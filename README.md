# RVPTURE — média Droit & Art

Site statique (HTML/CSS/JS, aucune installation) : fond bleu `#9BB4E3`, esprit carnet (polaroïds, scotch, trombone, typographies serif condensées).

## Ouvrir le site
Ouvrez `index.html` dans un navigateur, ou publiez le dossier tel quel (GitHub Pages, Netlify…).
Toute la navigation se fait dans la même fenêtre (`#/droit`, `#/art/mode`, `#/article/…`).

## Structure
- **Accueil** : édito, « À la une » (Précédent / Suivant), rubriques, « Qui sommes-nous ».
- **Menu / loupe** : barre latérale avec recherche en direct et arborescence des rubriques.
- **Droit** → Actualité, Portrait · **Art** → Mode, Cinéma – Théâtre, Expositions.
- Chaque rubrique = inventaire d'articles en polaroïds → clic = page de l'article.

## Modifier le contenu
1. **Depuis le site** : bouton **Éditer** (en haut à droite).
   - Les textes en pointillés se modifient directement.
   - **+ Nouvel article** : titre, rubrique, chapô, image (fichier ou adresse), texte, images dans le texte.
   - Sur un article : **Modifier** / **Supprimer**.
   - Les changements sont enregistrés *dans votre navigateur*. Pour les publier : **Exporter**, puis remplacez `data/contenu.js` par le fichier téléchargé.
2. **À la main** : tout le contenu est dans `data/contenu.js` (format expliqué en tête du fichier). Mettez vos photos dans `images/`.

Les articles et images fournis sont des exemples (photos picsum.photos) à remplacer.
