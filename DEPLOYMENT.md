# 🚀 DÉPLOIEMENT COMPLET - IdentiGuinée

## ✅ ÉTAPE 1: BACKEND (Railway)

**LIEN DIRECT:** https://railway.app/new?repo=https://github.com/Joellajoiekoivogui-Boop/Identiguin-e1

### Instructions:
1. **Clique le lien ci-dessus**
2. **Connecte-toi avec GitHub** (si demandé)
3. **Clique "Deploy"**
4. **Attends 2-3 minutes**
5. **Copie l'URL générée** (ex: `https://identiguin-e1-production.railway.app`)

### Variables d'environnement à ajouter:
Dans Railway Dashboard → Variables:
- `JWT_SECRET` = `identiguinee_jwt_secret_2024_secure_key`
- `FRONTEND_URL` = URL du frontend Vercel (à ajouter après)

---

## ✅ ÉTAPE 2: FRONTEND (Vercel)

**LIEN DIRECT:** https://vercel.com/new?repo=https://github.com/Joellajoiekoivogui-Boop/Identiguin-e1

### Instructions:
1. **Clique le lien ci-dessus**
2. **Connecte-toi avec GitHub** (si demandé)
3. **Configure le projet:**
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js
4. **Ajoute les variables d'environnement:**
   - `NEXT_PUBLIC_API_URL` = URL du backend Railway (ex: `https://identiguin-e1-production.railway.app`)
5. **Clique "Deploy"**
6. **Attends 1-2 minutes**

---

## ✅ ÉTAPE 3: FINALISATION

1. **Retourne sur Railway**
2. **Ajoute la variable:** `FRONTEND_URL` = URL Vercel (ex: `https://identiguin-e1.vercel.app`)

---

## 🎯 RÉSULTAT FINAL

**Frontend:** `https://identiguin-e1.vercel.app`
**Backend:** `https://identiguin-e1-production.railway.app`

**Test:** Va sur le frontend et vérifie que l'API fonctionne!

---

## 🔧 SI PROBLÈMES

- **Railway:** Vérifie que ton repo est public
- **Vercel:** Assure-toi que le dossier `frontend` est bien sélectionné
- **Variables:** Les variables sont sensibles à la casse

**Besoin d'aide?** Dis-moi à quelle étape tu bloques!
