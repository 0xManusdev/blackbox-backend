# Documentation API - Blackbox Report Backend

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Configuration de base](#configuration-de-base)
- [Authentification](#authentification)
- [Endpoints Publics](#endpoints-publics)
- [Endpoints Protégés (Admin)](#endpoints-protégés-admin)
- [Gestion des erreurs](#gestion-des-erreurs)
- [Intégration avec TanStack Query (React Query)](#intégration-avec-tanstack-query-react-query)
- [Exemples complets](#exemples-complets)
- [Types TypeScript](#types-typescript)

---

## Vue d'ensemble

### URL de base

- **Développement** : `http://localhost:3000`
- **Production** : `https://your-app.onrender.com`

### Format des réponses

Toutes les réponses suivent le format JSON suivant :

**Succès :**
```json
{
  "success": true,
  "data": { /* données */ },
  "message": "Message optionnel"
}
```

**Erreur :**
```json
{
  "success": false,
  "error": "Type d'erreur",
  "message": "Description de l'erreur"
}
```

### Codes de statut HTTP

| Code | Signification |
|------|---------------|
| 200 | Succès (GET, PUT, DELETE) |
| 201 | Créé avec succès (POST) |
| 400 | Erreur de validation |
| 401 | Non authentifié |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

---

## Configuration de base

### Installation des dépendances

```bash
npm install @tanstack/react-query axios
# ou
yarn add @tanstack/react-query axios
```

### Configuration d'Axios

```typescript
// src/lib/axios.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true, // Important pour les cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Rediriger vers login ou afficher modal
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Configuration de TanStack Query

```typescript
// src/main.tsx ou src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Votre application */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## Authentification

### Système d'authentification

L'API utilise JWT stockés dans des cookies HTTP-only pour l'authentification.

**Flow :**
1. Client envoie email + password via POST `/api/auth/login`
2. Serveur valide et retourne un token JWT dans un cookie `token`
3. Le cookie est automatiquement envoyé avec chaque requête suivante
4. Pas besoin de gérer manuellement le token côté client

### 1. Créer un administrateur

**Endpoint :** `POST /api/auth/register`

**Body :**
```typescript
{
  firstName: string;    // Prénom (requis)
  lastName: string;     // Nom (requis)
  email: string;        // Email unique (requis)
  password: string;     // Min 8 caractères (requis)
  position: string;     // Poste occupé (requis)
}
```

**Réponse (201) :**
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

**Erreurs possibles :**
- `400` : Email invalide ou mot de passe trop court
- `400` : Email déjà utilisé

**TanStack Query :**
```typescript
// src/hooks/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/axios';

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  position: string;
}

interface Admin {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  createdAt: string;
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const response = await api.post<{
        success: boolean;
        message: string;
        data: Admin;
      }>('/api/auth/register', data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Admin créé:', data);
      // Rediriger vers login
    },
    onError: (error: any) => {
      console.error('Erreur inscription:', error.response?.data?.message);
    },
  });
}

// Utilisation dans un composant
function RegisterForm() {
  const registerMutation = useRegister();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    registerMutation.mutate({
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      position: formData.get('position') as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Vos champs de formulaire */}
      <button 
        type="submit" 
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? 'Création...' : 'Créer un compte'}
      </button>
      {registerMutation.isError && (
        <p className="error">{registerMutation.error.message}</p>
      )}
    </form>
  );
}
```

---

### 2. Se connecter

**Endpoint :** `POST /api/auth/login`

**Body :**
```typescript
{
  email: string;        // Email de l'admin
  password: string;     // Mot de passe
}
```

**Réponse (200) :**
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

**Erreurs possibles :**
- `400` : Email ou mot de passe manquant
- `401` : Credentials incorrects

**TanStack Query :**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';

interface LoginInput {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    admin: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      position: string;
    };
    token: string;
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const response = await api.post<LoginResponse>(
        '/api/auth/login',
        credentials
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Stocker les infos de l'admin dans le cache
      queryClient.setQueryData(['currentUser'], data.data.admin);
      // Rediriger vers dashboard
      window.location.href = '/dashboard';
    },
    onError: (error: any) => {
      console.error('Erreur login:', error.response?.data?.message);
    },
  });
}

// Utilisation dans un composant
function LoginForm() {
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    loginMutation.mutate({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" name="email" required />
      <input type="password" name="password" required />
      <button 
        type="submit" 
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? 'Connexion...' : 'Se connecter'}
      </button>
      {loginMutation.isError && (
        <p className="error">Email ou mot de passe incorrect</p>
      )}
    </form>
  );
}
```

---

### 3. Obtenir le profil de l'admin connecté

**Endpoint :** `GET /api/auth/me`

**Headers :** Cookie `token` (automatique)

**Réponse (200) :**
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

**Erreurs possibles :**
- `401` : Non authentifié (cookie manquant ou expiré)

**TanStack Query :**
```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

interface CurrentUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  createdAt: string;
  updatedAt: string;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: CurrentUser;
      }>('/api/auth/me');
      return response.data.data;
    },
    retry: false, // Ne pas retry si non authentifié
    staleTime: Infinity, // Les données du user ne changent pas souvent
  });
}

