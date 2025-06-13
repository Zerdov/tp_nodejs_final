# Projet Node.js – Gestionnaire de fichiers multi-utilisateur

## 🎯 Objectif du projet

Développer une API HTTP en Node.js permettant à un utilisateur authentifié :
- de se connecter avec des identifiants prédéfinis (fichier JSON)
- de consulter, ajouter, supprimer des fichiers dans son espace personnel
- de partager un repertoire avec d’autres utilisateurs
- d’être notifié en temps réel via WebSocket des changements au niveau des fichiers et des répertoires.
- d'utiliser des commandes système via spawn ou exec pour compresser ou analyser des fichiers

## 📁 Contexte technique

Ce projet utilise uniquement les modules natifs de Node.js, à l’exception de la bibliothèque `ws` pour le WebSocket.
Les utilisateurs sont définis à l’avance dans un fichier `users.json`. Aucune inscription ne doit être possible.

## 📂 Fonctionnalités à implémenter

- API REST en Node.js natif (`http`, `url`, `fs`, etc.)
- Authentification via POST `/login` (utilisateur et mot de passe à vérifier dans `users.json`)
- Génération d’un token simple (pas JWT), stocké côté serveur
- Accès protégé par token pour toutes les routes de gestion de fichiers
- Upload, téléchargement, suppression de fichiers personnels
- WebSocket (`ws`) pour recevoir des notifications (upload terminé, compression lancée…)
- Utilisation de `child_process.spawn` ou `exec` pour compresser un répertoire ou lancer un traitement système

## 📦 Contraintes

- Utilisation interdite de frameworks ou bibliothèques HTTP (ex: Express, Multer, JWT)
- L’unique dépendance autorisée est `ws`
- Aucune base de données – tout passe par le système de fichiers
- L'architecture du projet est à concevoir par l'étudiant (aucune structure imposée)

## Lancer le projet

## Cloner le repository

```bash
git clone https://github.com/Zerdov/tp_nodejs_final.git
```

### Installer les dépendances

```bash
pnpm i
```

### Démarrer le serveur

```bash
pnpm dev
```

### Démarrer les tests

```bash
pnpm test
```

### Structure

On a décidé de partir sur une structure **M**odels **V**iews **C**ontrollers
