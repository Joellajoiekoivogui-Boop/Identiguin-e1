const crypto = require('crypto');

// Tokens en mémoire : token → { documentId, expireAt }
const tokens = new Map();

function genererToken(documentId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expireAt = Date.now() + 60 * 60 * 1000; // 1 heure
  tokens.set(token, { documentId, expireAt });
  // Nettoyage des tokens expirés
  for (const [t, v] of tokens) {
    if (v.expireAt < Date.now()) tokens.delete(t);
  }
  return token;
}

function validerToken(token) {
  const entry = tokens.get(token);
  if (!entry) return null;
  if (entry.expireAt < Date.now()) { tokens.delete(token); return null; }
  return entry.documentId;
}

module.exports = { genererToken, validerToken };
