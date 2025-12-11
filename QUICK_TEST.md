# Tests rapides - Système d'administration

## Prérequis
- Serveur démarré : `npm run dev`
- Base de données migrée : `npx prisma migrate deploy`

## Tests avec cURL (Windows PowerShell)

### 1. Créer un admin

```powershell
$body = @{
    firstName = "Test"
    lastName = "Admin"
    email = "test@admin.com"
    password = "Password123!"
    position = "Testeur"
} | ConvertTo-Json

curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d $body
```

### 2. Se connecter

```powershell
$body = @{
    email = "test@admin.com"
    password = "Password123!"
} | ConvertTo-Json

curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -c cookies.txt `
  -d $body
```

### 3. Consulter les signalements (protégé)

```powershell
curl -X GET http://localhost:3000/api/reports `
  -b cookies.txt
```

### 4. Marquer un signalement comme résolu

```powershell
# Remplacer 1 par l'ID du signalement
curl -X PUT http://localhost:3000/api/reports/1/resolve `
  -b cookies.txt
```

### 5. Consulter les logs d'audit

```powershell
curl -X GET http://localhost:3000/api/admin/logs `
  -b cookies.txt
```

### 6. Obtenir le profil admin

```powershell
curl -X GET http://localhost:3000/api/auth/me `
  -b cookies.txt
```

### 7. Se déconnecter

```powershell
curl -X POST http://localhost:3000/api/auth/logout `
  -b cookies.txt
```

---

## Tests avec cURL (Linux/macOS)

### 1. Créer un admin

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "Admin",
    "email": "test@admin.com",
    "password": "Password123!",
    "position": "Testeur"
  }'
```

### 2. Se connecter

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@admin.com",
    "password": "Password123!"
  }'
```

### 3. Consulter les signalements (protégé)

```bash
curl -X GET http://localhost:3000/api/reports \
  -b cookies.txt
```

### 4. Marquer un signalement comme résolu

```bash
curl -X PUT http://localhost:3000/api/reports/1/resolve \
  -b cookies.txt
```

### 5. Consulter les logs d'audit

```bash
curl -X GET http://localhost:3000/api/admin/logs \
  -b cookies.txt
```

### 6. Obtenir le profil admin

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt
```

### 7. Se déconnecter

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

---

## Tests avec Postman

### Configuration

1. Importer la collection : `postman/AeroChain_Sentinel_API.postman_collection.json`
2. Sélectionner l'environnement : **Local**
3. Les cookies seront gérés automatiquement par Postman

### Ordre de test

1. **POST** `/api/auth/register` - Créer un admin
2. **POST** `/api/auth/login` - Se connecter (cookie stocké automatiquement)
3. **GET** `/api/auth/me` - Vérifier la session
4. **GET** `/api/reports` - Liste des signalements
5. **PUT** `/api/reports/:id/resolve` - Marquer comme résolu
6. **GET** `/api/admin/logs` - Consulter les logs
7. **POST** `/api/auth/logout` - Se déconnecter

---

## Tests avec JavaScript (Frontend)

### Configuration CORS

Le backend doit avoir :
```javascript
cors({
  origin: 'http://localhost:3001',
  credentials: true
})
```

### Code de test

```javascript
// 1. Créer un admin
async function register() {
  const response = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      firstName: 'Test',
      lastName: 'Frontend',
      email: 'frontend@test.com',
      password: 'TestPass123!',
      position: 'Developer'
    })
  });
  const data = await response.json();
  console.log('Register:', data);
}

// 2. Se connecter
async function login() {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: 'frontend@test.com',
      password: 'TestPass123!'
    })
  });
  const data = await response.json();
  console.log('Login:', data);
}

// 3. Consulter les signalements
async function getReports() {
  const response = await fetch('http://localhost:3000/api/reports', {
    credentials: 'include'
  });
  const data = await response.json();
  console.log('Reports:', data);
}

// 4. Marquer comme résolu
async function resolveReport(id) {
  const response = await fetch(`http://localhost:3000/api/reports/${id}/resolve`, {
    method: 'PUT',
    credentials: 'include'
  });
  const data = await response.json();
  console.log('Resolve:', data);
}

