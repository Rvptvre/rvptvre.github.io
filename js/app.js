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
      '<a href="#/" class="footer__logo">RVPTURE</a>' +
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
