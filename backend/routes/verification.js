const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');

function construireReponse(record) {
  const now = new Date();
  const [d, m, y] = (record.data.dateExpiration || '').split('/');
  const expiration = y ? new Date(`${y}-${m}-${d}`) : null;
  const estExpire  = expiration ? expiration < now : false;
  const joursRestants = expiration ? Math.ceil((expiration - now) / (1000 * 60 * 60 * 24)) : null;
  const estRevoque = blockchainService.estRevoque(record.data.id);

  let statut = 'VALIDE';
  if (estRevoque) statut = 'RÉVOQUÉ';
  else if (estExpire) statut = 'EXPIRÉ';

  return {
    valide: statut === 'VALIDE',
    statut,
    documentId: record.data.id,
    type: record.data.type,
    titulaire: {
      nom: record.data.nom,
      prenoms: record.data.prenoms,
      dateNaissance: record.data.dateNaissance,
      nationalite: record.data.nationalite,
    },
    dateEmission: record.data.dateEmission,
    dateExpiration: record.data.dateExpiration,
    joursRestants,
    renouvellementDe: record.data.renouvellementDe || null,
    blockchain: {
      hash: record.hash,
      blockIndex: record.index,
      timestamp: record.timestamp,
      integrite: blockchainService.verifierIntegrite(record.hash),
    },
  };
}

// GET /api/verification/:id
router.get('/:id', (req, res) => {
  const record = blockchainService.verifier(req.params.id);
  if (!record) {
    return res.json({ valide: false, statut: 'INVALIDE', message: 'Aucun document trouvé avec cet identifiant.' });
  }
  res.json(construireReponse(record));
});

// GET /api/verification?id=...
router.get('/', (req, res) => {
  if (!req.query.id) return res.status(400).json({ error: 'Identifiant requis.' });
  const record = blockchainService.verifier(req.query.id);
  if (!record) {
    return res.json({ valide: false, statut: 'INVALIDE', message: 'Document introuvable.' });
  }
  res.json(construireReponse(record));
});

module.exports = router;