// 5. Consulter les logs
async function getAuditLogs() {
  const response = await fetch('http://localhost:3000/api/admin/logs', {
    credentials: 'include'
  });
  const data = await response.json();
  console.log('Audit logs:', data);
}

// 6. Se déconnecter
async function logout() {
  const response = await fetch('http://localhost:3000/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  const data = await response.json();
  console.log('Logout:', data);
}

// Exécuter les tests
(async () => {
  await register();
  await login();
  await getReports();
  await resolveReport(1);
  await getAuditLogs();
  await logout();
})();
```

---

## Vérification en base de données

### Vérifier les admins créés

```sql
SELECT id, first_name, last_name, email, position, created_at
FROM admins
ORDER BY created_at DESC;
```

### Vérifier les logs d'audit

```sql
SELECT 
  al.id,
  al.action,
  al.method,
  al.ip_address,
  a.email as admin_email,
  al.created_at
FROM audit_logs al
JOIN admins a ON al.admin_id = a.id
ORDER BY al.created_at DESC
LIMIT 20;
```

### Vérifier les signalements résolus

```sql
SELECT 
  r.id,
  r.zone,
  r.status,
  a.email as resolved_by_email,
  r.resolved_at
FROM reports r
LEFT JOIN admins a ON r.resolved_by = a.id
WHERE r.status = 'resolved'
ORDER BY r.resolved_at DESC;
```

---

## Codes de statut attendus

| Endpoint | Succès | Erreur auth | Erreur validation |
|----------|--------|-------------|-------------------|
| POST /auth/register | 201 | - | 400 |
| POST /auth/login | 200 | 401 | 400 |
| GET /auth/me | 200 | 401 | - |
| GET /reports | 200 | 401 | - |
| PUT /reports/:id/resolve | 200 | 401 | 404 |
| DELETE /reports/:id | 200 | 401 | 404 |
| GET /admin/logs | 200 | 401 | - |
| POST /auth/logout | 200 | - | - |

---

## Checklist de test

- [ ] Créer un admin avec email valide
- [ ] Tenter de créer un admin avec email existant (doit échouer)
- [ ] Se connecter avec credentials corrects
- [ ] Se connecter avec mauvais mot de passe (doit échouer)
- [ ] Accéder à `/api/reports` sans authentification (doit échouer 401)
- [ ] Accéder à `/api/reports` avec authentification (doit réussir)
- [ ] Marquer un signalement comme résolu
- [ ] Vérifier que le log d'audit est créé
- [ ] Consulter les logs d'audit
- [ ] Supprimer un signalement
- [ ] Vérifier que le signalement est supprimé
- [ ] Se déconnecter
- [ ] Tenter d'accéder à une route protégée après logout (doit échouer 401)

---

## Nettoyage après tests

### Supprimer les admins de test

```sql
DELETE FROM admins WHERE email LIKE '%test%';
```

### Supprimer les logs d'audit de test

```sql
DELETE FROM audit_logs WHERE admin_id NOT IN (SELECT id FROM admins);
```

---

## En cas de problème

### Token invalide après redémarrage

**Cause :** JWT_SECRET a changé entre les redémarrages

**Solution :** Se reconnecter via `/api/auth/login`

---

### Cookie non reçu

**Cause :** CORS mal configuré

**Solution :** Vérifier que :
- Backend : `cors({ credentials: true, origin: 'http://localhost:3001' })`
- Frontend : `credentials: 'include'` dans fetch

---

### Logs d'audit vides

**Cause :** Action non loggée (GET par exemple)

**Solution :** Seules les actions POST, PUT, DELETE, PATCH sont loggées

---

**Bon test ! 🧪**
