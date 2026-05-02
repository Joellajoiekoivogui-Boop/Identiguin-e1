const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../middleware/auth');
const blockchainService = require('../services/blockchainService');

// Mot de passe hashé au démarrage à partir de la variable d'environnement
let ADMIN_HASH = null;
(async () => {
  ADMIN_HASH = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'IdentiGuinee2026', 10);
})();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (
    username !== (process.env.ADMIN_USERNAME || 'admin') ||
    !(await bcrypt.compare(password, ADMIN_HASH))
  ) {
    return res.status(401).json({ error: 'Identifiants incorrects.' });
  }
  const token = jwt.sign(
    { username, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  res.json({ token, username, expiresIn: '8h' });
});

// GET /api/admin/stats — protégé
router.get('/stats', requireAuth, (req, res) => {
  const chaine = blockchainService.obtenirChaine();
  const docs = chaine.filter((b) => b.data?.id && b.data?.nom);

  const parType = docs.reduce((acc, b) => {
    acc[b.data.type] = (acc[b.data.type] || 0) + 1;
    return acc;
  }, {});

  const parMois = docs.reduce((acc, b) => {
    const mois = b.timestamp?.substring(0, 7) || 'inconnu';
    acc[mois] = (acc[mois] || 0) + 1;
    return acc;
  }, {});

  res.json({
    totalDocuments: docs.length,
    totalBlocs: chaine.length,
    parType,
    parMois,
    dernierDocument: docs[docs.length - 1]?.data || null,
  });
});

// GET /api/admin/documents — protégé
router.get('/documents', requireAuth, (req, res) => {
  const chaine = blockchainService.obtenirChaine();
  const docs = chaine
    .filter((b) => b.data?.id && b.data?.nom)
    .map((b) => ({
      id: b.data.id,
      nom: b.data.nom,
      prenoms: b.data.prenoms,
      type: b.data.type,
      dateEmission: b.data.dateEmission,
      dateExpiration: b.data.dateExpiration,
      nationalite: b.data.nationalite,
      blockIndex: b.index,
      hash: b.hash,
    }));
  res.json(docs);
});

// GET /api/admin/export/csv — protégé
router.get('/export/csv', requireAuth, (req, res) => {
  const chaine = blockchainService.obtenirChaine();
  const docs = chaine.filter((b) => b.data?.id && b.data?.nom);

  const entetes = [
    'ID', 'Type', 'Nom', 'Prénoms', 'Date Naissance', 'Lieu Naissance',
    'Sexe', 'Nationalité', 'Adresse', 'Profession', 'Situation Matrimoniale',
    'Date Émission', 'Date Expiration', 'Block', 'Hash Blockchain',
  ];

  const lignes = docs.map((b) => {
    const d = b.data;
    return [
      d.id, d.type, d.nom, d.prenoms, d.dateNaissance, d.lieuNaissance || '',
      d.sexe, d.nationalite, d.adresse || '', d.profession || '',
      d.situationMatrimoniale || '', d.dateEmission, d.dateExpiration,
      b.index, b.hash,
    ].map((v) => `"${String(v || '').replace(/"/g, '""')}"`).join(',');
  });

  const csv = [entetes.join(','), ...lignes].join('\n');
  const bom = '﻿'; // BOM pour Excel

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="identiguinee_export_${Date.now()}.csv"`);
  res.send(bom + csv);
});

// POST /api/admin/revoquer/:id — protégé
router.post('/revoquer/:id', requireAuth, (req, res) => {
  const record = blockchainService.verifier(req.params.id);
  if (!record) return res.status(404).json({ error: 'Document introuvable.' });
  blockchainService.revoquer(req.params.id, req.admin.username);
  res.json({ success: true, message: `Document ${req.params.id} révoqué.` });
});

module.exports = router;
