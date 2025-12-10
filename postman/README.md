# 📮 Postman Collection - AeroChain Sentinel API

## 📁 Fichiers

| Fichier | Description |
|---------|-------------|
| `AeroChain_Sentinel_API.postman_collection.json` | Collection complète des endpoints |
| `Local.postman_environment.json` | Environnement de développement local |
| `Production.postman_environment.json` | Environnement de production |

## 🚀 Installation

### 1. Importer dans Postman

1. Ouvrir Postman
2. **File** → **Import**
3. Sélectionner les 3 fichiers JSON de ce dossier
4. Cliquer sur **Import**

### 2. Sélectionner l'environnement

1. En haut à droite de Postman, cliquer sur le menu déroulant des environnements
2. Sélectionner **AeroChain - Local** pour le développement
3. Ou **AeroChain - Production** pour la prod (modifier l'URL d'abord)

## 📋 Endpoints disponibles

### 🏠 Root
- `GET /` - Informations de l'API

### ❤️ Health
- `GET /api/health` - Vérification de santé

### 📝 Reports
- `POST /api/reports` - Soumettre un signalement
- `GET /api/reports` - Liste tous les signalements
- `GET /api/reports/:id` - Détails d'un signalement

### ✅ Verification
- `GET /api/reports/:id/verify` - Vérifier l'intégrité blockchain

### ❌ Error Cases
- Tests pour les cas d'erreur (validation, 404, etc.)

## 🧪 Tests automatiques

Chaque requête inclut des **tests automatiques** qui vérifient :
- Le code de statut HTTP
- La structure de la réponse
- La présence des données attendues

Le script sauvegarde automatiquement l'ID du dernier rapport créé dans la variable `lastReportId` pour faciliter les tests enchaînés.

## 🔧 Configuration

### Environnement Local
```json
{
  "baseUrl": "http://localhost:3000"
}
```

### Environnement Production
```json
{
  "baseUrl": "https://your-production-url.com"
}
```

Modifiez `baseUrl` dans l'environnement Production avec votre URL de déploiement.