// Utilisation dans un composant
function UserProfile() {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) return <div>Chargement...</div>;
  if (isError) return <div>Non authentifié</div>;

  return (
    <div>
      <h2>{user.firstName} {user.lastName}</h2>
      <p>{user.position}</p>
      <p>{user.email}</p>
    </div>
  );
}

// Hook personnalisé pour vérifier l'authentification
export function useIsAuthenticated() {
  const { data, isLoading } = useCurrentUser();
  return {
    isAuthenticated: !!data,
    isLoading,
    user: data,
  };
}
```

---

### 4. Se déconnecter

**Endpoint :** `POST /api/auth/logout`

**Headers :** Cookie `token` (automatique)

**Réponse (200) :**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

**TanStack Query :**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/auth/logout');
      return response.data;
    },
    onSuccess: () => {
      // Vider le cache
      queryClient.clear();
      // Rediriger vers login
      window.location.href = '/login';
    },
  });
}

// Utilisation dans un composant
function LogoutButton() {
  const logoutMutation = useLogout();

  return (
    <button 
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
    >
      {logoutMutation.isPending ? 'Déconnexion...' : 'Se déconnecter'}
    </button>
  );
}
```

---

## Endpoints Publics

### 1. Health Check

**Endpoint :** `GET /api/health`

**Réponse (200) :**
```json
{
  "status": "ok",
  "timestamp": "2025-12-11T10:00:00.000Z",
  "service": "Blackbox Report API"
}
```

**TanStack Query :**
```typescript
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get('/api/health');
      return response.data;
    },
    refetchInterval: 60000, // Vérifier toutes les minutes
  });
}
```

---

### 2. Liste des zones disponibles

**Endpoint :** `GET /api/zones`

**Réponse (200) :**
```json
{
  "success": true,
  "data": [
    { "value": "TERMINAL_1", "label": "Terminal 1" },
    { "value": "TERMINAL_2", "label": "Terminal 2" },
    { "value": "PORTES_EMBARQUEMENT", "label": "Portes d'embarquement" },
    { "value": "ZONE_DOUANES", "label": "Zone de douanes" },
    { "value": "PARKING", "label": "Parking" },
    { "value": "HALL_ARRIVEE", "label": "Hall d'arrivée" },
    { "value": "HALL_DEPART", "label": "Hall de départ" },
    { "value": "ZONE_TRANSIT", "label": "Zone de transit" },
    { "value": "AUTRE", "label": "Autre (préciser)" }
  ]
}
```

**TanStack Query :**
```typescript
interface Zone {
  value: string;
  label: string;
}

export function useZones() {
  return useQuery({
    queryKey: ['zones'],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: Zone[];
      }>('/api/zones');
      return response.data.data;
    },
    staleTime: Infinity, // Les zones ne changent jamais
  });
}

// Utilisation dans un composant
function ZoneSelect() {
  const { data: zones, isLoading } = useZones();

  if (isLoading) return <div>Chargement...</div>;

  return (
    <select name="zone">
      {zones?.map((zone) => (
        <option key={zone.value} value={zone.value}>
          {zone.label}
        </option>
      ))}
    </select>
  );
}
```

---

### 3. Soumettre un signalement

**Endpoint :** `POST /api/reports`

**Content-Type :** `multipart/form-data`

**Body (FormData) :**
```typescript
{
  zone: string;              // Zone de l'incident (requis)
  customZone?: string;       // Zone personnalisée si zone="AUTRE"
  incidentTime: string;      // Heure HH:MM (requis)
  description: string;       // Description de l'incident (requis)
  attachments?: File[];      // Max 3 fichiers, 5MB chacun
}
```

