const fs = require('fs');
const path = require('path');

const AUDIT_PATH = path.join(__dirname, '../data/audit.json');

function charger() {
  if (!fs.existsSync(AUDIT_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf8')); } catch { return []; }
}

function logAction(action, details = {}) {
  const logs = charger();
  logs.push({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    action,
    ...details,
  });
  // Garder les 500 derniers logs
  const recents = logs.slice(-500);
  fs.writeFileSync(AUDIT_PATH, JSON.stringify(recents, null, 2));
}

function obtenirLogs(limite = 100) {
  return charger().slice(-limite).reverse();
}

module.exports = { logAction, obtenirLogs };
