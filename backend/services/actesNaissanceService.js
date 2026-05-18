const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/actes_naissance.json');

function charger() {
  if (!fs.existsSync(DB_PATH)) return [];
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function normaliser(str) {
  return (str || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

function chercher(numero) {
  const actes = charger();
  return actes.find(a => a.numero === numero.toUpperCase().trim()) || null;
}

function verifier(numero, donnees) {
  const acte = chercher(numero);
  if (!acte) {
    return { valide: false, raison: "Numéro d'acte de naissance introuvable dans le registre civil." };
  }

  const erreurs = [];
  if (normaliser(donnees.nom) !== normaliser(acte.nom))             erreurs.push('Nom de famille');
  if (normaliser(donnees.prenoms) !== normaliser(acte.prenoms))     erreurs.push('Prénom(s)');
  if ((donnees.dateNaissance || '') !== acte.dateNaissance)         erreurs.push('Date de naissance');
  if (normaliser(donnees.lieuNaissance) !== normaliser(acte.lieuNaissance)) erreurs.push('Lieu de naissance');
  if ((donnees.sexe || '').toUpperCase() !== acte.sexe.toUpperCase()) erreurs.push('Sexe');

  if (erreurs.length > 0) {
    return {
      valide: false,
      raison: `Les données suivantes ne correspondent pas à l'acte de naissance enregistré : ${erreurs.join(', ')}. La demande de document est refusée.`,
    };
  }

  return { valide: true, acte };
}

module.exports = { chercher, verifier };
