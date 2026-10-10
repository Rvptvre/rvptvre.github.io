# RVPTURE — média Droit & Art

Site statique (HTML/CSS/JS, aucune installation) : fond bleu `#9BB4E3`, esprit carnet (polaroïds, scotch, trombone, typographies serif condensées).

Le site publié est **en lecture seule** : les visiteurs ne peuvent rien modifier. Tout le contenu se modifie en amont, dans les fichiers du projet, puis on republie.

## Voir le site
Ouvrez `index.html` dans un navigateur, ou publiez le dossier tel quel (GitHub Pages, Netlify…).
Toute la navigation se fait dans la même fenêtre (`#/droit`, `#/art/mode`, `#/article/…`).

## Structure
- **Accueil** : édito, « À la une » (Précédent / Suivant), rubriques, « Qui sommes-nous ».
- **Menu / loupe** : barre latérale avec recherche en direct et arborescence des rubriques.
- **Droit** → Actualité, Portrait · **Art** → Mode, Cinéma – Théâtre, Expositions.
- Chaque rubrique = inventaire d'articles en polaroïds → clic = page de l'article.

## Modifier le contenu
Tout est dans **`data/contenu.js`** (mode d'emploi détaillé en tête du fichier) :
- `site` : textes de l'accueil (édito, titre, « Qui sommes-nous », valeurs) ;
- `sections` : rubriques et leurs textes d'introduction ;
- `articles` : un bloc par article (titre, rubrique, date, image, texte…).

Pour ajouter un article : copiez un bloc existant, changez son `id` et son contenu.
Les photos vont dans le dossier **`images/`** (ex. `"image": "images/defile.jpg"`).

Les fichiers `index.html`, `css/` et `js/` n'ont pas besoin d'être touchés pour ajouter du contenu.

Les articles et images fournis sont des exemples (photos picsum.photos) à remplacer.
