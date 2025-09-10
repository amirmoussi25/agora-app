# 🚀 AGORA - Guide de Démarrage

## 📋 Prérequis

- **Node.js 18+** 
- **MongoDB** (local ou cloud)
- **NPM** ou **Yarn**

## ⚡ Installation Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration MongoDB
Assure-toi que MongoDB est démarré :
```bash
# MongoDB local
mongod

# Ou utilise MongoDB Atlas (cloud)
```

### 3. Lancer l'application
```bash
npm run dev
```

L'application sera disponible sur : **http://localhost:3000**

## 🔧 Configuration

### Variables d'environnement (.env.local)
✅ **Déjà configurées avec tes clés** :
- Mailtrap : `sandbox.smtp.mailtrap.io`
- Stripe : Clés de test configurées
- JWT : Clé sécurisée générée
- MongoDB : `mongodb://localhost:27017/agora`

### Base de données
- **SQLite** : Se crée automatiquement dans `/database/`
- **MongoDB** : Collection `agora` créée automatiquement

## 🎯 Test de l'Application

### 1. Créer un compte Mairie
- Va sur http://localhost:3000
- Clique "S'inscrire"
- Sélectionne "Mairie"
- Remplis les informations

### 2. Vérifier l'email
- Va sur https://mailtrap.io/inboxes
- Clique sur l'email de vérification

### 3. Ajouter une salle
- Connecte-toi en tant que mairie
- Va dans "Ajouter" 
- Crée ta première salle

### 4. Créer un compte Client
- Déconnecte-toi
- Crée un compte client
- Explore les salles
- Ajoute aux favoris
- Fais une réservation

## 🏗️ Structure du Projet

```
agora-app/
├── src/
│   ├── app/                 # Pages Next.js
│   │   ├── api/            # Routes API
│   │   ├── explorer/       # Page exploration clients
│   │   ├── mes-salles/     # Page gestion mairies
│   │   └── ...
│   ├── components/         # Composants React
│   │   ├── auth/           # Authentification
│   │   ├── rooms/          # Gestion salles
│   │   └── ui/            # shadcn/ui
│   └── lib/               # Utilitaires
├── database/              # Base SQLite (auto-créée)
└── .env.local            # Configuration
```

## ✨ Fonctionnalités Disponibles

### 👥 Clients
- ✅ Inscription/Connexion
- ✅ Explorer les salles avec filtres
- ✅ Système de favoris
- ✅ Réservation de salles
- ✅ Gestion du profil

### 🏛️ Mairies  
- ✅ Inscription/Connexion spécialisée
- ✅ CRUD complet des salles
- ✅ Gestion des réservations reçues
- ✅ Profil avec adresse mairie

### 💳 Paiements
- ✅ Intégration Stripe (mode test)
- ✅ Webhooks configurés
- ✅ Historique des paiements

## 🐛 Dépannage

### MongoDB ne démarre pas
```bash
# Sur Windows
net start MongoDB

# Sur Mac
brew services start mongodb-community

# Sur Linux
sudo systemctl start mongod
```

### Port 3000 occupé
```bash
# Changer le port
PORT=3001 npm run dev
```

### Erreurs de permissions SQLite
```bash
# Créer le dossier database
mkdir database
chmod 755 database
```

## 🚀 Production

Pour le déploiement :
1. **Vercel** : Connecte ton repo GitHub
2. **Variables d'env** : Configure sur Vercel
3. **MongoDB Atlas** : Change MONGODB_URI
4. **Stripe Live** : Remplace par les clés live

---

🎉 **L'application Agora est prête à fonctionner !**