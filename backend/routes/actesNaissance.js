const express = require('express');
const router = express.Router();
const actesNaissanceService = require('../services/actesNaissanceService');

// GET /api/actes-naissance/:numero
router.get('/:numero', (req, res) => {
  const acte = actesNaissanceService.chercher(req.params.numero);
  if (!acte) {
    return res.status(404).json({ error: "Numéro d'acte de naissance introuvable dans le registre civil." });
  }
  res.json({
    existe: true,
    numero: acte.numero,
    nom: acte.nom,
    prenoms: acte.prenoms,
    dateNaissance: acte.dateNaissance,
    lieuNaissance: acte.lieuNaissance,
    sexe: acte.sexe,
  });
});

module.exports = router;
