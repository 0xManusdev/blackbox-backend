# Guide d'Administration - API Blackbox Report

## Table des matières

- [Authentification](#authentification)
- [Endpoints Admin](#endpoints-admin)
- [Logs d'audit](#logs-daudit)
- [Exemples d'utilisation](#exemples-dutilisation)

## Authentification

### 1. Créer un administrateur

**Endpoint:** `POST /api/auth/register`

**Body:**
```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@airport.com",
  "password": "SecurePass123!",
  "position": "Responsable Sécurité"
}
```

**Réponse (201):**
```json
{
  "success": true,
  "message": "Administrateur créé avec succès",
  "data": {
    "id": 1,
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@airport.com",
    "position": "Responsable Sécurité",
    "createdAt": "2025-12-11T10:00:00.000Z"
  }
}
```

**Exemple cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@airport.com",
    "password": "SecurePass123!",
    "position": "Responsable Sécurité"
  }'
```

---

### 2. Connexion

**Endpoint:** `POST /api/auth/login`

**Body:**
```json
{
  "email": "jean.dupont@airport.com",
  "password": "SecurePass123!"
}
```

**Réponse (200):**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "admin": {
      "id": 1,
      "email": "jean.dupont@airport.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "position": "Responsable Sécurité"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** Le token est automatiquement stocké dans un cookie HTTP-only nommé `token`.

**Exemple cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "jean.dupont@airport.com",
    "password": "SecurePass123!"
  }'
```

---

### 3. Obtenir le profil admin

**Endpoint:** `GET /api/auth/me`

**Headers:** Cookie avec le token

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@airport.com",
    "position": "Responsable Sécurité",
    "createdAt": "2025-12-11T10:00:00.000Z",
    "updatedAt": "2025-12-11T10:00:00.000Z"
  }
}
```

**Exemple cURL:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt
```

---

### 4. Déconnexion

**Endpoint:** `POST /api/auth/logout`

**Réponse (200):**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

**Exemple cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

---

## Endpoints Admin

### 1. Récupérer tous les signalements (protégé)

**Endpoint:** `GET /api/reports`

**Headers:** Cookie avec le token

**Réponse (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "zone": "TERMINAL_1",
      "customZone": null,
      "incidentTime": "14:30",
      "category": "Sécurité",
      "severity": "medium",
      "anonymizedContent": "Incident de sécurité observé...",
      "attachments": [],
      "blockchainTxHash": "0x1a2b3c...",
      "createdAt": "2025-12-11T10:00:00.000Z"
    }
  ]
}
```

**Exemple cURL:**
```bash
curl -X GET http://localhost:3000/api/reports \
  -b cookies.txt
```

---

### 2. Marquer un signalement comme résolu

**Endpoint:** `PUT /api/reports/:id/resolve`

**Headers:** Cookie avec le token

**Réponse (200):**
```json
{
  "success": true,
  "message": "Signalement marqué comme résolu",
  "data": {
    "id": 1,
    "status": "resolved",
    "resolvedBy": 1,
    "resolvedAt": "2025-12-11T11:00:00.000Z"
  }
}
```

**Exemple cURL:**
```bash
curl -X PUT http://localhost:3000/api/reports/1/resolve \
  -b cookies.txt
```

---

### 3. Supprimer un signalement

**Endpoint:** `DELETE /api/reports/:id`

**Headers:** Cookie avec le token

**Réponse (200):**
```json
{
  "success": true,
  "message": "Signalement supprimé avec succès",
  "data": {
    "id": 1,
    "deletedBy": 1,
    "deletedAt": "2025-12-11T11:30:00.000Z"
  }
}
```

**Exemple cURL:**
```bash
curl -X DELETE http://localhost:3000/api/reports/1 \
  -b cookies.txt
