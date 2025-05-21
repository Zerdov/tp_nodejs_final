# **TP4- git-vuln : CI/CD Sécurisée avec GitLab **

## TP noté et à rendre pour le : 12/05/2025

## **Objectifs**
- Mettre en place un projet DevOps complet : GitLab + Docker + CI/CD + Sécurité.
- Appliquer des bonnes pratiques de Git, CI/CD, et sécurité dès le développement.
- Automatiser les tests de qualité, sécurité et conformité.

---

## **Étapes à suivre**

### **0. Lire le sujet en entier avant de commencer :)**

### **1. Créer un projet GitLab**
- Connectez-vous à votre instance GitLab.
- Créez un projet vide nommé `b3-tp4-git-vuln-nom-prenom`.
- Permettez l'accès "public" à votre dépot.
- Notez l'URL de votre dépôt.

---

### **2. Cloner le projet dans votre VM**
- Connectez-vous à votre VM / environnement
- Clonez le projet GitLab.

---

### **3. Créer les différentes branches**
- Dans le projet cloné :
    - Créer la branche `main` si cette dernière n'existe pas
        - La branche devra être protégée
        - Uniquement les maintainers peuvent merge du code
        - Personne n'a le droit de push directement du code dans la branche
    - créer une branche nommée `develop` qui devra :
        - Être La branche par defaut du projet
        - Être Protégée
        - Permettre uniquement aux maintainers de push et merge du code.

    - Créez une branche nommée `feature/*` à partir de la branche develop.
        - Cette branche sera votre branche de travail

---

### **4. Écrire / importer un petit projet web**
- Implémentez ou importez une application web simple. L'application peut être écrite en PHP, Node.js ou autre langage de votre choix.

---

### **5. Écrire un Dockerfile**
- Créez un fichier `Dockerfile` qui décrit l'environnement d'exécution de votre application.

---

### **6. Construire l'image Docker**
- Utilisez Docker pour construire une image contenant l'application ainsi que ses dépendances.

---

### **7. Automatiser le lancement de l'environnement avec un `docker-compose.yml`**
- Créez un fichier `docker-compose.yml` pour orchestrer l'exécution de l'application.

---

### **8. Tester le fonctionnement localement**
- Lancez l'application avec Docker Compose.
- Vérifiez que l'application est fonctionnelle et est accessible localement.
- Lancer les tests suivant localement:
    - hadolint
    - trivy
    - semgrep
    - gitleaks

---

### **9. Pousser les modifications dans GitLab**
- Poussez régulièrement vos modifications dans la branche `feature/*`.

---

### **10. Intégration CI/CD GitLab – Automatiser les bonnes pratiques dans `.gitlab-ci.yml`**
- Configurez un pipeline CI/CD dans GitLab avec les étapes suivantes :
  1. Vérifier la syntaxe des fichiers `.yml` avec **yamllint** en activant les règles suivantes : 
    - Vérification de l'ensemble des fichiers `.yml` et `.yaml` uniquement.
    - Activation de la vérification de début de document.
    - Désactivation de la vérification des commentaires ainsi que de leur indentation.
    - Désactivation de la vérification de la longueur des lignes.
    - Autorisation de 0 à 2 espaces uniquement à l'intérieur de brackets "{}".
  2. Vérifier la syntaxe de votre applicatif en utilisant un outil adéquat selon le langage de votre application.
  3. Vérifier la syntaxe du Dockerfile avec **hadolint**.
  4. Vérifier les vulnérabilités du Dockerfile avec **trivy**.
  5. Construire l'image Docker de l'applicatif.
  6. Vérifier les vulnérabilités (CVE) dans l'image construite. (os + dépendances) avec **trivy**.
  7. Corriger l'ensemble des éventuels problèmes remontés.
  8. Ajouter un scan de secrets dans les fichiers du dépôt avec **gitleaks** pour détecter des clés API ou autres informations sensibles.
  9. Ajouter un scan d'analyse statique avec **semgrep** pour rechercher des vulnérabilités dans le code.

---

### **11. Exécuter les étapes CI/CD**
- Assurez-vous que toutes les étapes s'exécutent automatiquement à chaque commit.
- Provoquer volotairement des anomalies à détecter pour chacune des étapes afin tester leur bon fonctionnement
- Corrigez ensuite les anomalies
---

### **12. Comportements spécifiques par branche – Contrôler le niveau de rigueur selon le contexte**
- Dans les branches `feature/*` : 
  - les échecs des scans de sécurité ne bloquent pas le pipeline et devront tout de même lever un warning.
  - Les échecs des autres jobs devront interrompre le pipeline immédiatement (application de fail-fast)

- Dans les branches `develop` et `main`: 
  - Tous les échecs devront bloquer le pipeline

- Lors du merge de la branche `develop` dans la branche principale `main` :
  - Ajoutez une étape dans le pipeline pour simuler le déploiement en production.
  - Cette étape doit afficher un message dans les logs : **"Simulation de déploiement réussie"**.
  - Cette étape devra se déclencher uniquement lors du merge vers main.

---

### **13. Documentation complète – Faciliter la maintenance et la transmission**
- README.md : explication du projet, comment lancer, structure, pipeline
- docs/*.md : document dans lequel vous consignerez (vous pourrez exporter ce doc en pdf pour faire votre rapport si vous le souhaitez)
  - Choix techniques (langage, outils)
  - Vulnérabilités détectées (et corrigées)
  - Déroulé des tests
  - Captures d'écran des pipelines
  - Retour critique : qu'auriez-vous amélioré ?

---
---

## **Livrables**
### Dans le projet :
1. Un dépôt GitLab **public** avec CI-CD et les différentes branches.
2. Une application web fonctionnelle.
3. Un fichier `Dockerfile` et un fichier `docker-compose.yml` propres.
4. Un fichier `.gitlab-ci.yml` contenant le pipeline CI/CD.
5. Un pipeline fonctionnel qui s'exécute à chaque commit et lors des merges.
6. Un fichier de configuration `yamllint`.
7. Une documentation expliquant le projet (cf 13.1). (README.md)
8. Un repertoire docs/ à la racine du projet (Cf 13.2)

### A me transmettre par mail: (et Uniquement par mail)

  - **Le lien** de votre repo public GitLab
  - **Un rapport au format pdf** nommé [`rapport-tp4-git-vuln-nom-prenom.pdf`] et expliquant la réalisation du TP étape par étape avec des capture d'écran en indiquant à minima section/numéro de questions.
  - **L'objet** du mail devra suivre le pattern [`B3-TP4-git-vuln-Nom-Prénom`]


NB : Tout rendu transmis par un autre moyen que le mail ne sera pas pris en compte.

---