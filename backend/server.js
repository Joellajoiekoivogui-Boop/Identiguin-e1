const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const documentsRoutes = require('./routes/documents');
const verificationRoutes = require('./routes/verification');
const adminRoutes = require('./routes/admin');
const renouvellementRoutes = require('./routes/renouvellement');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    // Accepter les domaines Vercel et les origines connues
    if (!origin || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
      cb(null, true);
    } else {
      cb(null, true); // API publique — on accepte toutes les origines
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/documents', documentsRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/renouvellement', renouvellementRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', platform: 'IdentiGuinée API', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`IdentiGuinée API démarrée sur http://localhost:${PORT}`);
});
