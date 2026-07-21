# 🌍 MemoMonde

<p align="center">
  <h1 align="center">MemoMonde</h1>
  <p align="center"><strong>Jeu de mémoire et de quiz géographique mondial interactif sur les pays du monde</strong></p>
  <p align="center">
    👉 <strong><a href="https://chouteau.github.io/memomonde/">Jouer au jeu en ligne !</a></strong>
  </p>
</p>

*💡 Conçu dans le même esprit que <a href="https://github.com/chouteau/memofrance">MemoFrance</a>, MemoMonde vous invite à voyager autour du globe pour tester et mémoriser la géographie de toutes les nations du monde.*

L'application est entièrement statique, ultra-fluide et fonctionne **100% localement** dans votre navigateur (aucun serveur backend ni base de données requis).

---

## 🚀 Caractéristiques Principales

### 1. Deux Mécaniques de Jeu Adaptatives
* **Mode QCM (Choix Multiples)** : Identifiez le pays mis en surbrillance sur la carte du monde, son drapeau, sa capitale, sa langue ou sa monnaie parmi 4 propositions.
* **Mode Clic sur Carte (Localisation Directe)** : Le jeu vous donne le nom d'un pays et vous devez le localiser directement en cliquant sur son tracé vectoriel sur la carte interactive du monde.

### 2. 5 Catégories de Connaissances Géographiques
* 📍 **Localisation sur carte** : Identifier un pays à partir de son tracé vectoriel ou le repérer sur la carte.
* 🏛️ **Capitales** : Associer chaque nation à sa capitale officielle (ex: *Paris, Tokyo, Brasilia, Le Caire...*).
* 🚩 **Drapeaux HD** : Reconnaître les drapeaux des pays grâce à l'intégration d'images vectorielles et HD grand format.
* 🗣️ **Langues Officielles** : Retrouver les langues principales parlées dans chaque pays (ex: *Japonais, Espagnol, Swahili, Amharique...*).
* 💰 **Devises & Monnaies** : Découvrir la monnaie et son symbole (ex: *Euro (€), Yen (¥), Real (R$), Dollar ($)...*).

### 3. Carte Mondiale Vectorielle SVG HD (180+ Pays & Territoires)
* **Pan & Zoom Intégré** : Zoom avant/arrière fluide (molette, double-clic ou boutons `+` / `-` / `Réinitialiser`) et centrage automatique (`focusOnCountry`) idéal pour observer les petits pays et îles.
* **Surbrillance Interactive** : Animation dorée pour le pays cible, vert pour la validation d'une bonne réponse et rouge en cas d'erreur.
* **Couverture à 100% sans trou** : Tous les continents (Europe, Asie, Afrique, Amérique du Nord, Amérique du Sud, Océanie) et territoires sont représentés avec leurs véritables contours géographiques.

### 4. Ergonomie & Fonctionnalités Premium
* **Layout 2 Colonnes Immersif** : Carte pleine hauteur à gauche (`1fr`) et panneau vertical de questions à droite (`400px`).
* **Auto-transition & Mode Apprentissage** :
  * Bonne réponse : transition automatique après 1 seconde de confirmation visuelle.
  * Erreur : affichage d'une **Fiche Apprentissage** détaillée avec capitale, langue, monnaie et drapeau pour favoriser la mémorisation.
* **Bilan Final & Révision Interactive sur la Carte** : À la fin des 10, 20 ou 50 questions, obtenez votre note sur 20 avec badge de rang (🏆 *Maître Géographe*, 🌟 *Grand Explorateur*, etc.). Cliquez sur n'importe quelle erreur dans le tableau pour la voir directement illuminée sur la carte.
* **Synthétiseur Audio Web Audio API** : Carillons et effets sonores générés dynamiquement sans aucun fichier MP3 externe à charger.
* **Design Glassmorphism & Thèmes** : Switch rapide entre le **Thème Sombre** (bleu nuit néon) et le **Thème Clair** (gris/blanc épuré), sauvegardé dans `localStorage`.

---

## 🛠️ Stack Technique

* **HTML5** : Structure sémantique responsive et carte vectorielle **SVG** interactive.
* **CSS3** : Variables CSS pour le thémage, Glassmorphism, animations et layout grid adaptatif PC/Tablette/Mobile.
* **JavaScript (ES6 Vanilla)** : Moteur de quiz, algorithmes de distracteurs intelligents et manipulation du DOM.
* **Web Audio API** : Synthétiseur d'effets sonores intégré.
* **FlagCDN** : Service d'images HD pour l'affichage fidèle et rapide des drapeaux.

---

## 📂 Organisation du Dépôt

```
MemoMonde/
├── index.html        # Page d'accueil et structure principale
├── style.css         # Design system, Glassmorphism et layout 2 colonnes
├── app.js            # Moteur de jeu, quiz engine et gestionnaires d'événements
├── map.js            # Contrôleur de carte SVG (Pan/Zoom, surbrillance, tooltips)
├── sound.js          # Synthétiseur d'effets sonores Web Audio API
├── countries.js      # Base de données complète des 180+ pays et tracés SVG
├── .gitignore        # Fichiers ignorés par Git
└── README.md         # Documentation du projet
```

---

## 🎮 Comment Lancer le Jeu en Local

1. Clonez ou téléchargez le dépôt :
   ```bash
   git clone https://github.com/chouteau/memomonde.git
   ```
2. Double-cliquez sur le fichier **`index.html`** pour l'ouvrir directement dans votre navigateur web habituel (aucun serveur ni installation requise).
3. Choisissez vos options de jeu et cliquez sur **🚀 Commencer le Quiz** !
