/* RVPTURE — application (site d'une seule page, navigation par #ancre) */
(function () {
  'use strict';

  var STORAGE_KEY = 'rvpture-contenu-v1';
  var EDIT_KEY = 'rvpture-edition';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  var app = $('#app');
  var content = loadContent();
  var editMode = false;
  try { editMode = localStorage.getItem(EDIT_KEY) === '1'; } catch (e) { /* stockage indisponible */ }

  /* ------------------------------------------------------------------
   * Stockage
   * ------------------------------------------------------------------ */
  function loadContent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (isValidContent(parsed)) return normalize(parsed);
      }
    } catch (e) { /* stockage indisponible ou corrompu */ }
    return normalize(clone(window.RVPTURE_CONTENT || {}));
  }

  function normalize(c) {
    c.site = c.site || {};
    c.site.valeurs = c.site.valeurs || [];
    c.sections = c.sections || [];
    c.articles = c.articles || [];
    c.media = c.media || {};
    return c;
  }

  function isValidContent(c) {
    return c && typeof c === 'object' && Array.isArray(c.sections) && Array.isArray(c.articles);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
      return true;
    } catch (e) {
      alert("Impossible d'enregistrer : l'espace de stockage du navigateur est plein (les images importées sont volumineuses).\n\n" +
        "Cliquez sur « Exporter » pour sauvegarder votre travail dans un fichier, ou utilisez des adresses d'images (https://…) plutôt que des fichiers.");
      return false;
    }
  }

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

  function slugify(s) {
    return norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'article';
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

  function setPath(obj, path, value) {
    var keys = path.split('.');
    var last = keys.pop();
    var target = keys.reduce(function (o, k) { return o[k]; }, obj);
    if (target) target[last] = value;
  }

  // Résout une source d'image : "media:xxx" (image importée) ou adresse classique
  function imgSrc(s) {
    s = String(s || '').trim();
    if (s.indexOf('media:') === 0) return content.media[s.slice(6)] || '';
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

  function editable(path, tag, cls) {
    tag = tag || 'span';
    return '<' + tag + ' data-edit="' + path + '"' + (cls ? ' class="' + cls + '"' : '') + '>' +
      esc(getPath(content, path) || '') + '</' + tag + '>';
  }

  /* ------------------------------------------------------------------
   * Mise en forme du corps des articles
   * ------------------------------------------------------------------ */
  function inline(t) {
    t = esc(t);
    t = t.replace(/\[([^\]]+)\]\(((?:https?:\/\/|#|mailto:)[^)\s]+)\)/g, function (m, label, url) {
      var ext = /^https?:/.test(url);
      return '<a href="' + url + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + label + '</a>';
    });
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
    return t.replace(/\n/g, '<br>');
  }

  function renderBody(text, seed) {
    var i = 0;
    return String(text || '').split(/\n\s*\n/).map(function (block) {
      block = block.trim();
      if (!block) return '';
      var m = block.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
      if (m) {
        i++;
        return '<figure class="polaroid polaroid--figure" style="--r:' + tilt(seed + i, 2.5) + 'deg">' +
          '<span class="tape" aria-hidden="true"></span>' +
          '<div class="polaroid__img polaroid__img--free">' + img(m[2], m[1]) + '</div>' +
          (m[1] ? '<figcaption class="polaroid__caption polaroid__caption--small">' + esc(m[1]) + '</figcaption>' : '<div class="polaroid__pad"></div>') +
          '</figure>';
      }
      if (/^##\s+/.test(block)) return '<h2>' + inline(block.replace(/^##\s+/, '')) + '</h2>';
      if (/^>\s?/.test(block)) return '<blockquote>' + inline(block.replace(/^>\s?/gm, '')) + '</blockquote>';
      return '<p>' + inline(block) + '</p>';
    }).join('\n');
  }

  /* ------------------------------------------------------------------
   * Éléments décoratifs (SVG)
   * ------------------------------------------------------------------ */
  var SVG = {
    clip: '<svg class="deco-clip" viewBox="0 0 120 160" aria-hidden="true"><defs><linearGradient id="clipg" x1="0" x2="1"><stop offset="0" stop-color="#151515"/><stop offset=".42" stop-color="#6f6f6f"/><stop offset=".55" stop-color="#2f2f2f"/><stop offset="1" stop-color="#0e0e0e"/></linearGradient></defs>' +
      '<path d="M42 100 L34 24 Q34 6 60 6 Q86 6 86 24 L78 100" fill="none" stroke="#a7a7a7" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M50 100 L46 36 Q46 22 60 22 Q74 22 74 36 L70 100" fill="none" stroke="#5c5c5c" stroke-width="3.5"/>' +
      '<path d="M12 104 H108 L101 156 H19 Z" fill="url(#clipg)"/><rect x="12" y="98" width="96" height="12" rx="3" fill="#262626"/></svg>',
    star: '<svg class="deco-star" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 3 L62 36 L97 37 L69 58 L80 93 L50 72 L20 93 L31 58 L3 37 L38 36 Z" fill="#3b5a99"/>' +
      '<path d="M50 14 L59 40 L86 41 L64 57 L72 83 L50 67 L28 83 L36 57 L14 41 L41 40 Z" fill="none" stroke="#c5d4f2" stroke-width="1.6" stroke-dasharray="3 3"/></svg>',
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
        (editMode ? '<p>Cliquez sur « + Nouvel article » pour en ajouter un.</p>' : '<p>Revenez bientôt !</p>') + '</div>';
    }
    return '<div class="pgrid">' + list.map(function (a) { return polaroid(a); }).join('') + '</div>';
  }

  function addButton(secId, rubId) {
    if (!editMode) return '';
    return '<button type="button" class="btn btn--ink add-btn" data-new="' + esc(secId) + '|' + esc(rubId || '') + '">+ Ajouter un article ici</button>';
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
    if (s.motEntoure && !editMode) {
      var w = esc(s.motEntoure);
      aboutItalic = aboutItalic.replace(w, '<span class="circled">' + w + '</span>');
    }

    var html = '' +
      '<section class="hero">' +
        '<div class="hero__collage">' +
          '<div class="torn torn--green" aria-hidden="true"></div>' +
          SVG.clip +
          '<div class="paper">' +
            editable('site.editoTitre', 'h2', 'paper__title') +
            editable('site.edito', 'p', 'paper__text') +
          '</div>' +
          SVG.star +
          (latest[0] ? '<a class="snap snap--hero" href="#/article/' + encodeURIComponent(latest[0].id) + '" aria-label="' + esc(latest[0].titre) + '">' + img(latest[0].image, '') + '</a>' : '') +
        '</div>' +
        '<div class="hero__text">' +
          '<h1 class="hero__title">' + editable('site.heroItalique', 'em') + editable('site.heroCapitales', 'span', 'caps') + '</h1>' +
          editable('site.heroTexte', 'p', 'hero__lead') +
          '<div class="hero__links"><a class="link-u" href="#/droit">Rubrique Droit</a><a class="link-u" href="#/art">Rubrique Art</a></div>' +
          SVG.loop +
        '</div>' +
      '</section>' +

      '<section class="une">' +
        '<div class="une__head">' +
          '<div><p class="label">À la une</p>' + editable('site.uneTexte', 'p', 'une__lead') + '</div>' +
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
          editable('sections.' + i + '.intro', 'p', 'bigcard__intro') +
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
      '<p class="about__big">' + editable('site.aPropos') + ' <em' + (editMode ? ' data-edit="site.aProposItalique"' : '') + '>' + aboutItalic + '</em></p>' +
      (cover ? '<div class="stamp" aria-hidden="true"><span class="torn torn--gold"></span><div class="stamp__inner">' + img(cover.image, '') + '</div></div>' : '') +
      '<span class="tape tape--about" aria-hidden="true"></span>' +
      '<p class="label">Nos valeurs</p>' +
      '<div class="values">' + (s.valeurs || []).map(function (v, i) {
        return '<p>' + editable('site.valeurs.' + i + '.titre', 'strong') + ' ' + editable('site.valeurs.' + i + '.texte') + '</p>';
      }).join('') + '</div>' +
      '</section>';

    return html;
  }

  function pageSection(sec) {
    var idx = content.sections.indexOf(sec);
    var all = articlesOf(sec.id);
    var html = giantTitle(sec.titre, all) +
      '<div class="page-intro">' + crumbs([{ label: 'Accueil', href: '#/' }, { label: sec.titre }]) +
      editable('sections.' + idx + '.intro', 'p', 'page-intro__text') + '</div>';

    html += (sec.sous || []).map(function (r, j) {
      var list = articlesOf(sec.id, r.id);
      return '<section class="bigcard bigcard--list">' +
        '<div class="bigcard__row">' +
          '<div><p class="label">' + esc(sec.titre) + '</p>' +
          '<h2 class="bigcard__title"><a href="#/' + esc(sec.id) + '/' + esc(r.id) + '">' + esc(r.titre) + '</a></h2>' +
          editable('sections.' + idx + '.sous.' + j + '.intro', 'p', 'bigcard__intro') + '</div>' +
          '<p class="bigcard__num">(0' + (j + 1) + ')</p>' +
        '</div>' +
        polaroidGrid(list.slice(0, 4)) +
        '<div class="bigcard__foot">' + addButton(sec.id, r.id) +
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
        editable('sections.' + idx + '.sous.' + j + '.intro', 'p', 'page-intro__text') +
        '<div class="subnav">' + sec.sous.map(function (r) {
          return '<a class="pill' + (r === rub ? ' is-active' : '') + '" href="#/' + esc(sec.id) + '/' + esc(r.id) + '">' + esc(r.titre) + '</a>';
        }).join('') + '</div>' +
        addButton(sec.id, rub.id) +
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
        (editMode ? '<div class="article__tools"><button type="button" class="btn btn--ink" data-edit-article="' + esc(a.id) + '">Modifier cet article</button>' +
          '<button type="button" class="btn btn--ghost" data-delete-article="' + esc(a.id) + '">Supprimer</button></div>' : '') +
      '</header>' +
      (imgSrc(a.image) ? '<figure class="polaroid polaroid--hero" style="--r:' + tilt(a.id, 2) + 'deg">' +
        '<span class="tape" aria-hidden="true"></span><span class="tape tape--b" aria-hidden="true"></span>' +
        '<div class="polaroid__img polaroid__img--free">' + img(a.image, a.legende || a.titre) + '</div>' +
        (a.legende ? '<figcaption class="polaroid__caption polaroid__caption--small">' + esc(a.legende) + '</figcaption>' : '<div class="polaroid__pad"></div>') +
        '</figure>' : '') +
      '<div class="article__body">' + renderBody(a.corps, a.id) + '</div>' +
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
    // Carrousel « À la une »
    var car = $('#carousel');
    $$('[data-scroll]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (car) car.scrollBy({ left: Number(b.getAttribute('data-scroll')) * car.clientWidth * 0.8, behavior: 'smooth' });
      });
    });

    // Textes modifiables
    $$('[data-edit]').forEach(function (el) {
      if (!editMode) { el.removeAttribute('contenteditable'); return; }
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'true');
      el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); });
      el.addEventListener('paste', function (e) {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
      });
      el.addEventListener('blur', function () {
        var path = el.getAttribute('data-edit');
        var val = el.innerText.replace(/\n{3,}/g, '\n\n').trim();
        if (getPath(content, path) !== val) { setPath(content, path, val); save(); }
      });
    });

    $$('[data-new]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = b.getAttribute('data-new').split('|');
        openEditor(null, p[0], p[1]);
      });
    });
    $$('[data-edit-article]').forEach(function (b) {
      b.addEventListener('click', function () { openEditor(b.getAttribute('data-edit-article')); });
    });
    $$('[data-delete-article]').forEach(function (b) {
      b.addEventListener('click', function () { deleteArticle(b.getAttribute('data-delete-article')); });
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
      var hay = norm([a.titre, a.chapo, a.corps, a.auteur, rubLabel(a)].join(' '));
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
    if (e.key === 'Escape') {
      if (!$('#modal').hidden) closeEditor();
      else closeDrawer();
    }
  });

  /* ------------------------------------------------------------------
   * Mode édition
   * ------------------------------------------------------------------ */
  function applyEditMode() {
    document.body.classList.toggle('is-editing', editMode);
    $('#editbar').hidden = !editMode;
    $('#editToggle').textContent = editMode ? 'Quitter l\'édition' : 'Éditer';
    $('#editToggle').setAttribute('aria-pressed', editMode ? 'true' : 'false');
  }

  $('#editToggle').addEventListener('click', function () {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    editMode = !editMode;
    try { localStorage.setItem(EDIT_KEY, editMode ? '1' : '0'); } catch (e) { /* ignore */ }
    applyEditMode();
    render();
  });

  $('#editbar').addEventListener('click', function (e) {
    var b = e.target.closest('[data-action]');
    if (!b) return;
    var action = b.getAttribute('data-action');
    if (action === 'new') {
      var parts = parseRoute();
      if (parts[0] === 'article') {
        var cur = content.articles.filter(function (x) { return x.id === parts[1]; })[0];
        openEditor(null, cur && cur.section, cur && cur.rubrique);
      } else openEditor(null, parts[0], parts[1]);
    }
    if (action === 'export') exportContent();
    if (action === 'import') $('#importInput').click();
    if (action === 'reset') {
      if (confirm('Effacer toutes les modifications faites dans ce navigateur et revenir au contenu publié (data/contenu.js) ?')) {
        try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
        content = normalize(clone(window.RVPTURE_CONTENT || {}));
        render();
      }
    }
  });

  function exportContent() {
    gcMedia();
    var text = '/* RVPTURE — contenu exporté le ' + new Date().toLocaleString('fr-FR') + '.\n' +
      ' * Remplacez le fichier data/contenu.js du site par celui-ci pour publier vos modifications. */\n' +
      'window.RVPTURE_CONTENT = ' + JSON.stringify(content, null, 2) + ';\n';
    var blob = new Blob([text], { type: 'text/javascript' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'contenu.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  $('#importInput').addEventListener('change', function () {
    var file = this.files[0];
    this.value = '';
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var t = String(reader.result);
        var data = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
        if (!isValidContent(data)) throw new Error('format');
        content = normalize(data);
        save();
        render();
        alert('Contenu importé.');
      } catch (err) {
        alert('Ce fichier ne semble pas être un contenu Rvpture valide.');
      }
    };
    reader.readAsText(file);
  });

  // Supprime les images importées qui ne sont plus utilisées
  function gcMedia() {
    var used = {};
    var mark = function (s) {
      String(s || '').replace(/media:([\w-]+)/g, function (m, id) { used[id] = true; return m; });
    };
    content.articles.forEach(function (a) { mark(a.image); mark(a.corps); });
    Object.keys(content.media).forEach(function (id) { if (!used[id]) delete content.media[id]; });
  }

  function deleteArticle(id) {
    var a = content.articles.filter(function (x) { return x.id === id; })[0];
    if (!a || !confirm('Supprimer définitivement « ' + a.titre + ' » ?')) return;
    content.articles = content.articles.filter(function (x) { return x.id !== id; });
    gcMedia();
    save();
    location.hash = '#/' + a.section + (a.rubrique ? '/' + a.rubrique : '');
  }

  /* ---------- Formulaire d'article ---------- */
  var pendingMedia = [];

  function resizeImage(file, max) {
    max = max || 1400;
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        var im = new Image();
        im.onerror = reject;
        im.onload = function () {
          var scale = Math.min(1, max / Math.max(im.width, im.height));
          var c = document.createElement('canvas');
          c.width = Math.round(im.width * scale);
          c.height = Math.round(im.height * scale);
          var ctx = c.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(im, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.82));
        };
        im.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function storeImage(file) {
    return resizeImage(file).then(function (data) {
      var id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      content.media[id] = data;
      pendingMedia.push(id);
      return 'media:' + id;
    });
  }

  function rubOptions(secId, rubId) {
    return content.sections.map(function (sec) {
      return '<optgroup label="' + esc(sec.titre) + '">' + (sec.sous || []).map(function (r) {
        var v = sec.id + '|' + r.id;
        return '<option value="' + esc(v) + '"' + (sec.id === secId && r.id === rubId ? ' selected' : '') + '>' + esc(sec.titre + ' — ' + r.titre) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
  }

  function openEditor(id, secId, rubId) {
    var a = id ? content.articles.filter(function (x) { return x.id === id; })[0] : null;
    var isNew = !a;
    if (isNew) {
      var sec = findSection(secId) || content.sections[0];
      var rub = findRub(sec, rubId) || (sec && sec.sous[0]);
      a = { titre: '', chapo: '', auteur: 'La rédaction', date: new Date().toISOString().slice(0, 10), image: '', legende: '', corps: '',
        section: sec ? sec.id : '', rubrique: rub ? rub.id : '' };
    }
    pendingMedia = [];
    var cover = a.image || '';

    var modal = $('#modal');
    modal.innerHTML = '<div class="modal__box" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
      '<span class="tape tape--modal" aria-hidden="true"></span>' +
      '<form class="form" id="articleForm" novalidate>' +
        '<div class="form__head"><h2 id="modalTitle">' + (isNew ? 'Nouvel article' : 'Modifier l\'article') + '</h2>' +
        '<button type="button" class="text-btn" data-close>Fermer ✕</button></div>' +
        '<label class="field"><span>Titre *</span><input name="titre" required value="' + esc(a.titre) + '"></label>' +
        '<div class="form__row">' +
          '<label class="field"><span>Rubrique *</span><select name="rub">' + rubOptions(a.section, a.rubrique) + '</select></label>' +
          '<label class="field"><span>Date</span><input type="date" name="date" value="' + esc(a.date) + '"></label>' +
        '</div>' +
        '<label class="field"><span>Auteur·rice</span><input name="auteur" value="' + esc(a.auteur) + '"></label>' +
        '<label class="field"><span>Chapô (texte d\'introduction)</span><textarea name="chapo" rows="2">' + esc(a.chapo) + '</textarea></label>' +
        '<fieldset class="field field--cover"><span>Image principale (polaroïd)</span>' +
          '<div class="cover">' +
            '<div class="cover__preview" id="coverPreview">' + img(cover, '') + '</div>' +
            '<div class="cover__ctrl">' +
              '<label class="btn btn--file">Choisir une image…<input type="file" accept="image/*" id="coverFile" hidden></label>' +
              '<label class="field field--inline"><span>ou adresse de l\'image</span><input name="imageUrl" placeholder="https://… ou images/photo.jpg" value="' + esc(cover.indexOf('media:') === 0 ? '' : cover) + '"></label>' +
              '<label class="field field--inline"><span>Légende</span><input name="legende" value="' + esc(a.legende) + '"></label>' +
            '</div>' +
          '</div>' +
        '</fieldset>' +
        '<div class="field"><span>Texte de l\'article</span>' +
          '<div class="toolbar" role="toolbar" aria-label="Mise en forme">' +
            '<button type="button" data-fmt="h2">Intertitre</button>' +
            '<button type="button" data-fmt="quote">Citation</button>' +
            '<button type="button" data-fmt="bold"><strong>Gras</strong></button>' +
            '<button type="button" data-fmt="italic"><em>Italique</em></button>' +
            '<button type="button" data-fmt="link">Lien</button>' +
            '<label class="toolbar__img">+ Image dans le texte<input type="file" accept="image/*" id="bodyFile" hidden></label>' +
          '</div>' +
          '<textarea name="corps" rows="14" id="corps" placeholder="Écrivez ici. Laissez une ligne vide entre deux paragraphes.">' + esc(a.corps) + '</textarea>' +
          '<p class="hint">Une ligne vide = nouveau paragraphe · <code>## </code> intertitre · <code>&gt; </code> citation · <code>**gras**</code> · <code>*italique*</code> · <code>![légende](image)</code> image.</p>' +
        '</div>' +
        '<p class="form__error" id="formError" role="alert"></p>' +
        '<div class="form__actions">' +
          '<button type="button" class="btn btn--ghost" data-close>Annuler</button>' +
          '<button type="submit" class="btn btn--ink">' + (isNew ? 'Publier l\'article' : 'Enregistrer') + '</button>' +
        '</div>' +
      '</form></div>';
    modal.hidden = false;
    document.body.classList.add('modal-open');

    var form = $('#articleForm');
    var corps = $('#corps');
    form.titre.focus();

    $$('[data-close]', modal).forEach(function (b) { b.addEventListener('click', closeEditor); });
    modal.onclick = function (e) { if (e.target === modal) closeEditor(); };

    $('#coverFile').addEventListener('change', function () {
      var f = this.files[0];
      if (!f) return;
      storeImage(f).then(function (ref) {
        cover = ref;
        form.imageUrl.value = '';
        $('#coverPreview').innerHTML = img(ref, '');
      }).catch(function () { alert('Image illisible.'); });
    });
    form.imageUrl.addEventListener('input', function () {
      cover = this.value.trim();
      $('#coverPreview').innerHTML = img(cover, '');
    });

    function wrap(before, after, placeholder) {
      var s = corps.selectionStart, e = corps.selectionEnd;
      var sel = corps.value.slice(s, e) || placeholder;
      corps.setRangeText(before + sel + after, s, e, 'end');
      corps.focus();
    }
    function block(text) {
      var s = corps.selectionStart;
      var v = corps.value;
      var pre = v.slice(0, s).replace(/\s*$/, '');
      var ins = (pre ? '\n\n' : '') + text + '\n\n';
      corps.setRangeText(ins, pre.length, corps.selectionEnd, 'end');
      corps.focus();
    }
    $$('[data-fmt]', modal).forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-fmt');
        var sel = corps.value.slice(corps.selectionStart, corps.selectionEnd);
        if (f === 'bold') wrap('**', '**', 'texte en gras');
        if (f === 'italic') wrap('*', '*', 'texte en italique');
        if (f === 'h2') block('## ' + (sel || 'Intertitre'));
        if (f === 'quote') block('> ' + (sel || 'Citation'));
        if (f === 'link') {
          var url = prompt('Adresse du lien (https://…) :', 'https://');
          if (url) wrap('[', '](' + url.trim() + ')', 'texte du lien');
        }
      });
    });
    $('#bodyFile').addEventListener('change', function () {
      var f = this.files[0];
      this.value = '';
      if (!f) return;
      storeImage(f).then(function (ref) {
        var cap = prompt('Légende de l\'image (facultatif) :', '') || '';
        block('![' + cap.replace(/[\[\]]/g, '') + '](' + ref + ')');
      }).catch(function () { alert('Image illisible.'); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var titre = form.titre.value.trim();
      var rubVal = form.rub.value.split('|');
      if (!titre) { $('#formError').textContent = 'Le titre est obligatoire.'; form.titre.focus(); return; }
      if (!rubVal[0]) { $('#formError').textContent = 'Choisissez une rubrique.'; return; }

      var data = {
        titre: titre,
        section: rubVal[0],
        rubrique: rubVal[1],
        date: form.date.value,
        auteur: form.auteur.value.trim(),
        chapo: form.chapo.value.trim(),
        image: cover,
        legende: form.legende.value.trim(),
        corps: form.corps.value.replace(/\r/g, '').trim()
      };

      if (isNew) {
        data.id = slugify(titre);
        while (content.articles.some(function (x) { return x.id === data.id; })) data.id = slugify(titre) + '-' + Date.now().toString(36).slice(-4);
        content.articles.push(data);
      } else {
        Object.keys(data).forEach(function (k) { a[k] = data[k]; });
        data.id = a.id;
      }
      gcMedia();
      if (!save()) return;
      pendingMedia = [];
      closeEditor(true);
      var target = '#/article/' + encodeURIComponent(data.id);
      if (location.hash === target) render(); else location.hash = target;
    });
  }

  function closeEditor(saved) {
    if (saved !== true && pendingMedia.length) {
      pendingMedia.forEach(function (id) { delete content.media[id]; });
    }
    pendingMedia = [];
    var modal = $('#modal');
    modal.hidden = true;
    modal.innerHTML = '';
    document.body.classList.remove('modal-open');
  }

  /* ------------------------------------------------------------------
   * Démarrage
   * ------------------------------------------------------------------ */
  $('#today').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  window.addEventListener('hashchange', function () { closeDrawer(); render(); });
  window.addEventListener('scroll', function () {
    document.body.classList.toggle('is-scrolled', window.scrollY > 60);
  }, { passive: true });

  applyEditMode();
  render();
})();
