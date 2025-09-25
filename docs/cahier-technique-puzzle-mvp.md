# Note mise a jour (Supabase)
Depuis la validation initiale, l'hebergement des donnees passe de Firebase a Supabase (Storage + Postgres). Les sections existantes restent valables pour le metier, mais se referer au README pour la configuration Supabase.
# Cahier technique - Application web de puzzle eco-responsable (MVP)

## 1. Contexte et objectifs
- **Public cible** : enfants autour de 10 ans, usage sur tablette, ordinateur familial ou smartphone.
- **Vision produit** : sensibiliser a l'eco-responsabilite via un puzzle educatif simple a prendre en main.
- **Objectif MVP** : permettre de choisir ou importer une image, la decouper en puzzle 3 x 3 (extension 4 x 4 en option) puis la reconstituer avec un drag & drop a ancrage ("snap").
- **Contraintes cles** : pas de compte utilisateur ni stockage persistant du jeu, optimisation eco-concue (poids maitrise, pas de tracking), conformite accessibilite (WCAG 2.1 AA).

## 2. Parties prenantes et utilisateurs
- **Equipe produit** : PO pedagogique, developpeur front, designer UX/UI, referent eco-conception.
- **Parties prenantes externes** : hebergeur (Vercel), Firebase (Firestore + Storage), parents/tuteurs.
- **Utilisateurs finaux** : enfants (primaires), en autonomie ou accompagnes, ayant une sensibilite limitee aux interfaces complexes.

## 3. Parcours utilisateur
1. **Accueil** : choisir entre "Jouer", "Importer une image", "Galerie du projet".
2. **Galerie** : parcourir les images validees, filtrer par source (Projet/Mes imports), selectionner une image pour jouer.
3. **Import** : televerser un JPEG/PNG <= 5 Mo, recadrer (carre recommande), compression automatique en WebP <= 1920 px, enregistrement dans Firebase.
4. **Jeu** : puzzle genere cote client, pieces melangees, drag & drop avec snap, compteur, chrono, indice optionnel. Message de succes puis choix rejouer/changer d'image.

## 4. Perimetre fonctionnel detaille
### 4.1 Accueil
- Mise en avant des trois CTA principaux avec descriptif succinct.
- Court texte pedagogique sur la demarche eco-responsable.
- Illustration legere (< 30 Ko) optimisee.

### 4.2 Galerie
- Recupere les documents Firestore `images` avec `status = "approved"`.
- Grille responsive (3 colonnes desktop, 2 tablette, 1 mobile) avec lazy-loading (IntersectionObserver).
- Filtres persistants en memoire (source = `project` | `user`).
- Cartes affichant vignette optimisee, titre, source, date simplifiee.
- Selection d'une carte -> navigation vers l'ecran de jeu avec l'ID de l'image.

### 4.3 Import d'images
- Acceptation via `<input type="file" accept="image/png,image/jpeg">` et glisser-deposer.
- Previsualisation avec option de recadrage (contrainte ratio 1:1 recommande, mais non bloquant).
- Compression client via canvas (`createImageBitmap` + `canvas.toBlob('image/webp', quality)`).
- Controles : taille max 5 Mo avant compression ; dimensions max 4096 px, redimensionnement a 1920 px max cote long.
- Upload dans Firebase Storage (`/user/{uuid}.webp`), suivi de l'ecriture Firestore :
  ```json
  {
    "title": "nom_fichier_sans_ext",
    "src": "https://firebase...",
    "source": "user",
    "status": "approved",
    "created_at": Timestamp.now(),
    "width": 1200,
    "height": 1200
  }
  ```
- Gestion erreurs (format, taille, upload) avec feedback visuel et sonore optionnel.

### 4.4 Ecran de jeu
- Chargement de l'image optimisee via `Image()` + `<canvas>`.
- Decoupage 3 x 3 (option 4 x 4 en configuration) avec generation des pieces (positions, index, image data).
- Melange aleatoire (Fisher-Yates) avec zone de depot initiale (pile laterale) + grille cible vide.
- Drag & drop pointer events (desktop/souris, tactile) avec touches clavier de secours (selection + fleches).
- Snap auto lorsque distance < 8 px du centre de cellule ; verrouillage de la piece et feedback (animation + son leger < 5 Ko).
- Chronometre (mm:ss) demarrant a la premiere interaction et stoppe a la piece finale.
- Compteur `pieces placees / total` mis a jour en temps reel.
- Bouton "Indice" affichant l'image fantome semi-transparente (opacity 0.35) en arriere-plan.
- Fin de partie : modale "Bravo !" + temps ecoule, boutons "Rejouer" (remelange) et "Changer d'image" (retour galerie).

