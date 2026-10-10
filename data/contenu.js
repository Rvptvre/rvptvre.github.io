/*
 * RVPTURE — contenu du site
 * --------------------------------------------------------------
 * Ce fichier contient TOUT le contenu publié : textes de l'accueil,
 * rubriques et articles. Vous pouvez :
 *   - le modifier directement à la main (textes, images, articles) ;
 *   - ou utiliser le « mode Édition » du site puis cliquer sur
 *     « Exporter » : le site télécharge un nouveau contenu.js qui
 *     remplace celui-ci.
 *
 * Mise en forme du corps des articles (champ "corps") :
 *   - un paragraphe par bloc, séparés par une ligne vide ;
 *   - "## Intertitre" pour un intertitre ;
 *   - "> Citation" pour une citation ;
 *   - "![Légende](chemin/ou/url-de-l-image.jpg)" pour une image (polaroïd) ;
 *   - **gras**, *italique*, [lien](https://...).
 *
 * Images : mettez vos fichiers dans le dossier images/ et indiquez
 * "images/mon-fichier.jpg", ou utilisez une adresse https://...
 */
window.RVPTURE_CONTENT = {
  "site": {
    "nom": "RVPTURE",
    "editoTitre": "Édito",
    "edito": "Rvpture est un média indépendant qui fait se rencontrer deux mondes que tout semble opposer : la rigueur du droit et la liberté de l'art. Ici, on décrypte l'actualité juridique, on raconte celles et ceux qui la font, et on arpente les défilés, les salles obscures et les galeries.",
    "heroItalique": "Le droit, l'art",
    "heroCapitales": "et tout ce qui fait rupture",
    "heroTexte": "Analyses, portraits, critiques et coups de cœur : un regard neuf sur ce qui bouge dans les prétoires comme sur les scènes.",
    "uneTexte": "Les derniers articles publiés, toutes rubriques confondues.",
    "aPropos": "Rvpture est un média né d'une conviction simple : le droit et la création parlent de la même chose, de nos libertés.",
    "aProposItalique": "Nous écrivons pour celles et ceux qui veulent comprendre sans renoncer au plaisir de lire.",
    "motEntoure": "comprendre",
    "valeurs": [
      { "titre": "Rigueur.", "texte": "Chaque article s'appuie sur des sources vérifiées et des textes précis. Le droit ne souffre pas l'approximation." },
      { "titre": "Curiosité.", "texte": "Des tribunaux aux ateliers, nous allons chercher les histoires là où on ne les attend pas." },
      { "titre": "Clarté.", "texte": "Rendre lisible ce qui est complexe, sans jamais simplifier à l'excès. Écrire pour être compris." },
      { "titre": "Indépendance.", "texte": "Un regard libre, critique et sincère, au service de nos lectrices et lecteurs avant tout." }
    ]
  },

  "sections": [
    {
      "id": "droit",
      "titre": "Droit",
      "intro": "L'actualité juridique décryptée et les portraits de celles et ceux qui font vivre le droit au quotidien.",
      "sous": [
        { "id": "actualite", "titre": "Actualité", "intro": "Réformes, décisions marquantes, débats de société : l'actualité du droit expliquée simplement." },
        { "id": "portrait", "titre": "Portrait", "intro": "Avocates, magistrats, juristes, chercheuses : rencontres avec des parcours singuliers." }
      ]
    },
    {
      "id": "art",
      "titre": "Art",
      "intro": "Mode, cinéma, théâtre et expositions : nos critiques, nos rencontres et nos coups de cœur.",
      "sous": [
        { "id": "mode", "titre": "Mode", "intro": "Défilés, créateurs émergents et histoire du vêtement." },
        { "id": "cinema-theatre", "titre": "Cinéma – Théâtre", "intro": "Ce qu'il faut voir sur grand écran et sur les planches." },
        { "id": "expositions", "titre": "Expositions", "intro": "Musées, galeries et lieux alternatifs : les expositions à ne pas manquer." }
      ]
    }
  ],

  "articles": [
    {
      "id": "intelligence-artificielle-et-droit-d-auteur",
      "section": "droit",
      "rubrique": "actualite",
      "titre": "Intelligence artificielle et droit d'auteur : qui possède une œuvre générée ?",
      "chapo": "Les images et textes produits par des IA bousculent les catégories classiques de la propriété intellectuelle. Tour d'horizon d'un débat qui ne fait que commencer.",
      "auteur": "La rédaction",
      "date": "2026-10-02",
      "image": "https://picsum.photos/seed/rvpture-ia/900/1100",
      "legende": "Une œuvre peut-elle exister sans auteur ?",
      "corps": "Depuis l'arrivée massive des outils de génération d'images et de textes, une question revient sans cesse dans les cabinets d'avocats comme dans les écoles d'art : à qui appartient une création produite par une machine ?\n\nEn droit français, l'œuvre protégée est traditionnellement définie comme une création de forme originale, portant **l'empreinte de la personnalité de son auteur**. Or une machine n'a, par définition, pas de personnalité.\n\n## Une notion d'auteur mise à l'épreuve\n\nLe débat se déplace donc vers l'utilisateur : celui qui choisit, corrige, sélectionne et assemble les résultats peut-il revendiquer une part de création ? Les réponses varient selon le degré d'intervention humaine.\n\n> Le droit d'auteur protège un geste humain, pas un résultat statistique.\n\nReste la question, tout aussi sensible, des œuvres utilisées pour entraîner ces modèles. Plusieurs procédures sont en cours en Europe et aux États-Unis, et leurs issues dessineront les contours du droit de demain.\n\n*Texte d'exemple — à remplacer par votre article.*"
    },
    {
      "id": "reforme-justice-des-mineurs",
      "section": "droit",
      "rubrique": "actualite",
      "titre": "Justice des mineurs : ce que change la nouvelle procédure",
      "chapo": "Délais raccourcis, audience de culpabilité, mesures éducatives : ce qu'il faut retenir.",
      "auteur": "La rédaction",
      "date": "2026-09-21",
      "image": "https://picsum.photos/seed/rvpture-justice/900/1100",
      "legende": "Le tribunal pour enfants, au cœur de la réforme.",
      "corps": "La justice pénale des mineurs repose sur un principe ancien : la primauté de l'éducatif sur le répressif. Les réformes successives ont cherché à concilier ce principe avec l'exigence d'une réponse plus rapide.\n\n## Une procédure en deux temps\n\nLa procédure distingue désormais clairement l'audience sur la culpabilité et celle sur la sanction, avec entre les deux une période de mise à l'épreuve éducative.\n\nPour les professionnels, l'enjeu est de taille : tenir les délais sans sacrifier l'accompagnement des jeunes.\n\n*Texte d'exemple — à remplacer par votre article.*"
    },
    {
      "id": "droit-a-l-oubli-numerique",
      "section": "droit",
      "rubrique": "actualite",
      "titre": "Le droit à l'oubli numérique, dix ans après",
      "chapo": "Déréférencement, effacement, archives de presse : où en est-on vraiment ?",
      "auteur": "La rédaction",
      "date": "2026-09-08",
      "image": "https://picsum.photos/seed/rvpture-oubli/900/1100",
      "legende": "",
      "corps": "Le droit à l'effacement permet à toute personne de demander la suppression de données la concernant. Mais il se heurte à d'autres droits fondamentaux, à commencer par la liberté d'information.\n\nLes juridictions ont progressivement dessiné un équilibre, au cas par cas, entre la vie privée et l'intérêt du public.\n\n*Texte d'exemple — à remplacer par votre article.*"
    },
    {
      "id": "portrait-avocate-penaliste",
      "section": "droit",
      "rubrique": "portrait",
      "titre": "Une pénaliste à la barre : « Défendre, c'est d'abord écouter »",
      "chapo": "Rencontre avec une avocate qui a fait de la défense pénale un engagement de chaque instant.",
      "auteur": "La rédaction",
      "date": "2026-09-28",
      "image": "https://picsum.photos/seed/rvpture-avocate/900/1100",
      "legende": "Dans son cabinet, entre deux audiences.",
      "corps": "Elle reçoit dans un petit cabinet encombré de dossiers, un café froid à la main. Depuis quinze ans, elle plaide aux assises, en comparution immédiate, partout où on l'appelle.\n\n> On ne défend pas un acte, on défend une personne et ses droits.\n\n## Une vocation tardive\n\nRien ne la destinait au droit : des études de lettres, un passage par le journalisme, puis le déclic lors d'un procès suivi en tant que simple spectatrice.\n\n*Portrait d'exemple — personnage fictif, à remplacer par votre article.*"
    },
    {
      "id": "portrait-magistrate",
      "section": "droit",
      "rubrique": "portrait",
      "titre": "Juge des enfants, un métier de patience",
      "chapo": "Elle suit chaque année des centaines de dossiers. Portrait d'une magistrate passionnée.",
      "auteur": "La rédaction",
      "date": "2026-08-30",
      "image": "https://picsum.photos/seed/rvpture-juge/900/1100",
      "legende": "",
      "corps": "Le bureau est lumineux, les murs couverts de dessins d'enfants. « Ce sont des cadeaux, sourit-elle. Certains reviennent me voir des années plus tard. »\n\nSon quotidien : des audiences en cabinet, des familles à écouter, des décisions à prendre vite et bien.\n\n*Portrait d'exemple — personnage fictif, à remplacer par votre article.*"
    },
    {
      "id": "fashion-week-printemps",
      "section": "art",
      "rubrique": "mode",
      "titre": "Fashion Week : le retour du vêtement qui raconte",
      "chapo": "Sur les podiums de la saison, les créateurs renouent avec le récit et l'artisanat.",
      "auteur": "La rédaction",
      "date": "2026-10-05",
      "image": "https://picsum.photos/seed/rvpture-mode/900/1100",
      "legende": "Backstage, quelques minutes avant le défilé.",
      "corps": "Fini le minimalisme froid : cette saison, les silhouettes se chargent d'histoires. Broderies, pièces recyclées, matières anciennes détournées.\n\n## L'artisanat au premier plan\n\nPlusieurs maisons ont choisi de montrer le travail des ateliers, invitant brodeuses et plumassiers à saluer aux côtés des directeurs artistiques.\n\n![Détail d'une broderie réalisée à la main](https://picsum.photos/seed/rvpture-broderie/900/700)\n\nUne manière de rappeler que la mode est aussi un savoir-faire.\n\n*Texte d'exemple — à remplacer par votre article.*"
    },
    {
      "id": "seconde-main-et-contrefacon",
      "section": "art",
      "rubrique": "mode",
      "titre": "Seconde main, upcycling et contrefaçon : la ligne de crête",
      "chapo": "Transformer une pièce de luxe, est-ce créer ou contrefaire ? Quand la mode rencontre le droit.",
      "auteur": "La rédaction",
      "date": "2026-09-14",
      "image": "https://picsum.photos/seed/rvpture-upcycling/900/1100",
      "legende": "",
      "corps": "L'upcycling a le vent en poupe. Mais lorsque la pièce transformée porte le logo d'une grande maison, la frontière avec la contrefaçon devient floue.\n\nLes tribunaux examinent au cas par cas l'usage de la marque et le risque de confusion pour le public.\n\n*Texte d'exemple — à remplacer par votre article.*"
    },
    {
      "id": "critique-film-automne",
      "section": "art",
      "rubrique": "cinema-theatre",
      "titre": "Le film de l'automne : un huis clos qui ne vous lâche pas",
      "chapo": "Deux personnages, une nuit, un secret. Notre critique du film qui fait parler.",
      "auteur": "La rédaction",
      "date": "2026-10-08",
      "image": "https://picsum.photos/seed/rvpture-cinema/900/1100",
      "legende": "",
      "corps": "Il y a des films qui s'imposent dès le premier plan. Celui-ci en fait partie : une cuisine, deux visages, et une tension qui ne retombe jamais.\n\n> Le cinéma le plus fort tient parfois dans une seule pièce.\n\nLa mise en scène, d'une précision remarquable, laisse toute la place aux comédiens.\n\n*Texte d'exemple — à remplacer par votre article.*"
    },
    {
      "id": "theatre-proces-sur-scene",
      "section": "art",
      "rubrique": "cinema-theatre",
      "titre": "Quand le procès monte sur scène",
      "chapo": "De plus en plus de pièces s'emparent des grandes affaires judiciaires. Pourquoi le tribunal fascine-t-il autant le théâtre ?",
      "auteur": "La rédaction",
      "date": "2026-09-18",
      "image": "https://picsum.photos/seed/rvpture-theatre/900/1100",
      "legende": "",
      "corps": "Le procès est déjà, en soi, une forme de théâtre : unité de lieu, rôles définis, parole publique, dénouement attendu.\n\nRien d'étonnant, donc, à ce que les metteurs en scène y puisent une matière inépuisable.\n\n*Texte d'exemple — à remplacer par votre article.*"
    },
    {
      "id": "exposition-photographie",
      "section": "art",
      "rubrique": "expositions",
      "titre": "Une exposition photo qui fige la ville en mouvement",
      "chapo": "Cent tirages, cinquante ans de rues, un regard : la rétrospective à voir cet automne.",
      "auteur": "La rédaction",
      "date": "2026-10-01",
      "image": "https://picsum.photos/seed/rvpture-expo/900/1100",
      "legende": "",
      "corps": "Le parcours s'ouvre sur une série de portraits pris sur le vif, en noir et blanc, dans les années soixante-dix.\n\n## Une ville, mille visages\n\nAu fil des salles, la couleur apparaît, les cadrages se resserrent, et l'on suit l'évolution d'un regard autant que celle d'une ville.\n\n*Texte d'exemple — à remplacer par votre article.*"
    },
    {
      "id": "galerie-jeune-creation",
      "section": "art",
      "rubrique": "expositions",
      "titre": "Jeune création : trois galeries à suivre de près",
      "chapo": "Petits lieux, grandes ambitions : notre sélection d'espaces qui défendent les artistes émergents.",
      "auteur": "La rédaction",
      "date": "2026-09-02",
      "image": "https://picsum.photos/seed/rvpture-galerie/900/1100",
      "legende": "",
      "corps": "Loin des grandes foires, une nouvelle génération de galeries prend des risques et expose des artistes encore inconnus du grand public.\n\nVisite guidée de trois lieux qui font bouger la scène.\n\n*Texte d'exemple — à remplacer par votre article.*"
    }
  ],

  "media": {}
};