**Réponse (201) :**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "zone": "TERMINAL_1",
    "incidentTime": "14:30",
    "category": "Sécurité",
    "severity": "medium",
    "analysis": "L'incident signalé concerne...",
    "anonymizedContent": "Incident de sécurité observé près de [REDACTED]",
    "attachments": [
      "https://xxx.supabase.co/storage/v1/object/public/attachments/..."
    ],
    "blockchain": {
      "txHash": "0x1a2b3c4d...",
      "contentHash": "0x8f4e3b2a...",
      "blockNumber": 5234567,
      "explorerUrl": "https://sepolia.etherscan.io/tx/0x1a2b3c4d..."
    },
    "createdAt": "2025-12-11T10:00:00.000Z"
  }
}
```

**Erreurs possibles :**
- `400` : Champs manquants ou invalides
- `413` : Fichier trop volumineux

**TanStack Query :**
```typescript
interface SubmitReportInput {
  zone: string;
  customZone?: string;
  incidentTime: string;
  description: string;
  attachments?: File[];
}

interface Report {
  id: number;
  zone: string;
  incidentTime: string;
  category: string;
  severity: string;
  analysis: string;
  anonymizedContent: string;
  attachments: string[];
  blockchain: {
    txHash: string;
    contentHash: string;
    blockNumber: number;
    explorerUrl: string;
  };
  createdAt: string;
}

