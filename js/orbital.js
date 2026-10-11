/*
 * RVPTURE — globe de texte en orbite (bas de la page d'accueil)
 * ------------------------------------------------------------------
 * Un texte enroulé autour d'une sphère transparente qui tourne lentement.
 * On peut la faire tourner à la souris ou au doigt ; elle reprend ensuite
 * doucement sa rotation.
 *
 * Utilisation : <div data-orbital-type data-text="…"></div>
 * Options (attributs data-*) : text, colors (liste séparée par des virgules),
 * font-weight, font-family, spacing, flow, back-opacity.
 *
 * Ce fichier est assemblé avec Three.js par scripts/build.mjs.
 */
import * as THREE from 'three'

const BASE_SPIN = 0.22 // vitesse de rotation au repos (radians / seconde)
const DRAG_SPEED = 0.008 // rotation par pixel glissé

const DEFAULTS = {
  text: 'RVPTVRE · DROIT & ART · ',
  colors: ['#141414', '#3b5a99'],
  fontWeight: 400,
  fontFamily: 'Instrument Serif',
  spacing: 1,
  flow: 1,
  backOpacity: 0.22,
}

const TEX_W = 4096
const TEX_H = 2048

// Dessine le texte en bandes horizontales sur une texture équirectangulaire.
function drawTexture(canvas, opts) {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, TEX_W, TEX_H)
  const text = String(opts.text || DEFAULTS.text).replace(/\s*$/, ' ')
  const colors = opts.colors && opts.colors.length ? opts.colors : DEFAULTS.colors
  const family = /[\s,]/.test(opts.fontFamily) && !/["']/.test(opts.fontFamily) ? `"${opts.fontFamily}"` : opts.fontFamily
  const size = 150
  const lineHeight = size * 1.05 * opts.spacing
  // Bandes entre ±62° de latitude : au-delà, la sphère écrase trop le texte.
  const top = TEX_H * 0.155
  const bottom = TEX_H * 0.845
  const rows = Math.max(1, Math.floor((bottom - top) / lineHeight))
  const y0 = (TEX_H - rows * lineHeight) / 2 + lineHeight / 2

  ctx.font = `${opts.fontWeight} ${size}px ${family}, Georgia, serif`
  ctx.textBaseline = 'middle'
  const w = ctx.measureText(text).width || 1
  // Nombre entier de répétitions pour que le texte se raccorde sans couture.
  const repeats = Math.max(1, Math.round(TEX_W / w))
  const scaleX = TEX_W / (repeats * w)

  for (let r = 0; r < rows; r++) {
    const y = y0 + r * lineHeight
    // Décalage d'une ligne à l'autre pour un motif moins régulier.
    const offset = ((r * 0.37) % 1) * w * scaleX
    ctx.fillStyle = colors[r % colors.length]
    ctx.save()
    ctx.translate(-offset, y)
    ctx.scale(scaleX, 1)
    for (let i = -1; i <= repeats; i++) ctx.fillText(text, i * w, 0)
    ctx.restore()
  }
}

