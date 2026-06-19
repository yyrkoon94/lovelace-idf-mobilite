# 📝 Release Note — v1.0.0 — Nouvelle version majeure de la carte IDF Mobilité

## 🚀 Nouveautés majeures

### 🔗 Intégration officielle Home Assistant (Companion Integration)
La carte dispose désormais d’une intégration dédiée :
**IDF Mobilité Assistant**

- configuration 100% UI
- recherche d’arrêt intégrée
- création automatique des entités
- gestion native des perturbations
- compatibilité totale avec la carte

👉 https://github.com/yyrkoon94/idf-mobilite-assistant

---

### 🖥️ Nouvel éditeur graphique complet
Le card‑editor a été entièrement réécrit :

- navigation par onglets (Premier arrêt / Second arrêt / Messages)
- options dynamiques selon le type de ligne (BUS / RER / SNCF)
- filtres avancés (lignes, références, destinations)
- gestion multi‑entités pour les messages
- options d’affichage enrichies (quai, heure, regroupement, etc.)
- mode écran, mode sans bordure, affichage station
- support des bus de remplacement (RER/SNCF)

---

### 🆕 Support complet des messages PRIM
- Sélection de plusieurs entités de messages
- Filtrage par texte
- Affichage séparé :
  - perturbations
  - alertes
  - messages d’information
- Option “ne pas faire défiler”

---

## ✨ Améliorations

- Interface modernisée (Shoelace + style Home Assistant)
- Meilleure détection des capteurs REST (Siri / disruptions)
- Gestion plus propre des options conditionnelles
- Code plus clair, mieux structuré, plus maintenable
- Compatibilité renforcée avec les thèmes HA (clair/sombre)

---

## 🐛 Corrections

- Correction de plusieurs incohérences d’affichage
- Correction du filtrage des lignes et références
- Correction du comportement des switches dans l’éditeur
- Correction de l’affichage des destinations groupées
- Correction du support StopArea / StopPoint

---

## 📦 Compatibilité & Migration

### ✔ Compatible avec :
- l’intégration IDF Mobilité Assistant (recommandé)
- les anciens capteurs REST manuels (toujours supportés)

### ⚠ Recommandation
Si vous utilisiez des capteurs REST manuels, il est conseillé de migrer vers l’intégration officielle pour :

- réduire les appels API
- simplifier la configuration
- améliorer la fiabilité
- bénéficier des mises à jour automatiques

Une section complète “Configuration manuelle (optionnelle)” est disponible dans le README.

---

## ❤️ Remerciements

Merci à tous les utilisateurs qui ont testé, remonté des bugs et proposé des améliorations.
Cette version marque une étape importante : la carte devient un véritable **companion visuel** de l’intégration IDF Mobilité Assistant.

---

## 📣 Prochaine étape

- support des favoris
- affichage enrichi des perturbations
- animations type RATP/SNCF
- mode multi‑lignes avancé
