const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const documentsRoutes      = require('./routes/documents');
const verificationRoutes   = require('./routes/verification');
const adminRoutes          = require('./routes/admin');
const renouvellementRoutes = require('./routes/renouvellement');
const actesNaissanceRoutes = require('./routes/actesNaissance');
const citoyenRoutes        = require('./routes/citoyen');

const app  = express();
const PORT = process.env.PORT || 5005;

// ── Sécurité HTTP headers ──
app.use(helmet({ contentSecurityPolicy: false }));

// ── CORS ──
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || /localhost/.test(origin) || /\.vercel\.app$/.test(origin)) cb(null, true);
    else cb(null, true);
  },
  credentials: true,
}));

// ── Rate limiting ──
const limiteurGeneral = rateLimit({ windowMs: 15*60*1000, max: 200, message: { error: 'Trop de requêtes. Réessayez dans 15 minutes.' } });
const limiteurCreation = rateLimit({ windowMs: 15*60*1000, max: 20, message: { error: 'Limite de création atteinte. Réessayez dans 15 minutes.' } });
const limiteurAdmin = rateLimit({ windowMs: 15*60*1000, max: 50, message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' } });

app.use(limiteurGeneral);
app.use('/api/documents/create', limiteurCreation);
app.use('/api/admin/login', limiteurAdmin);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/documents',      documentsRoutes);
app.use('/api/verification',   verificationRoutes);
app.use('/api/admin',          adminRoutes);
app.use('/api/renouvellement', renouvellementRoutes);
app.use('/api/actes-naissance',actesNaissanceRoutes);
app.use('/api/citoyen',        citoyenRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', platform: 'IdentiGuinée API', version: '2.0.0' });
});

app.listen(PORT, () => {
  console.log(`IdentiGuinée API v2 démarrée sur http://localhost:${PORT}`);
});