## 5. Architecture technique
### 5.1 Front-end
- **Framework** : React 18 + Vite pour un bundle leger.
- **Langage** : TypeScript strict pour prevenir les erreurs runtime.
- **Gestion d'etat** : Zustand (store global leger pour conserver filtres, image active, progression puzzle).
- **Routing** : React Router v6 (`/`, `/gallery`, `/import`, `/play/:imageId`).
- **Styles** : CSS Modules + variables CSS (theme clair par defaut, support sombre optionnel).
- **Accessibilite** : utilisation de `aria-*`, gestion focus et navigation clavier via roving tabindex.
- **Internationalisation** : francais uniquement MVP, architecture compatible i18n (fichiers JSON).

### 5.2 Modules principaux
- `AppShell` : layout, header leger, gestion theme.
- `HomePage` : CTA + pitch eco.
- `GalleryPage` : composant `ImageGrid`, filtre `SourceFilter`, loader skeleton.
- `ImportPage` : `UploadDropzone`, `Cropper` (lib legere comme `react-easy-crop`), `CompressionWorker` (Web Worker optionnel).
- `PlayPage` : `PuzzleCanvas`, `Piece`, `Timer`, `ProgressIndicator`, `HintOverlay`.
- `stores/puzzleStore.ts` : etat puzzle, timer, progression.
- `services/firebase.ts` : initialisation Firebase, App Check, wrappers Firestore/Storage.
- `services/imageProcessing.ts` : compression, decoupe, melange.

### 5.3 Firebase
- **Firestore** : collection `images` (index par `source`, `created_at desc`).
- **Storage** : dossiers `project/` (prechargees) et `user/` (imports). Mise en cache CDN.
- **Authentification** : anonyme non necessaire (acces lecture publique). App Check reCAPTCHA v3 active sur front.
- **Securite** : regles fournies (cf. section 8). Aucun write Firestore hors creation image utilisateur.

### 5.4 Hebergement et CI/CD
- Deploiement via Vercel (build `npm run build`).
- Github Actions : lint + tests + build sur PR, deploiement automatique sur `main`.
- Variables d'env (`.env.local` et Vercel dashboard) :
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_FIREBASE_MEASUREMENT_ID` (optionnel)
  - `VITE_FIREBASE_APP_CHECK_KEY` (cle reCAPTCHA v3)

## 6. Donnees et modeles
### 6.1 Schema Firestore `images`
| Champ        | Type        | Obligatoire | Description                                   |
|--------------|-------------|-------------|-----------------------------------------------|
| `id`         | string auto | oui         | ID doc Firestore                              |
| `title`      | string      | oui         | Nom descriptif (120 caracteres max)           |
| `src`        | string URL  | oui         | URL publique storage                          |
| `source`     | string      | oui         | `project` ou `user`                           |
| `status`     | string      | oui         | `approved` (MVP)                              |
| `created_at` | timestamp   | oui         | Date d'ajout                                  |
| `width`      | number      | oui         | Largeur originale stockee                     |
| `height`     | number      | oui         | Hauteur originale                             |
| `attribution`| string      | non         | Credit image projet (si applicable)           |

### 6.2 Validation cote client
- Verification MIME type via `file.type` + signature (option) avant upload.
- Rejet si taille > 5 Mo ou si apres compression > 1920 px.
- Normalisation titre (slug + retrait extension).

### 6.3 Stockage des assets
- `storage://project/{slug}.webp` : images pre-approuvees (upload manuel via console).
- `storage://user/{timestamp}-{uuid}.webp` : imports utilisateur.
- Sons (`success.mp3`, `snap.wav`) : dossier `assets/audio/`, < 10 Ko, chargement lazy via dynamic import.

