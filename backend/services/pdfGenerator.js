const PDFDocument = require('pdfkit');
const fs = require('fs');
const crypto = require('crypto');

const CARD = {
  blanc:   '#FFFFFF',
  fondCl:  '#F4F7FB',
  navy:    '#0A1628',
  bleu:    '#1E3A5F',
  bleuMd:  '#2A5080',
  bleuCl:  '#5B8DB8',
  or:      '#C8A830',
  orCl:    '#DAB94A',
  gris:    '#6B7A8D',
  grisL:   '#B8C4D0',
  grisXL:  '#E4EAF2',
  rouge:   '#CE1126',
  jaune:   '#FCD116',
  vert:    '#009460',
  shadow:  '#C8D4E0',
};

const PP = {
  fond:    '#0F1E3A',
  fond2:   '#0A1628',
  or:      '#C8A830',
  orCl:    '#DAB94A',
  cream:   '#F0EDE8',
  gris:    '#8A9BB5',
  grisCl:  '#B0C0D4',
  line:    '#1E3560',
  accent:  '#3A6090',
};

function sigHash(id) {
  return crypto.createHash('sha256').update(`IDENTIGUINEE:${id}:2026`).digest('hex');
}

function mrzLine(str, len) {
  return str.toUpperCase().replace(/[^A-Z0-9<]/g, '<').padEnd(len, '<').substring(0, len);
}

// ── Fingerprint: concentric slightly-offset ellipses simulating ridges ─────────
function drawFingerprint(doc, cx, cy, color) {
  doc.save();
  doc.strokeColor(color).fillOpacity(0);
  for (let i = 1; i <= 10; i++) {
    const rx = 2.2 + i * 1.85;
    const ry = 2.8 + i * 1.45;
    const dx = Math.sin(i * 0.65) * 1.1;
    const dy = Math.cos(i * 0.85) * 0.7;
    const lw = i < 4 ? 0.35 : i < 8 ? 0.4 : 0.45;
    doc.lineWidth(lw);
    doc.ellipse(cx + dx, cy + dy, rx, ry).stroke();
  }
  doc.fillOpacity(1);
  doc.circle(cx, cy, 1.3).fill(color);
  doc.restore();
}

// ── Human-looking signature: multi-stroke bezier with loops and paraph ─────────
function drawSignatureHumaine(doc, sx, sy, couleur) {
  doc.save();
  doc.fillOpacity(0);

  // First letter (rounded J-like initial with loop)
  doc.strokeColor(couleur).lineWidth(1.2);
  doc.moveTo(sx + 5, sy - 2)
    .bezierCurveTo(sx + 2, sy - 10, sx + 13, sy - 14, sx + 17, sy - 5)
    .bezierCurveTo(sx + 19, sy + 1, sx + 15, sy + 7, sx + 11, sy + 4)
    .stroke();

  // Second initial (K-like upstroke and downstroke)
  doc.lineWidth(1.1);
  doc.moveTo(sx + 19, sy - 12)
    .bezierCurveTo(sx + 20, sy - 6, sx + 21, sy - 1, sx + 22, sy + 4)
    .stroke();
  doc.moveTo(sx + 22, sy - 3)
    .bezierCurveTo(sx + 26, sy - 8, sx + 32, sy - 6, sx + 34, sy - 1)
    .stroke();
  doc.moveTo(sx + 22, sy - 1)
    .bezierCurveTo(sx + 28, sy + 1, sx + 32, sy + 5, sx + 34, sy + 7)
    .stroke();

  // Main body sweep (flowing cursive)
  doc.lineWidth(0.9);
  doc.moveTo(sx + 34, sy)
    .bezierCurveTo(sx + 44, sy - 5, sx + 54, sy + 4, sx + 64, sy - 2)
    .bezierCurveTo(sx + 72, sy - 6, sx + 80, sy + 2, sx + 90, sy - 1)
    .stroke();

  // Loop ascender mid-way
  doc.lineWidth(0.75);
  doc.moveTo(sx + 64, sy - 2)
    .bezierCurveTo(sx + 66, sy - 12, sx + 74, sy - 16, sx + 76, sy - 7)
    .bezierCurveTo(sx + 77, sy - 2, sx + 80, sy + 2, sx + 90, sy - 1)
    .stroke();

  // End flourish / paraph (right-to-left loop)
  doc.lineWidth(0.85);
  doc.moveTo(sx + 90, sy - 1)
    .bezierCurveTo(sx + 100, sy - 7, sx + 112, sy + 3, sx + 108, sy + 10)
    .bezierCurveTo(sx + 104, sy + 15, sx + 92, sy + 13, sx + 88, sy + 8)
    .stroke();

  // Underline flourish
  doc.lineWidth(0.55);
  doc.moveTo(sx + 3, sy + 17)
    .bezierCurveTo(sx + 35, sy + 20, sx + 78, sy + 16, sx + 110, sy + 18)
    .stroke();

  doc.restore();
}

