const express = require('express');
const router  = express.Router();
const blockchainService     = require('../services/blockchainService');
const actesNaissanceService = require('../services/actesNaissanceService');

// POST /api/citoyen/mes-documents
// Body: { numeroActe }
router.post('/mes-documents', (req, res) => {
  const { numeroActe } = req.body;
  if (!numeroActe) return res.status(400).json({ error: 'Numéro d\'acte requis.' });

  const acte = actesNaissanceService.chercher(numeroActe);
  if (!acte) return res.status(404).json({ error: 'Acte de naissance introuvable.' });

  const chaine = blockchainService.obtenirChaine();
  const auj    = new Date();

  const docs = chaine
    .filter(b => b.data?.id && b.data?.nom &&
      b.data.numeroActeNaissance === acte.numero)
    .map(b => {
      const [d,m,y] = (b.data.dateExpiration||'').split('/');
      const exp = y ? new Date(`${y}-${m}-${d}`) : null;
      const joursRestants = exp ? Math.ceil((exp - auj)/(1000*60*60*24)) : null;
      const revoque = blockchainService.estRevoque?.(b.data.id) || false;
      return {
        id:             b.data.id,
        type:           b.data.type,
        dateEmission:   b.data.dateEmission,
        dateExpiration: b.data.dateExpiration,
        hashBlockchain: b.hash,
        blockIndex:     b.index,
        joursRestants,
        statut: revoque ? 'RÉVOQUÉ' : (joursRestants !== null && joursRestants < 0) ? 'EXPIRÉ' : 'VALIDE',
        pdfUrl: `/api/documents/pdf/${b.data.id}`,
      };
    });

  res.json({
    titulaire: {
      nom:           acte.nom,
      prenoms:       acte.prenoms,
      dateNaissance: acte.dateNaissance,
      lieuNaissance: acte.lieuNaissance,
    },
    documents: docs,
    total: docs.length,
  });
});

module.exports = router;
