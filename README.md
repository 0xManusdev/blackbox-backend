# Blackbox Report Backend

API REST pour le signalement anonyme d'incidents aéroportuaires avec analyse IA et preuve d'intégrité blockchain.

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Architecture](#architecture)
- [Stack Technique](#stack-technique)
- [Structure du Projet](#structure-du-projet)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Modèle de Données](#modèle-de-données)
- [Collection Postman](#collection-postman)
- [Déploiement](#déploiement)
- [Troubleshooting](#troubleshooting)
- [Sécurité](#sécurité)

## Fonctionnalités

- **Signalement anonyme** - Soumission d'incidents avec zone, heure et description
- **Analyse IA (Gemini)** - Anonymisation automatique, catégorisation et analyse de sévérité
- **Preuve Blockchain (Sepolia)** - Horodatage immuable via transaction Ethereum
- **Stockage fichiers (Supabase)** - Upload de pièces jointes (max 3 fichiers, 5MB chacun)
- **Vérification d'intégrité** - Validation du hash stocké vs blockchain

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** >= 22.0.0
- **npm** >= 10.0.0
- **PostgreSQL** (fourni par Supabase)
- **Git**

### Comptes et accès requis

- Compte **Supabase** (base de données + storage)
- Clé API **Google Gemini** (Gemini 1.5 Flash)
- Wallet Ethereum avec testnet **Sepolia ETH**
- Accès **Infura** ou autre provider RPC Sepolia


## Architecture

### Vue d'ensemble

```
┌─────────────┐
│   Client    │
│  (Frontend) │
└──────┬──────┘
       │
       │ HTTP/multipart
       ▼
┌─────────────────────────────────────────────┐
│          Express.js API Server              │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │      ReportController                │  │
│  └────────┬────────────────────────────┘  │
│           │                                 │
│  ┌────────▼────────┐  ┌─────────────────┐ │
│  │   AIService     │  │  StorageService │ │
│  │   (Gemini)      │  │   (Supabase)    │ │
│  └────────┬────────┘  └────────┬────────┘ │
│           │                     │           │
│  ┌────────▼─────────────────────▼────────┐ │
│  │        BlockchainService              │ │
│  │         (Ethereum Sepolia)            │ │
│  └────────┬──────────────────────────────┘ │
│           │                                 │
│  ┌────────▼────────┐                       │
│  │    DBService    │                       │
│  │  (Prisma ORM)   │                       │
│  └────────┬────────┘                       │
└───────────┼──────────────────────────────────┘
            │
            ▼
   ┌────────────────┐
   │   PostgreSQL   │
   │   (Supabase)   │
   └────────────────┘
```

### Workflow de traitement d'un signalement

```
1. Réception de la requête
   └─> Validation des données (zone, heure, description)
   └─> Upload des pièces jointes (si présentes)

2. Traitement IA (Google Gemini)
   └─> Anonymisation du contenu (suppression données personnelles)
   └─> Catégorisation automatique de l'incident
   └─> Évaluation de la sévérité (low/medium/high/critical)
   └─> Génération d'une analyse contextuelle

3. Stockage des fichiers (Supabase Storage)
   └─> Upload dans le bucket "attachments"
   └─> Génération des URLs publiques
   └─> Validation des formats et tailles

4. Création de la preuve blockchain
   └─> Génération du hash SHA256 du contenu anonymisé
   └─> Création d'une transaction Ethereum sur Sepolia
   └─> Inclusion du hash dans les transaction data
   └─> Récupération du transaction hash comme preuve

5. Enregistrement en base de données
   └─> Sauvegarde de toutes les métadonnées
   └─> Stockage du hash et du transaction hash
   └─> URLs des pièces jointes

6. Retour de la réponse
   └─> Report complet avec ID
   └─> Transaction hash pour vérification
   └─> Analyse IA complète
```

### Flux de vérification d'intégrité

```
1. Récupération du report depuis la DB
   └─> contentHash stocké
   └─> blockchainTxHash stocké

2. Interrogation de la blockchain Sepolia
   └─> Récupération de la transaction via le hash
   └─> Extraction du hash depuis les transaction data

3. Comparaison
   └─> Hash DB === Hash Blockchain
   └─> Retour du statut de vérification
```

## Stack Technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Runtime | Node.js | >= 22.0.0 |
| Framework | Express.js | 5.2.1 |
| Langage | TypeScript | 5.9.3 |
| Base de données | PostgreSQL | via Supabase |
| ORM | Prisma | 7.1.0 |
| Intelligence Artificielle | Google Gemini | 1.5 Flash |
| Blockchain | Ethereum Sepolia | Testnet |
| Library Blockchain | ethers.js | 6.16.0 |
| Stockage fichiers | Supabase Storage | - |
| Upload handler | Multer | 2.0.2 |

## Structure du Projet

```
blackbox-backend/
├── src/
│   ├── app.ts                      # Point d'entrée Express
│   ├── config/
│   │   └── index.ts                # Configuration environnement
│   ├── controllers/
│   │   └── ReportController.ts     # Logique métier des signalements
│   ├── routes/
│   │   └── index.ts                # Définition des endpoints
│   ├── services/
│   │   ├── AIService.ts            # Intégration Google Gemini
│   │   ├── BlockchainService.ts    # Transactions Ethereum Sepolia
│   │   ├── DBService.ts            # Accès PostgreSQL via Prisma
│   │   └── StorageService.ts       # Gestion Supabase Storage
│   └── utils/
│       └── ErrorHandler.ts         # Gestion centralisée des erreurs
├── prisma/
│   ├── schema.prisma               # Modèle de données Prisma
│   └── migrations/                 # Historique des migrations
├── postman/
│   ├── AeroChain_Sentinel_API.postman_collection.json
│   ├── Local.postman_environment.json
│   └── Production.postman_environment.json
├── dist/                           # Code compilé (généré)
├── node_modules/                   # Dépendances (généré)
├── .env                            # Variables d'environnement (non versionné)
├── .env.example                    # Template des variables
├── .gitignore
├── Procfile                        # Configuration déploiement Render
├── package.json
├── tsconfig.json                   # Configuration TypeScript
└── README.md
```

## Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd blackbox-backend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer l'environnement

```bash
cp .env.example .env
```

Éditez le fichier `.env` avec vos clés et credentials (voir section [Configuration](#configuration)).

### 4. Configurer la base de données

#### Générer le client Prisma

```bash
npm run prisma:generate
```

#### Exécuter les migrations

```bash
npm run prisma:migrate
```

Ou pour un environnement de production :

```bash
npx prisma migrate deploy
```

#### Vérifier la connexion

Connectez-vous au dashboard Supabase :
- URL : `https://supabase.com/dashboard`
- Naviguez vers votre projet > Table Editor
- Vérifiez que la table `reports` existe

### 5. Configurer Supabase Storage

1. Connectez-vous au dashboard Supabase
2. Allez dans **Storage** > **New bucket**
3. Créez un bucket nommé : `attachments`
4. Configuration du bucket :
   - **Public bucket** : `true` (pour accès direct aux URLs)
   - **File size limit** : `5242880` (5MB)
   - **Allowed MIME types** : `image/*, application/pdf`

### 6. Lancer le serveur en développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

## Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Configuration serveur
PORT=3000

# Base de données PostgreSQL (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres

# Google Gemini AI
GEMINI_API_KEY=AIzaSy...

# Ethereum Sepolia Network
ETH_PRIVATE_KEY=0x1234567890abcdef...
ETH_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Supabase Storage
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_BUCKET=attachments
```

### Obtention des clés

#### Supabase (Database + Storage)

1. Créez un projet sur [supabase.com](https://supabase.com)
2. **DATABASE_URL** : Project Settings > Database > Connection string (URI)
3. **SUPABASE_URL** : Project Settings > API > Project URL
4. **SUPABASE_SERVICE_KEY** : Project Settings > API > service_role (secret)

#### Google Gemini

1. Accédez à [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Créez une nouvelle clé API
3. Copiez la clé dans `GEMINI_API_KEY`

#### Ethereum Sepolia

1. **Wallet** : Créez un wallet MetaMask ou utilisez un existant
2. **Private Key** : Exportez la clé privée (Settings > Security & Privacy > Reveal Private Key)
3. **Testnet ETH** : Obtenez des Sepolia ETH sur [sepoliafaucet.com](https://sepoliafaucet.com)
4. **RPC URL** :
   - Créez un projet sur [Infura](https://infura.io)
   - Copiez l'endpoint Sepolia : `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

## API Endpoints

### Base URL

- **Développement** : `http://localhost:3000`
- **Production** : `https://your-app.onrender.com`

### Health Check

Vérifier que l'API est opérationnelle.

```http
GET /api/health
```

#### Réponse (200 OK)

```json
{
  "status": "ok",
  "timestamp": "2025-12-11T09:00:00.000Z",
  "uptime": 3600
}
```

#### Exemple cURL

```bash
curl -X GET http://localhost:3000/api/health
```

---

### Liste des zones disponibles

Récupérer les zones prédéfinies pour le formulaire.

```http
GET /api/zones
```

#### Réponse (200 OK)

```json
{
  "zones": [
    { "value": "TERMINAL_1", "label": "Terminal 1" },
    { "value": "TERMINAL_2", "label": "Terminal 2" },
    { "value": "PORTES_EMBARQUEMENT", "label": "Portes d'embarquement" },
    { "value": "ZONE_DOUANES", "label": "Zone douanes" },
    { "value": "PARKING", "label": "Parking" },
    { "value": "HALL_ARRIVEE", "label": "Hall d'arrivée" },
    { "value": "HALL_DEPART", "label": "Hall de départ" },
    { "value": "ZONE_TRANSIT", "label": "Zone de transit" },
    { "value": "AUTRE", "label": "Autre (préciser)" }
  ]
}
```

#### Exemple cURL

```bash
curl -X GET http://localhost:3000/api/zones
```

---

### Soumettre un signalement

Créer un nouveau signalement d'incident.

```http
POST /api/reports
Content-Type: multipart/form-data
```

#### Paramètres

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `zone` | string | Oui | Zone de l'incident (voir `/api/zones`) |
| `customZone` | string | Conditionnel | Zone personnalisée (requis si zone="AUTRE") |
| `incidentTime` | string | Oui | Heure de l'incident (format HH:MM, ex: "14:30") |
| `description` | string | Oui | Description détaillée de l'incident |
| `attachments` | File[] | Non | Pièces jointes (max 3 fichiers, 5MB chacun) |

#### Formats acceptés pour les pièces jointes

- Images : `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Documents : `application/pdf`

#### Exemple de requête

```bash
curl -X POST http://localhost:3000/api/reports \
  -F "zone=TERMINAL_1" \
  -F "incidentTime=14:30" \
  -F "description=Incident de sécurité observé près de la porte B12" \
  -F "attachments=@/path/to/image1.jpg" \
  -F "attachments=@/path/to/image2.jpg"
```

#### Réponse (201 Created)

```json
{
  "success": true,
  "data": {
    "id": 42,
    "zone": "TERMINAL_1",
    "custom_zone": null,
    "incident_time": "14:30",
    "description": "Incident de sécurité observé près de la porte B12",
    "anonymized_content": "Incident de sécurité observé près de la porte [REDACTED]",
    "category": "Sécurité",
    "severity": "medium",
    "ai_analysis": "L'incident signalé concerne un problème de sécurité dans une zone d'embarquement...",
    "content_hash": "0x8f4e3b2a1c9d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1",
    "blockchain_tx_hash": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    "attachments": [
      "https://xxx.supabase.co/storage/v1/object/public/attachments/1234-image1.jpg",
      "https://xxx.supabase.co/storage/v1/object/public/attachments/1234-image2.jpg"
    ],
    "created_at": "2025-12-11T09:00:00.000Z"
  }
}
```

#### Réponses d'erreur

**400 Bad Request** - Données invalides

```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "zone": "Zone invalide. Utilisez /api/zones pour voir les valeurs autorisées",
    "incidentTime": "Format d'heure invalide. Utilisez HH:MM",
    "description": "La description est requise"
  }
}
```

**413 Payload Too Large** - Fichier trop volumineux

```json
{
  "success": false,
  "error": "File too large",
  "message": "La taille maximale par fichier est de 5MB"
}
```

**500 Internal Server Error** - Erreur serveur

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Une erreur est survenue lors du traitement de la requête"
}
```

---

### Liste des signalements

Récupérer tous les signalements (triés par date décroissante).

```http
GET /api/reports
```

#### Réponse (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "zone": "TERMINAL_1",
      "custom_zone": null,
      "incident_time": "14:30",
      "description": "Incident de sécurité observé près de la porte B12",
      "anonymized_content": "Incident de sécurité observé près de la porte [REDACTED]",
      "category": "Sécurité",
      "severity": "medium",
      "ai_analysis": "L'incident signalé concerne un problème de sécurité...",
      "content_hash": "0x8f4e3b2a...",
      "blockchain_tx_hash": "0x1a2b3c4d...",
      "attachments": [
        "https://xxx.supabase.co/storage/v1/object/public/attachments/1234-image1.jpg"
      ],
      "created_at": "2025-12-11T09:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### Exemple cURL

```bash
curl -X GET http://localhost:3000/api/reports
```

---

### Détail d'un signalement

Récupérer un signalement spécifique par son ID.

```http
GET /api/reports/:id
```

#### Paramètres URL

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | integer | ID du signalement |

#### Réponse (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 42,
    "zone": "TERMINAL_1",
    "custom_zone": null,
    "incident_time": "14:30",
    "description": "Incident de sécurité observé près de la porte B12",
    "anonymized_content": "Incident de sécurité observé près de la porte [REDACTED]",
    "category": "Sécurité",
    "severity": "medium",
    "ai_analysis": "L'incident signalé concerne un problème de sécurité...",
    "content_hash": "0x8f4e3b2a1c9d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1",
    "blockchain_tx_hash": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    "attachments": [
      "https://xxx.supabase.co/storage/v1/object/public/attachments/1234-image1.jpg"
    ],
    "created_at": "2025-12-11T09:00:00.000Z"
  }
}
```

#### Réponse d'erreur (404 Not Found)

```json
{
  "success": false,
  "error": "Report not found",
  "message": "Aucun signalement trouvé avec l'ID 42"
}
```

#### Exemple cURL

```bash
curl -X GET http://localhost:3000/api/reports/42
```

---

### Vérifier l'intégrité blockchain

Vérifier que le hash stocké en base correspond au hash enregistré sur la blockchain Sepolia.

```http
GET /api/reports/:id/verify
```

#### Paramètres URL

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | integer | ID du signalement à vérifier |

#### Réponse (200 OK) - Intégrité validée

```json
{
  "success": true,
  "verified": true,
  "data": {
    "reportId": 42,
    "contentHash": "0x8f4e3b2a1c9d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1",
    "blockchainTxHash": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    "blockchainHash": "0x8f4e3b2a1c9d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1",
    "blockNumber": 5234567,
    "timestamp": "2025-12-11T09:00:00.000Z",
    "explorerUrl": "https://sepolia.etherscan.io/tx/0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"
  }
}
```

#### Réponse (200 OK) - Intégrité compromise

```json
{
  "success": true,
  "verified": false,
  "data": {
    "reportId": 42,
    "contentHash": "0x8f4e3b2a...",
    "blockchainHash": "0x9a1b2c3d...",
    "error": "Hash mismatch: data has been tampered"
  }
}
```

#### Réponse d'erreur (404 Not Found)

```json
{
  "success": false,
  "error": "Report not found",
  "message": "Aucun signalement trouvé avec l'ID 42"
}
```

#### Exemple cURL

```bash
curl -X GET http://localhost:3000/api/reports/42/verify
```

## Modèle de Données

### Schema Prisma

```prisma
enum Zone {
    TERMINAL_1
    TERMINAL_2
    PORTES_EMBARQUEMENT
    ZONE_DOUANES
    PARKING
    HALL_ARRIVEE
    HALL_DEPART
    ZONE_TRANSIT
    AUTRE
}

model Report {
    id                Int      @id @default(autoincrement())
    
    // Champs du formulaire
    zone              Zone
    customZone        String?  @map("custom_zone")
    incidentTime      String   @map("incident_time") @db.VarChar(10)
    description       String
    
    // Champs traités par l'IA
    anonymizedContent String   @map("anonymized_content")
    category          String   @db.VarChar(100)
    severity          String   @db.VarChar(50)
    aiAnalysis        String   @map("ai_analysis")
    
    // Preuve blockchain
    contentHash       String   @map("content_hash") @db.VarChar(66)
    blockchainTxHash  String   @map("blockchain_tx_hash") @db.VarChar(66)
    
    // Pièces jointes
    attachments       String[] @default([])
    
    createdAt         DateTime @default(now()) @map("created_at")

    @@map("reports")
}
```

### Description des champs

| Champ | Type | Description |
|-------|------|-------------|
| `id` | Integer | Identifiant unique auto-incrémenté |
| `zone` | Enum | Zone de l'incident (voir enum Zone) |
| `customZone` | String (nullable) | Zone personnalisée si zone = AUTRE |
| `incidentTime` | String | Heure de l'incident (format HH:MM) |
| `description` | String | Description originale fournie par l'utilisateur |
| `anonymizedContent` | String | Contenu anonymisé par Google Gemini |
| `category` | String | Catégorie détectée par l'IA (Sécurité, Maintenance, etc.) |
| `severity` | String | Niveau de sévérité : low, medium, high, critical |
| `aiAnalysis` | String | Analyse contextuelle générée par l'IA |
| `contentHash` | String | Hash SHA256 du contenu anonymisé (format 0x...) |
| `blockchainTxHash` | String | Hash de la transaction Ethereum Sepolia |
| `attachments` | String[] | Array des URLs Supabase des pièces jointes |
| `createdAt` | DateTime | Date et heure de création du signalement |

## Collection Postman

Une collection Postman complète est disponible dans le dossier `/postman`.

### Fichiers disponibles

- **AeroChain_Sentinel_API.postman_collection.json** : Collection complète des endpoints
- **Local.postman_environment.json** : Environnement de développement local
- **Production.postman_environment.json** : Environnement de production

### Import dans Postman

1. Ouvrez Postman Desktop ou Web
2. Cliquez sur **Import** (en haut à gauche)
3. Sélectionnez les 3 fichiers JSON du dossier `/postman`
4. La collection et les environnements seront importés

### Configuration

#### Environnement Local

```json
{
  "baseUrl": "http://localhost:3000",
  "apiVersion": "/api"
}
```

#### Environnement Production

```json
{
  "baseUrl": "https://your-app.onrender.com",
  "apiVersion": "/api"
}
```

### Utilisation

1. Sélectionnez l'environnement souhaité (Local ou Production) dans le dropdown en haut à droite
2. Naviguez dans la collection **AeroChain Sentinel API**
3. Les requêtes disponibles :
   - **Health Check** : Vérifier le statut de l'API
   - **Get Zones** : Liste des zones disponibles
   - **Create Report** : Soumettre un signalement (avec upload de fichiers)
   - **Get All Reports** : Récupérer tous les signalements
   - **Get Report By ID** : Détails d'un signalement spécifique
   - **Verify Report** : Vérifier l'intégrité blockchain

### Exemples de test

Les requêtes incluent des exemples de réponses et des tests automatiques pour valider :
- Les codes de statut HTTP
- La structure des réponses JSON
- La présence des champs obligatoires
- Le format des données

## Déploiement

### Prérequis déploiement

- Compte **Render** (ou Railway, Heroku)
- Repository Git (GitHub, GitLab, Bitbucket)
- Base de données PostgreSQL configurée (Supabase)
- Variables d'environnement prêtes

### Déploiement sur Render

#### 1. Créer un nouveau Web Service

1. Connectez-vous sur [render.com](https://render.com)
2. Cliquez sur **New +** > **Web Service**
3. Connectez votre repository Git
4. Configurez le service :

```yaml
Name: blackbox-backend
Environment: Node
Region: Frankfurt (ou plus proche de vos utilisateurs)
Branch: main
Build Command: npm install && npm run build
Start Command: npm start
```

#### 2. Configurer les variables d'environnement

Dans l'onglet **Environment**, ajoutez toutes les variables du fichier `.env` :

```
PORT=3000
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
ETH_PRIVATE_KEY=...
ETH_RPC_URL=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
SUPABASE_BUCKET=attachments
```

#### 3. Configuration avancée

**Instance Type** : Starter (gratuit) ou Standard selon les besoins

**Health Check Path** : `/api/health`

**Auto-Deploy** : Activé (déploiement automatique sur push)

#### 4. Déployer

1. Cliquez sur **Create Web Service**
2. Render va :
   - Cloner le repository
   - Installer les dépendances (`npm install`)
   - Générer le client Prisma (`prisma generate`)
   - Compiler TypeScript (`tsc`)
   - Démarrer le serveur (`npm start`)

#### 5. Exécuter les migrations

Une fois le service déployé, ouvrez un shell :

```bash
# Depuis le dashboard Render > Shell
npx prisma migrate deploy
```

#### 6. Vérifier le déploiement

```bash
curl https://your-app.onrender.com/api/health
```

### Variables d'environnement de production

Assurez-vous d'utiliser des valeurs de production sécurisées :

- **ETH_PRIVATE_KEY** : Wallet dédié avec un minimum de Sepolia ETH
- **SUPABASE_SERVICE_KEY** : Clé service_role (et non anon key)
- **GEMINI_API_KEY** : Clé API avec quotas suffisants

### Monitoring du déploiement

#### Logs

Accédez aux logs en temps réel :
- Dashboard Render > Logs
- Filtrez par niveau : Error, Warning, Info

#### Métriques

Surveillez :
- CPU usage
- Memory usage
- Response times
- Error rates

### Mise à jour en production

```bash
# Sur votre machine locale
git add .
git commit -m "Fix: description du correctif"
git push origin main
```

Render détecte automatiquement le push et redéploie l'application.

### Rollback en cas de problème

1. Dashboard Render > votre service
2. Onglet **Events**
3. Sélectionnez un déploiement précédent
4. Cliquez sur **Rollback to this version**

## Troubleshooting

### Problèmes courants

#### 1. Erreur : Cannot find module '@prisma/client'

**Cause** : Le client Prisma n'a pas été généré.

**Solution** :

```bash
npm run prisma:generate
npm run build
```

En production, vérifiez que le script `build` dans `package.json` inclut bien `prisma generate` :

```json
"build": "prisma generate && tsc"
```

---

#### 2. Erreur : Database connection failed

**Cause** : La `DATABASE_URL` est incorrecte ou la base n'est pas accessible.

**Solution** :

1. Vérifiez la variable `DATABASE_URL` dans `.env`
2. Testez la connexion depuis Supabase Dashboard :
   - Project Settings > Database > Connection info
3. Vérifiez que l'IP de Render est autorisée (Supabase accepte toutes les IPs par défaut)
4. Testez la connexion :

```bash
npx prisma db push
```

---

#### 3. Erreur : Insufficient funds (Ethereum)

**Cause** : Le wallet n'a plus de Sepolia ETH.

**Solution** :

1. Vérifiez le solde du wallet sur [Sepolia Etherscan](https://sepolia.etherscan.io)
2. Rechargez via un faucet :
   - [sepoliafaucet.com](https://sepoliafaucet.com)
   - [infura.io/faucet](https://infura.io/faucet)
3. Attendez 1-2 minutes que la transaction soit confirmée

---

#### 4. Erreur : File upload failed (413 Payload Too Large)

**Cause** : Le fichier dépasse la limite de 5MB.

**Solution** :

- Vérifiez la taille du fichier avant upload
- Compressez les images si nécessaire
- La limite est définie dans `StorageService.ts` :

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
```

---

#### 5. Erreur : Gemini API rate limit exceeded

**Cause** : Trop de requêtes vers l'API Gemini.

**Solution** :

1. Vérifiez vos quotas sur [Google AI Studio](https://makersuite.google.com)
2. Implémentez un système de retry avec backoff
3. Considérez une mise à niveau du quota si nécessaire

---

#### 6. Erreur : Supabase Storage upload failed

**Cause** : Bucket mal configuré ou clé invalide.

**Solution** :

1. Vérifiez que le bucket existe :
   - Dashboard Supabase > Storage
   - Créez le bucket `attachments` si absent
2. Vérifiez la configuration du bucket :
   - Public : `true`
   - File size limit : `5242880` bytes
3. Vérifiez `SUPABASE_SERVICE_KEY` (doit être service_role, pas anon)

---

#### 7. Port déjà utilisé en développement

**Erreur** : `EADDRINUSE: address already in use :::3000`

**Solution** :

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Ou changez le port dans .env
PORT=3001
```

---

#### 8. TypeScript compilation errors

**Cause** : Types incompatibles ou imports incorrects.

**Solution** :

```bash
# Nettoyer et reconstruire
rm -rf dist node_modules package-lock.json
npm install
npm run build
```

---

#### 9. Migrations Prisma échouées

**Erreur** : `Migration failed to apply`

**Solution** :

```bash
# Réinitialiser la base (ATTENTION : supprime les données)
npx prisma migrate reset

# Ou forcer l'application
npx prisma migrate resolve --applied <migration_name>
npx prisma migrate deploy
```

---

### Logs de débogage

#### Activer les logs détaillés

Ajoutez dans `.env` :

```env
DEBUG=*
NODE_ENV=development
```

#### Consulter les logs Render

```bash
# Via le dashboard
Render Dashboard > Your Service > Logs

# Via CLI (si configuré)
render logs -s blackbox-backend --tail
```

#### Logs Prisma

```bash
# Activer les logs des requêtes SQL
DATABASE_URL="...?connection_limit=10&pool_timeout=20&log=query"
```

---

### Contacts support

En cas de problème persistant :

- **Supabase** : [supabase.com/support](https://supabase.com/support)
- **Render** : [render.com/docs](https://render.com/docs)
- **Infura** : [infura.io/contact](https://infura.io/contact)
- **Google AI** : [ai.google.dev/support](https://ai.google.dev/support)

## Sécurité

### Bonnes pratiques

#### 1. Protection des clés privées

**CRITICAL** : Ne JAMAIS commiter le fichier `.env` ou des clés privées dans Git.

```bash
# Vérifier que .env est dans .gitignore
cat .gitignore | grep .env

# Si absent, ajouter
echo ".env" >> .gitignore
```

**Vérification avant commit** :

```bash
# Vérifier qu'aucune clé n'est présente
git diff --cached | grep -E "(API_KEY|PRIVATE_KEY|SERVICE_KEY)"
```

---

#### 2. Rotation des clés

Changez régulièrement les clés API et credentials :

**Fréquence recommandée** :
- Clés API : tous les 90 jours
- Clés blockchain : tous les 6 mois
- Clés de service : lors de chaque départ d'équipe

**Procédure** :
1. Générer une nouvelle clé sur la plateforme concernée
2. Mettre à jour dans les variables d'environnement
3. Tester en staging
4. Déployer en production
5. Révoquer l'ancienne clé après 24h

---

#### 3. Gestion des accès Supabase

**Service Role Key** : À utiliser UNIQUEMENT côté serveur

```env
# ✅ BON : Backend uniquement
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ❌ MAUVAIS : Ne jamais utiliser côté frontend
# La service_role key bypass toutes les RLS policies
```

**Anon Key** : Pour les accès publics frontend (si applicable)

---

#### 4. Sécurité blockchain

**Wallet dédié** : Utilisez un wallet spécifique pour l'application

```
✅ BON : 
- Wallet dédié avec minimum de fonds
- Uniquement pour les transactions de l'app

❌ MAUVAIS :
- Wallet personnel avec tous vos fonds
- Même wallet pour plusieurs projets
```

**Fonds minimaux** : Gardez seulement le nécessaire

```
Recommandation : 0.1 Sepolia ETH
(Suffisant pour ~1000 transactions)
```

---

#### 5. Validation des entrées

Toutes les entrées utilisateur sont validées :

```typescript
// Exemple : validation de l'heure
const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
if (!timeRegex.test(incidentTime)) {
  throw new Error('Format d\'heure invalide');
}
```

**Protection contre** :
- Injection SQL (via Prisma ORM)
- XSS (validation + sanitization)
- Path traversal (validation des noms de fichiers)

---

#### 6. Upload de fichiers sécurisé

**Limitations** :
- Taille maximale : 5MB par fichier
- Formats autorisés : images + PDF uniquement
- Maximum 3 fichiers par signalement

**Validation** :
```typescript
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 
  'image/webp', 'application/pdf'
];
```

---

#### 7. HTTPS obligatoire en production

**Render** : HTTPS activé automatiquement avec certificat SSL gratuit

**Vérification** :

```bash
curl -I https://your-app.onrender.com/api/health
# Cherchez : "HTTP/2 200"
```

---

#### 8. Variables sensibles en production

**Checklist avant déploiement** :

- [ ] `ETH_PRIVATE_KEY` : Wallet dédié, fonds minimaux
- [ ] `GEMINI_API_KEY` : Quota suffisant configuré
- [ ] `SUPABASE_SERVICE_KEY` : Service role (pas anon)
- [ ] `DATABASE_URL` : Connexion sécurisée (SSL)
- [ ] Toutes les clés différentes de celles de développement

---

#### 9. Audit de sécurité

**Commandes utiles** :

```bash
# Audit des dépendances npm
npm audit

# Corriger les vulnérabilités automatiquement
npm audit fix

# Vérifier les versions obsolètes
npm outdated
```

---

#### 10. Sauvegarde des données

**Base de données Supabase** :

1. Dashboard Supabase > Database > Backups
2. Sauvegardes automatiques quotidiennes (plan Pro)
3. Export manuel possible :

```bash
# Export de la base
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

---

### Checklist de sécurité

Avant chaque déploiement :

- [ ] `.env` bien dans `.gitignore`
- [ ] Aucune clé en dur dans le code
- [ ] Variables d'environnement configurées sur Render
- [ ] Wallet blockchain avec fonds minimaux
- [ ] `npm audit` sans vulnérabilités critiques
- [ ] HTTPS actif en production
- [ ] Logs ne contiennent pas de données sensibles
- [ ] Backup récent de la base de données

---

## Scripts npm

| Script | Commande | Description |
|--------|----------|-------------|
| `dev` | `nodemon --exec ts-node src/app.ts` | Lancer le serveur en mode développement avec hot-reload |
| `build` | `prisma generate && tsc` | Générer le client Prisma et compiler TypeScript |
| `start` | `node dist/app.js` | Démarrer le serveur en production (code compilé) |
| `prisma:generate` | `prisma generate` | Générer le client Prisma à partir du schema |
| `prisma:migrate` | `prisma migrate dev` | Créer et appliquer une nouvelle migration |
| `prisma:push` | `prisma db push` | Synchroniser le schéma Prisma avec la DB (sans migration) |

### Utilisation

```bash
# Développement
npm run dev

# Production (local)
npm run build
npm start

# Gestion base de données
npm run prisma:generate    # Après modification du schema.prisma
npm run prisma:migrate     # Créer une migration (développement)
npx prisma migrate deploy  # Appliquer les migrations (production)
npm run prisma:push        # Sync rapide (prototypage uniquement)
```

---

## License

ISC
