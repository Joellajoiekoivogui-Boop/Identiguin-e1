# Guide de Déploiement - IdentiGuinée

## Backend sur Railway

### Option 1 : Déploiement en 1 clic (Recommandé)
[🚀 Déployer sur Railway](https://railway.app/new?repo=https://github.com/Joellajoiekoivogui-Boop/Identiguin-e1&plugins=postgresql)

### Option 2 : Déploiement manuel
1. Accède à https://railway.app
2. Clique "New Project"
3. Sélectionne "Deploy from GitHub"
4. Choisis le repository `Identiguin-e1`
5. Railway détectera automatiquement `railway.json`
6. Ajoute les variables d'environnement dans Railway Dashboard:
   - `JWT_SECRET` = ta clé secrète
   - `FRONTEND_URL` = URL du frontend Vercel
7. Déploie

### Récupérer l'URL du backend
Après le déploiement, Railway génère une URL publique (ex: `https://identiguinee-production.railway.app`)

---

## Frontend sur Vercel

1. Accède à https://vercel.com
2. Clique "New Project"
3. Importe le repository GitHub `Identiguin-e1`
4. Configure le dossier root → `frontend`
5. Ajoute la variable d'environnement:
   - `NEXT_PUBLIC_API_URL` = l'URL du backend Railway
6. Déploie

---

## Après le déploiement

Mets à jour le backend avec l'URL du frontend:
- Variable Railway: `FRONTEND_URL` = URL Vercel du frontend

---

## Vérification

- Backend: `https://your-railway-url/api/health`
- Frontend: `https://your-vercel-url`
