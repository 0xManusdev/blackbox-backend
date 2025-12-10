# 🛫 AeroChain Sentinel API

> **Backend API REST pour le signalement anonyme d'incidents aéroportuaires avec IA & Blockchain**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?style=flat-square&logo=ethereum&logoColor=white)](https://sepolia.etherscan.io/)

---

## 📖 Description

**AeroChain Sentinel** est une API REST sécurisée permettant aux employés d'aéroports de signaler anonymement des incidents de sécurité. L'API utilise :

- 🤖 **Google Gemini AI** pour l'anonymisation automatique et l'analyse des signalements
- ⛓️ **Ethereum Blockchain (Sepolia)** pour l'horodatage immuable et la preuve d'intégrité
- 🗄️ **PostgreSQL + Prisma ORM** pour le stockage sécurisé des données

---

## 🏗️ Architecture

```
blackbox-backend/
├── src/
│   ├── app.ts                 # Point d'entrée de l'application
│   ├── config/
│   │   └── index.ts           # Configuration et variables d'environnement
│   ├── controllers/
│   │   └── ReportController.ts # Contrôleurs des endpoints
│   ├── routes/
│   │   └── index.ts           # Définition des routes API
│   ├── services/
│   │   ├── AIService.ts       # Service d'analyse IA (Gemini)
│   │   ├── BlockchainService.ts # Service blockchain (Ethereum)
│   │   └── DBService.ts       # Service base de données (Prisma)
│   └── utils/
│       └── ErrorHandler.ts    # Gestion centralisée des erreurs
├── prisma/
│   └── schema.prisma          # Schéma de base de données
├── generated/                 # Client Prisma généré
├── prisma.config.ts           # Configuration Prisma 7
├── package.json
├── tsconfig.json
└── Procfile                   # Configuration déploiement
```

---

## 🚀 Installation

### Prérequis

- **Node.js** ≥ 18.x
- **PostgreSQL** ≥ 14.x
- **Compte Infura/Alchemy** pour accès RPC Ethereum Sepolia
- **Clé API Google Gemini**
- **Wallet Ethereum** avec ETH Sepolia (testnet)

### Étapes

```bash
# 1. Cloner le repository
git clone https://github.com/0xManusdev/blackbox-backend.git
cd blackbox-backend

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Générer le client Prisma
npm run prisma:generate

# 5. Appliquer les migrations
npm run prisma:migrate
# OU pousser le schéma directement
npm run prisma:push

# 6. Lancer en développement
npm run dev

# OU builder et lancer en production
npm run build
npm start
```

---

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Server Configuration
PORT=3000

# PostgreSQL Database
DATABASE_URL=postgresql://user:password@localhost:5432/incidents

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Ethereum Sepolia Network
ETH_PRIVATE_KEY=your_wallet_private_key_here
ETH_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

| Variable | Description | Obligatoire |
|----------|-------------|:-----------:|
| `PORT` | Port du serveur | Non (défaut: 3000) |
| `DATABASE_URL` | URL de connexion PostgreSQL | ✅ |
| `GEMINI_API_KEY` | Clé API Google Gemini | ✅ |
| `ETH_PRIVATE_KEY` | Clé privée wallet Ethereum | ✅ |
| `ETH_RPC_URL` | URL RPC réseau Sepolia | ✅ |

---

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Endpoints disponibles

| Méthode | Endpoint | Description |
|:-------:|----------|-------------|
| `GET` | `/` | Informations sur l'API |
| `GET` | `/api/health` | Vérification de santé |
| `POST` | `/api/reports` | Soumettre un signalement |
| `GET` | `/api/reports` | Récupérer tous les signalements |
| `GET` | `/api/reports/:id` | Récupérer un signalement |
| `GET` | `/api/reports/:id/verify` | Vérifier l'intégrité |

---

## 📋 Documentation des Endpoints

### `GET /`
Retourne les informations de base de l'API.