export function createOrbitalType(container, options = {}) {
  const opts = { ...DEFAULTS, ...options }
  let disposed = false
  let frame = 0
  let texture = null

  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch (err) {
    // WebGL indisponible : on laisse le texte de secours affiché.
    return { destroy() {} }
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)
  const el = renderer.domElement
  el.style.display = 'block'
  el.style.width = '100%'
  el.style.height = '100%'
  el.style.cursor = 'grab'
  el.style.touchAction = 'pan-y'
  el.setAttribute('aria-hidden', 'true')
  container.appendChild(el)
  container.classList.add('is-ready')

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
  camera.position.set(0, 0, 4.6)

  const tilt = new THREE.Group()
  const globe = new THREE.Group()
  tilt.add(globe)
  scene.add(tilt)

  const canvas = document.createElement('canvas')
  canvas.width = TEX_W
  canvas.height = TEX_H
  drawTexture(canvas, opts)
  texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  texture.wrapS = THREE.RepeatWrapping

  // Redessine quand la police du site est chargée.
  if (document.fonts && document.fonts.load) {
    document.fonts.load(`${opts.fontWeight} 150px "${opts.fontFamily}"`).then(() => {
      if (disposed) return
      drawTexture(canvas, opts)
      texture.needsUpdate = true
    }).catch(() => {})
  }

  const geometry = new THREE.SphereGeometry(1, 96, 64)
  // Face arrière (le texte vu « à travers » le globe), plus pâle.
  const backMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    transparent: true,
    opacity: opts.backOpacity,
    depthWrite: false,
  })
  const frontMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.FrontSide,
    transparent: true,
    depthWrite: false,
  })
  const back = new THREE.Mesh(geometry, backMaterial)
  const front = new THREE.Mesh(geometry, frontMaterial)
  back.renderOrder = 0
  front.renderOrder = 1
  globe.add(back, front)

  const resize = () => {
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  const ro = new ResizeObserver(resize)

  // N'anime que lorsque le globe est visible à l'écran.
  let visible = true
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => { visible = entries[0].isIntersecting })
    : null
  if (io) io.observe(container)

  ro.observe(container)

  // Drag to spin, with inertia that eases back to the idle spin.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const baseSpin = -BASE_SPIN * opts.flow * (reduceMotion ? 0.25 : 1)
  let spinVel = baseSpin
  let tiltOffset = 0
  let dragging = false
  let lastX = 0
  let lastY = 0
  let lastT = 0

  const onDown = (e) => {
    dragging = true
    lastX = e.clientX
    lastY = e.clientY
    lastT = performance.now()
    el.setPointerCapture(e.pointerId)
    el.style.cursor = 'grabbing'
  }
  const onMove = (e) => {
    if (!dragging) return
    const now = performance.now()
    const dt = Math.max((now - lastT) / 1000, 1 / 240)
    const dx = (e.clientX - lastX) * DRAG_SPEED
    const dy = (e.clientY - lastY) * DRAG_SPEED
    globe.rotation.y += dx
    tiltOffset = THREE.MathUtils.clamp(tiltOffset + dy, -0.9, 0.9)
    spinVel = dx / dt
    lastX = e.clientX
    lastY = e.clientY
    lastT = now
  }
  const onUp = (e) => {
    dragging = false
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    el.style.cursor = 'grab'
  }
  el.addEventListener('pointerdown', onDown)
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)

  const start = performance.now()
  let prev = start
  const tick = () => {
    frame = requestAnimationFrame(tick)
    const now = performance.now()
    const dt = Math.min((now - prev) / 1000, 0.1)
    const t = (now - start) / 1000
    prev = now
    if (!visible) return

    if (!dragging) {
      spinVel += (baseSpin - spinVel) * (1 - Math.exp(-dt * 1.6))
      tiltOffset *= Math.exp(-dt * 1.2)
      globe.rotation.y += spinVel * dt
    }

    // Slow wobble of the spin axis, like a loosely held globe.
    const wobble = reduceMotion ? 0 : 1
    tilt.rotation.z = 0.36 + Math.sin(t * 0.45) * 0.09 * wobble
    tilt.rotation.x = 0.32 + Math.sin(t * 0.31 + 1.3) * 0.07 * wobble + tiltOffset

    renderer.render(scene, camera)
  }
  tick()

  return {
    destroy() {
      disposed = true
      cancelAnimationFrame(frame)
      ro.disconnect()
      if (io) io.disconnect()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      texture?.dispose()
      geometry.dispose()
      backMaterial.dispose()
      frontMaterial.dispose()
      renderer.dispose()
      el.remove()
    },
  }
}

function optionsFromDataset(ds) {
  const num = (v) => (v === undefined || v === '' ? undefined : Number(v))
  const opts = {
    text: ds.text,
    colors: ds.colors ? ds.colors.split(',').map((c) => c.trim()) : undefined,
    fontWeight: num(ds.fontWeight),
    fontFamily: ds.fontFamily,
    spacing: num(ds.spacing),
    flow: num(ds.flow),
    backOpacity: num(ds.backOpacity),
  }
  return Object.fromEntries(Object.entries(opts).filter(([, v]) => v !== undefined))
}

// Globes actifs : le site change de page sans recharger, on arrête donc
// ceux qui ne sont plus affichés.
const instances = new Set()

function autoInit() {
  instances.forEach((node) => {
    if (!node.isConnected) {
      node.__orbitalType.destroy()
      node.__orbitalType = null
      instances.delete(node)
    }
  })
  document.querySelectorAll('[data-orbital-type]').forEach((node) => {
    if (node.__orbitalType) return
    node.__orbitalType = createOrbitalType(node, optionsFromDataset(node.dataset))
    instances.add(node)
  })
}

// Relancé à chaque affichage de page par js/app.js
document.addEventListener('rvpture:render', autoInit)

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit)
} else {
  autoInit()
}