export function useSubmitReport() {
  return useMutation({
    mutationFn: async (data: SubmitReportInput) => {
      const formData = new FormData();
      formData.append('zone', data.zone);
      if (data.customZone) {
        formData.append('customZone', data.customZone);
      }
      formData.append('incidentTime', data.incidentTime);
      formData.append('description', data.description);
      
      // Ajouter les fichiers
      data.attachments?.forEach((file) => {
        formData.append('attachments', file);
      });

      const response = await api.post<{
        success: boolean;
        data: Report;
      }>('/api/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    },
    onSuccess: (report) => {
      console.log('Signalement créé:', report);
      // Afficher modal de succès
    },
    onError: (error: any) => {
      console.error('Erreur:', error.response?.data?.message);
    },
  });
}

// Utilisation dans un composant
function ReportForm() {
  const submitMutation = useSubmitReport();
  const [files, setFiles] = React.useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    submitMutation.mutate({
      zone: formData.get('zone') as string,
      customZone: formData.get('customZone') as string || undefined,
      incidentTime: formData.get('incidentTime') as string,
      description: formData.get('description') as string,
      attachments: files,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files).slice(0, 3));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <select name="zone" required>
        {/* Options de zones */}
      </select>
      <input type="time" name="incidentTime" required />
      <textarea name="description" required />
      <input 
        type="file" 
        multiple 
        accept="image/*,application/pdf" 
        onChange={handleFileChange}
      />
      <button 
        type="submit" 
        disabled={submitMutation.isPending}
      >
        {submitMutation.isPending ? 'Envoi...' : 'Soumettre'}
      </button>
      {submitMutation.isSuccess && (
        <p className="success">Signalement envoyé avec succès!</p>
      )}
    </form>
  );
}
```

---

### 4. Obtenir un signalement par ID

**Endpoint :** `GET /api/reports/:id`

**Paramètres :**
- `id` (number) : ID du signalement

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "zone": "TERMINAL_1",
    "customZone": null,
    "incidentTime": "14:30",
    "description": "Incident de sécurité observé...",
    "category": "Sécurité",
    "severity": "medium",
    "analysis": "L'incident signalé concerne...",
    "anonymizedContent": "Incident observé près de [REDACTED]",
    "attachments": ["https://..."],
    "blockchain": {
      "txHash": "0x1a2b3c4d...",
      "contentHash": "0x8f4e3b2a...",
      "explorerUrl": "https://sepolia.etherscan.io/tx/0x1a2b3c4d..."
    },
    "createdAt": "2025-12-11T10:00:00.000Z"
  }
}
```

**Erreurs possibles :**
- `400` : ID invalide
- `404` : Signalement non trouvé

**TanStack Query :**
```typescript
interface ReportDetail {
  id: number;
  zone: string;
  customZone: string | null;
  incidentTime: string;
  description: string;
  category: string;
  severity: string;
  analysis: string;
  anonymizedContent: string;
  attachments: string[];
  blockchain: {
    txHash: string;
    contentHash: string;
    explorerUrl: string;
  };
  createdAt: string;
}

export function useReport(id: number) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: ReportDetail;
      }>(`/api/reports/${id}`);
      return response.data.data;
    },
    enabled: !!id, // Ne lance la requête que si id existe
  });
}

// Utilisation dans un composant
function ReportDetailPage({ reportId }: { reportId: number }) {
  const { data: report, isLoading, isError } = useReport(reportId);

  if (isLoading) return <div>Chargement...</div>;
  if (isError) return <div>Signalement non trouvé</div>;
  if (!report) return null;

  return (
    <div>
      <h1>Signalement #{report.id}</h1>
      <p><strong>Zone:</strong> {report.zone}</p>
      <p><strong>Heure:</strong> {report.incidentTime}</p>
      <p><strong>Catégorie:</strong> {report.category}</p>
      <p><strong>Sévérité:</strong> {report.severity}</p>
      <p><strong>Analyse:</strong> {report.analysis}</p>
      
      {report.attachments.length > 0 && (
        <div>
          <h3>Pièces jointes</h3>
          {report.attachments.map((url, index) => (
            <img key={index} src={url} alt={`Attachment ${index + 1}`} />
          ))}
        </div>
      )}

      <div>
        <h3>Preuve blockchain</h3>
        <a href={report.blockchain.explorerUrl} target="_blank" rel="noopener noreferrer">
          Voir sur Etherscan
        </a>
      </div>
    </div>
  );
}
```

---

### 5. Vérifier l'intégrité blockchain

**Endpoint :** `GET /api/reports/:id/verify`

**Paramètres :**
- `id` (number) : ID du signalement

**Réponse (200) - Intégrité validée :**
```json
{
  "success": true,
  "data": {
    "reportId": 42,
    "integrityValid": true,
    "storedHash": "0x8f4e3b2a...",
    "calculatedHash": "0x8f4e3b2a...",
    "blockchainTxHash": "0x1a2b3c4d...",
    "explorerUrl": "https://sepolia.etherscan.io/tx/0x1a2b3c4d..."
  }
}
```

**Réponse (200) - Intégrité compromise :**
```json
{
  "success": true,
  "data": {
    "reportId": 42,
    "integrityValid": false,
    "storedHash": "0x8f4e3b2a...",
    "calculatedHash": "0x9a1b2c3d...",
    "blockchainTxHash": "0x1a2b3c4d...",
    "explorerUrl": "https://sepolia.etherscan.io/tx/0x1a2b3c4d..."
  }
}
```

**TanStack Query :**
```typescript
interface VerifyResult {
  reportId: number;
  integrityValid: boolean;
  storedHash: string;
  calculatedHash: string;
  blockchainTxHash: string;
  explorerUrl: string;
}

export function useVerifyReport(reportId: number) {
  return useQuery({
    queryKey: ['verify', reportId],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        data: VerifyResult;
      }>(`/api/reports/${reportId}/verify`);
      return response.data.data;
    },
    enabled: !!reportId,
    staleTime: 30000, // Cache 30 secondes
  });
}

// Utilisation dans un composant
function VerifyReportButton({ reportId }: { reportId: number }) {
  const { 
    data: verification, 
    isLoading, 
    refetch 
  } = useVerifyReport(reportId);

  return (
    <div>
      <button onClick={() => refetch()} disabled={isLoading}>
        {isLoading ? 'Vérification...' : 'Vérifier l\'intégrité'}
      </button>
      
      {verification && (
        <div className={verification.integrityValid ? 'valid' : 'invalid'}>
          {verification.integrityValid ? (
            <p>✅ Intégrité validée - Données non altérées</p>
          ) : (
            <p>❌ Intégrité compromise - Données potentiellement modifiées</p>
          )}
          <a href={verification.explorerUrl} target="_blank">
            Voir sur Etherscan
          </a>
        </div>
      )}
    </div>
  );
}
```

---

## Endpoints Protégés (Admin)

**Note :** Tous ces endpoints nécessitent une authentification (cookie `token`).

### 1. Liste de tous les signalements (Admin)

**Endpoint :** `GET /api/reports`

**Headers :** Cookie `token` (automatique)

**Réponse (200) :**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 42,
      "zone": "TERMINAL_1",
      "customZone": null,
      "incidentTime": "14:30",
      "category": "Sécurité",
      "severity": "medium",
      "anonymizedContent": "Incident observé...",
      "attachments": ["https://..."],
      "blockchainTxHash": "0x1a2b3c4d...",
      "createdAt": "2025-12-11T10:00:00.000Z"
    }
  ]
}
```

**Erreurs possibles :**
- `401` : Non authentifié

**TanStack Query :**
```typescript
interface ReportSummary {
  id: number;
  zone: string;
  customZone: string | null;
  incidentTime: string;
  category: string;
  severity: string;
  anonymizedContent: string;
  attachments: string[];
  blockchainTxHash: string;
  createdAt: string;
}

