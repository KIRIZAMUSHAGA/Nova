# Plan d'Implémentation - Système d'Authentification Nova

## 📋 Vue d'ensemble
Intégration d'un système d'authentification complet (signup/login/JWT) à Nova, en préservant les fonctionnalités existantes (threads, messages, OpenAI).

---

## 🗂️ ÉTAPE 1 ✅ STRUCTURATION (Actuellement en cours)

### Collections MongoDB à créer/modifier

```
users
├── _id: ObjectId
├── email: string (unique, indexed)
├── passwordHash: string (bcrypt)
├── createdAt: Date
├── plan: string ("free" par défaut)
└── quotaUsed: number

threads (modification)
├── _id: ObjectId
├── userId: ObjectId (référence users)
├── title: string
├── createdAt: Date
└── updatedAt: Date

messages (pas de modification)
├── _id: ObjectId
├── threadId: ObjectId
├── role: string ("user" | "assistant")
├── content: string
└── createdAt: Date
```

---

## 🔧 ÉTAPE 2: Backend Auth (À faire après validation)

### Fichiers à créer/modifier:

**1. `server/auth.ts` (NOUVEAU)**
- Configuration JWT (secret, expiration)
- Fonction `generateToken(userId)`
- Fonction `verifyToken(token)`
- Fonction `hashPassword(password)`
- Fonction `comparePassword(password, hash)`

**2. `server/auth-middleware.ts` (NOUVEAU)**
- Middleware Express pour vérifier JWT
- Extraction du token depuis header `Authorization: Bearer <token>`
- Injection de `req.user` avec userId
- Gestion d'erreurs (token expiré, invalide, manquant)

**3. `shared/auth-schema.ts` (NOUVEAU)**
```typescript
// Zod schemas pour validation
- signupSchema
- loginSchema
- userSchema
```

**4. `server/routes.ts` (MODIFICATION)**
Ajouter endpoints:
- `POST /api/auth/signup` → CreateUserHandler
- `POST /api/auth/login` → LoginHandler
- `GET /api/auth/me` → GetCurrentUserHandler (protégé)
- `POST /api/auth/logout` → LogoutHandler

Modifier endpoints existants:
- `POST /api/threads` → Ajouter `authMiddleware`, utiliser `req.user.id`
- `GET /api/threads` → Ajouter `authMiddleware`, filtrer par userId
- `POST /api/messages` → Ajouter `authMiddleware`

**5. `server/storage.ts` (MODIFICATION)**
Ajouter méthodes:
```typescript
// Users
- createUser(email, passwordHash): Promise<User>
- getUserByEmail(email): Promise<User | null>
- getUserById(id): Promise<User | null>

// Threads (modifier pour userId)
- getThreadsByUserId(userId): Promise<Thread[]>
- createThread(userId, title): Promise<Thread>

// Messages
- getMessagesByThreadId(threadId): Promise<Message[]>
- createMessage(threadId, role, content): Promise<Message>
```

---

## 🎨 ÉTAPE 3: Frontend Auth Pages (À faire après étape 2)

### Pages à créer:

**1. `client/src/pages/WelcomePage.tsx` (NOUVEAU)**
- Logo Nova
- Titre: "Nova AI - Assistant Intelligent"
- Boutons: "Se connecter" | "Créer un compte"
- Styleark mode, couleurs Nova (violet/noir)

**2. `client/src/pages/SignupPage.tsx` (NOUVEAU)**
- Form avec champs: email, password, confirmPassword
- Validation côté client (Zod)
- Appel API POST /api/auth/signup
- Loader pendant requête
- Erreur / succès messages
- Lien vers login

**3. `client/src/pages/LoginPage.tsx` (NOUVEAU)**
- Form avec champs: email, password
- Validation côté client
- Appel API POST /api/auth/login
- Stockage JWT dans localStorage
- Redirection vers HomePage après succès
- Lien vers signup

### Modifications:

**4. `client/src/App.tsx` (MODIFICATION)**
- Ajouter routes pour Welcome, Signup, Login
- Créer `PrivateRoute` component (protège pages nécessitant auth)
- Vérifier JWT au démarrage (`GET /api/auth/me`)
- Redirection vers WelcomePage si pas authentifié

**5. `client/src/lib/queryClient.ts` (MODIFICATION)**
- Ajouter JWT dans les headers par défaut
- Intercepter erreurs 401 → logout + redirection

**6. `client/src/hooks/use-auth.ts` (NOUVEAU)**
- Hook personnalisé pour gérer auth
- `useLogin(email, password)`
- `useSignup(email, password, confirmPassword)`
- `useLogout()`
- `useCurrentUser()`

---

## 🔗 ÉTAPE 4: Intégration avec Nova (À faire après étape 3)

### Modifications existantes:

**1. HomePage.tsx**
- Ajouter bouton logout en haut
- Afficher email utilisateur
- Threads filtrés par userId (backend déjà fait)

**2. ThreadPage.tsx**
- Confirmer que messages sont liés au bon thread/user
- Conversation stays private

**3. API calls existants**
- Tous les endpoints chat/threads/messages nécessitent maintenant auth
- Logique métier: un user ne voit que ses propres threads

---

## 🔒 ÉTAPE 5: Tests & Stabilité (À faire après étape 4)

### Vérifications:

- [ ] Signup avec email déjà existant → erreur claire
- [ ] Login avec credentials invalides → erreur claire
- [ ] Token expiré → logout automatique + redirection login
- [ ] Accès sans token → redirection welcome
- [ ] Créer thread sans auth → 401 Unauthorized
- [ ] Voir thread d'un autre user → 403 Forbidden (optionnel sécurité avancée)

### Sécurité:

- [ ] Pas de password en logs/erreurs
- [ ] Variables sensibles en env (JWT_SECRET, MONGODB_URI)
- [ ] HTTPS en production (Replit handles)
- [ ] CORS correctement configuré

---

## 📦 Dépendances nécessaires (à installer si manquantes)

```json
{
  "dependencies": {
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "mongodb": "^5.0.0",
    "dotenv": "^16.0.0"
  }
}
```

Status: Vérifier `package.json` avant l'étape 2.

---

## 🚀 Variables d'environnement (Secrets Replit)

À configurer:
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/nova
JWT_SECRET=super_secret_key_128_chars_min
JWT_EXPIRY=7d
NODE_ENV=development|production
```

---

## ✅ Checklist Finale

- [x] Étape 1: Plan structuré
- [ ] Étape 2: Backend auth implémenté + testé
- [ ] Étape 3: Pages UI créées + formulaires validés
- [ ] Étape 4: Intégration Nova complète
- [ ] Étape 5: Tests manuels + stabilité vérifiée

---

## 🎯 Flux Utilisateur Final

```
1. Nouveau user → Welcome → Signup (créer compte)
2. User → Login (enter app)
3. HomePage (voir threads personnels)
4. Créer/ouvrir thread → chat avec Nova
5. Chaque message lié au thread → lié au user
6. Logout possible à tout moment
```

---

## 📝 Notes Importantes

- **MongoDB** remplace Drizzle/PostgreSQL pour la persistence (users, threads, messages)
- **JWT** stocké côté client (localStorage) + envoyé en header Authorization
- **Sécurité**: Aucun password en clair, bcrypt + salts
- **Erreurs**: Messages clairs mais pas verbeux (pas de stack traces côté client)
- **UX**: Dark mode, smooth transitions, loaders pendant requêtes
- **Production**: Compatible Replit Preview + Publishing

