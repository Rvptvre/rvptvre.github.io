/*
 * RVPTURE — fabrication du site
 * ------------------------------------------------------------------
 * Lit le contenu (dossier contenu/) et produit le site prêt à publier
 * dans le dossier _site/.
 *
 *   contenu/accueil.yml     textes de la page d'accueil
 *   contenu/rubriques.yml   textes d'introduction des rubriques
 *   contenu/articles/*.md   un fichier par article
 *   images/                 photos
 *
 * Lancé automatiquement par GitHub à chaque modification
 * (.github/workflows/publier.yml). En local : npm install && npm run build
 */
import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { Marked } from 'marked';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, '_site');
const ARTICLES_DIR = path.join(ROOT, 'contenu', 'articles');

// Structure du site : rubriques et sous-rubriques (identifiants utilisés dans les adresses)
const STRUCTURE = [
  { id: 'droit', titre: 'Droit', sous: [
    { id: 'actualite', titre: 'Actualité' },
    { id: 'portrait', titre: 'Portrait' }
  ] },
  { id: 'art', titre: 'Art', sous: [
    { id: 'mode', titre: 'Mode' },
    { id: 'cinema-theatre', titre: 'Cinéma – Théâtre' },
    { id: 'expositions', titre: 'Expositions' },
    { id: 'musique', titre: 'Musique' }
  ] }
];

let warnings = 0;
function warn(file, msg) {
  warnings++;
  // Format reconnu par GitHub Actions : le message apparaît dans le résumé de la publication
  console.log(`::warning file=${file}::${msg}`);
}

function readYaml(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { warn(rel, 'fichier introuvable'); return {}; }
  try {
    return load(fs.readFileSync(file, 'utf8')) || {};
  } catch (e) {
    warn(rel, 'fichier illisible : ' + e.message.split('\n')[0]);
    return {};
  }
}

function str(v) {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// "/images/photo.jpg" -> "images/photo.jpg" (pour fonctionner aussi dans un sous-dossier, ex. GitHub Pages)
function fixPath(src) {
  src = str(src);
  return src.replace(/^\.?\/(?=images\/)/, '');
}

function slugify(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'article';
}

/* ---------- Markdown -> HTML ---------- */
const marked = new Marked({ gfm: true, breaks: true });
marked.use({
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const ext = /^https?:\/\//.test(href);
      return '<a href="' + escAttr(href) + '"' + (title ? ' title="' + escAttr(title) + '"' : '') +
        (ext ? ' target="_blank" rel="noopener"' : '') + '>' + text + '</a>';
    },
    image({ href, title, text }) {
      return '<img src="' + escAttr(fixPath(href)) + '" alt="' + escAttr(text || '') + '"' +
        (title ? ' title="' + escAttr(title) + '"' : '') + ' loading="lazy">';
    }
  }
});

function bodyToHtml(md) {
  let html = marked.parse(md || '');
  // Images seules dans un paragraphe -> polaroïd avec légende
  html = html.replace(/<p>\s*<img src="([^"]*)" alt="([^"]*)"(?: title="([^"]*)")? loading="lazy">\s*<\/p>/g,
    function (m, src, alt, title) {
      const cap = title || alt;
      return '<figure class="polaroid polaroid--figure"><span class="tape" aria-hidden="true"></span>' +
        '<div class="polaroid__img polaroid__img--free"><img src="' + src + '" alt="' + alt + '" loading="lazy"></div>' +
        (cap ? '<figcaption class="polaroid__caption polaroid__caption--small">' + cap + '</figcaption>' : '<div class="polaroid__pad"></div>') +
        '</figure>';
    });
  // Chemins d'images écrits en HTML par l'éditeur
  html = html.replace(/(<img[^>]+src=")\/(images\/)/g, '$1$2');
  return html;
}

function plainText(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

/* ---------- Articles ---------- */
function splitFrontmatter(raw) {
  const m = raw.replace(/^﻿/, '').match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)([\s\S]*)$/);
  if (!m) return null;
  return { data: load(m[1]) || {}, body: m[2] };
}

const validRubriques = new Set();
STRUCTURE.forEach(s => s.sous.forEach(r => validRubriques.add(s.id + '/' + r.id)));

const articles = [];
const files = fs.existsSync(ARTICLES_DIR) ? fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md') && !f.startsWith('_')) : [];
for (const f of files.sort()) {
  const rel = 'contenu/articles/' + f;
  let parsed;
  try {
    parsed = splitFrontmatter(fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf8'));
  } catch (e) {
    warn(rel, 'article illisible, ignoré : ' + e.message.split('\n')[0]);
    continue;
  }
  if (!parsed) { warn(rel, 'en-tête manquant (bloc --- ... ---), article ignoré'); continue; }
  const d = parsed.data;
  if (d.publie === false) continue; // brouillon
  const titre = str(d.titre);
  if (!titre) { warn(rel, 'titre manquant, article ignoré'); continue; }
  const rubrique = str(d.rubrique);
  if (!validRubriques.has(rubrique)) { warn(rel, `rubrique « ${rubrique} » inconnue, article ignoré`); continue; }
  const [section, sous] = rubrique.split('/');
  const html = bodyToHtml(str(d.corps) || parsed.body);
  articles.push({
    id: slugify(f.replace(/\.md$/, '')),
    section,
    rubrique: sous,
    titre,
    chapo: str(d.chapo),
    auteur: str(d.auteur),
    date: str(d.date).slice(0, 10),
    image: fixPath(d.image),
    legende: str(d.legende),
    html,
    texte: plainText(html)
  });
}

/* ---------- Accueil et rubriques ---------- */
const accueil = readYaml('contenu/accueil.yml');
const intros = readYaml('contenu/rubriques.yml');
const site = {};
for (const k of ['editoTitre', 'edito', 'heroItalique', 'heroCapitales', 'heroTexte', 'uneTexte', 'aPropos', 'aProposItalique', 'motEntoure']) {
  site[k] = str(accueil[k]);
}
site.valeurs = (Array.isArray(accueil.valeurs) ? accueil.valeurs : []).map(v => ({ titre: str(v && v.titre), texte: str(v && v.texte) }));

const sections = STRUCTURE.map(s => ({
  id: s.id,
  titre: s.titre,
  intro: str(intros[s.id]),
  sous: s.sous.map(r => ({ id: r.id, titre: r.titre, intro: str(intros[r.id.replace(/-/g, '_')]) }))
}));

/* ---------- Écriture du site ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });

for (const item of ['css', 'js', 'images', '.nojekyll']) {
  const src = path.join(ROOT, item);
  if (fs.existsSync(src)) fs.cpSync(src, path.join(OUT, item), { recursive: true });
}

// Numéro de version : oblige les navigateurs à recharger les fichiers après chaque publication
const version = Date.now().toString(36);
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/\?v=[\w.-]+/g, '?v=' + version);
fs.writeFileSync(path.join(OUT, 'index.html'), index);

fs.writeFileSync(path.join(OUT, 'data', 'contenu.js'),
  '/* Fichier généré automatiquement à partir du dossier contenu/ — ne pas modifier. */\n' +
  'window.RVPTURE_CONTENT = ' + JSON.stringify({ site, sections, articles }) + ';\n');

console.log(`Site fabriqué dans _site/ : ${articles.length} article(s) publié(s)` + (warnings ? `, ${warnings} avertissement(s).` : '.'));