export function useAllReports() {
  return useQuery({
    queryKey: ['reports', 'all'],
    queryFn: async () => {
      const response = await api.get<{
        success: boolean;
        count: number;
        data: ReportSummary[];
      }>('/api/reports');
      return response.data;
    },
    // Rafraîchir automatiquement toutes les 30 secondes
    refetchInterval: 30000,
  });
}

// Utilisation dans un composant
function AdminReportsList() {
  const { data, isLoading, isError } = useAllReports();

  if (isLoading) return <div>Chargement...</div>;
  if (isError) return <div>Erreur de chargement</div>;

  return (
    <div>
      <h2>Tous les signalements ({data?.count})</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Zone</th>
            <th>Heure</th>
            <th>Catégorie</th>
            <th>Sévérité</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.map((report) => (
            <tr key={report.id}>
              <td>{report.id}</td>
              <td>{report.zone}</td>
              <td>{report.incidentTime}</td>
              <td>{report.category}</td>
              <td>
                <span className={`severity-${report.severity}`}>
                  {report.severity}
                </span>
              </td>
              <td>{new Date(report.createdAt).toLocaleDateString()}</td>
              <td>
                <button>Voir</button>
                <button>Résoudre</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### 2. Marquer un signalement comme résolu

**Endpoint :** `PUT /api/reports/:id/resolve`

**Headers :** Cookie `token` (automatique)

**Paramètres :**
- `id` (number) : ID du signalement

**Réponse (200) :**
```json
{
  "success": true,
  "message": "Signalement marqué comme résolu",
  "data": {
    "id": 42,
    "status": "resolved",
    "resolvedBy": 1,
    "resolvedAt": "2025-12-11T11:00:00.000Z"
  }
}
```

**Erreurs possibles :**
- `401` : Non authentifié
- `404` : Signalement non trouvé

**TanStack Query :**
```typescript
interface ResolveResult {
  id: number;
  status: string;
  resolvedBy: number;
  resolvedAt: string;
}

export function useResolveReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: number) => {
      const response = await api.put<{
        success: boolean;
        message: string;
        data: ResolveResult;
      }>(`/api/reports/${reportId}/resolve`);
      return response.data;
    },
    onSuccess: () => {
      // Invalider et rafraîchir la liste des signalements
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error: any) => {
      console.error('Erreur:', error.response?.data?.message);
    },
  });
}

// Utilisation dans un composant
function ResolveButton({ reportId }: { reportId: number }) {
  const resolveMutation = useResolveReport();

  const handleResolve = () => {
    if (confirm('Marquer ce signalement comme résolu ?')) {
      resolveMutation.mutate(reportId);
    }
  };

  return (
    <button 
      onClick={handleResolve}
      disabled={resolveMutation.isPending}
    >
      {resolveMutation.isPending ? 'Résolution...' : 'Marquer résolu'}
    </button>
  );
}
```

---

### 3. Supprimer un signalement

**Endpoint :** `DELETE /api/reports/:id`

**Headers :** Cookie `token` (automatique)

**Paramètres :**
- `id` (number) : ID du signalement

**Réponse (200) :**
```json
{
  "success": true,
  "message": "Signalement supprimé avec succès",
  "data": {
    "id": 42,
    "deletedBy": 1,
    "deletedAt": "2025-12-11T11:30:00.000Z"
  }
}
```

**Erreurs possibles :**
- `401` : Non authentifié
- `404` : Signalement non trouvé

**TanStack Query :**
```typescript
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: number) => {
      const response = await api.delete<{
        success: boolean;
        message: string;
        data: {
          id: number;
          deletedBy: number;
          deletedAt: string;
        };
      }>(`/api/reports/${reportId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalider et rafraîchir la liste des signalements
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

// Utilisation dans un composant
function DeleteButton({ reportId }: { reportId: number }) {
  const deleteMutation = useDeleteReport();

  const handleDelete = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
      deleteMutation.mutate(reportId);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={deleteMutation.isPending}
      className="btn-danger"
    >
      {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
    </button>
  );
}
```

---

### 4. Consulter les logs d'audit

**Endpoint :** `GET /api/admin/logs`

**Headers :** Cookie `token` (automatique)

**Query Parameters :**
- `page` (number, optionnel) : Numéro de page (défaut: 1)
- `perPage` (number, optionnel) : Résultats par page (défaut: 50, max: 100)

**Réponse (200) :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "action": "PUT /api/reports/5/resolve",
      "method": "PUT",
      "endpoint": "/api/reports/5/resolve",
      "params": {
        "params": { "id": "5" }
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
    "total": 150,
    "totalPages": 3
  }
}
```

**TanStack Query :**
```typescript
interface AuditLog {
  id: number;
  action: string;
  method: string;
  endpoint: string;
  params: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  admin: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
  };
}

interface AuditLogsResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export function useAuditLogs(page: number = 1, perPage: number = 50) {
  return useQuery({
    queryKey: ['auditLogs', page, perPage],
    queryFn: async () => {
      const response = await api.get<AuditLogsResponse>(
        `/api/admin/logs?page=${page}&perPage=${perPage}`
      );
      return response.data;
    },
  });
}

// Utilisation dans un composant avec pagination
function AuditLogsTable() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useAuditLogs(page, 20);

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div>
      <h2>Logs d'audit</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Admin</th>
            <th>Action</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.createdAt).toLocaleString()}</td>
              <td>{log.admin.firstName} {log.admin.lastName}</td>
              <td>
                <code>{log.method}</code> {log.endpoint}
              </td>
              <td>{log.ipAddress}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Précédent
        </button>
        <span>
          Page {data?.pagination.page} sur {data?.pagination.totalPages}
        </span>
        <button 
          onClick={() => setPage(p => p + 1)}
          disabled={page >= (data?.pagination.totalPages || 1)}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
```

---

## Gestion des erreurs

### Structure des erreurs

```typescript
interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: any;
}
```

### Gestion globale avec Axios

```typescript
// src/lib/axios.ts
import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const message = error.response?.data?.message || 'Une erreur est survenue';
    
    // Gestion par code d'erreur
    switch (error.response?.status) {
      case 401:
        // Rediriger vers login
        window.location.href = '/login';
        break;
      case 403:
        console.error('Accès refusé');
        break;
      case 404:
        console.error('Ressource non trouvée');
        break;
      case 500:
        console.error('Erreur serveur');
        break;
    }

    return Promise.reject(error);
  }
);
```

### Gestion des erreurs avec TanStack Query

```typescript
// Hook personnalisé pour gérer les erreurs
export function useErrorHandler() {
  return (error: any) => {
    const message = error.response?.data?.message || 'Une erreur est survenue';
    
    // Vous pouvez utiliser une lib de notifications (toast, etc.)
    console.error(message);
    
    // Ou afficher dans un state global
    // showNotification({ type: 'error', message });
  };
}

// Utilisation dans une mutation
export function useSubmitReport() {
  const handleError = useErrorHandler();

  return useMutation({
    mutationFn: submitReportFn,
    onError: handleError,
  });
}
```

### Component ErrorBoundary

```typescript
// src/components/ErrorBoundary.tsx
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div role="alert">
      <h2>Une erreur s'est produite</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Réessayer</button>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ReactErrorBoundary onReset={reset} FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
}
```

---

## Intégration avec TanStack Query (React Query)

### Configuration avancée

```typescript
// src/lib/queryClient.ts
import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
  queries: {
    retry: (failureCount, error: any) => {
      // Ne pas retry sur 401, 403, 404
      if ([401, 403, 404].includes(error?.response?.status)) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
  },
  mutations: {
    retry: false,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});
```

### Hook personnalisé pour les mutations avec optimistic updates

```typescript
// Exemple: Résoudre un signalement avec mise à jour optimiste
export function useResolveReportOptimistic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: number) => {
      const response = await api.put(`/api/reports/${reportId}/resolve`);
      return response.data;
    },
    // Optimistic update
    onMutate: async (reportId) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ['reports'] });

      // Sauvegarder l'état précédent
      const previousReports = queryClient.getQueryData(['reports', 'all']);

      // Mettre à jour optimistically
      queryClient.setQueryData(['reports', 'all'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((report: any) =>
            report.id === reportId
              ? { ...report, status: 'resolved' }
              : report
          ),
        };
      });

      return { previousReports };
    },
    // En cas d'erreur, restaurer l'état précédent
    onError: (err, reportId, context: any) => {
      queryClient.setQueryData(['reports', 'all'], context.previousReports);
    },
    // Toujours rafraîchir après la mutation
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
```

### Prefetching pour améliorer les performances

```typescript
// Précharger les détails d'un signalement au survol
function ReportListItem({ report }: { report: ReportSummary }) {
  const queryClient = useQueryClient();

  const prefetchReport = () => {
    queryClient.prefetchQuery({
      queryKey: ['report', report.id],
      queryFn: () => api.get(`/api/reports/${report.id}`).then(r => r.data.data),
    });
  };

  return (
    <div onMouseEnter={prefetchReport}>
      <Link to={`/reports/${report.id}`}>
        Signalement #{report.id}
      </Link>
    </div>
  );
}
```

### Infinite scroll pour les logs d'audit

```typescript
export function useInfiniteAuditLogs() {
  return useInfiniteQuery({
    queryKey: ['auditLogs', 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get<AuditLogsResponse>(
        `/api/admin/logs?page=${pageParam}&perPage=20`
      );
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

// Utilisation avec infinite scroll
function InfiniteAuditLogs() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteAuditLogs();

  return (
    <div>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.data.map((log) => (
            <AuditLogItem key={log.id} log={log} />
          ))}
        </React.Fragment>
      ))}
      
      {hasNextPage && (
        <button 
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Chargement...' : 'Charger plus'}
        </button>
      )}
    </div>
  );
}
```

---

## Exemples complets

### Application complète avec authentification

```typescript
// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useIsAuthenticated } from './hooks/useAuth';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useIsAuthenticated();

  if (isLoading) return <div>Chargement...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/report" element={<PublicReportForm />} />
          
          {/* Routes protégées */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <AdminReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

### Dashboard avec statistiques

```typescript
// src/pages/DashboardPage.tsx
function DashboardPage() {
  const { data: reports } = useAllReports();
  const { data: user } = useCurrentUser();

  const stats = React.useMemo(() => {
    if (!reports) return null;
    
    return {
      total: reports.count,
      byseverity: {
        low: reports.data.filter(r => r.severity === 'low').length,
        medium: reports.data.filter(r => r.severity === 'medium').length,
        high: reports.data.filter(r => r.severity === 'high').length,
        critical: reports.data.filter(r => r.severity === 'critical').length,
      },
      recent: reports.data.slice(0, 5),
    };
  }, [reports]);

  return (
    <div>
      <h1>Tableau de bord</h1>
      <p>Bienvenue {user?.firstName} {user?.lastName}</p>

      <div className="stats-grid">
        <StatCard title="Total" value={stats?.total || 0} />
        <StatCard title="Faible" value={stats?.byeverity.low || 0} color="green" />
        <StatCard title="Moyen" value={stats?.bySeverity.medium || 0} color="yellow" />
        <StatCard title="Élevé" value={stats?.bySeverity.high || 0} color="orange" />
        <StatCard title="Critique" value={stats?.bySeverity.critical || 0} color="red" />
      </div>

      <div>
        <h2>Signalements récents</h2>
        {stats?.recent.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </div>
  );
}
```

---

## Types TypeScript

### Types complets pour l'API

```typescript
// src/types/api.ts

// ============= Auth Types =============
export interface Admin {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  position: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    admin: Omit<Admin, 'createdAt' | 'updatedAt'>;
    token: string;
  };
}

// ============= Report Types =============
export type Zone =
  | 'TERMINAL_1'
  | 'TERMINAL_2'
  | 'PORTES_EMBARQUEMENT'
  | 'ZONE_DOUANES'
  | 'PARKING'
  | 'HALL_ARRIVEE'
  | 'HALL_DEPART'
  | 'ZONE_TRANSIT'
  | 'AUTRE';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type ReportStatus = 'pending' | 'resolved' | 'closed';

export interface ZoneOption {
  value: Zone;
  label: string;
}

export interface SubmitReportInput {
  zone: Zone;
  customZone?: string;
  incidentTime: string;
  description: string;
  attachments?: File[];
}

export interface BlockchainInfo {
  txHash: string;
  contentHash: string;
  blockNumber: number;
  explorerUrl: string;
}

export interface Report {
  id: number;
  zone: Zone;
  incidentTime: string;
  category: string;
  severity: Severity;
  analysis: string;
  anonymizedContent: string;
  attachments: string[];
  blockchain: BlockchainInfo;
  createdAt: string;
}

export interface ReportDetail extends Report {
  customZone: string | null;
  description: string;
  status: ReportStatus;
  resolvedBy?: number;
  resolvedAt?: string;
}

export interface ReportSummary {
  id: number;
  zone: Zone;
  customZone: string | null;
  incidentTime: string;
  category: string;
  severity: Severity;
  anonymizedContent: string;
  attachments: string[];
  blockchainTxHash: string;
  status: ReportStatus;
  createdAt: string;
}

// ============= Audit Types =============
export interface AuditLog {
  id: number;
  action: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  params: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  admin: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
  };
}

export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// ============= Response Types =============
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: any;
}

export interface ListResponse<T> extends ApiResponse<T[]> {
  count: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

// ============= Verification Types =============
export interface VerifyResult {
  reportId: number;
  integrityValid: boolean;
  storedHash: string;
  calculatedHash: string;
  blockchainTxHash: string;
  explorerUrl: string;
}
```

### Hooks typés

```typescript
// src/hooks/api.ts
import { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ApiError } from '@/types/api';

// Type helper pour les queries
export type QueryOptions<TData, TError = AxiosError<ApiError>> = Omit<
  UseQueryOptions<TData, TError>,
  'queryKey' | 'queryFn'
>;

// Type helper pour les mutations
export type MutationOptions<TData, TVariables, TError = AxiosError<ApiError>> = Omit<
  UseMutationOptions<TData, TError, TVariables>,
  'mutationFn'
>;

// Exemple d'utilisation
export function useAllReports(options?: QueryOptions<ListResponse<ReportSummary>>) {
  return useQuery({
    queryKey: ['reports', 'all'],
    queryFn: async () => {
      const response = await api.get<ListResponse<ReportSummary>>('/api/reports');
      return response.data;
    },
    ...options,
  });
}
```

---

## Résumé des Query Keys

Pour une gestion optimale du cache avec TanStack Query :

```typescript
// src/lib/queryKeys.ts
export const queryKeys = {
  // Auth
  currentUser: ['currentUser'] as const,
  
  // Reports
  reports: {
    all: ['reports', 'all'] as const,
    detail: (id: number) => ['report', id] as const,
    verify: (id: number) => ['verify', id] as const,
  },
  
  // Audit
  auditLogs: {
    list: (page: number, perPage: number) => ['auditLogs', page, perPage] as const,
    infinite: ['auditLogs', 'infinite'] as const,
  },
  
  // Zones
  zones: ['zones'] as const,
  
  // Health
  health: ['health'] as const,
} as const;

// Utilisation
export function useAllReports() {
  return useQuery({
    queryKey: queryKeys.reports.all,
    queryFn: fetchAllReports,
  });
}
```

---

## Notes importantes

### CORS et Cookies

Pour que les cookies fonctionnent correctement :

1. **Backend** : Configurer CORS avec `credentials: true`
2. **Frontend** : Utiliser `withCredentials: true` dans Axios
3. **Même domaine en production** : Frontend et backend sur le même domaine ou sous-domaines

### Sécurité

- Ne jamais stocker le token JWT dans localStorage
- Utiliser HTTPS en production
- Les cookies HTTP-only protègent contre les attaques XSS
- Valider toutes les entrées utilisateur côté frontend

### Performance

- Utiliser le prefetching pour les données fréquemment consultées
- Implémenter l'infinite scroll pour les longues listes
- Mettre en cache les données statiques (zones) indéfiniment
- Utiliser les optimistic updates pour une UX réactive

---

**Documentation complète ! Pour toute question, référez-vous aux exemples ci-dessus ou consultez la documentation officielle de TanStack Query : https://tanstack.com/query/latest**
