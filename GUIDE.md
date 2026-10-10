# Guide : gérer le site Rvpture sans toucher au code

Le site se gère depuis **Pages CMS**, une interface web gratuite : on remplit des formulaires,
on glisse des photos, on clique sur « Enregistrer »… et le site se met à jour tout seul
en 1 à 2 minutes. Aucun code, aucun fichier à manipuler.

> Pages CMS est en anglais, mais tous les champs du site sont en français.

---

## 1. Mise en place (à faire une seule fois)

### a) Activer la publication automatique
1. Sur GitHub, ouvrez le dépôt **rvpture**.
2. Cliquez sur **Settings** (⚙️, en haut à droite du dépôt), puis sur **Pages** dans le menu de gauche.
3. Dans **Build and deployment → Source**, choisissez **GitHub Actions**.

C'est tout. Le site est publié à l'adresse indiquée en haut de cette page
(du type `https://trip0lit.github.io/rvpture/`).

### b) Connecter Pages CMS
1. Allez sur **[app.pagescms.org](https://app.pagescms.org)**.
2. Cliquez sur **Sign in with GitHub** et acceptez.
3. Pages CMS vous propose d'installer son application GitHub : choisissez votre compte,
   puis le dépôt **rvpture** (« Only select repositories » → rvpture), et validez.
4. De retour sur Pages CMS, ouvrez **rvpture** (branche **main**).

Vous voyez maintenant dans le menu de gauche : **Articles**, **Page d'accueil**,
**Textes des rubriques** et **Media** (vos photos).

Astuce : ajoutez app.pagescms.org à vos favoris, c'est votre « back-office ».

---

## 2. Ajouter un article

1. Dans Pages CMS, cliquez sur **Articles**, puis sur le bouton d'ajout (**Add an entry**).
2. Remplissez le formulaire :
   - **Titre** : il sert aussi à créer l'adresse de l'article ;
   - **Rubrique** : Droit — Actualité, Droit — Portrait, Art — Mode, Art — Cinéma – Théâtre ou Art — Expositions ;
   - **Date de publication** : les articles les plus récents apparaissent en premier ;
   - **Auteur·rice**, **Chapô** (texte d'introduction) ;
   - **Photo principale** : cliquez dessus, puis **Upload** pour envoyer une photo depuis votre ordinateur
     (ou choisissez une photo déjà envoyée) ;
   - **Légende de la photo** (facultatif) ;
   - **Texte de l'article** : écrivez comme dans un traitement de texte
     (gras, italique, intertitres, listes, citations, liens…).
3. Cliquez sur **Save**.
4. Patientez 1 à 2 minutes : l'article apparaît sur le site, dans sa rubrique, sur l'accueil (« À la une ») et dans la recherche.

### Mettre une photo dans le texte
Dans l'éditeur du texte, cliquez sur l'icône **image** de la barre d'outils, puis envoyez ou choisissez la photo.
Une photo placée **seule sur sa ligne** s'affiche en **polaroïd** ; son *texte alternatif*
(la description de l'image) devient la **légende** écrite sous le polaroïd.

### Conseils pour les photos
- Formats : **JPG** (photos) ou PNG. Évitez les fichiers énormes : moins de **2 Mo** suffit largement
  (une photo de téléphone peut être réduite avec n'importe quel outil d'export « taille moyenne »).
- La photo principale est recadrée en **carré** dans les polaroïds : gardez le sujet au centre.

---

## 3. Modifier, masquer ou supprimer un article
- **Modifier** : Articles → cliquez sur l'article → changez ce que vous voulez → **Save**.
- **Brouillon** : décochez **Publié sur le site** → **Save**. L'article disparaît du site mais reste
  dans Pages CMS ; recochez la case pour le publier. Pratique pour préparer un article à l'avance !
- **Supprimer** : dans la liste des articles, menu **⋯** de l'article → **Delete**.

---

## 4. Modifier les textes du site
- **Page d'accueil** : édito, grand titre, texte « À la une », « Qui sommes-nous », valeurs
  (on peut ajouter ou retirer des valeurs).
- **Textes des rubriques** : les phrases d'introduction de chaque rubrique.

---

## 5. En cas de souci

**Mon article n'apparaît pas.**
- Attendez 2 minutes, puis rechargez la page en forçant : **Ctrl + Maj + R** (Windows) ou **Cmd + Maj + R** (Mac).
- Vérifiez que la case **Publié sur le site** est cochée et qu'une **Rubrique** est choisie.

**Vérifier que la publication s'est bien passée.**
Sur GitHub, onglet **Actions** du dépôt : chaque enregistrement lance « Publier le site ».
- ✅ coche verte : c'est en ligne.
- 🟡 rond jaune : publication en cours.
- ❌ croix rouge : cliquez dessus pour lire le message, ou demandez de l'aide.

Si un article contient une erreur (par exemple sans titre), il est simplement **ignoré** :
le reste du site est quand même publié, et un avertissement apparaît dans l'onglet Actions.

---

## Pour info : où est rangé quoi ?
Pages CMS enregistre tout dans le dépôt GitHub, vous n'avez pas à y toucher :

| Dossier / fichier | Contenu |
| --- | --- |
| `contenu/articles/` | un fichier par article |
| `contenu/accueil.yml` | textes de la page d'accueil |
| `contenu/rubriques.yml` | introductions des rubriques |
| `images/` | les photos envoyées |

Chaque modification est conservée dans l'historique de GitHub : rien n'est jamais perdu.
