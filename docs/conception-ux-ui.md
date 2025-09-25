# Conception UX/UI - Puzzle eco-responsable

## 1. Objectifs UX
- Favoriser une prise en main immediate par des enfants de 9 a 11 ans.
- Limiter la charge cognitive via une hierarchie claire et un vocabulaire direct.
- Valoriser la dimension eco-responsable sans distraire de l'action de jeu.
- Garantir une experience fluide sur mobile, tablette et desktop (tactile prioritaire).

## 2. Personas synthese
| Persona | Besoins principaux | Points de vigilance |
|---------|--------------------|---------------------|
| Eleve curieux (10 ans) | Trouver rapidement un puzzle amusant, comprendre les consignes | Interface claire, textes courts, feedback sonore positif |
| Parent accompagnateur | Verifier la securite et la pedagogie du contenu | Transparence sur les sources, pas de compte requis |
| Enseignant relais | Montrer un support ludique pendant un atelier eco | Facile a projeter, navigation clavier possible |

## 3. Parcours cibles
1. **Accueil** : decouverte des CTA et du message eco.
2. **Galerie** : choix d'une image prechargee ou de ses imports.
3. **Import** : ajout d'une nouvelle image et recadrage rapide.
4. **Jeu** : reconstitution du puzzle, feedback, relance.

## 4. Wireframes textuels
### 4.1 Accueil
```
[Header compact]
| Logo  | Bouton Mode sombre |

[Hero]
Titre court (2 lignes max)
Paragraphe pedagogique (1 phrase)
[CTA jouer] [CTA importer] [Lien galerie]
Illustration eco (alignee a droite desktop, pleine largeur mobile)

[Bloc eco-conception]
Icones 3 colonnes (mobile: liste)
```

### 4.2 Galerie
```
[Header avec retour Accueil]
Titre + filtre (boutons projet / mes imports)
[Search (option MVP+1) - placeholder pour evolution]
[Grille responsive]
Carte image : vignette 4:3, badge source, titre, bouton "Jouer"
[Infinity loader] + skeleton sur 3 cartes
```

### 4.3 Import
```
[Header]
Titre + sous-texte rappel limites (5 Mo, JPEG/PNG)
[Dropzone drag & drop]
 Apercu image + commande recadrage
 Controle curseur zoom + reposition
 Boutons : Annuler / Valider
[Progress bar upload] + message succes/erreur
```

### 4.4 Jeu
```
[Top bar]
 Bouton retour (icone fleche)
 Timer mm:ss
 Compteur pieces
 Bouton "Indice" (state on/off)
 Bouton mute son

[Zone centrale]
 Grille cible 3x3 (border secondaire)
 Zone pieces melangees a droite desktop / dessous mobile

[Feedback]
 Snap animation (piece lumineuse)
 Barre progression horizontale (optionnelle)

[Modal fin]
 Message Bravo + temps
 Boutons : Rejouer / Changer d'image
```

## 5. Guidelines UI
- **Palette base** (hex):
  - Primaire: `#2A9D8F` (vert ocean leger).
  - Secondaire: `#E9C46A` (ocre lumineux).
  - Accent: `#F4A261` pour feedback.
  - Fond clair: `#F7F7F2`; Texte principal: `#1D1D1F`.
  - Fond sombre possible: `#1A1C1D` (texte `#F2F2F2`).
- **Typographies**: sans-serif lisible (ex: Poppins ou Mulish). Grosseur recommandee 18 px min corps, 14 px pour annotations.
- **Iconographie**: pack vectoriel simplifie (SVG < 2 Ko). Style lineaire coherent.
- **Boutons**: arrondis 12 px, hauteur min 44 px, ombre douce `0 4px 12px rgba(0,0,0,0.08)`.
- **Feedback**: animations <= 200 ms, easing standard `ease-in-out`, vibrations mobiles en option courte (< 40 ms).

## 6. Accessibilite UX
- Focus states visibles (outline 3 px Primaire a 60%).
- Navigation clavier lineaire: header -> contenu -> CTA -> footer.
- Textes audio: bouton locution pour messages clefs (option post-MVP).
- Contraste teste sur palette (AA). Eviter texte sur image sans overlay 70%.

## 7. Design system initial
- **Tokens CSS** (`src/styles/tokens.css` a venir): couleurs, espacements (scale 4 px), radius (8 / 12 / 20).
- **Composants**: Button, IconButton, Card, Modal, ProgressBar, Toggle, Tooltip, Dropzone.
- **Patterns**: Top bar jeu, grille responsive, zone drag & drop, modal victoire.

## 8. Prototype rapide
- Outil recommande: Figma (library legere, export SVG optimises).
- Pages Figma: Accueil, Galerie, Import, Jeu, Modal fin, Composants.
- Integrations: exporter variables vers tokens CSS (plugin Design Tokens).

## 9. Suivi et validations
- Revue UX hebdomadaire (fin semaine x) avec PO et designer.
- Tests utilisateurs rapides sur 3 enfants (observation 10 min) pour valider comprehension CTA.
- Checklist accessibilite partagee avec referent eco pour verification.
