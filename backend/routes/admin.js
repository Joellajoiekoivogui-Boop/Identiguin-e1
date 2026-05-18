const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const fs      = require('fs');
const path    = require('path');
const { requireAuth }    = require('../middleware/auth');
const blockchainService  = require('../services/blockchainService');
const auditService       = require('../services/auditService');

const ACTES_PATH = path.join(__dirname, '../data/actes_naissance.json');

function chargerActes() {
  if (!fs.existsSync(ACTES_PATH)) return [];
  return JSON.parse(fs.readFileSync(ACTES_PATH, 'utf8'));
}
function sauvegarderActes(actes) {
  fs.writeFileSync(ACTES_PATH, JSON.stringify(actes, null, 2));
}

// POST /api/admin/login — mode démo
router.post('/login', (req, res) => {
  const token = jwt.sign(
    { username: 'demo', role: 'admin' },
    process.env.JWT_SECRET || 'identiguinee_secret_jwt_2026_guinee',
    { expiresIn: '8h' }
  );
  auditService.logAction('ADMIN_LOGIN', { username: 'demo', ip: req.ip });
  res.json({ token, username: 'demo', expiresIn: '8h' });
});

// GET /api/admin/stats
router.get('/stats', requireAuth, (req, res) => {
  const chaine = blockchainService.obtenirChaine();
  const docs   = chaine.filter(b => b.data?.id && b.data?.nom);
  const parType = docs.reduce((acc, b) => { acc[b.data.type] = (acc[b.data.type]||0)+1; return acc; }, {});
  const parMois = docs.reduce((acc, b) => { const m = b.timestamp?.substring(0,7)||'?'; acc[m]=(acc[m]||0)+1; return acc; }, {});

  // Alertes expiration dans les 180 jours
  const auj = new Date();
  const expireBientot = docs.filter(b => {
    const [d,m,y] = (b.data.dateExpiration||'').split('/');
    if (!y) return false;
    const exp = new Date(`${y}-${m}-${d}`);
    const diff = (exp - auj) / (1000*60*60*24);
    return diff >= 0 && diff <= 180;
  }).length;

  res.json({
    totalDocuments: docs.length,
    totalBlocs: chaine.length,
    parType, parMois,
    expireBientot,
    dernierDocument: docs[docs.length-1]?.data || null,
  });
});

// GET /api/admin/documents
router.get('/documents', requireAuth, (req, res) => {
  const chaine = blockchainService.obtenirChaine();
  const auj    = new Date();
  const docs   = chaine
    .filter(b => b.data?.id && b.data?.nom)
    .map(b => {
      const [d,m,y] = (b.data.dateExpiration||'').split('/');
      const exp = y ? new Date(`${y}-${m}-${d}`) : null;
      const joursRestants = exp ? Math.ceil((exp - auj)/(1000*60*60*24)) : null;
      return {
        id: b.data.id, nom: b.data.nom, prenoms: b.data.prenoms,
        type: b.data.type, dateEmission: b.data.dateEmission,
        dateExpiration: b.data.dateExpiration,
        nationalite: b.data.nationalite, blockIndex: b.index, hash: b.hash,
        joursRestants,
        alerteExpiration: joursRestants !== null && joursRestants >= 0 && joursRestants <= 180,
      };
    });
  res.json(docs);
});

// GET /api/admin/export/csv
router.get('/export/csv', requireAuth, (req, res) => {
  const chaine = blockchainService.obtenirChaine();
  const docs   = chaine.filter(b => b.data?.id && b.data?.nom);
  const entetes = ['ID','Type','Nom','Prénoms','Date Naissance','Lieu Naissance','Sexe','Nationalité','Adresse','Profession','Situation Matrimoniale','Date Émission','Date Expiration','Block','Hash Blockchain'];
  const lignes  = docs.map(b => {
    const d = b.data;
    return [d.id,d.type,d.nom,d.prenoms,d.dateNaissance,d.lieuNaissance||'',d.sexe,d.nationalite,d.adresse||'',d.profession||'',d.situationMatrimoniale||'',d.dateEmission,d.dateExpiration,b.index,b.hash]
      .map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',');
  });
  auditService.logAction('EXPORT_CSV', { total: docs.length, ip: req.ip });
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition',`attachment; filename="identiguinee_export_${Date.now()}.csv"`);
  res.send('﻿' + [entetes.join(','),...lignes].join('\n'));
});

