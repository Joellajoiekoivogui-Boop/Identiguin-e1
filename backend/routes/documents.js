const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');

const pdfGenerator           = require('../services/pdfGenerator');
const blockchainService      = require('../services/blockchainService');
const qrcodeService          = require('../services/qrcodeService');
const actesNaissanceService  = require('../services/actesNaissanceService');
const auditService           = require('../services/auditService');
const emailService           = require('../services/emailService');
const downloadTokenService   = require('../services/downloadTokenService');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/png','image/webp','image/gif'].includes(file.mimetype);
    if (!ok) return cb(new Error('Format non supporté. Utilisez JPG, PNG ou WEBP.'));
    cb(null, true);
  },
});

function sanitiser(str, maxLen = 100) {
  if (!str) return '';
  return String(str).trim().substring(0, maxLen).replace(/[<>]/g, '');
}

function validerMagicBytes(filePath) {
  const buf = Buffer.alloc(8);
  const fd  = fs.openSync(filePath, 'r');
  fs.readSync(fd, buf, 0, 8, 0);
  fs.closeSync(fd);
  const isJPEG = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
  const isPNG  = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
  const isWEBP = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46;
  const isGIF  = buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46;
  return isJPEG || isPNG || isWEBP || isGIF;
}

// POST /api/documents/create
router.post('/create', upload.single('photo'), async (req, res) => {
  try {
    const {
      type, nom, prenoms, dateNaissance, lieuNaissance, sexe,
      nationalite, adresse, profession, situationMatrimoniale, email,
      taille, couleurYeux, lieuDelivrance, numeroActeNaissance
    } = req.body;

    if (!nom || !prenoms || !dateNaissance || !type) {
      return res.status(400).json({ error: 'Champs obligatoires manquants.' });
    }
    if (!numeroActeNaissance) {
      return res.status(400).json({ error: "Le numéro d'acte de naissance est obligatoire." });
    }

    // Vérification acte de naissance
    const verification = actesNaissanceService.verifier(numeroActeNaissance, { nom, prenoms, dateNaissance, lieuNaissance, sexe });
    if (!verification.valide) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(422).json({ error: verification.raison });
    }

    // Validation magic bytes photo
    if (req.file) {
      if (!validerMagicBytes(req.file.path)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Fichier image invalide ou corrompu.' });
      }
    }

    const year         = new Date().getFullYear();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const documentId   = `GN-${year}-${randomSuffix}`;
    const photoPath    = req.file ? req.file.path : null;

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verification?id=${documentId}`;
    const qrCodeDataUrl   = await qrcodeService.generate(verificationUrl);

    const documentData = {
      id: documentId, type,
      nom:                    sanitiser(nom, 50),
      prenoms:                sanitiser(prenoms, 80),
      dateNaissance,
      lieuNaissance:          sanitiser(lieuNaissance, 80),
      sexe:                   sexe === 'M' ? 'M' : 'F',
      nationalite:            sanitiser(nationalite || 'Guinéenne', 50),
      adresse:                sanitiser(adresse, 200),
      profession:             sanitiser(profession, 80),
      situationMatrimoniale:  sanitiser(situationMatrimoniale, 30),
      email:                  sanitiser(email, 100),
      taille:                 sanitiser(taille, 20),
      couleurYeux:            sanitiser(couleurYeux, 20),
      lieuDelivrance:         sanitiser(lieuDelivrance, 80),
      numeroActeNaissance:    sanitiser(numeroActeNaissance, 30),
      dateEmission:  new Date().toLocaleDateString('fr-FR'),
      dateExpiration: new Date(new Date().setFullYear(new Date().getFullYear() + (type === 'passeport' ? 5 : 10))).toLocaleDateString('fr-FR'),
      photoPath, verificationUrl, qrCodeDataUrl,
    };

    const blockchainRecord    = await blockchainService.enregistrer(documentData);
    documentData.hashBlockchain = blockchainRecord.hash;
    documentData.blockIndex     = blockchainRecord.index;

    const pdfBuffer = await pdfGenerator.generer(documentData);
    const pdfDir    = path.join(__dirname, '../pdfs');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    fs.writeFileSync(path.join(pdfDir, `${documentId}.pdf`), pdfBuffer);

    // Token de téléchargement sécurisé (1h)
    const downloadToken = downloadTokenService.genererToken(documentId);

    // Audit
    auditService.logAction('DOCUMENT_CREE', {
      documentId, type, nom: documentData.nom, prenoms: documentData.prenoms,
      ip: req.ip, acte: numeroActeNaissance,
    });

    // Email de confirmation (silencieux si non configuré)
    emailService.envoyerConfirmationDocument(documentData).catch(() => {});

    res.json({
      success:         true,
      documentId,
      hashBlockchain:  blockchainRecord.hash,
      blockIndex:      blockchainRecord.index,
      pdfUrl:          `/api/documents/pdf/${documentId}`,
      downloadToken,
      secureUrl:       `/api/documents/download/${downloadToken}`,
      message:         'Document généré et ancré sur la blockchain avec succès.',
    });
  } catch (err) {
    console.error('Erreur création document:', err);
    res.status(500).json({ error: 'Erreur interne lors de la génération du document.' });
  }
});

// GET /api/documents/download/:token — téléchargement sécurisé (token valide 1h)
router.get('/download/:token', (req, res) => {
  const documentId = downloadTokenService.validerToken(req.params.token);
  if (!documentId) {
    return res.status(410).json({ error: 'Lien de téléchargement expiré ou invalide.' });
  }
  const pdfPath = path.join(__dirname, '../pdfs', `${documentId}.pdf`);
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'Document introuvable.' });
  }
  auditService.logAction('DOCUMENT_TELECHARGE', { documentId, ip: req.ip, methode: 'token' });
  const pdfData = fs.readFileSync(pdfPath);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${documentId}.pdf"`);
  res.setHeader('Content-Length', pdfData.length);
  res.setHeader('Cache-Control', 'no-cache');
  res.end(pdfData);
});