## 7. Securite et conformite
- **Firestore rules** :
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /images/{id} {
        allow read: if true;
        allow create: if request.resource.data.source == "user"
                      && request.resource.data.status in ["approved"]
                      && request.resource.data.src is string
                      && request.resource.data.created_at is timestamp;
        allow update, delete: if false;
      }
    }
  }
  ```
- **Storage rules** :
  ```
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /{allPaths=**} {
        allow read: if true;
      }
      match /user/{fileName=**} {
        allow write: if request.resource.size < 5 * 1024 * 1024
                     && request.resource.contentType.matches('image/.*');
      }
      match /project/{fileName=**} {
        allow write: if false;
      }
    }
  }
  ```
- App Check reCAPTCHA v3 obligatoire avant toute ecriture.
- Gestion CORS Storage : autoriser GET public, POST via Firebase SDK.
- Journalisation : activer logs Firestore et Storage (audit).

## 8. Performance et eco-conception
- Budget JS : < 150 Ko gz (hors React). Utiliser code splitting (`React.lazy`) pour l'ecran de jeu.
- Lazy-loading images et composants lourds.
- Preferer `requestIdleCallback` pour pre-charger puzzles.
- Utilisation d'`IntersectionObserver` pour charger pieces/audio uniquement a l'usage.
- Compression systematique des assets (WebP, SVG optimises via SVGO).
- Neutralite carbone : afficher message pedagogique, proposer mode economie d'energie (desactiver animations facultatives).
- Mesure Lighthouse EcoIndex (cible < 30). Suivi via CI (rapport Lighthouse sur build).

## 9. Accessibilite
- Couleurs respectant contraste AA (ratio >= 4.5:1 pour texte normal).
- Focus visible sur tous elements interactifs, alternative clavier complete.
- Annonces ARIA : progression puzzle (`aria-live="polite"`), message victoire (`aria-live="assertive"`).
- Sons optionnels et discrets ; bouton mute global.
- Tests manuels NVDA/VoiceOver, audit axe-core automatise.

## 10. Qualite, tests et analytics
- **Tests unitaires** : composants critiques (`PuzzleCanvas`, `puzzleStore`). Outil : Vitest + React Testing Library.
- **Tests E2E** : scenario import + jeu via Playwright (headless). Lancer sur PR.
- **Tests manuels** : grille sur devices (Chrome, Firefox, Safari, Edge). Liste de controle accessibilite.
- **Analytics** : pas de tracking tiers. Option compteur interne anonyme (nombre de puzzles termines) stocke en memoire locale.

## 11. Outils et dependances cibles
- `react`, `react-dom`, `react-router-dom`, `zustand`.
- `firebase` SDK modular v9.
- `react-easy-crop` (ou implementation maison si budget poids trop eleve).
- `@use-gesture/react` + `react-spring` (optionnel) pour drag & drop fluide, sinon pointer events natifs.
- `clsx`, `zod` (validation legere), `axe-core` dev only.
- Dev tooling : ESLint (config eco), Prettier, Stylelint.

## 12. Deploiement et operations
- Branches : `main` (prod), `dev` (integration), feature branches.
- Pipeline : lint -> tests -> build. Si succes sur `main`, Vercel deploye sur URL prod.
- Environnements :
  - `local` : `npm run dev`, App Check debug token.
  - `preview` : deploiements Vercel automatiques.
  - `production` : URL publique, App Check prod.
- Monitoring : Vercel Analytics (sans cookies), Firebase console pour erreurs storage.

## 13. Roadmap MVP
| Semaine | Objectifs cles |
|---------|----------------|
| S1 | Setup projet Firebase + Vercel, scaffolding React, configuration CI. |
| S2 | Implementation import (upload, compression, Firestore). |
| S3 | Galerie (affichage, filtres, lazy-loading). |
| S4 | Puzzle 3 x 3 (canvas, drag & drop, chrono, feedback). |
| S5 | Tests accessibilite, optimisation perf/eco, finalisation livrables. |

## 14. Livrables attendus
- Code source versionne (GitHub/GitLab) avec README detaille.
- Application front deployee sur Vercel (URL publique documentee).
- Projet Firebase configure (Firestore, Storage, App Check, regles validees).
- Documentation :
  - README installation, variables d'environnement, scripts.
  - Guide deploiement Vercel.
  - Guide d'utilisation 1 page avec captures.
  - Pack assets (icones, sons, textures legeres).
- Rapport de tests (accessibilite, lighthouse, E2E) remis en fin de S5.

## 15. Annexes
- **Diagramme de navigation** (a produire dans la documentation finale) : Accueil -> Galerie/Import -> Jeu -> Fin -> (Rejouer | Changer d'image).
- **Risques identifies** :
  - Performances mobiles si images non optimisees -> traiter compression cote client + placeholders.
  - Compatibilite tactile drag & drop -> tests precoces iOS/Android.
  - Sensibilite reCAPTCHA v3 aux faux positifs -> monitoring des scores, ajustement seuil.
- **Pistes d'evolution** : puzzles 4 x 4 et 5 x 5, multilingue, mode collaboratif, badges.