// POST /api/admin/revoquer/:id
router.post('/revoquer/:id', requireAuth, (req, res) => {
  const record = blockchainService.verifier(req.params.id);
  if (!record) return res.status(404).json({ error: 'Document introuvable.' });
  blockchainService.revoquer(req.params.id, req.admin.username);
  auditService.logAction('DOCUMENT_REVOQUE', { documentId: req.params.id, par: req.admin.username, ip: req.ip });
  res.json({ success: true, message: `Document ${req.params.id} révoqué.` });
});

// GET /api/admin/audit
router.get('/audit', requireAuth, (req, res) => {
  const limite = parseInt(req.query.limite) || 100;
  res.json(auditService.obtenirLogs(limite));
});

// ── CRUD Actes de naissance ──────────────────────────────────────────────────

// GET /api/admin/actes
router.get('/actes', requireAuth, (req, res) => {
  res.json(chargerActes());
});

// POST /api/admin/actes
router.post('/actes', requireAuth, (req, res) => {
  const { numero, nom, prenoms, dateNaissance, lieuNaissance, sexe } = req.body;
  if (!numero || !nom || !prenoms || !dateNaissance) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' });
  }
  const actes = chargerActes();
  if (actes.find(a => a.numero === numero.toUpperCase())) {
    return res.status(409).json({ error: 'Ce numéro d\'acte existe déjà.' });
  }
  const nouvelActe = {
    numero: numero.toUpperCase().trim(),
    nom: nom.toUpperCase().trim(),
    prenoms: prenoms.trim(),
    dateNaissance: dateNaissance.trim(),
    lieuNaissance: lieuNaissance?.trim() || '',
    sexe: sexe === 'F' ? 'F' : 'M',
  };
  actes.push(nouvelActe);
  sauvegarderActes(actes);
  auditService.logAction('ACTE_AJOUTE', { numero: nouvelActe.numero, par: req.admin.username });
  res.status(201).json({ success: true, acte: nouvelActe });
});

// PUT /api/admin/actes/:numero
router.put('/actes/:numero', requireAuth, (req, res) => {
  const actes = chargerActes();
  const idx   = actes.findIndex(a => a.numero === req.params.numero.toUpperCase());
  if (idx === -1) return res.status(404).json({ error: 'Acte introuvable.' });
  const { nom, prenoms, dateNaissance, lieuNaissance, sexe } = req.body;
  actes[idx] = { ...actes[idx], nom: nom?.toUpperCase()||actes[idx].nom, prenoms: prenoms||actes[idx].prenoms, dateNaissance: dateNaissance||actes[idx].dateNaissance, lieuNaissance: lieuNaissance||actes[idx].lieuNaissance, sexe: sexe||actes[idx].sexe };
  sauvegarderActes(actes);
  auditService.logAction('ACTE_MODIFIE', { numero: req.params.numero, par: req.admin.username });
  res.json({ success: true, acte: actes[idx] });
});

// DELETE /api/admin/actes/:numero
router.delete('/actes/:numero', requireAuth, (req, res) => {
  const actes  = chargerActes();
  const filtres = actes.filter(a => a.numero !== req.params.numero.toUpperCase());
  if (filtres.length === actes.length) return res.status(404).json({ error: 'Acte introuvable.' });
  sauvegarderActes(filtres);
  auditService.logAction('ACTE_SUPPRIME', { numero: req.params.numero, par: req.admin.username });
  res.json({ success: true });
});

module.exports = router;