// GET /api/documents/pdf/:id — téléchargement direct
router.get('/pdf/:id', (req, res) => {
  const pdfPath = path.join(__dirname, '../pdfs', `${req.params.id}.pdf`);
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'Document introuvable.' });
  }
  auditService.logAction('DOCUMENT_TELECHARGE', { documentId: req.params.id, ip: req.ip, methode: 'direct' });
  const pdfData = fs.readFileSync(pdfPath);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.id}.pdf"`);
  res.setHeader('Content-Length', pdfData.length);
  res.setHeader('Cache-Control', 'no-cache');
  res.end(pdfData);
});

// GET /api/documents/chain
router.get('/chain', (req, res) => {
  res.json(blockchainService.obtenirChaine());
});

// GET /api/documents/snapshot — données minimales pour vérification hors ligne
router.get('/snapshot', (req, res) => {
  const chaine = blockchainService.obtenirChaine();
  const now = new Date();
  const snapshot = chaine
    .filter(b => b.data?.id && b.data?.nom)
    .map(b => {
      const [d, m, y] = (b.data.dateExpiration || '').split('/');
      const exp = y ? new Date(`${y}-${m}-${d}`) : null;
      const joursRestants = exp ? Math.ceil((exp - now) / (1000 * 60 * 60 * 24)) : null;
      const revoque = blockchainService.estRevoque?.(b.data.id) || false;
      const statut = revoque ? 'RÉVOQUÉ' : (joursRestants !== null && joursRestants < 0 ? 'EXPIRÉ' : 'VALIDE');
      return {
        id:             b.data.id,
        type:           b.data.type,
        nom:            b.data.nom,
        prenoms:        b.data.prenoms,
        dateNaissance:  b.data.dateNaissance,
        nationalite:    b.data.nationalite || 'Guinéenne',
        dateEmission:   b.data.dateEmission,
        dateExpiration: b.data.dateExpiration,
        statut,
        joursRestants,
        hash:           b.hash,
        blockIndex:     b.index,
        timestamp:      b.timestamp,
      };
    });
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json({ snapshot, syncedAt: new Date().toISOString(), total: snapshot.length });
});

module.exports = router;
