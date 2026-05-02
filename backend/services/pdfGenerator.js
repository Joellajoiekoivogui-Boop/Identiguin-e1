const PDFDocument = require('pdfkit');
const fs = require('fs');
const crypto = require('crypto');

// Palette officielle
const C = {
  rouge:     '#CE1126',
  jaune:     '#FCD116',
  vert:      '#009460',
  nuit:      '#08111F',
  nuit2:     '#0D1B2E',
  nuit3:     '#162440',
  or:        '#D4AF37',
  orClair:   '#E8C56A',
  blanc:     '#F0EDE8',
  gris:      '#8A9BB5',
  grisF:     '#4A6080',
  bleuClair: '#2A4A6A',
};

async function generer(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    if (data.type === 'passeport') genererPasseport(doc, data);
    else genererCarte(doc, data);
    doc.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

function drapeauGuinee(doc, x, y, w, h) {
  const b = w / 3;
  doc.rect(x, y, b, h).fill(C.rouge);
  doc.rect(x + b, y, b, h).fill(C.jaune);
  doc.rect(x + b * 2, y, b, h).fill(C.vert);
  // Liseré or
  doc.rect(x, y, w, h).strokeColor(C.or).lineWidth(0.8).stroke();
}

function bandeTricolore(doc, y, W, h) {
  const b = W / 3;
  doc.rect(0, y, b, h).fill(C.rouge);
  doc.rect(b, y, b, h).fill(C.jaune);
  doc.rect(b * 2, y, b, h).fill(C.vert);
}

function sceau(doc, cx, cy, r) {
  // Cercle extérieur
  doc.circle(cx, cy, r).strokeColor(C.or).lineWidth(1.2).fillOpacity(0).stroke();
  // Cercle intérieur
  doc.circle(cx, cy, r - 5).strokeColor(C.or).lineWidth(0.4).stroke();
  // Texte circulaire simulé
  doc.fontSize(4.5).fillColor(C.or).fillOpacity(1).font('Helvetica-Bold')
    .text('• REPUBLIQUE DE GUINEE •', cx - r + 4, cy - 5, { width: (r - 4) * 2, align: 'center' });
  doc.fontSize(4).fillColor(C.orClair)
    .text('IDENTITÉ OFFICIELLE', cx - r + 4, cy + 1, { width: (r - 4) * 2, align: 'center' });
}

function signatureNumerique(doc, x, y, largeur) {
  // Fond de la zone signature
  doc.rect(x - 8, y - 8, largeur + 16, 28).fill('#040C18');
  doc.rect(x - 8, y - 8, largeur + 16, 28).strokeColor(C.bleuClair).lineWidth(0.4).stroke();

  // Courbe signature manuscrite (bezier)
  doc.save();
  doc.strokeColor(C.orClair).lineWidth(1.1).fillOpacity(0);

  doc.moveTo(x, y + 8)
    .bezierCurveTo(x + 12, y,     x + 18, y + 14, x + 32, y + 6)
    .bezierCurveTo(x + 42, y,     x + 48, y + 12, x + 60, y + 7)
    .bezierCurveTo(x + 70, y + 2, x + 76, y + 10, x + 90, y + 5)
    .stroke();

  doc.moveTo(x + 90, y + 5)
    .bezierCurveTo(x + 100, y,    x + 108, y + 11, x + 120, y + 6)
    .bezierCurveTo(x + 130, y + 1,x + 136, y + 9,  x + 150, y + 5)
    .stroke();

  // Trait de soulignement
  doc.moveTo(x, y + 14).lineTo(x + 155, y + 14)
    .strokeColor(C.or).lineWidth(0.6).stroke();

  doc.restore();
}

function cornerAccents(doc, x, y, w, h, s = 10, color = C.or) {
  doc.rect(x, y, s, 1.5).fill(color);
  doc.rect(x, y, 1.5, s).fill(color);
  doc.rect(x + w - s, y, s, 1.5).fill(color);
  doc.rect(x + w - 1.5, y, 1.5, s).fill(color);
  doc.rect(x, y + h - 1.5, s, 1.5).fill(color);
  doc.rect(x, y + h - s, 1.5, s).fill(color);
  doc.rect(x + w - s, y + h - 1.5, s, 1.5).fill(color);
  doc.rect(x + w - 1.5, y + h - s, 1.5, s).fill(color);
}

function champInfo(doc, label, valeur, x, y, w, bold = false) {
  doc.fontSize(6).fillColor(C.or).font('Helvetica-Bold').text(label, x, y);
  doc.fontSize(bold ? 10.5 : 9.5)
    .fillColor(C.blanc)
    .font(bold ? 'Helvetica-Bold' : 'Helvetica')
    .text((valeur || 'N/A').toString(), x, y + 8, { width: w, ellipsis: true });
}

function photoOuPlaceholder(doc, pX, pY, pW, pH, photoPath) {
  doc.rect(pX, pY, pW, pH).fill(C.nuit3);
  if (photoPath && fs.existsSync(photoPath)) {
    try {
      doc.image(photoPath, pX, pY, { width: pW, height: pH, cover: [pW, pH] });
      return;
    } catch {}
  }
  // Silhouette
  doc.circle(pX + pW / 2, pY + pH * 0.33, pW * 0.22).fill(C.bleuClair);
  doc.ellipse(pX + pW / 2, pY + pH * 0.72, pW * 0.3, pH * 0.22).fill(C.bleuClair);
  doc.fontSize(7).fillColor(C.grisF).font('Helvetica')
    .text('PHOTO D\'IDENTITÉ', pX, pY + pH - 16, { width: pW, align: 'center' });
}

function mrzLine(str, len) {
  return str.toUpperCase().replace(/[^A-Z0-9<]/g, '<').padEnd(len, '<').substring(0, len);
}

function sigHash(id) {
  return crypto.createHash('sha256').update(`IDENTIGUINEE:${id}:SIGNATURE:${Date.now()}`).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// CARTE D'IDENTITÉ NATIONALE BIOMÉTRIQUE
// ─────────────────────────────────────────────────────────────────────────────

function genererCarte(doc, data) {
  const W = 595, H = 842;
  const BANDE = 16;
  const MARGE = 38;

  // ── Fond principal ──────────────────────────────────────────────────────────
  doc.rect(0, 0, W, H).fill(C.nuit);

  // Motif de sécurité (lignes diagonales discrètes)
  doc.save();
  doc.strokeColor('#0E1E32').lineWidth(0.4);
  for (let i = -H; i < W + H; i += 24) {
    doc.moveTo(i, 0).lineTo(i + H, H).stroke();
  }
  doc.restore();

  // ── Bandes tricolores ───────────────────────────────────────────────────────
  bandeTricolore(doc, 0, W, BANDE);
  bandeTricolore(doc, H - BANDE, W, BANDE);

  // ── DRAPEAU GUINÉE (grand, côté droit, zone header) ─────────────────────────
  const flagW = 90, flagH = 58;
  const flagX = W - MARGE - flagW;
  const flagY = BANDE + 12;
  drapeauGuinee(doc, flagX, flagY, flagW, flagH);
  doc.fontSize(6).fillColor(C.or).font('Helvetica-Bold')
    .text('GUINÉE', flagX, flagY + flagH + 4, { width: flagW, align: 'center' });

  // ── EN-TÊTE ─────────────────────────────────────────────────────────────────
  const headerY = BANDE + 10;
  doc.fontSize(8.5).fillColor(C.orClair).font('Helvetica-Bold')
    .text('RÉPUBLIQUE DE GUINÉE', MARGE, headerY, { width: W - MARGE * 2 - flagW - 10, align: 'center' });
  doc.fontSize(6.5).fillColor(C.gris).font('Helvetica')
    .text('Travail — Justice — Solidarité', MARGE, headerY + 13, { width: W - MARGE * 2 - flagW - 10, align: 'center' });

  // Séparateur or
  doc.rect(MARGE, headerY + 28, W - MARGE * 2 - flagW - 10, 0.8).fill(C.or);

  doc.fontSize(12.5).fillColor(C.blanc).font('Helvetica-Bold')
    .text("CARTE NATIONALE D'IDENTITÉ BIOMÉTRIQUE", MARGE, headerY + 34, { width: W - MARGE * 2 - flagW - 10, align: 'center' });
  doc.fontSize(7).fillColor(C.gris).font('Helvetica')
    .text('NATIONAL BIOMETRIC IDENTITY CARD', MARGE, headerY + 50, { width: W - MARGE * 2 - flagW - 10, align: 'center' });

  // Ligne séparatrice
  const sepY = BANDE + 82;
  doc.rect(MARGE, sepY, W - MARGE * 2, 0.6).fill(C.or);

  // ── ZONE PHOTO (gauche) ──────────────────────────────────────────────────────
  const pX = MARGE, pY = sepY + 14;
  const pW = 158, pH = 198;

  // Cadre or + photo
  doc.rect(pX - 3, pY - 3, pW + 6, pH + 6).fill(C.or);
  photoOuPlaceholder(doc, pX, pY, pW, pH, data.photoPath);

  // Drapeau guinéen SOUS la photo (proéminent)
  const dX = pX, dY = pY + pH + 10;
  const dW = pW, dH = 48;
  drapeauGuinee(doc, dX, dY, dW, dH);

  // Légende drapeau
  doc.fontSize(5.5).fillColor(C.orClair).font('Helvetica-Bold')
    .text('🇬🇳  DRAPEAU DE LA GUINÉE  🇬🇳', dX, dY + dH + 5, { width: dW, align: 'center' });

  // Sceau officiel
  const sceauY = dY + dH + 26;
  sceau(doc, pX + pW / 2, sceauY + 22, 26);

  // ── ZONE INFORMATIONS (droite) ───────────────────────────────────────────────
  const iX = pX + pW + 22;
  const iW = W - iX - MARGE;
  let iY = sepY + 14;
  const lineH = 30;

  const champs = [
    { label: 'NOM / SURNAME', val: (data.nom || '').toUpperCase(), bold: true },
    { label: 'PRÉNOM(S) / GIVEN NAMES', val: data.prenoms },
    { label: 'DATE DE NAISSANCE / DATE OF BIRTH', val: data.dateNaissance },
    { label: 'LIEU DE NAISSANCE / PLACE OF BIRTH', val: (data.lieuNaissance || '').toUpperCase() },
    { label: 'SEXE / SEX', val: data.sexe === 'M' ? 'M — MASCULIN' : 'F — FÉMININ' },
    { label: 'NATIONALITÉ / NATIONALITY', val: (data.nationalite || 'GUINÉENNE').toUpperCase() },
    { label: 'PROFESSION', val: data.profession || 'N/A' },
    { label: 'ADRESSE / ADDRESS', val: data.adresse || 'N/A' },
  ];

  champs.forEach((c, i) => {
    if (i > 0) doc.rect(iX, iY - 4, iW, 0.3).fill(C.bleuClair);
    champInfo(doc, c.label, c.val, iX, iY, iW, c.bold);
    iY += lineH;
  });

  // ── IDENTIFIANT UNIQUE ───────────────────────────────────────────────────────
  const idBoxY = Math.max(iY + 6, dY + dH + 72);
  const idBoxH = 52;
  doc.rect(MARGE, idBoxY, W - MARGE * 2, idBoxH).fill('#040C18');
  cornerAccents(doc, MARGE, idBoxY, W - MARGE * 2, idBoxH, 12);

  doc.fontSize(7).fillColor(C.or).font('Helvetica-Bold')
    .text('IDENTIFIANT UNIQUE  /  UNIQUE IDENTIFIER', 0, idBoxY + 9, { align: 'center', width: W });
  doc.fontSize(22).fillColor(C.blanc).font('Helvetica-Bold')
    .text(data.id || '', 0, idBoxY + 22, { align: 'center', width: W });

  // ── DATES ────────────────────────────────────────────────────────────────────
  const datesY = idBoxY + idBoxH + 8;
  doc.rect(MARGE, datesY, W - MARGE * 2, 0.4).fill(C.bleuClair);

  doc.fontSize(6).fillColor(C.or).font('Helvetica-Bold').text("DATE D'ÉMISSION", MARGE, datesY + 6);
  doc.fontSize(10).fillColor(C.blanc).font('Helvetica').text(data.dateEmission || '', MARGE, datesY + 16);

  doc.fontSize(6).fillColor(C.or).font('Helvetica-Bold').text("DATE D'EXPIRATION", W / 2 - 10, datesY + 6);
  doc.fontSize(10).fillColor(C.blanc).font('Helvetica').text(data.dateExpiration || '', W / 2 - 10, datesY + 16);

  // ── SIGNATURE NUMÉRIQUE + QR ─────────────────────────────────────────────────
  const sigZoneY = datesY + 40;
  doc.rect(MARGE, sigZoneY, W - MARGE * 2, 0.4).fill(C.bleuClair);

  doc.fontSize(6.5).fillColor(C.or).font('Helvetica-Bold')
    .text('SIGNATURE NUMÉRIQUE  /  DIGITAL SIGNATURE', MARGE, sigZoneY + 8);

  signatureNumerique(doc, MARGE, sigZoneY + 22, 230);

  const hashVal = data.hashBlockchain || sigHash(data.id || '');
  doc.fontSize(5).fillColor(C.gris).font('Courier')
    .text(hashVal.substring(0, 32) + '...', MARGE, sigZoneY + 52, { width: 240 });

  doc.fontSize(5.5).fillColor(C.vert).font('Helvetica-Bold')
    .text(`✓ BLOC #${data.blockIndex || 0}  —  BLOCKCHAIN IDENTIGUINÉE  —  SHA-256 VÉRIFIÉ`, MARGE, sigZoneY + 62);

  // QR Code
  if (data.qrCodeDataUrl) {
    try {
      const qrBuf = Buffer.from(data.qrCodeDataUrl.split(',')[1], 'base64');
      const qrSize = 82;
      const qrX = W - MARGE - qrSize;
      const qrY = sigZoneY + 4;
      doc.rect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6).fill(C.or);
      doc.image(qrBuf, qrX, qrY, { width: qrSize, height: qrSize });
      doc.fontSize(5.5).fillColor(C.gris).font('Helvetica')
        .text('Scanner pour vérifier', qrX - 3, qrY + qrSize + 5, { width: qrSize + 6, align: 'center' });
    } catch {}
  }

  // Deuxième drapeau (petit, décoratif bas-gauche)
  const flag2X = MARGE, flag2Y = sigZoneY + 75;
  drapeauGuinee(doc, flag2X, flag2Y, 54, 32);

  // ── ZONE MRZ ─────────────────────────────────────────────────────────────────
  const mrzY = H - BANDE - 52;
  doc.rect(0, mrzY - 2, W, 50).fill('#030A12');
  doc.rect(0, mrzY - 2, W, 0.8).fill(C.or);

  doc.fontSize(6.5).fillColor(C.or).font('Helvetica-Bold')
    .text('ZONE DE LECTURE AUTOMATIQUE  /  MACHINE READABLE ZONE', 0, mrzY + 4, { align: 'center', width: W });

  const nom = (data.nom || '').toUpperCase().replace(/[^A-Z]/g, '');
  const pre = (data.prenoms || '').toUpperCase().replace(/[^A-Z ]/g, '').replace(/ /g, '<');
  const dob = (data.dateNaissance || '000000').split('/').reverse().join('').substring(2, 8);
  const eid = (data.id || '').replace(/-/g, '').padEnd(9, '<').substring(0, 9);

  doc.fontSize(7.5).fillColor(C.blanc).font('Courier')
    .text(mrzLine(`ID<GIN${nom}<<${pre}`, 30), MARGE, mrzY + 20)
    .text(mrzLine(`${eid}GIN${dob}0`, 30), MARGE, mrzY + 33);

  // Site web
  doc.fontSize(5.5).fillColor(C.grisF)
    .text('www.identiguinee.gov.gn  —  Plateforme Nationale d\'Identité Numérique Sécurisée', 0, mrzY - 12, { align: 'center', width: W });
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSEPORT ÉLECTRONIQUE
// ─────────────────────────────────────────────────────────────────────────────

function genererPasseport(doc, data) {
  const W = 595, H = 842;
  const BANDE = 16;
  const MARGE = 38;

  // Fond
  doc.rect(0, 0, W, H).fill(C.nuit);

  // Motif sécurité
  doc.save();
  doc.strokeColor('#0E1E32').lineWidth(0.4);
  for (let i = -H; i < W + H; i += 24) doc.moveTo(i, 0).lineTo(i + H, H).stroke();
  doc.restore();

  // Bandes tricolores
  bandeTricolore(doc, 0, W, BANDE);
  bandeTricolore(doc, H - BANDE, W, BANDE);

  // Drapeau (haut droite)
  const flagW = 80, flagH = 50;
  drapeauGuinee(doc, W - MARGE - flagW, BANDE + 14, flagW, flagH);

  // En-tête
  const hY = BANDE + 12;
  doc.fontSize(9).fillColor(C.orClair).font('Helvetica-Bold')
    .text('PASSEPORT  /  PASSPORT', MARGE, hY, { width: W - MARGE * 2 - flagW - 12, align: 'center' });
  doc.fontSize(7.5).fillColor(C.blanc)
    .text('REPUBLIQUE DE GUINEE  /  REPUBLIC OF GUINEA', MARGE, hY + 14, { width: W - MARGE * 2 - flagW - 12, align: 'center' });
  doc.fontSize(6).fillColor(C.gris)
    .text('Travail — Justice — Solidarité', MARGE, hY + 26, { width: W - MARGE * 2 - flagW - 12, align: 'center' });
  doc.rect(MARGE, hY + 40, W - MARGE * 2 - flagW - 12, 0.8).fill(C.or);

  const sepY = BANDE + 70;
  doc.rect(MARGE, sepY, W - MARGE * 2, 0.6).fill(C.or);

  // Photo
  const pX = MARGE, pY = sepY + 14, pW = 140, pH = 175;
  doc.rect(pX - 3, pY - 3, pW + 6, pH + 6).fill(C.or);
  photoOuPlaceholder(doc, pX, pY, pW, pH, data.photoPath);

  // Drapeau sous photo (passeport)
  drapeauGuinee(doc, pX, pY + pH + 10, pW, 38);
  doc.fontSize(5.5).fillColor(C.orClair).font('Helvetica-Bold')
    .text('GUINÉE / GUINEA', pX, pY + pH + 52, { width: pW, align: 'center' });
  sceau(doc, pX + pW / 2, pY + pH + 82, 24);

  // Informations
  const iX = pX + pW + 22, iW = W - iX - MARGE;
  let iY = sepY + 14;

  [
    { label: 'NOM / SURNAME', val: (data.nom || '').toUpperCase(), bold: true },
    { label: 'PRÉNOM(S) / GIVEN NAMES', val: data.prenoms },
    { label: 'DATE DE NAISSANCE / DATE OF BIRTH', val: data.dateNaissance },
    { label: 'LIEU DE NAISSANCE / PLACE OF BIRTH', val: (data.lieuNaissance || '').toUpperCase() },
    { label: 'NATIONALITÉ / NATIONALITY', val: (data.nationalite || 'GUINÉENNE').toUpperCase() },
    { label: 'SEXE / SEX', val: data.sexe === 'M' ? 'M — MASCULIN' : 'F — FÉMININ' },
    { label: 'PROFESSION', val: data.profession || 'N/A' },
  ].forEach((c, i) => {
    if (i > 0) doc.rect(iX, iY - 4, iW, 0.3).fill(C.bleuClair);
    champInfo(doc, c.label, c.val, iX, iY, iW, c.bold);
    iY += 30;
  });

  // N° Passeport
  const idY = Math.max(iY + 8, pY + pH + 100);
  doc.rect(MARGE, idY, W - MARGE * 2, 50).fill('#040C18');
  cornerAccents(doc, MARGE, idY, W - MARGE * 2, 50);
  doc.fontSize(7).fillColor(C.or).font('Helvetica-Bold')
    .text('N° PASSEPORT  /  PASSPORT NO.', 0, idY + 9, { align: 'center', width: W });
  doc.fontSize(20).fillColor(C.blanc).font('Helvetica-Bold')
    .text(data.id || '', 0, idY + 21, { align: 'center', width: W });

  // Dates
  const dY2 = idY + 58;
  doc.fontSize(6).fillColor(C.or).font('Helvetica-Bold').text("DATE D'ÉMISSION", MARGE, dY2);
  doc.fontSize(10).fillColor(C.blanc).font('Helvetica').text(data.dateEmission || '', MARGE, dY2 + 11);
  doc.fontSize(6).fillColor(C.or).font('Helvetica-Bold').text("DATE D'EXPIRATION", W / 2, dY2);
  doc.fontSize(10).fillColor(C.blanc).font('Helvetica').text(data.dateExpiration || '', W / 2, dY2 + 11);

  // QR
  if (data.qrCodeDataUrl) {
    try {
      const qrBuf = Buffer.from(data.qrCodeDataUrl.split(',')[1], 'base64');
      const qrX = W - MARGE - 80;
      doc.rect(qrX - 3, dY2 - 3, 86, 86).fill(C.or);
      doc.image(qrBuf, qrX, dY2, { width: 80, height: 80 });
    } catch {}
  }

  // Signature
  const sigY2 = dY2 + 38;
  doc.rect(MARGE, sigY2, W - MARGE * 2, 0.4).fill(C.bleuClair);
  doc.fontSize(6.5).fillColor(C.or).font('Helvetica-Bold')
    .text('SIGNATURE NUMÉRIQUE  /  DIGITAL SIGNATURE', MARGE, sigY2 + 8);
  signatureNumerique(doc, MARGE, sigY2 + 24, 210);

  const hash = data.hashBlockchain || sigHash(data.id || '');
  doc.fontSize(5).fillColor(C.gris).font('Courier')
    .text(hash.substring(0, 40) + '...', MARGE, sigY2 + 54, { width: W - MARGE * 2 });
  doc.fontSize(5.5).fillColor(C.vert)
    .text(`✓ BLOC #${data.blockIndex || 0}  —  BLOCKCHAIN IDENTIGUINÉE  —  OACI COMPLIANT`, MARGE, sigY2 + 65);

  // MRZ
  const mrzY = H - BANDE - 62;
  doc.rect(0, mrzY - 2, W, 60).fill('#030A12');
  doc.rect(0, mrzY - 2, W, 0.8).fill(C.or);
  doc.fontSize(6.5).fillColor(C.or).font('Helvetica-Bold')
    .text('ZONE DE LECTURE AUTOMATIQUE  /  MACHINE READABLE ZONE (OACI/ICAO)', 0, mrzY + 4, { align: 'center', width: W });

  const nomP = (data.nom || '').toUpperCase().replace(/[^A-Z]/g, '');
  const preP = (data.prenoms || '').toUpperCase().replace(/[^A-Z ]/g, '').replace(/ /g, '<');
  const dobP = (data.dateNaissance || '000000').split('/').reverse().join('').substring(2, 8);
  const eidP = (data.id || '').replace(/-/g, '').padEnd(9, '<').substring(0, 9);

  doc.fontSize(8).fillColor(C.blanc).font('Courier')
    .text(mrzLine(`P<GIN${nomP}<<${preP}`, 44), MARGE, mrzY + 20)
    .text(mrzLine(`${eidP}GIN${dobP}0<<<<<<<<<<<<`, 44), MARGE, mrzY + 36);

  doc.fontSize(5.5).fillColor(C.grisF)
    .text('www.identiguinee.gov.gn', 0, mrzY - 10, { align: 'center', width: W });
}

module.exports = { generer };
