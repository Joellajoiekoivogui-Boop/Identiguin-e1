const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CHAIN_FILE = path.join(__dirname, '../data/blockchain.json');

function chargerChaine() {
  if (!fs.existsSync(CHAIN_FILE)) {
    const genesis = {
      index: 0,
      timestamp: new Date().toISOString(),
      data: { type: 'GENESIS', message: 'IdentiGuinée Blockchain — Bloc Genesis' },
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      hash: '',
    };
    genesis.hash = calculerHash(genesis);
    const chain = [genesis];
    sauvegarderChaine(chain);
    return chain;
  }
  try {
    return JSON.parse(fs.readFileSync(CHAIN_FILE, 'utf-8'));
  } catch {
    return chargerChaine();
  }
}

function sauvegarderChaine(chain) {
  const dir = path.dirname(CHAIN_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CHAIN_FILE, JSON.stringify(chain, null, 2));
}

function calculerHash(bloc) {
  const contenu = JSON.stringify({
    index: bloc.index,
    timestamp: bloc.timestamp,
    data: bloc.data,
    previousHash: bloc.previousHash,
  });
  return crypto.createHash('sha256').update(contenu).digest('hex');
}

function enregistrer(documentData) {
  const chain = chargerChaine();
  const dernierBloc = chain[chain.length - 1];

  // Données sans le chemin de la photo (sensible)
  const donneesSanitisees = { ...documentData };
  delete donneesSanitisees.photoPath;
  delete donneesSanitisees.qrCodeDataUrl;

  const nouveauBloc = {
    index: dernierBloc.index + 1,
    timestamp: new Date().toISOString(),
    data: donneesSanitisees,
    previousHash: dernierBloc.hash,
    hash: '',
  };
  nouveauBloc.hash = calculerHash(nouveauBloc);

  chain.push(nouveauBloc);
  sauvegarderChaine(chain);

  return { hash: nouveauBloc.hash, index: nouveauBloc.index, timestamp: nouveauBloc.timestamp };
}

function verifier(documentId) {
  const chain = chargerChaine();
  const bloc = chain.find((b) => b.data && b.data.id === documentId);
  return bloc || null;
}

function verifierIntegrite(hash) {
  const chain = chargerChaine();
  const bloc = chain.find((b) => b.hash === hash);
  if (!bloc) return false;
  return calculerHash(bloc) === bloc.hash;
}

function revoquer(documentId, parQui) {
  const chain = chargerChaine();
  const dernierBloc = chain[chain.length - 1];
  const revokeBloc = {
    index: dernierBloc.index + 1,
    timestamp: new Date().toISOString(),
    data: { type: 'REVOCATION', documentId, parQui, raison: 'renouvellement ou révocation admin' },
    previousHash: dernierBloc.hash,
    hash: '',
  };
  revokeBloc.hash = calculerHash(revokeBloc);
  chain.push(revokeBloc);
  sauvegarderChaine(chain);
}

function estRevoque(documentId) {
  const chain = chargerChaine();
  return chain.some((b) => b.data?.type === 'REVOCATION' && b.data?.documentId === documentId);
}

function obtenirChaine() {
  return chargerChaine();
}

module.exports = { enregistrer, verifier, verifierIntegrite, obtenirChaine, revoquer, estRevoque };