```

---

## Logs d'audit

### Consulter les logs d'audit

**Endpoint:** `GET /api/admin/logs`

**Query Parameters:**
- `page` (optionnel) : Numéro de page (défaut: 1)
- `perPage` (optionnel) : Résultats par page (défaut: 50, max: 100)

**Headers:** Cookie avec le token

**Réponse (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "action": "PUT /api/reports/1/resolve",
      "method": "PUT",
      "endpoint": "/api/reports/1/resolve",
      "params": {
        "params": { "id": "1" }
      },
      "ipAddress": "127.0.0.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-12-11T11:00:00.000Z",
      "admin": {
        "id": 1,
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean.dupont@airport.com",
        "position": "Responsable Sécurité"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

**Exemple cURL:**
```bash
curl -X GET "http://localhost:3000/api/admin/logs?page=1&perPage=20" \
  -b cookies.txt
```

---

## Exemples d'utilisation

### Workflow complet avec cURL

#### 1. Créer un admin
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Marie",
    "lastName": "Martin",
    "email": "marie.martin@airport.com",
    "password": "SecurePass456!",
    "position": "Chef de service"
  }'
```

#### 2. Se connecter
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "marie.martin@airport.com",
    "password": "SecurePass456!"
  }'
```

#### 3. Consulter tous les signalements
```bash
curl -X GET http://localhost:3000/api/reports \
  -b cookies.txt
```

#### 4. Marquer un signalement comme résolu
```bash
curl -X PUT http://localhost:3000/api/reports/5/resolve \
  -b cookies.txt
```

#### 5. Consulter les logs d'audit
```bash
curl -X GET http://localhost:3000/api/admin/logs \
  -b cookies.txt
```

#### 6. Se déconnecter
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

---

### Utilisation avec Postman

1. **Créer un admin** via POST `/api/auth/register`
2. **Se connecter** via POST `/api/auth/login`
   - Le cookie `token` sera automatiquement stocké par Postman
3. **Utiliser les endpoints protégés** - le cookie sera envoyé automatiquement

---

### Gestion des cookies en JavaScript (Frontend)

```javascript
// Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important pour les cookies
  body: JSON.stringify({
    email: 'admin@airport.com',
    password: 'password123'
  })
});

// Requête protégée
const reportsResponse = await fetch('http://localhost:3000/api/reports', {
  method: 'GET',
  credentials: 'include', // Le cookie sera envoyé automatiquement
});

// Logout
await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  credentials: 'include',
});
```

---

## Sécurité

### Bonnes pratiques

1. **Mots de passe** : Minimum 8 caractères
2. **Token JWT** : Valide 24 heures
3. **Cookies HTTP-only** : Protection XSS
4. **CORS** : Configuré pour le frontend autorisé uniquement
5. **Logs d'audit** : Toutes les actions de modification sont enregistrées

### Actions loggées

Les actions suivantes sont automatiquement enregistrées dans les logs d'audit :

- ✅ PUT `/api/reports/:id/resolve` - Résolution d'un signalement
- ✅ DELETE `/api/reports/:id` - Suppression d'un signalement
- ✅ POST (toutes les créations admin futures)
- ✅ PATCH (toutes les modifications admin futures)

Les actions suivantes ne sont **pas** loggées :

- ❌ GET (consultations)
- ❌ POST `/api/reports` (signalements publics)

---

## Troubleshooting

### Erreur 401 : Non autorisé

**Cause** : Token manquant ou expiré

**Solution** : Se reconnecter via `/api/auth/login`

---

### Erreur : Token invalide

**Cause** : JWT_SECRET différent entre générations

**Solution** : Vérifier que `JWT_SECRET` est identique dans `.env`

---

### Cookie non envoyé

**Cause** : CORS mal configuré ou `credentials: 'include'` manquant

**Solution** : 
- Backend : Vérifier `cors({ credentials: true })`
- Frontend : Ajouter `credentials: 'include'` aux requêtes fetch

---

## Variables d'environnement requises

Ajoutez ces variables à votre fichier `.env` :

```env
# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=24h
```

**Important** : Changez `JWT_SECRET` en production avec une valeur sécurisée (32+ caractères aléatoires).
