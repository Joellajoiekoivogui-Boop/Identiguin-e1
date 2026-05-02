const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const blockchainService = require('../services/blockchainService');
const pdfGenerator = require('../services/pdfGenerator');
const qrcodeService = require('../services/qrcodeService');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/renouvellement/:id — vérifier éligibilité
router.get('/:id', (req, res) => {
  const record = blockchainService.verifier(req.params.id);
  if (!record) return res.status(404).json({ error: 'Document introuvable.' });

  const expiration = new Date(record.data.dateExpiration.split('/').reverse().join('-'));
  const maintenant = new Date();
  const joursRestants = Math.floor((expiration - maintenant) / (1000 * 60 * 60 * 24));

  res.json({
    eligible: joursRestants <= 180, // éligible si < 6 mois avant expiration
    joursRestants,
    documentActuel: {
      id: record.data.id,
      nom: record.data.nom,
      prenoms: record.data.prenoms,
      type: record.data.type,
      dateExpiration: record.data.dateExpiration,
    },
  });
});

// POST /api/renouvellement/:id — procéder au renouvellement
router.post('/:id', upload.single('photo'), async (req, res) => {
  const ancienRecord = blockchainService.verifier(req.params.id);
  if (!ancienRecord) return res.status(404).json({ error: 'Document original introuvable.' });

  try {
    const ancienData = ancienRecord.data;
    const annee = new Date().getFullYear();
    const suffixe = Math.random().toString(36).substring(2, 8).toUpperCase();
    const nouvelId = `GN-${annee}-${suffixe}`;

    const photoPath = req.file ? req.file.path : null;
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verification?id=${nouvelId}`;
    const qrCodeDataUrl = await qrcodeService.generate(verificationUrl);

    const nouvellesDonnees = {
      ...ancienData,
      id: nouvelId,
      adresse: req.body.adresse || ancienData.adresse,
      profession: req.body.profession || ancienData.profession,
      photoPath: photoPath || ancienData.photoPath,
      dateEmission: new Date().toLocaleDateString('fr-FR'),
      dateExpiration: new Date(
        new Date().setFullYear(new Date().getFullYear() + (ancienData.type === 'passeport' ? 5 : 10))
      ).toLocaleDateString('fr-FR'),
      verificationUrl,
      qrCodeDataUrl,
      renouvellementDe: ancienData.id,
    };

    const blockRecord = await blockchainService.enregistrer(nouvellesDonnees);
    nouvellesDonnees.hashBlockchain = blockRecord.hash;
    nouvellesDonnees.blockIndex = blockRecord.index;

    const pdfBuffer = await pdfGenerator.generer(nouvellesDonnees);
    const pdfDir = path.join(__dirname, '../pdfs');
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
    fs.writeFileSync(path.join(pdfDir, `${nouvelId}.pdf`), pdfBuffer);

    blockchainService.revoquer(ancienData.id, 'SYSTEM_RENEWAL');

    res.json({
      success: true,
      ancienId: ancienData.id,
      nouvelId,
      hashBlockchain: blockRecord.hash,
      blockIndex: blockRecord.index,
      pdfUrl: `/api/documents/pdf/${nouvelId}`,
    });
  } catch (err) {
    console.error('Erreur renouvellement:', err);
    res.status(500).json({ error: 'Erreur lors du renouvellement.' });
  }
});

module.exports = router;