**Réponse :**
```json
{
  "name": "AeroChain Sentinel API",
  "version": "1.0.0",
  "description": "Anonymous Airport Incident Reporting with AI & Blockchain",
  "endpoints": {
    "health": "GET /api/health",
    "submitReport": "POST /api/reports",
    "getReports": "GET /api/reports",
    "getReport": "GET /api/reports/:id",
    "verifyReport": "GET /api/reports/:id/verify"
  }
}
```

---

### `GET /api/health`
Vérifie que l'API est opérationnelle.

**Réponse :**
```json
{
  "status": "ok",
  "timestamp": "2025-12-10T15:00:00.000Z",
  "service": "AeroChain Sentinel API"
}
```

---

### `POST /api/reports`
Soumet un nouveau signalement d'incident.

**Corps de la requête :**
```json
{
  "content": "J'ai observé Jean Dupuis (badge #12345) laisser une porte de sécurité ouverte près du terminal 3. Cela s'est produit à 14h30 le 10 décembre."
}
```

**Processus :**
1. 🤖 **Analyse IA** : Gemini anonymise le contenu et catégorise l'incident
2. ⛓️ **Blockchain** : Le hash du contenu est enregistré sur Ethereum Sepolia
3. 💾 **Base de données** : Le rapport complet est sauvegardé

**Réponse (201 Created) :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "category": "PROCEDURE_NON_RESPECTEE",
    "severity": "medium",
    "analysis": "Incident relatif au non-respect des procédures de sécurité concernant l'accès aux zones sensibles.",
    "anonymizedContent": "J'ai observé [EMPLOYÉ_A] (badge [BADGE_XXX]) laisser une porte de sécurité ouverte près du terminal 3...",
    "blockchain": {
      "txHash": "0x1234567890abcdef...",
      "contentHash": "0xabcdef1234567890...",
      "blockNumber": 12345678,
      "explorerUrl": "https://sepolia.etherscan.io/tx/0x..."
    },
    "createdAt": "2025-12-10T15:00:00.000Z"
  }
}
```

---

### `GET /api/reports`
Récupère la liste de tous les signalements.

**Réponse :**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "category": "PROCEDURE_NON_RESPECTEE",
      "severity": "medium",
      "anonymizedContent": "...",
      "blockchainTxHash": "0x...",
      "createdAt": "2025-12-10T15:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/reports/:id`
Récupère un signalement spécifique par son ID.

**Paramètres :**
- `id` (number) : Identifiant du signalement

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "category": "PROCEDURE_NON_RESPECTEE",
    "severity": "medium",
    "analysis": "...",
    "anonymizedContent": "...",
    "blockchain": {
      "txHash": "0x...",
      "contentHash": "0x...",
      "explorerUrl": "https://sepolia.etherscan.io/tx/0x..."
    },
    "createdAt": "2025-12-10T15:00:00.000Z"
  }
}
```

---

### `GET /api/reports/:id/verify`
Vérifie l'intégrité d'un signalement en comparant les hashs.

**Paramètres :**
- `id` (number) : Identifiant du signalement

**Réponse :**
```json
{
  "success": true,
  "data": {
    "reportId": 1,
    "integrityValid": true,
    "storedHash": "0x...",
    "calculatedHash": "0x...",
    "blockchainTxHash": "0x...",
    "explorerUrl": "https://sepolia.etherscan.io/tx/0x..."
  }
}
```

---

## 🗄️ Modèle de Données

### Schema Prisma

```prisma
model Report {
    id                Int      @id @default(autoincrement())
    originalContent   String   @map("original_content")
    anonymizedContent String   @map("anonymized_content")
    category          String   @db.VarChar(100)
    severity          String   @db.VarChar(50)
    aiAnalysis        String   @map("ai_analysis")
    contentHash       String   @map("content_hash") @db.VarChar(66)
    blockchainTxHash  String   @map("blockchain_tx_hash") @db.VarChar(66)
    createdAt         DateTime @default(now()) @map("created_at")

    @@map("reports")
}
```

### Catégories d'incidents

| Catégorie | Description |
|-----------|-------------|
| `SECURITE_PHYSIQUE` | Incidents liés à la sécurité physique |
| `SECURITE_AERIENNE` | Incidents liés à la sécurité aérienne |
| `PROCEDURE_NON_RESPECTEE` | Non-respect des procédures |
| `INCIDENT_TECHNIQUE` | Problèmes techniques |
| `COMPORTEMENT_SUSPECT` | Comportements suspects |
| `AUTRE` | Autres types d'incidents |

### Niveaux de sévérité

| Niveau | Description |
|--------|-------------|
| `low` | Impact mineur |
| `medium` | Impact modéré |
| `high` | Impact significatif |
| `critical` | Impact critique, action immédiate requise |

---

## 🔧 Scripts NPM

```bash
# Développement avec hot-reload
npm run dev

