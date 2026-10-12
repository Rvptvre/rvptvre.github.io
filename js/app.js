/* RVPTURE — application (site d'une seule page, navigation par #ancre) */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var app = $('#app');

  // Le contenu vient uniquement de data/contenu.js : le site publié est en lecture seule.
  var content = window.RVPTURE_CONTENT || {};
  content.site = content.site || {};
  content.site.valeurs = content.site.valeurs || [];
  content.sections = content.sections || [];
  content.articles = content.articles || [];

  /* ------------------------------------------------------------------
   * Utilitaires
   * ------------------------------------------------------------------ */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function hashNum(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  // Légère inclinaison « polaroïd » stable pour chaque article
  function tilt(id, max) {
    max = max || 3;
    return ((hashNum(id) % (max * 20 + 1)) / 10 - max).toFixed(1);
  }

  function formatDate(d) {
    if (!d) return '';
    var dt = new Date(d + 'T12:00:00');
    if (isNaN(dt)) return esc(d);
    return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }

  // Résout une source d'image (fichier du dossier images/ ou adresse https://)
  function imgSrc(s) {
    s = String(s || '').trim();
    if (/^(https?:\/\/|data:image\/|\/|\.{0,2}\/?[\w-])/i.test(s) && !/^\s*javascript:/i.test(s)) return s;
    return '';
  }

  function img(s, alt, cls) {
    var src = imgSrc(s);
    if (!src) return '<span class="img-empty" aria-hidden="true"></span>';
    return '<img src="' + esc(src) + '" alt="' + esc(alt || '') + '" loading="lazy"' + (cls ? ' class="' + cls + '"' : '') +
      ' onerror="this.classList.add(\'is-broken\')">';
  }

  function findSection(id) {
    return content.sections.filter(function (s) { return s.id === id; })[0];
  }

  function findRub(sec, id) {
    return sec && (sec.sous || []).filter(function (r) { return r.id === id; })[0];
  }

  function sorted(list) {
    return list.slice().sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
  }

  function articlesOf(secId, rubId) {
    return sorted(content.articles.filter(function (a) {
      return a.section === secId && (!rubId || a.rubrique === rubId);
    }));
  }

  function rubLabel(a) {
    var sec = findSection(a.section);
    var rub = findRub(sec, a.rubrique);
    return (sec ? sec.titre : '') + (rub ? ' · ' + rub.titre : '');
  }

  // Texte du site (défini dans data/contenu.js) placé dans une balise
  function text(path, tag, cls) {
    tag = tag || 'span';
    return '<' + tag + (cls ? ' class="' + cls + '"' : '') + '>' +
      esc(getPath(content, path) || '') + '</' + tag + '>';
  }

  /* ------------------------------------------------------------------
   * Éléments décoratifs (SVG)
   * ------------------------------------------------------------------ */
  var SVG = {
    clip: '<svg class="deco-clip" viewBox="0 0 120 150" aria-hidden="true"><defs>' +
      '<linearGradient id="clipMetal" x1="0" x2="1"><stop offset="0" stop-color="#8d9298"/><stop offset=".35" stop-color="#f4f6f8"/><stop offset=".55" stop-color="#a9aeb4"/><stop offset="1" stop-color="#6c7178"/></linearGradient>' +
      '<linearGradient id="clipBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a3a"/><stop offset=".18" stop-color="#121212"/><stop offset=".8" stop-color="#050505"/><stop offset="1" stop-color="#1c1c1c"/></linearGradient>' +
      '<linearGradient id="clipShine" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff" stop-opacity=".28"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="M40 96 L33 20 Q33 5 60 5 Q87 5 87 20 L80 96" fill="none" stroke="url(#clipMetal)" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="M47 96 L44 31 Q44 19 60 19 Q76 19 76 31 L73 96" fill="none" stroke="url(#clipMetal)" stroke-width="4" stroke-linecap="round" opacity=".85"/>' +
      '<path d="M10 100 Q60 92 110 100 L104 146 Q60 150 16 146 Z" fill="url(#clipBody)"/>' +
      '<path d="M10 100 Q60 92 110 100 L104 146 Q60 150 16 146 Z" fill="url(#clipShine)"/>' +
      '<path d="M12 101 Q60 93.5 108 101" fill="none" stroke="#5b5b5b" stroke-width="1.4"/></svg>',
    paperclip: '<svg class="deco-paperclip" viewBox="0 0 34 120" aria-hidden="true"><defs><linearGradient id="pcMetal" x1="0" x2="1"><stop offset="0" stop-color="#7d838b"/><stop offset=".45" stop-color="#eef1f4"/><stop offset="1" stop-color="#8a9097"/></linearGradient></defs>' +
      '<path d="M8 96 V17 A10 10 0 0 1 28 17 V104 A8 8 0 0 1 12 104 V28 A4.5 4.5 0 0 1 21 28 V86" fill="none" stroke="url(#pcMetal)" stroke-width="2.8" stroke-linecap="round"/></svg>',
    postmark: '<svg class="deco-postmark" viewBox="0 0 160 80" aria-hidden="true"><g fill="none" stroke="#2c3550" stroke-opacity=".55" stroke-width="1.6">' +
      '<circle cx="40" cy="40" r="30"/><circle cx="40" cy="40" r="22" stroke-dasharray="2 3"/>' +
      '<path d="M78 22 q10 -6 20 0 t20 0 t20 0 t20 0 M78 34 q10 -6 20 0 t20 0 t20 0 t20 0 M78 46 q10 -6 20 0 t20 0 t20 0 t20 0 M78 58 q10 -6 20 0 t20 0 t20 0 t20 0"/></g>' +
      '<text x="40" y="37" text-anchor="middle" font-family="Courier New, monospace" font-size="9" fill="#2c3550" fill-opacity=".65">RVPTVRE</text>' +
      '<text x="40" y="49" text-anchor="middle" font-family="Courier New, monospace" font-size="8" fill="#2c3550" fill-opacity=".65">' + new Date().getFullYear() + '</text></svg>',
    loop: '<svg class="deco-loop" viewBox="0 0 320 230" aria-hidden="true"><path d="M10 40 C 60 10, 120 90, 95 160 C 75 215, 10 200, 30 150 C 55 95, 190 120, 210 70 C 225 30, 165 20, 175 60 C 190 115, 280 110, 310 200" fill="none" stroke="currentColor" stroke-width="2.6" stroke-dasharray="9 8" stroke-linecap="round"/></svg>',
    heart: '<svg class="deco-heart" viewBox="0 0 60 54" aria-hidden="true"><path d="M30 52 C 10 36, 2 26, 2 15 C 2 7, 8 2, 16 2 C 22 2, 27 6, 30 11 C 33 6, 38 2, 44 2 C 52 2, 58 7, 58 15 C 58 26, 50 36, 30 52 Z" fill="#f2b8c6" stroke="#141414" stroke-width="2"/></svg>'
  };

  /* ------------------------------------------------------------------
   * Composants
   * ------------------------------------------------------------------ */
  function polaroid(a, opts) {
    opts = opts || {};
    return '<a class="polaroid' + (opts.cls ? ' ' + opts.cls : '') + '" href="#/article/' + encodeURIComponent(a.id) + '" style="--r:' + tilt(a.id) + 'deg;--tr:' + tilt(a.id + 't', 6) + 'deg">' +
      '<span class="tape" aria-hidden="true"></span>' +
      '<div class="polaroid__img">' + img(a.image, '') + '</div>' +
      '<p class="polaroid__caption">' + esc(a.titre) + '</p>' +
      (opts.noMeta ? '<div class="polaroid__pad"></div>' : '<p class="polaroid__meta">' + esc(rubLabel(a)) + (a.date ? ' — ' + formatDate(a.date) : '') + '</p>') +
      '</a>';
  }

  function polaroidGrid(list) {
    if (!list.length) {
      return '<div class="empty"><p class="empty__title">Aucun article pour le moment.</p>' +
        '<p>Revenez bientôt !</p></div>';
    }
    return '<div class="pgrid">' + list.map(function (a) { return polaroid(a); }).join('') + '</div>';
  }

  function card(a) {
    return '<a class="card" href="#/article/' + encodeURIComponent(a.id) + '">' +
      '<div class="card__img">' + img(a.image, '') + '</div>' +
      '<h3 class="card__title">' + esc(a.titre) + '</h3>' +
      '<p class="card__meta">' + esc(rubLabel(a)) + '</p></a>';
  }

  function crumbs(items) {
    return '<nav class="crumbs" aria-label="Fil d\'Ariane">' + items.map(function (it, i) {
      return (i ? '<span aria-hidden="true">/</span>' : '') +
        (it.href ? '<a href="' + it.href + '">' + esc(it.label) + '</a>' : '<span aria-current="page">' + esc(it.label) + '</span>');
    }).join('') + '</nav>';
  }

  function giantTitle(text, list) {
    var a = list[0], b = list[1];
    return '<header class="giant-head">' +
      (a ? '<a class="snap snap--left" href="#/article/' + encodeURIComponent(a.id) + '" aria-label="' + esc(a.titre) + '">' + img(a.image, '') + '</a>' : '') +
      '<h1 class="giant">' + esc(text) + '</h1>' +
      (b ? '<a class="snap snap--right" href="#/article/' + encodeURIComponent(b.id) + '" aria-label="' + esc(b.titre) + '">' + img(b.image, '') + '</a>' : '') +
      '</header>';
  }

  /* ------------------------------------------------------------------
   * Pages
   * ------------------------------------------------------------------ */
  function pageHome() {
    var s = content.site;
    var latest = sorted(content.articles).slice(0, 10);

    var aboutItalic = esc(s.aProposItalique || '');
    if (s.motEntoure) {
      var w = esc(s.motEntoure);
      aboutItalic = aboutItalic.replace(w, '<span class="circled">' + w + '</span>');
    }

    var html = '' +
      '<section class="hero">' +
        '<div class="folder">' +
          '<div class="folder__collage" aria-hidden="true">' +
            '<div class="note"><span class="note__text">Droit &amp; Art — à suivre !</span></div>' +
            '<div class="pcard">' + SVG.clip +
              '<p class="pcard__head"><span class="pcard__title">Carte de presse</span><span class="pcard__num">N° RVP-' + new Date().getFullYear() + '-0001</span></p>' +
              '<div class="pcard__body">' +
                '<div class="pcard__photo">' + (latest[0] ? img(latest[0].image, '') : '') + '</div>' +
                '<dl class="pcard__fields">' +
                  '<dt>Média</dt><dd>Rvptvre</dd>' +
                  '<dt>Rubriques</dt><dd>Droit &amp; Art</dd>' +
                  '<dt>Délivrée le</dt><dd>' + esc(new Date().toLocaleDateString('fr-FR')) + '</dd>' +
                '</dl>' +
              '</div>' +
              '<p class="pcard__foot"><span class="barcode"></span><span class="pcard__sign">Rvptvre</span></p>' +
            '</div>' +
            '<div class="stamp-postal">' +
              '<div class="stamp-postal__inner">' + (latest[1] ? img(latest[1].image, '') : '') +
                '<span class="stamp-postal__value">2,50 €</span></div>' +
            '</div>' +
            SVG.postmark +
            '<div class="ticket">' +
              '<div class="ticket__stub">Rvptvre</div>' +
              '<div class="ticket__main">' +
                '<span class="ticket__small">Billet N° 000214</span>' +
                '<span class="ticket__big">Entrée générale</span>' +
                '<span class="ticket__small">Saison ' + new Date().getFullYear() + ' — Droit &amp; Art</span>' +
              '</div>' +
            '</div>' +
            '<span class="tape tape--ticket"></span>' +
          '</div>' +
          '<div class="folder__sheet">' + SVG.paperclip +
            text('site.editoTitre', 'h2', 'sheet__title') +
            text('site.edito', 'p', 'sheet__text') +
            '<p class="sheet__sign" aria-hidden="true">La rédaction</p>' +
          '</div>' +
          '<span class="folder__tab" aria-hidden="true">Rvptvre — Édito</span>' +
        '</div>' +
        '<div class="hero__text">' +
          '<h1 class="hero__title">' + text('site.heroItalique', 'em') + text('site.heroCapitales', 'span', 'caps') + '</h1>' +
          text('site.heroTexte', 'p', 'hero__lead') +
          '<div class="hero__links"><a class="link-u" href="#/droit">Rubrique Droit</a><a class="link-u" href="#/art">Rubrique Art</a></div>' +
          SVG.loop +
        '</div>' +
      '</section>' +

      '<section class="une">' +
        '<div class="une__head">' +
          '<div><p class="label">À la une</p>' + text('site.uneTexte', 'p', 'une__lead') + '</div>' +
          '<div class="carousel-nav"><button type="button" class="link-u" data-scroll="-1">Précédent</button><button type="button" class="link-u" data-scroll="1">Suivant</button></div>' +
        '</div>' +
        '<div class="carousel" id="carousel">' + latest.map(card).join('') + '</div>' +
      '</section>';

    html += content.sections.map(function (sec, i) {
      var list = articlesOf(sec.id).slice(0, 3);
      return '<section class="bigcard">' +
        '<div class="bigcard__body">' +
          '<p class="label">Rubrique</p>' +
          '<h2 class="bigcard__title"><a href="#/' + esc(sec.id) + '">' + esc(sec.titre) + '</a></h2>' +
          text('sections.' + i + '.intro', 'p', 'bigcard__intro') +
          '<div class="pills">' + (sec.sous || []).map(function (r) {
            return '<a class="pill" href="#/' + esc(sec.id) + '/' + esc(r.id) + '">' + esc(r.titre) + '</a>';
          }).join('') + '</div>' +
          '<a class="link-u" href="#/' + esc(sec.id) + '">Tout voir</a>' +
        '</div>' +
        '<p class="bigcard__num">(0' + (i + 1) + ')</p>' +
        '<div class="bigcard__stack">' + list.map(function (a, j) {
          return polaroid(a, { cls: 'polaroid--stack polaroid--s' + j, noMeta: true });
        }).join('') + '</div>' +
      '</section>';
    }).join('');

    var cover = latest[2] || latest[0];
    html += '<section class="about">' +
      '<p class="label">Qui sommes-nous</p>' +
      '<p class="about__big">' + text('site.aPropos') + ' <em>' + aboutItalic + '</em></p>' +
      (cover ? '<div class="stamp" aria-hidden="true"><span class="torn torn--gold"></span><div class="stamp__inner">' + img(cover.image, '') + '</div></div>' : '') +
      '<span class="tape tape--about" aria-hidden="true"></span>' +
      '<p class="label">Nos valeurs</p>' +
      '<div class="values">' + (s.valeurs || []).map(function (v, i) {
        return '<p>' + text('site.valeurs.' + i + '.titre', 'strong') + ' ' + text('site.valeurs.' + i + '.texte') + '</p>';
      }).join('') + '</div>' +
      '</section>';

    // Globe de texte animé (js/orbital.js)
    var globeText = s.globeTexte || 'RVPTVRE · DROIT & ART · ';
    html += '<section class="orbital" aria-label="' + esc(globeText.trim()) + '">' +
      '<div class="orbital__globe" data-orbital-type data-text="' + esc(globeText) + '"' +
        ' data-colors="#141414,#3b5a99,#141414,#8aa5d9" data-font-family="Instrument Serif" data-back-opacity="0.22">' +
        '<p class="orbital__fallback">' + esc(globeText) + '</p>' +
      '</div>' +
      '<p class="orbital__hint" aria-hidden="true">Faites tourner le globe</p>' +
      '</section>';

    return html;
  }

  function pageSection(sec) {
    var idx = content.sections.indexOf(sec);
    var all = articlesOf(sec.id);
    var html = giantTitle(sec.titre, all) +
      '<div class="page-intro">' + crumbs([{ label: 'Accueil', href: '#/' }, { label: sec.titre }]) +
      text('sections.' + idx + '.intro', 'p', 'page-intro__text') + '</div>';

    html += (sec.sous || []).map(function (r, j) {
      var list = articlesOf(sec.id, r.id);
      return '<section class="bigcard bigcard--list">' +
        '<div class="bigcard__row">' +
          '<div><p class="label">' + esc(sec.titre) + '</p>' +
          '<h2 class="bigcard__title"><a href="#/' + esc(sec.id) + '/' + esc(r.id) + '">' + esc(r.titre) + '</a></h2>' +
          text('sections.' + idx + '.sous.' + j + '.intro', 'p', 'bigcard__intro') + '</div>' +
          '<p class="bigcard__num">(0' + (j + 1) + ')</p>' +
        '</div>' +
        polaroidGrid(list.slice(0, 4)) +
        '<div class="bigcard__foot">' +
          '<a class="link-u" href="#/' + esc(sec.id) + '/' + esc(r.id) + '">Tous les articles « ' + esc(r.titre) + ' » (' + list.length + ')</a></div>' +
      '</section>';
    }).join('');
    return html;
  }

  function pageRubrique(sec, rub) {
    var idx = content.sections.indexOf(sec);
    var j = sec.sous.indexOf(rub);
    var list = articlesOf(sec.id, rub.id);
    return giantTitle(rub.titre, list) +
      '<div class="page-intro">' +
        crumbs([{ label: 'Accueil', href: '#/' }, { label: sec.titre, href: '#/' + sec.id }, { label: rub.titre }]) +
        text('sections.' + idx + '.sous.' + j + '.intro', 'p', 'page-intro__text') +
        '<div class="subnav">' + sec.sous.map(function (r) {
          return '<a class="pill' + (r === rub ? ' is-active' : '') + '" href="#/' + esc(sec.id) + '/' + esc(r.id) + '">' + esc(r.titre) + '</a>';
        }).join('') + '</div>' +
      '</div>' +
      '<section class="inventory">' + polaroidGrid(list) + '</section>';
  }

  function pageArticle(a) {
    var sec = findSection(a.section);
    var rub = findRub(sec, a.rubrique);
    var path = [{ label: 'Accueil', href: '#/' }];
    if (sec) path.push({ label: sec.titre, href: '#/' + sec.id });
    if (rub) path.push({ label: rub.titre, href: '#/' + sec.id + '/' + rub.id });

    var related = articlesOf(a.section, a.rubrique).filter(function (x) { return x.id !== a.id; }).slice(0, 3);

    return '<article class="article">' +
      '<header class="article__head">' +
        crumbs(path) +
        '<p class="label">' + esc(rubLabel(a)) + '</p>' +
        '<h1 class="article__title">' + esc(a.titre) + '</h1>' +
        (a.chapo ? '<p class="article__chapo">' + esc(a.chapo) + '</p>' : '') +
        '<p class="article__meta">' + (a.auteur ? 'Par ' + esc(a.auteur) : '') + (a.auteur && a.date ? ' — ' : '') + formatDate(a.date) + '</p>' +
      '</header>' +
      (imgSrc(a.image) ? '<figure class="polaroid polaroid--hero" style="--r:' + tilt(a.id, 2) + 'deg">' +
        '<span class="tape" aria-hidden="true"></span><span class="tape tape--b" aria-hidden="true"></span>' +
        '<div class="polaroid__img polaroid__img--free">' + img(a.image, a.legende || a.titre) + '</div>' +
        (a.legende ? '<figcaption class="polaroid__caption polaroid__caption--small">' + esc(a.legende) + '</figcaption>' : '<div class="polaroid__pad"></div>') +
        '</figure>' : '') +
      '<div class="article__body" data-seed="' + esc(a.id) + '">' + (a.html || '') + '</div>' +
      '<footer class="article__foot">' +
        (rub ? '<a class="link-u" href="#/' + esc(sec.id) + '/' + esc(rub.id) + '">← Retour à « ' + esc(rub.titre) + ' »</a>' : '<a class="link-u" href="#/">← Accueil</a>') +
      '</footer>' +
      '</article>' +
      (related.length ? '<section class="related"><p class="label">Dans la même rubrique</p>' + polaroidGrid(related) + '</section>' : '');
  }

  function pageNotFound() {
    return '<section class="notfound"><h1 class="giant">404</h1><p>Cette page n\'existe pas (ou plus).</p><a class="link-u" href="#/">Retour à l\'accueil</a></section>';
  }

  /* ------------------------------------------------------------------
   * Routeur
   * ------------------------------------------------------------------ */
  function parseRoute() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    var parts = h.split('/').filter(Boolean);
    return parts;
  }

  var lastHash = null;

  function render() {
    var parts = parseRoute();
    var html, title = 'RVPTURE — Droit & Art', active = '';

    if (!parts.length) {
      html = pageHome();
    } else if (parts[0] === 'article') {
      var a = content.articles.filter(function (x) { return x.id === parts[1]; })[0];
      if (a) { html = pageArticle(a); title = a.titre + ' — RVPTURE'; active = a.section + '/' + a.rubrique; }
    } else {
      var sec = findSection(parts[0]);
      if (sec && parts.length === 1) { html = pageSection(sec); title = sec.titre + ' — RVPTURE'; active = sec.id; }
      else if (sec) {
        var rub = findRub(sec, parts[1]);
        if (rub) { html = pageRubrique(sec, rub); title = rub.titre + ' — ' + sec.titre + ' — RVPTURE'; active = sec.id + '/' + rub.id; }
      }
    }

    app.innerHTML = html || pageNotFound();
    document.title = title;
    renderNav(active);
    afterRender();
    document.dispatchEvent(new CustomEvent('rvpture:render'));

    if (location.hash !== lastHash) {
      window.scrollTo(0, 0);
      lastHash = location.hash;
    }
  }

  /* Réseaux sociaux — logos Font Awesome Free (CC BY 4.0), boutons d'après Uiverse.io (vinodjangid07) */
  var SOCIALS = [
    { key: 'instagram', label: 'Instagram', cls: 'containerOne', svg: '<svg class="socialSvg" viewBox="0 0 448 512" aria-hidden="true"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path></svg>' },
    { key: 'x', label: 'X (Twitter)', cls: 'containerTwo', svg: '<svg class="socialSvg" viewBox="0 0 512 512" aria-hidden="true"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path></svg>' },
    { key: 'linkedin', label: 'LinkedIn', cls: 'containerThree', svg: '<svg class="socialSvg" viewBox="0 0 448 512" aria-hidden="true"><path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"></path></svg>' },
    { key: 'whatsapp', label: 'WhatsApp', cls: 'containerFour', svg: '<svg class="socialSvg" viewBox="0 0 448 512" aria-hidden="true"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>' }
  ];

  function socialLinks() {
    var links = content.site.reseaux || {};
    var items = SOCIALS.filter(function (r) { return links[r.key]; });
    if (!items.length) return '';
    return '<div class="footer__social"><div class="social-card">' + items.map(function (r) {
      return '<a class="socialContainer ' + r.cls + '" href="' + esc(links[r.key]) + '" target="_blank" rel="noopener" aria-label="' + esc(r.label) + '" title="' + esc(r.label) + '">' + r.svg + '</a>';
    }).join('') + '</div></div>';
  }

  function renderNav(active) {
    var html = '';
    content.sections.forEach(function (sec, i) {
      if (i) html += '<span class="mainnav__sep" aria-hidden="true"></span>';
      var secActive = active === sec.id || active.indexOf(sec.id + '/') === 0;
      html += '<a class="mainnav__sec' + (secActive ? ' is-active' : '') + '" href="#/' + esc(sec.id) + '">' + esc(sec.titre) + '</a>';
      (sec.sous || []).forEach(function (r) {
        var on = active === sec.id + '/' + r.id;
        html += '<a class="' + (on ? 'is-active' : '') + '" href="#/' + esc(sec.id) + '/' + esc(r.id) + '">' + esc(r.titre) + '</a>';
      });
    });
    $('#navLinks').innerHTML = html;

    $('#drawerTree').innerHTML = '<p class="label">Rubriques</p>' + content.sections.map(function (sec) {
      return '<div class="tree__sec"><a class="tree__title" href="#/' + esc(sec.id) + '">' + esc(sec.titre) + '</a>' +
        '<ul>' + (sec.sous || []).map(function (r) {
          return '<li><a href="#/' + esc(sec.id) + '/' + esc(r.id) + '">' + esc(r.titre) +
            ' <span class="tree__count">' + articlesOf(sec.id, r.id).length + '</span></a></li>';
        }).join('') + '</ul></div>';
    }).join('') + '<a class="tree__home link-u" href="#/">Accueil</a>';

    $('#footer').innerHTML = '<div class="footer__inner">' +
      '<div class="footer__brand"><a href="#/" class="footer__logo">RVPTURE</a>' + socialLinks() + '</div>' +
      '<div class="footer__cols">' + content.sections.map(function (sec) {
        return '<div><p class="label"><a href="#/' + esc(sec.id) + '">' + esc(sec.titre) + '</a></p>' +
          (sec.sous || []).map(function (r) { return '<a href="#/' + esc(sec.id) + '/' + esc(r.id) + '">' + esc(r.titre) + '</a>'; }).join('') + '</div>';
      }).join('') + '</div>' +
      '<p class="footer__small">© ' + new Date().getFullYear() + ' Rvpture — Droit &amp; Art</p></div>';
  }

  function afterRender() {
    // Inclinaison des photos polaroïd dans le texte des articles
    var body = $('.article__body');
    if (body) {
      var seed = body.getAttribute('data-seed') || '';
      $$('.polaroid--figure', body).forEach(function (f, i) {
        f.style.setProperty('--r', tilt(seed + (i + 1), 2.5) + 'deg');
      });
      $$('img', body).forEach(function (im) {
        im.addEventListener('error', function () { im.classList.add('is-broken'); });
      });
    }

    // Carrousel « À la une »
    var car = $('#carousel');
    $$('[data-scroll]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (car) car.scrollBy({ left: Number(b.getAttribute('data-scroll')) * car.clientWidth * 0.8, behavior: 'smooth' });
      });
    });
  }

  /* ------------------------------------------------------------------
   * Barre latérale : menu + recherche
   * ------------------------------------------------------------------ */
  var drawer = $('#drawer');
  var overlay = $('#overlay');
  var searchInput = $('#searchInput');

  function openDrawer(focusSearch) {
    overlay.hidden = false;
    requestAnimationFrame(function () {
      document.body.classList.add('drawer-open');
    });
    drawer.setAttribute('aria-hidden', 'false');
    $('#menuBtn').setAttribute('aria-expanded', 'true');
    runSearch();
    setTimeout(function () { (focusSearch ? searchInput : $('#drawerClose')).focus(); }, 250);
  }

  function closeDrawer() {
    if (!document.body.classList.contains('drawer-open')) return;
    document.body.classList.remove('drawer-open');
    drawer.setAttribute('aria-hidden', 'true');
    $('#menuBtn').setAttribute('aria-expanded', 'false');
    setTimeout(function () { overlay.hidden = true; }, 300);
  }

  function runSearch() {
    var q = norm(searchInput.value.trim());
    var box = $('#searchResults');
    var list;
    if (!q) {
      list = sorted(content.articles).slice(0, 4);
      box.innerHTML = '<p class="label">Derniers articles</p>' + resultList(list);
      return;
    }
    var terms = q.split(/\s+/);
    list = sorted(content.articles).filter(function (a) {
      var hay = norm([a.titre, a.chapo, a.texte, a.auteur, rubLabel(a)].join(' '));
      return terms.every(function (t) { return hay.indexOf(t) !== -1; });
    });
    box.innerHTML = '<p class="label">' + list.length + ' résultat' + (list.length > 1 ? 's' : '') + '</p>' +
      (list.length ? resultList(list.slice(0, 30)) : '<p class="drawer__none">Aucun article ne correspond à « ' + esc(searchInput.value.trim()) + ' ».</p>');
  }

  function resultList(list) {
    return '<ul class="results">' + list.map(function (a) {
      return '<li><a href="#/article/' + encodeURIComponent(a.id) + '" style="--r:' + tilt(a.id, 2) + 'deg">' +
        '<span class="results__thumb">' + img(a.image, '') + '</span>' +
        '<span><span class="results__title">' + esc(a.titre) + '</span><span class="results__meta">' + esc(rubLabel(a)) + '</span></span></a></li>';
    }).join('') + '</ul>';
  }

  $('#menuBtn').addEventListener('click', function () { openDrawer(false); });
  $('#searchBtn').addEventListener('click', function () { openDrawer(true); });
  $('#drawerClose').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  searchInput.addEventListener('input', runSearch);
  drawer.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (a && a.getAttribute('href') === location.hash) closeDrawer();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });

  /* ------------------------------------------------------------------
   * Démarrage
   * ------------------------------------------------------------------ */
  $('#today').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  window.addEventListener('hashchange', function () { closeDrawer(); render(); });
  window.addEventListener('scroll', function () {
    document.body.classList.toggle('is-scrolled', window.scrollY > 60);
  }, { passive: true });

  render();
})();
