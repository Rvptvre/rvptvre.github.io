# RVPTURE — média Droit & Art

Site du média Rvpture : fond bleu `#9BB4E3`, esprit carnet (polaroïds, scotch, trombone, typographies serif condensées).

## ➜ Ajouter des articles et modifier le site : lire le [GUIDE](GUIDE.md)

Tout se fait depuis **[Pages CMS](https://app.pagescms.org)** (formulaires + envoi de photos),
sans toucher au code. Le site publié est en lecture seule et se met à jour tout seul
après chaque enregistrement.

## Fonctionnement (pour les curieux)

- `contenu/` : le contenu (articles en Markdown, textes de l'accueil et des rubriques), modifié via Pages CMS (`.pages.yml`).
- `images/` : les photos.
- `index.html`, `css/`, `js/` : la mise en page du site.
- `scripts/build.mjs` : assemble le site dans `_site/`.
- `.github/workflows/publier.yml` : à chaque modification de `main`, GitHub fabrique le site et le publie sur GitHub Pages.

### Voir le site sur son ordinateur
```
npm install
npm run build
```
puis ouvrir `_site/index.html` dans un navigateur.

Les articles et photos fournis sont des exemples (photos picsum.photos) à remplacer.