# Build TypeScript
npm run build

# Lancer en production
npm start

# Générer le client Prisma
npm run prisma:generate

# Créer une migration
npm run prisma:migrate

# Pousser le schéma (sans migration)
npm run prisma:push
```

---

## 🛡️ Sécurité

### Anonymisation IA
- Tous les noms de personnes → `[EMPLOYÉ_X]`
- Numéros de badge → `[BADGE_XXX]`
- Identifiants personnels → Supprimés/remplacés
- Noms de compagnies → `[COMPAGNIE_X]`

### Blockchain
- Hash Keccak256 du contenu anonymisé
- Transaction stockée sur Ethereum Sepolia
- Preuve d'intégrité vérifiable publiquement

### Base de données
- Connexion sécurisée via Prisma Adapter
- Validation des entrées côté serveur

---

## 🚢 Déploiement

### Railway / Render

Le projet inclut un `Procfile` prêt pour le déploiement :

```
web: npm run start
```

**Variables d'environnement à configurer :**
- `DATABASE_URL` (fourni automatiquement par Railway/Render)
- `GEMINI_API_KEY`
- `ETH_PRIVATE_KEY`
- `ETH_RPC_URL`

### Build de production

```bash
npm run build
# Génère le dossier dist/ avec le code JavaScript compilé
```

---

## 🧪 Tester l'API

### Avec cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Soumettre un rapport
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{"content": "Un employé Jean Martin a laissé la porte B12 ouverte..."}'

# Récupérer tous les rapports
curl http://localhost:3000/api/reports

# Récupérer un rapport
curl http://localhost:3000/api/reports/1

# Vérifier l'intégrité
curl http://localhost:3000/api/reports/1/verify
```

---

## 📦 Dépendances

### Production
| Package | Version | Description |
|---------|---------|-------------|
| `express` | 5.x | Framework web |
| `@prisma/client` | 7.x | ORM PostgreSQL |
| `@prisma/adapter-pg` | 7.x | Adaptateur PostgreSQL |
| `@google/generative-ai` | 0.24.x | SDK Google Gemini |
| `ethers` | 6.x | Bibliothèque Ethereum |
| `cors` | 2.8.x | Middleware CORS |
| `pg` | 8.x | Driver PostgreSQL |

### Développement
| Package | Version | Description |
|---------|---------|-------------|
| `typescript` | 5.9.x | Langage TypeScript |
| `prisma` | 7.x | CLI Prisma |
| `ts-node` | 10.x | Exécution TypeScript |
| `nodemon` | 3.x | Hot reload |
| `dotenv` | 17.x | Variables d'environnement |

---

## 📄 Licence

ISC © 2025

---

## 👤 Auteur

**@0xManusdev**

---

<p align="center">
  <strong>🛫 AeroChain Sentinel</strong> — Signalement anonyme et sécurisé
</p>