async function generer(data) {
  return new Promise((resolve, reject) => {
    const opts = { size: [612, 390], margins: { top: 0, bottom: 0, left: 0, right: 0 } };
    const doc = new PDFDocument(opts);
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    if (data.type === 'passeport') genererPasseport(doc, data);
    else                           genererCarte(doc, data);
    doc.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CARTE NATIONALE D'IDENTITÉ BIOMÉTRIQUE — style CNIB Guinée / USA ID
// ─────────────────────────────────────────────────────────────────────────────
function genererCarte(doc, data) {
  const W = 612, H = 390;
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RECTO (Face Avant)
  // ─────────────────────────────────────────────────────────────────────────────
  const RX = 20, RY = 15;
  const CW = 270, CH = 170; // Dimensions d'une carte standard (ratio ~1.6)
  
  function drawCardFrame(x, y, w, h) {
    doc.save();
    // Ombre portée
    doc.rect(x + 2, y + 2, w, h).fill('#E2E8F0');
    // Fond blanc
    doc.rect(x, y, w, h).fill('#FFFFFF');
    // Bordure
    doc.rect(x, y, w, h).strokeColor('#CBD5E1').lineWidth(0.5).stroke();
    
    // Guilloche de sécurité (lignes fines)
    doc.save();
    doc.strokeColor('#F1F5F9').lineWidth(0.2);
    for (let i = 0; i < h; i += 4) {
      doc.moveTo(x, y + i).lineTo(x + w, y + i + Math.sin(i) * 5).stroke();
    }
    doc.restore();
    doc.restore();
  }

  // --- DESSIN DU RECTO ---
  drawCardFrame(RX, RY, CW, CH);
  
  // Bandeau supérieur ECOWAS
  doc.rect(RX, RY, CW, 22).fill('#009460'); // Vert CEDEAO
  doc.fontSize(5).fillColor('#FFFFFF').font('Helvetica-Bold')
    .text('CEDEAO / ECOWAS', RX + 5, RY + 5)
    .text('REPUBLIQUE DE GUINEE / REPUBLIC OF GUINEA', RX, RY + 8, { width: CW, align: 'center' });
  doc.fontSize(6).text("CARTE NATIONALE D'IDENTITÉ / NATIONAL IDENTITY CARD", RX, RY + 14, { width: CW, align: 'center' });

  // Photo
  const PX = RX + 8, PY = RY + 30;
  const PW = 60, PH = 75;
  doc.rect(PX, PY, PW, PH).fill('#F8FAFC').strokeColor('#0F172A').lineWidth(0.5).stroke();
  if (data.photoPath && fs.existsSync(data.photoPath)) {
    try { doc.image(data.photoPath, PX, PY, { width: PW, height: PH, cover: [PW, PH] }); } catch {}
  } else {
    doc.fontSize(5).fillColor('#94A3B8').text('PHOTO', PX, PY + PH/2, { width: PW, align: 'center' });
  }
  
  // N° Personnel (NINA) sous la photo
  doc.fontSize(4.5).fillColor('#0F172A').font('Helvetica-Bold')
    .text('N° PERSONNEL / PERSONAL NO.', PX, PY + PH + 3);
  doc.fontSize(7).text(data.id ? data.id.replace(/-/g, '').substring(0, 10) : '—', PX, PY + PH + 8);

  // Champs de données (Recto)
  const DX = PX + PW + 10;
  const DW = CW - DX - 5;
  let dY = RY + 30;
  const rowH = 15;

  function fld(label, val, x, y, w, bold = false) {
    doc.fontSize(4.5).fillColor('#64748B').font('Helvetica').text(label, x, y);
    doc.fontSize(bold ? 7 : 6).fillColor('#0F172A').font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .text((val || '—').toString().toUpperCase(), x, y + 5, { width: w, ellipsis: true });
  }

  fld('NOM / SURNAME', data.nom, DX, dY, DW, true); dY += rowH + 2;
  fld('PRÉNOMS / GIVEN NAMES', data.prenoms, DX, dY, DW); dY += rowH;
  fld('DATE DE NAISSANCE / DATE OF BIRTH', data.dateNaissance, DX, dY, DW / 2);
  fld('LIEU DE NAISSANCE / PLACE OF BIRTH', data.lieuNaissance, DX + DW / 2, dY, DW / 2); dY += rowH;
  fld('SEXE / SEX', data.sexe === 'M' ? 'M' : 'F', DX, dY, 30);
  fld('TAILLE / HEIGHT', data.taille, DX + 40, dY, 40);
  fld('YEUX / EYES', data.couleurYeux, DX + 90, dY, 40); dY += rowH;
  fld('NATIONALITÉ / NATIONALITY', data.nationalite, DX, dY, DW); dY += rowH;
  fld('PROFESSION', data.profession, DX, dY, DW);

  // Photo fantôme à droite
  const GX = RX + CW - 45, GY = RY + 30;
  const GW = 35, GH = 45;
  doc.save().opacity(0.3);
  if (data.photoPath && fs.existsSync(data.photoPath)) {
    try { doc.image(data.photoPath, GX, GY, { width: GW, height: GH, cover: [GW, GH] }); } catch {}
  }
  doc.restore();
  
  // Signature sous la photo fantôme
  doc.fontSize(4).fillColor('#64748B').text('SIGNATURE', GX, GY + GH + 2);
  drawSignatureHumaine(doc, GX - 10, GY + GH + 12, '#0F172A');

  // ─────────────────────────────────────────────────────────────────────────────
  // VERSO (Face Arrière)
  // ─────────────────────────────────────────────────────────────────────────────
  const VX = RX + CW + 20, VY = RY;
  drawCardFrame(VX, VY, CW, CH);
  
  let vY = VY + 10;
  fld('ADRESSE / ADDRESS', data.adresse, VX + 10, vY, CW - 20); vY += 20;
  fld('DATE DE DÉLIVRANCE / DATE OF ISSUE', data.dateEmission, VX + 10, vY, 100);
  fld('DATE D\'EXPIRATION / DATE OF EXPIRY', data.dateExpiration, VX + 120, vY, 100); vY += 20;
  fld('AUTORITÉ DE DÉLIVRANCE / ISSUING AUTHORITY', data.lieuDelivrance, VX + 10, vY, CW - 20); vY += 25;

  // Empreinte digitale au verso
  const FVX = VX + 10, FVY = vY;
  doc.rect(FVX, FVY, 50, 60).fill('#F8FAFC').strokeColor('#E2E8F0').lineWidth(0.5).stroke();
  drawFingerprint(doc, FVX + 25, FVY + 35, '#2A5080');
  doc.fontSize(4).fillColor('#64748B').text('EMPREINTE / FINGERPRINT', FVX, FVY + 65, { width: 50, align: 'center' });

  // QR Code au verso pour vérification
  if (data.qrCodeDataUrl) {
    try {
      const qrBuf = Buffer.from(data.qrCodeDataUrl.split(',')[1], 'base64');
      doc.image(qrBuf, VX + CW - 70, vY, { width: 60, height: 60 });
      doc.fontSize(4).fillColor('#64748B').text('SCAN POUR VÉRIFIER', VX + CW - 70, vY + 65, { width: 60, align: 'center' });
    } catch {}
  }

  // Zone MRZ au bas du verso (3 lignes pour les cartes d'identité)
  const MRZX = VX + 5, MRZY = VY + CH - 35;
  doc.save();
  doc.fontSize(6.5).font('Courier').fillColor('#0F172A');
  const nomMRZ = (data.nom || '').toUpperCase().padEnd(15, '<').substring(0, 15);
  const preMRZ = (data.prenoms || '').toUpperCase().padEnd(15, '<').substring(0, 15);
  const dobMRZ = (data.dateNaissance || '00/00/0000').split('/').reverse().join('').substring(2, 8);
  const idMRZ = (data.id || '').replace(/-/g, '').padEnd(9, '<').substring(0, 9);
  
  doc.text(mrzLine(`IDGIN${idMRZ}<<<<<<<<<<<<<<<`, 30), MRZX, MRZY);
  doc.text(mrzLine(`${dobMRZ}M2412311GIN<<<<<<<<<<<8`, 30), MRZX, MRZY + 8);
  doc.text(mrzLine(`${nomMRZ}<<${preMRZ}<<<<<<<<<<<<`, 30), MRZX, MRZY + 16);
  doc.restore();

  // Titre global sur la page PDF
  doc.fontSize(10).fillColor('#0F172A').font('Helvetica-Bold')
    .text("SPECIMEN : CARTE NATIONALE D'IDENTITÉ BIOMÉTRIQUE (RECTO-VERSO)", RX, RY + CH + 25);
  doc.fontSize(7).font('Helvetica').fillColor('#64748B')
    .text("Ce document est une preuve d'identité numérique ancrée sur la blockchain IdentiGuinée.", RX, RY + CH + 40);
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSEPORT ÉLECTRONIQUE
// ─────────────────────────────────────────────────────────────────────────────
function genererPasseport(doc, data) {
  const W = 612, H = 390;
  
  // Fond et bordures de sécurité
  doc.rect(0, 0, W, H).fill('#0D1B3E'); // Bleu passeport profond
  
  // Motif de fond (guilloche complexe simulée)
  doc.save();
  doc.strokeColor('#1E3A5F').lineWidth(0.3);
  for (let i = 0; i < W; i += 15) {
    doc.moveTo(i, 0).bezierCurveTo(i + 50, H/2, i - 50, H/2, i, H).stroke();
  }
  doc.restore();

  // En-tête officiel
  doc.rect(0, 0, W, 50).fill('#09142E');
  doc.rect(0, 50, W, 2).fill('#C8A830'); // Ligne or

  doc.fontSize(14).fillColor('#C8A830').font('Helvetica-Bold')
    .text('RÉPUBLIQUE DE GUINÉE', 20, 10)
    .text('PASSEPORT / PASSPORT', 20, 26);
  
  doc.fontSize(10).fillColor('#FFFFFF').font('Helvetica-Bold')
    .text('Type', W - 150, 10)
    .text('P', W - 150, 22)
    .text('Code', W - 100, 10)
    .text('GIN', W - 100, 22)
    .text('Passeport No.', W - 220, 10)
    .text(data.id || '—', W - 220, 22);

  // Photo
  const PX = 30, PY = 70;
  const PW = 130, PH = 170;
  doc.rect(PX - 2, PY - 2, PW + 4, PH + 4).fill('#C8A830'); // Bordure or
  doc.rect(PX, PY, PW, PH).fill('#F1F5F9');
  
  if (data.photoPath && fs.existsSync(data.photoPath)) {
    try { doc.image(data.photoPath, PX, PY, { width: PW, height: PH, cover: [PW, PH] }); } catch {}
  }

  // Champs de données
  const DX = PX + PW + 30;
  const DW = W - DX - 30;
  let dY = 70;
  const rowH = 22;

  function ppFld(label, val, x, y, w, bold = false) {
    doc.fontSize(6).fillColor('#8A9BB5').font('Helvetica').text(label, x, y);
    doc.fontSize(bold ? 11 : 9).fillColor('#FFFFFF').font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .text((val || '—').toString().toUpperCase(), x, y + 8, { width: w });
    doc.rect(x, y + 20, w, 0.3).fill('#1E3A5F');
  }

  ppFld('NOM / SURNAME', data.nom, DX, dY, DW, true); dY += rowH + 5;
  ppFld('PRÉNOMS / GIVEN NAMES', data.prenoms, DX, dY, DW, true); dY += rowH + 5;
  ppFld('NATIONALITÉ / NATIONALITY', 'GUINÉENNE', DX, dY, DW); dY += rowH;
  
  // Ligne double : Date naissance et Sexe
  ppFld('DATE DE NAISSANCE / DATE OF BIRTH', data.dateNaissance, DX, dY, DW/2);
  ppFld('SEXE / SEX', data.sexe === 'M' ? 'M' : 'F', DX + DW/2 + 10, dY, DW/2 - 10); dY += rowH;
  
  ppFld('LIEU DE NAISSANCE / PLACE OF BIRTH', data.lieuNaissance, DX, dY, DW); dY += rowH;
  ppFld('DATE DE DÉLIVRANCE / DATE OF ISSUE', data.dateEmission, DX, dY, DW/2);
  ppFld('DATE D\'EXPIRATION / DATE OF EXPIRY', data.dateExpiration, DX + DW/2 + 10, dY, DW/2 - 10); dY += rowH;
  ppFld('AUTORITÉ / AUTHORITY', data.lieuDelivrance, DX, dY, DW);

  // Photo fantôme et Signature
  const GX = W - 100, GY = 250;
  doc.save().opacity(0.2);
  if (data.photoPath && fs.existsSync(data.photoPath)) {
    try { doc.image(data.photoPath, GX, GY, { width: 70, height: 90, cover: [70, 90] }); } catch {}
  }
  doc.restore();

  // Zone MRZ (2 lignes pour les passeports)
  const MRZY = H - 60;
  doc.rect(0, MRZY - 10, W, 70).fill('#050B1A');
  doc.fontSize(12).font('Courier').fillColor('#FFFFFF');
  
  const nomMRZ = (data.nom || '').toUpperCase().replace(/ /g, '<').padEnd(20, '<').substring(0, 20);
  const preMRZ = (data.prenoms || '').toUpperCase().replace(/ /g, '<').padEnd(15, '<').substring(0, 15);
  const dobMRZ = (data.dateNaissance || '00000000').split('/').reverse().join('').substring(2, 8);
  const idMRZ = (data.id || '').replace(/-/g, '').padEnd(9, '<').substring(0, 9);

  doc.text(mrzLine(`P<GIN${nomMRZ}<<${preMRZ}`, 44), 30, MRZY);
  doc.text(mrzLine(`${idMRZ}<8GIN${dobMRZ}4M2412311<<<<<<<<<<<<<<06`, 44), 30, MRZY + 15);
}

module.exports = { generer };
