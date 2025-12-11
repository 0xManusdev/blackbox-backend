# AeroChain Sentinel - Backend API

API REST pour le signalement anonyme d'incidents aéroportuaires avec analyse IA et preuve d'intégrité blockchain.

## 🚀 Fonctionnalités

- **Signalement anonyme** - Soumission d'incidents avec zone, heure et description
- **Analyse IA (Gemini)** - Anonymisation automatique, catégorisation et analyse de sévérité
- **Preuve Blockchain (Sepolia)** - Horodatage immuable via transaction Ethereum
- **Stockage fichiers (Supabase)** - Upload de pièces jointes (max 3 fichiers, 5MB)
- **Vérification d'intégrité** - Validation du hash stocké vs blockchain

## 📁 Structure du Projet

```
blackbox-backend/
├── src/
│   ├── app.ts                 # Point d'entrée Express
│   ├── config/index.ts        # Configuration environnement
│   ├── controllers/
│   │   └── ReportController.ts
│   ├── routes/index.ts        # Définition des endpoints
│   ├── services/
│   │   ├── AIService.ts       # Intégration Google Gemini
│   │   ├── BlockchainService.ts # Ethereum Sepolia
│   │   ├── DBService.ts       # PostgreSQL via Prisma
│   │   └── StorageService.ts  # Supabase Storage
│   └── utils/ErrorHandler.ts
├── prisma/
│   └── schema.prisma          # Modèle de données
├── generated/prisma/          # Client Prisma généré
├── postman/                   # Collection Postman
├── .env.example
├── Procfile                   # Déploiement Render/Railway
└── package.json
```

## 🛠️ Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Runtime | Node.js |
| Framework | Express.js 5 |
| Langage | TypeScript |
| Base de données | PostgreSQL (Supabase) |
| ORM | Prisma 7 |
| IA | Google Gemini 1.5 Flash |
| Blockchain | Ethereum Sepolia (ethers.js v6) |
| Stockage fichiers | Supabase Storage |

## ⚙️ Installation

```bash
# Cloner le projet
git clone <repo-url>
cd blackbox-backend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés

# Générer le client Prisma
npm run prisma:generate

# Synchroniser la base de données
npm run prisma:push

# Lancer en développement
npm run dev
```

## 🔐 Variables d'Environnement

```env
# Serveur
PORT=3000

# Base de données Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Ethereum Sepolia
ETH_PRIVATE_KEY=your_wallet_private_key
ETH_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Supabase Storage
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_BUCKET=attachments
```

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Zones disponibles
```
GET /api/zones
```
Retourne la liste des zones prédéfinies pour le formulaire.

### Soumettre un signalement
```
POST /api/reports
Content-Type: multipart/form-data
```

**Body:**
| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| zone | string | ✅ | Zone de l'incident |
| customZone | string | Si zone="autre" | Zone personnalisée |
| incidentTime | string | ✅ | Heure (format HH:MM) |
| description | string | ✅ | Description de l'incident |
| attachments | File[] | ❌ | Max 3 fichiers, 5MB chacun |

**Zones valides:** `terminal_1`, `terminal_2`, `portes_embarquement`, `zone_douanes`, `parking`, `hall_arrivee`, `hall_depart`, `zone_transit`, `autre`

### Liste des signalements
```
GET /api/reports
```

### Détail d'un signalement
```
GET /api/reports/:id
```

### Vérifier l'intégrité blockchain
```
GET /api/reports/:id/verify
```

## 🗄️ Modèle de Données

### Report
| Champ | Type | Description |
|-------|------|-------------|
| id | Int | ID auto-incrémenté |
| zone | Zone | Zone de l'incident |
| customZone | String? | Zone personnalisée (si AUTRE) |
| incidentTime | String | Heure de l'incident (HH:MM) |
| description | String | Description originale |
| anonymizedContent | String | Contenu anonymisé par l'IA |
| category | String | Catégorie détectée par l'IA |
| severity | String | Sévérité (low/medium/high/critical) |
| aiAnalysis | String | Analyse de l'IA |
| contentHash | String | Hash SHA256 du contenu |
| blockchainTxHash | String | Hash de la transaction Ethereum |
| attachments | String[] | URLs des pièces jointes |
| createdAt | DateTime | Date de création |

## 🚀 Déploiement

### Render / Railway

Le projet inclut un `Procfile`:
```
web: npm run build && npm start
```

Configurez les variables d'environnement dans le dashboard de votre plateforme.

## 📝 Scripts npm

| Script | Description |
|--------|-------------|
| `npm run dev` | Lancer en mode développement |
| `npm run build` | Générer Prisma + compiler TypeScript |
| `npm start` | Lancer en production |
| `npm run prisma:generate` | Générer le client Prisma |
| `npm run prisma:migrate` | Créer une migration |
| `npm run prisma:push` | Synchroniser le schéma |

## 📄 License

ISC
