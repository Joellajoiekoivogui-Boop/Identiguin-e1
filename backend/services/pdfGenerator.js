const PDFDocument = require('pdfkit');
const fs = require('fs');
const crypto = require('crypto');

// ── Palettes ───────────────────────────────────────────────────────────────────
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

async function generer(data) {
  return new Promise((resolve, reject) => {
    // Les deux formats utilisent le même gabarit carte paysage [612 × 390]
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
// CARTE D'IDENTITÉ NATIONALE BIOMÉTRIQUE — PAYSAGE BLANC (style USA ID)
// ─────────────────────────────────────────────────────────────────────────────
function genererCarte(doc, data) {
  const W = 612, H = 390;
  const ML = 20, MR = 20; // marges

  // ── Fond blanc ────────────────────────────────────────────────────────────
  doc.rect(0, 0, W, H).fill(CARD.blanc);

  // Motif sécurité (points discrets)
  doc.save();
  for (let x = 8; x < W; x += 14) {
    for (let y = 8; y < H; y += 14) {
      doc.circle(x, y, 0.5).fill(CARD.grisXL);
    }
  }
  doc.restore();

  // ── Barre latérale gauche (navy) ──────────────────────────────────────────
  doc.rect(0, 0, 5, H).fill(CARD.navy);

  // ── Bande tricolore GUINÉE en haut ────────────────────────────────────────
  const STRIP = 8;
  const sw = (W - 5) / 3;
  doc.rect(5,          0, sw, STRIP).fill(CARD.rouge);
  doc.rect(5 + sw,     0, sw, STRIP).fill(CARD.jaune);
  doc.rect(5 + sw * 2, 0, sw, STRIP).fill(CARD.vert);

  // ── En-tête ───────────────────────────────────────────────────────────────
  const hY = STRIP + 5;
  doc.fontSize(6.5).fillColor(CARD.navy).font('Helvetica-Bold')
    .text('RÉPUBLIQUE DE GUINÉE — REPUBLIC OF GUINEA', ML + 5, hY, { align: 'center', width: W - ML - MR });
  doc.fontSize(9).fillColor(CARD.navy).font('Helvetica-Bold')
    .text("CARTE NATIONALE D'IDENTITÉ BIOMÉTRIQUE", ML + 5, hY + 10, { align: 'center', width: W - ML - MR });
  doc.fontSize(6).fillColor(CARD.bleuCl).font('Helvetica')
    .text('NATIONAL BIOMETRIC IDENTITY CARD', ML + 5, hY + 21, { align: 'center', width: W - ML - MR });

  // Ligne séparatrice
  const RULE_Y = hY + 32;
  doc.rect(ML + 5, RULE_Y, W - ML - MR - 5, 0.6).fill(CARD.or);

  // ── Photo ─────────────────────────────────────────────────────────────────
  const PX = ML + 8, PY = RULE_Y + 10;
  const PW = 115, PH = 145;

  // Ombre
  doc.rect(PX + 3, PY + 3, PW, PH).fill(CARD.shadow);
  // Fond photo
  doc.rect(PX, PY, PW, PH).fill(CARD.grisXL);
  if (data.photoPath && fs.existsSync(data.photoPath)) {
    try {
      doc.image(data.photoPath, PX, PY, { width: PW, height: PH, cover: [PW, PH] });
    } catch {}
  } else {
    // Silhouette
    doc.circle(PX + PW / 2, PY + PH * 0.3, PW * 0.19).fill(CARD.grisL);
    doc.ellipse(PX + PW / 2, PY + PH * 0.65, PW * 0.26, PH * 0.19).fill(CARD.grisL);
    doc.fontSize(6).fillColor(CARD.gris).font('Helvetica')
      .text("PHOTO", PX, PY + PH - 14, { width: PW, align: 'center' });
  }
  // Cadre
  doc.rect(PX, PY, PW, PH).strokeColor(CARD.navy).lineWidth(0.8).stroke();

  // Sceau sous la photo
  const SX = PX + PW / 2, SY = PY + PH + 18;
  doc.circle(SX, SY, 18).strokeColor(CARD.or).lineWidth(0.8).fillOpacity(0).stroke();
  doc.circle(SX, SY, 13).strokeColor(CARD.or).lineWidth(0.35).stroke();
  doc.fillOpacity(1).fontSize(4.5).fillColor(CARD.or).font('Helvetica-Bold')
    .text('IDENTIGUINEE', SX - 18, SY - 3.5, { width: 36, align: 'center' });
  doc.fontSize(4).fillColor(CARD.bleuCl)
    .text('GUINÉE · GN', SX - 18, SY + 2, { width: 36, align: 'center' });

  // ── Champs de données ─────────────────────────────────────────────────────
  const DX = PX + PW + 16;
  const DW = W - DX - MR - 72; // réserve 72pt pour le QR
  let dY = RULE_Y + 10;
  const ROW = 22;

  function fieldCard(label, value, x, y, w, isBold) {
    doc.fontSize(5).fillColor(CARD.bleuMd).font('Helvetica-Bold').text(label, x, y);
    doc.fontSize(isBold ? 9 : 8)
      .fillColor(CARD.navy)
      .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
      .text((value || 'N/A').toString(), x, y + 7, { width: w, ellipsis: true, lineBreak: false });
  }

  const fields = [
    { l: 'NOM / SURNAME',                    v: (data.nom || '').toUpperCase(),               bold: true },
    { l: 'PRÉNOM(S) / GIVEN NAME(S)',         v: data.prenoms },
    { l: 'DATE DE NAISSANCE / DATE OF BIRTH', v: data.dateNaissance },
    { l: 'LIEU DE NAISSANCE / PLACE OF BIRTH',v: (data.lieuNaissance || '').toUpperCase() },
    { l: 'SEXE / SEX',                        v: data.sexe === 'M' ? 'M — MASCULIN' : 'F — FÉMININ' },
    { l: 'NATIONALITÉ / NATIONALITY',         v: (data.nationalite || 'Guinéenne').toUpperCase() },
    { l: 'PROFESSION',                        v: data.profession || 'N/A' },
  ];

  fields.forEach((f, i) => {
    if (i > 0) doc.rect(DX, dY - 2, DW, 0.3).fill(CARD.grisXL);
    fieldCard(f.l, f.v, DX, dY, DW, f.bold);
    dY += f.bold ? ROW + 2 : ROW;
  });

  // Boîte identifiant
  const ID_Y = dY + 4;
  doc.rect(DX, ID_Y, DW, 28).fill(CARD.navy);
  doc.fontSize(5.5).fillColor(CARD.or).font('Helvetica-Bold')
    .text('N° IDENTIFIANT / UNIQUE ID', DX + 6, ID_Y + 5);
  doc.fontSize(12).fillColor(CARD.blanc).font('Helvetica-Bold')
    .text(data.id || '', DX + 6, ID_Y + 14, { lineBreak: false });

  // Dates
  const DATE_Y = ID_Y + 34;
  doc.rect(DX, DATE_Y - 1, DW, 0.3).fill(CARD.grisXL);
  doc.fontSize(5).fillColor(CARD.bleuMd).font('Helvetica-Bold').text("ÉMIS LE / ISSUED", DX, DATE_Y);
  doc.fontSize(7.5).fillColor(CARD.navy).font('Helvetica').text(data.dateEmission || '', DX, DATE_Y + 7, { lineBreak: false });
  doc.fontSize(5).fillColor(CARD.bleuMd).font('Helvetica-Bold').text("EXPIRE LE / EXPIRY", DX + 110, DATE_Y, { lineBreak: false });
  doc.fontSize(7.5).fillColor(CARD.navy).font('Helvetica').text(data.dateExpiration || '', DX + 110, DATE_Y + 7, { lineBreak: false });

  // Zone signature
  const SIG_Y = DATE_Y + 22;
  doc.rect(DX, SIG_Y, 148, 20).fill(CARD.fondCl);
  doc.rect(DX, SIG_Y, 148, 20).strokeColor(CARD.grisL).lineWidth(0.4).stroke();
  doc.fontSize(5).fillColor(CARD.gris).font('Helvetica').text('SIGNATURE', DX + 3, SIG_Y + 3);
  doc.save();
  doc.strokeColor(CARD.navy).lineWidth(0.7).fillOpacity(0);
  const sx = DX + 8, sy = SIG_Y + 14;
  doc.moveTo(sx, sy)
    .bezierCurveTo(sx + 10, sy - 7, sx + 16, sy + 3,  sx + 28, sy - 2)
    .bezierCurveTo(sx + 36, sy - 7, sx + 42, sy + 4,  sx + 56, sy - 1)
    .bezierCurveTo(sx + 64, sy - 6, sx + 70, sy + 3,  sx + 86, sy - 2)
    .stroke();
  doc.restore();

  // ── QR Code ────────────────────────────────────────────────────────────────
  if (data.qrCodeDataUrl) {
    try {
      const qrBuf = Buffer.from(data.qrCodeDataUrl.split(',')[1], 'base64');
      const QS = 62;
      const QX = W - MR - QS, QY = RULE_Y + 10;
      doc.rect(QX - 2, QY - 2, QS + 4, QS + 4).fill(CARD.navy);
      doc.image(qrBuf, QX, QY, { width: QS, height: QS });
      doc.fontSize(4.5).fillColor(CARD.gris).font('Helvetica')
        .text('SCAN / VERIFY', QX - 2, QY + QS + 3, { width: QS + 4, align: 'center' });
    } catch {}
  }

  // ── Zone MRZ ──────────────────────────────────────────────────────────────
  const MRZ_Y = H - 52;
  doc.rect(0, MRZ_Y, W, 52).fill(CARD.navy);
  doc.rect(0, MRZ_Y, W, 0.6).fill(CARD.or);

  doc.fontSize(5.5).fillColor(CARD.or).font('Helvetica-Bold')
    .text('MACHINE READABLE ZONE — ZONE DE LECTURE AUTOMATIQUE', 0, MRZ_Y + 5, { align: 'center', width: W });

  const nom = (data.nom || '').toUpperCase().replace(/[^A-Z]/g, '');
  const pre = (data.prenoms || '').toUpperCase().replace(/[^A-Z ]/g, '').replace(/ /g, '<');
  const dob = (data.dateNaissance || '000000').split('/').reverse().join('').substring(2, 8);
  const eid = (data.id || '').replace(/-/g, '').padEnd(9, '<').substring(0, 9);

  doc.fontSize(7.5).fillColor(CARD.blanc).font('Courier')
    .text(mrzLine(`ID<GIN${nom}<<${pre}`, 30), ML + 8, MRZ_Y + 17)
    .text(mrzLine(`${eid}GIN${dob}0`, 30), ML + 8, MRZ_Y + 30);

  const hash = data.hashBlockchain || sigHash(data.id || '');
  doc.fontSize(4).fillColor(CARD.bleuCl).font('Courier')
    .text(`SHA-256: ${hash.substring(0, 40)}... | BLOC #${data.blockIndex || 0} | IDENTIGUINÉE`, ML + 8, MRZ_Y + 42);
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSEPORT ÉLECTRONIQUE — même format carte paysage [612×390], fond navy
// ─────────────────────────────────────────────────────────────────────────────
function genererPasseport(doc, data) {
  const W = 612, H = 390;
  const ML = 20, MR = 20;

  // ── Fond navy profond ─────────────────────────────────────────────────────
  doc.rect(0, 0, W, H).fill(PP.fond);

  // Motif sécurité (lignes diagonales très discrètes)
  doc.save();
  doc.strokeColor('#182E52').lineWidth(0.35);
  for (let i = -H; i < W + H; i += 22) {
    doc.moveTo(i, 0).lineTo(i + H, H).stroke();
  }
  doc.restore();

  // ── Barre latérale gauche (or) ────────────────────────────────────────────
  doc.rect(0, 0, 5, H).fill(PP.or);

  // ── Bandeau header navy foncé ─────────────────────────────────────────────
  const HEADER_H = 42;
  doc.rect(5, 0, W - 5, HEADER_H).fill(PP.fond2);
  doc.rect(5, HEADER_H, W - 5, 0.8).fill(PP.or);

  // Emblème (cercles, pas de drapeau)
  const EX = 5 + 44, EY = HEADER_H / 2;
  doc.circle(EX, EY, 16).strokeColor(PP.or).lineWidth(0.8).fillOpacity(0).stroke();
  doc.circle(EX, EY, 11).strokeColor(PP.or).lineWidth(0.3).stroke();
  doc.circle(EX, EY, 5).fill(PP.or).fillOpacity(1);
  doc.fontSize(4).fillColor(PP.fond2).font('Helvetica-Bold')
    .text('GN', EX - 7, EY - 2.5, { width: 14, align: 'center' });

  // Titre passeport
  doc.fontSize(13).fillColor(PP.or).font('Helvetica-Bold')
    .text('PASSEPORT', 5 + 70, 8, { lineBreak: false });
  doc.fontSize(7).fillColor(PP.grisCl).font('Helvetica')
    .text('REPUBLIQUE DE GUINEE  /  REPUBLIC OF GUINEA', 5 + 70, 23, { lineBreak: false });
  doc.fontSize(6).fillColor(PP.accent).font('Helvetica')
    .text('PASSPORT  —  OACI/ICAO COMPLIANT', 5 + 70, 33, { lineBreak: false });

  // ── Photo ─────────────────────────────────────────────────────────────────
  const PX = ML + 8, PY = HEADER_H + 12;
  const PW = 110, PH = 140;

  doc.rect(PX - 2, PY - 2, PW + 4, PH + 4).fill(PP.or);
  doc.rect(PX, PY, PW, PH).fill(PP.accent);
  if (data.photoPath && fs.existsSync(data.photoPath)) {
    try {
      doc.image(data.photoPath, PX, PY, { width: PW, height: PH, cover: [PW, PH] });
    } catch {}
  } else {
    doc.circle(PX + PW / 2, PY + PH * 0.3, PW * 0.2).fill('#3A6090');
    doc.ellipse(PX + PW / 2, PY + PH * 0.65, PW * 0.27, PH * 0.19).fill('#3A6090');
    doc.fontSize(6).fillColor(PP.grisCl).font('Helvetica')
      .text('PHOTO', PX, PY + PH - 14, { width: PW, align: 'center' });
  }

  // Sceau sous la photo
  const SX = PX + PW / 2, SY = PY + PH + 18;
  doc.circle(SX, SY, 15).strokeColor(PP.or).lineWidth(0.7).fillOpacity(0).stroke();
  doc.circle(SX, SY, 10).strokeColor(PP.or).lineWidth(0.3).stroke();
  doc.fillOpacity(1).fontSize(4).fillColor(PP.or).font('Helvetica-Bold')
    .text('IDENTIGUINEE', SX - 15, SY - 3, { width: 30, align: 'center' });

  // ── Données ───────────────────────────────────────────────────────────────
  const DX = PX + PW + 16;
  const DW = W - DX - MR - 70;
  let dY = HEADER_H + 12;
  const ROW = 20;

  function fieldPP(label, value, x, y, w, bold) {
    if (y > HEADER_H + 12) doc.rect(x, y - 2, w, 0.3).fill(PP.line);
    doc.fontSize(5).fillColor(PP.grisCl).font('Helvetica-Bold').text(label, x, y);
    doc.fontSize(bold ? 8.5 : 7.5)
      .fillColor(PP.cream)
      .font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .text((value || 'N/A').toString(), x, y + 7, { width: w, ellipsis: true, lineBreak: false });
  }

  const fields = [
    { l: 'NOM / SURNAME',                     v: (data.nom || '').toUpperCase(),               bold: true },
    { l: 'PRÉNOM(S) / GIVEN NAMES',            v: data.prenoms },
    { l: 'DATE DE NAISSANCE / DATE OF BIRTH',  v: data.dateNaissance },
    { l: 'LIEU DE NAISSANCE / PLACE OF BIRTH', v: (data.lieuNaissance || '').toUpperCase() },
    { l: 'SEXE / SEX',                         v: data.sexe === 'M' ? 'M — MASCULIN' : 'F — FÉMININ' },
    { l: 'NATIONALITÉ / NATIONALITY',          v: (data.nationalite || 'GUINÉENNE').toUpperCase() },
    { l: 'PROFESSION',                         v: data.profession || 'N/A' },
  ];

  fields.forEach(f => {
    fieldPP(f.l, f.v, DX, dY, DW, f.bold);
    dY += f.bold ? ROW + 2 : ROW;
  });

  // Boîte N° passeport
  const ID_Y = dY + 4;
  doc.rect(DX, ID_Y, DW, 26).fill(PP.fond2);
  doc.rect(DX, ID_Y, DW, 26).strokeColor(PP.or).lineWidth(0.5).stroke();
  doc.fontSize(5.5).fillColor(PP.or).font('Helvetica-Bold')
    .text('N° PASSEPORT / PASSPORT NO.', DX + 6, ID_Y + 5);
  doc.fontSize(11).fillColor(PP.cream).font('Helvetica-Bold')
    .text(data.id || '', DX + 6, ID_Y + 14, { lineBreak: false });

  // Dates
  const DATE_Y = ID_Y + 32;
  doc.fontSize(5).fillColor(PP.grisCl).font('Helvetica-Bold').text("ÉMIS LE / ISSUED", DX, DATE_Y);
  doc.fontSize(7).fillColor(PP.cream).font('Helvetica').text(data.dateEmission || '', DX, DATE_Y + 7, { lineBreak: false });
  doc.fontSize(5).fillColor(PP.grisCl).font('Helvetica-Bold').text("EXPIRE / EXPIRY", DX + 110, DATE_Y, { lineBreak: false });
  doc.fontSize(7).fillColor(PP.cream).font('Helvetica').text(data.dateExpiration || '', DX + 110, DATE_Y + 7, { lineBreak: false });

  // Signature
  const SIG_Y = DATE_Y + 22;
  doc.rect(DX, SIG_Y, 148, 18).fill(PP.fond2);
  doc.rect(DX, SIG_Y, 148, 18).strokeColor(PP.line).lineWidth(0.4).stroke();
  doc.fontSize(5).fillColor(PP.grisCl).font('Helvetica').text('SIGNATURE', DX + 3, SIG_Y + 3);
  doc.save();
  doc.strokeColor(PP.or).lineWidth(0.8).fillOpacity(0);
  const sx = DX + 8, sy = SIG_Y + 13;
  doc.moveTo(sx, sy)
    .bezierCurveTo(sx + 10, sy - 6, sx + 16, sy + 3,  sx + 28, sy - 2)
    .bezierCurveTo(sx + 36, sy - 6, sx + 42, sy + 3,  sx + 56, sy - 1)
    .bezierCurveTo(sx + 64, sy - 5, sx + 70, sy + 3,  sx + 86, sy - 2)
    .stroke();
  doc.restore();

  // ── QR Code ────────────────────────────────────────────────────────────────
  if (data.qrCodeDataUrl) {
    try {
      const qrBuf = Buffer.from(data.qrCodeDataUrl.split(',')[1], 'base64');
      const QS = 60;
      const QX = W - MR - QS, QY = HEADER_H + 12;
      doc.rect(QX - 2, QY - 2, QS + 4, QS + 4).fill(PP.or);
      doc.image(qrBuf, QX, QY, { width: QS, height: QS });
      doc.fontSize(4.5).fillColor(PP.grisCl).font('Helvetica')
        .text('SCAN / VERIFY', QX - 2, QY + QS + 3, { width: QS + 4, align: 'center' });
    } catch {}
  }

  // ── Zone MRZ ──────────────────────────────────────────────────────────────
  const MRZ_Y = H - 52;
  doc.rect(0, MRZ_Y, W, 52).fill('#030A14');
  doc.rect(0, MRZ_Y, W, 0.6).fill(PP.or);

  doc.fontSize(5.5).fillColor(PP.or).font('Helvetica-Bold')
    .text('MACHINE READABLE ZONE — ZONE DE LECTURE AUTOMATIQUE (OACI/ICAO)', 0, MRZ_Y + 5, { align: 'center', width: W });

  const nomP = (data.nom || '').toUpperCase().replace(/[^A-Z]/g, '');
  const preP = (data.prenoms || '').toUpperCase().replace(/[^A-Z ]/g, '').replace(/ /g, '<');
  const dobP = (data.dateNaissance || '000000').split('/').reverse().join('').substring(2, 8);
  const eidP = (data.id || '').replace(/-/g, '').padEnd(9, '<').substring(0, 9);

  doc.fontSize(7.5).fillColor(PP.cream).font('Courier')
    .text(mrzLine(`P<GIN${nomP}<<${preP}`, 30), ML + 8, MRZ_Y + 17)
    .text(mrzLine(`${eidP}GIN${dobP}0`, 30), ML + 8, MRZ_Y + 30);

  const hash = data.hashBlockchain || sigHash(data.id || '');
  doc.fontSize(4).fillColor(PP.accent).font('Courier')
    .text(`SHA-256: ${hash.substring(0, 40)}... | BLOC #${data.blockIndex || 0}`, ML + 8, MRZ_Y + 42);
}

module.exports = { generer };
