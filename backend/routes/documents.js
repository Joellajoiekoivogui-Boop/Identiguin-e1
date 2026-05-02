const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const pdfGenerator = require('../services/pdfGenerator');
const blockchainService = require('../services/blockchainService');
const qrcodeService = require('../services/qrcodeService');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/documents/create
router.post('/create', upload.single('photo'), async (req, res) => {
  try {
    const {
      type, nom, prenoms, dateNaissance, lieuNaissance, sexe,
      nationalite, adresse, profession, situationMatrimoniale, email,
    } = req.body;

    if (!nom || !prenoms || !dateNaissance || !type) {
      return res.status(400).json({ error: 'Champs obligatoires manquants.' });
    }

    const year = new Date().getFullYear();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const documentId = `GN-${year}-${randomSuffix}`;

    const photoPath = req.file ? req.file.path : null;

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verification?id=${documentId}`;
    const qrCodeDataUrl = await qrcodeService.generate(verificationUrl);

    const documentData = {
      id: documentId,
      type,
      nom,
      prenoms,
      dateNaissance,
      lieuNaissance,
      sexe,
      nationalite: nationalite || 'Guinéenne',
      adresse,
      profession,
      situationMatrimoniale,
      email,
      dateEmission: new Date().toLocaleDateString('fr-FR'),
      dateExpiration: new Date(
        new Date().setFullYear(new Date().getFullYear() + (type === 'passeport' ? 5 : 10))
      ).toLocaleDateString('fr-FR'),
      photoPath,
      verificationUrl,
      qrCodeDataUrl,
    };

    const blockchainRecord = await blockchainService.enregistrer(documentData);
    documentData.hashBlockchain = blockchainRecord.hash;
    documentData.blockIndex = blockchainRecord.index;

    const pdfBuffer = await pdfGenerator.generer(documentData);

    const pdfDir = path.join(__dirname, '../pdfs');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    const pdfPath = path.join(pdfDir, `${documentId}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);

    res.json({
      success: true,
      documentId,
      hashBlockchain: blockchainRecord.hash,
      blockIndex: blockchainRecord.index,
      pdfUrl: `/api/documents/pdf/${documentId}`,
      message: 'Document généré et ancré sur la blockchain avec succès.',
    });
  } catch (err) {
    console.error('Erreur création document:', err);
    res.status(500).json({ error: 'Erreur interne lors de la génération du document.' });
  }
});

// GET /api/documents/pdf/:id
router.get('/pdf/:id', (req, res) => {
  const pdfPath = path.join(__dirname, '../pdfs', `${req.params.id}.pdf`);
  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: 'Document introuvable.' });
  }
  const pdfData = fs.readFileSync(pdfPath);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.id}.pdf"`);
  res.setHeader('Content-Length', pdfData.length);
  res.setHeader('Cache-Control', 'no-cache');
  res.end(pdfData);
});

// GET /api/documents/chain — pour le dashboard
router.get('/chain', (req, res) => {
  const chain = blockchainService.obtenirChaine();
  res.json(chain);
});

module.exports = router;
