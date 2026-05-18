const PDFDocument = require('pdfkit');
const fs = require('fs');

const MONTHS_EN = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function formatDate(s) {
  if (!s) return '—';
  let d, m, y;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { [y,m,d] = s.split('-'); }
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) { [d,m,y] = s.split('/'); }
  else { return s.toUpperCase(); }
  return `${d} ${MONTHS_EN[parseInt(m,10)-1]||'?'} ${y}`;
}

function mrzLine(str, len) {
  return str.toUpperCase().replace(/[^A-Z0-9<]/g,'<').padEnd(len,'<').substring(0,len);
}

function drawFingerprint(doc, cx, cy, color) {
  doc.save().strokeColor(color).fillOpacity(0);
  for (let i = 1; i <= 10; i++) {
    const dx = Math.sin(i*0.65)*1.1, dy = Math.cos(i*0.85)*0.7;
    doc.lineWidth(i<4?0.35:i<8?0.4:0.45);
    doc.ellipse(cx+dx, cy+dy, 2.2+i*1.85, 2.8+i*1.45).stroke();
  }
  doc.fillOpacity(1).circle(cx,cy,1.3).fill(color);
  doc.restore();
}

function drawSignature(doc, sx, sy, color) {
  doc.save().fillOpacity(0).strokeColor(color);
  doc.lineWidth(0.95);
  doc.moveTo(sx+2,sy-1).bezierCurveTo(sx,sy-5,sx+7,sy-8,sx+11,sy-3)
    .bezierCurveTo(sx+13,sy,sx+9,sy+4,sx+6,sy+2).stroke();
  doc.lineWidth(0.85);
  doc.moveTo(sx+12,sy-7).bezierCurveTo(sx+13,sy-2,sx+14,sy,sx+15,sy+3).stroke();
  doc.moveTo(sx+15,sy-2).bezierCurveTo(sx+19,sy-4,sx+23,sy-3,sx+25,sy).stroke();
  doc.moveTo(sx+15,sy).bezierCurveTo(sx+19,sy+2,sx+23,sy+4,sx+25,sy+4).stroke();
  doc.lineWidth(0.7);
  doc.moveTo(sx+25,sy).bezierCurveTo(sx+32,sy-3,sx+40,sy+2,sx+48,sy-1)
    .bezierCurveTo(sx+54,sy-3,sx+60,sy+2,sx+65,sy).stroke();
  doc.moveTo(sx+65,sy).bezierCurveTo(sx+72,sy-3,sx+78,sy+2,sx+76,sy+7)
    .bezierCurveTo(sx+74,sy+10,sx+64,sy+9,sx+61,sy+5).stroke();
  doc.lineWidth(0.4);
  doc.moveTo(sx+1,sy+11).bezierCurveTo(sx+26,sy+13,sx+55,sy+10,sx+78,sy+12).stroke();
  doc.restore();
}

function drawECOWASLogo(doc, cx, cy, r) {
  doc.save();
  doc.circle(cx,cy,r).fillColor('#B84000').fill();
  doc.circle(cx,cy,r).strokeColor('#FFFFFF').lineWidth(0.7).stroke();
  doc.circle(cx,cy,r*0.68).strokeColor('#FFFFFF').lineWidth(0.45).stroke();
  // Simplified Africa shape
  doc.save().strokeColor('#FFFFFF').lineWidth(0.5).fillOpacity(0);
  doc.moveTo(cx-2,cy-5).lineTo(cx+2,cy-5).lineTo(cx+4,cy-2)
    .lineTo(cx+3,cy+3).lineTo(cx,cy+6).lineTo(cx-3,cy+3)
    .lineTo(cx-4,cy-2).closePath().stroke();
  doc.restore();
  doc.fontSize(2.6).fillColor('#FFFFFF').font('Helvetica-Bold')
    .text('CEDEAO', cx-r+1, cy+r-4.5, {width:r*2-2, align:'center'});
  doc.restore();
}

function drawHeader(doc, x, y, w) {
  const H = 38;
  doc.rect(x,y,w,H).fill('#C04400');
  drawECOWASLogo(doc, x+19, y+H/2, 14);
  const TW = w-76, TX = x+38;
  doc.fontSize(9.5).fillColor('#FFFFFF').font('Helvetica-Bold')
    .text('RÉPUBLIQUE DE GUINÉE', TX, y+5, {width:TW, align:'center'});
  doc.fontSize(6.5).font('Helvetica-Bold')
    .text("CARTE D'IDENTITE CEDEAO", TX, y+17, {width:TW, align:'center'});
  doc.fontSize(3.8).font('Helvetica')
    .text('ECOWAS IDENTITY CARD / BILHETE DE IDENTIDADE CEDEAO', TX, y+27, {width:TW, align:'center'});
  // Guinea flag
  const FX=x+w-33, FY=y+7, FW=24, FH=14;
  doc.rect(FX,      FY, FW/3, FH).fill('#CE1126');
  doc.rect(FX+FW/3, FY, FW/3, FH).fill('#FCD116');
  doc.rect(FX+FW*2/3,FY,FW/3, FH).fill('#009460');
  doc.rect(FX,FY,FW,FH).strokeColor('#FFFFFF').lineWidth(0.3).stroke();
  return H;
}

function drawCardBody(doc, x, y, w, h) {
  doc.rect(x,y,w,h).fill('#ECE7D5');
  doc.save();
  doc.strokeColor('#D5CCAB').lineWidth(0.13);
  for (let i=-10; i<h+10; i+=3.8) {
    doc.moveTo(x,y+i).lineTo(x+w, y+i+Math.sin(i*0.14)*7).stroke();
  }
  for (let i=-10; i<w+10; i+=3.8) {
    doc.moveTo(x+i,y).lineTo(x+i+Math.cos(i*0.11)*6, y+h).stroke();
  }
  doc.restore();
  doc.rect(x,y,w,h).strokeColor('#7A6535').lineWidth(0.5).stroke();
}

async function generer(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({size:[700,260], margins:{top:0,bottom:0,left:0,right:0}});
    const chunks=[];
    doc.on('data', c=>chunks.push(c));
    doc.on('end', ()=>resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    if (data.type==='passeport') genererPasseport(doc,data);
    else genererCarte(doc,data);
    doc.end();
  });
}

function genererCarte(doc, data) {
  const CW=320, CH=202;
  const RX=12, RY=22; // recto
  const VX=362, VY=22; // verso

  // Page background
  doc.rect(0,0,700,260).fill('#B0B4BA');

  // Shadows
  doc.rect(RX+3,RY+3,CW,CH).fill('#7A7E84');
  doc.rect(VX+3,VY+3,CW,CH).fill('#7A7E84');

  // ── RECTO ────────────────────────────────────────────
  drawCardBody(doc, RX, RY, CW, CH);
  const HDR = drawHeader(doc, RX, RY, CW);

  // Photo
  const PHX=RX+7, PHY=RY+HDR+6, PHW=73, PHH=91;
  doc.rect(PHX,PHY,PHW,PHH).fill('#F0EDE6').strokeColor('#222').lineWidth(0.5).stroke();
  if (data.photoPath && fs.existsSync(data.photoPath)) {
    try {
      doc.image(data.photoPath, PHX,PHY, {width:PHW, height:PHH, cover:[PHW,PHH]});
      doc.rect(PHX,PHY,PHW,PHH).strokeColor('#222').lineWidth(0.5).stroke();
    } catch {}
  } else {
    doc.fontSize(5).fillColor('#999').text('PHOTO', PHX, PHY+PHH/2-3, {width:PHW,align:'center'});
  }

  // Signature
  const SGY = PHY+PHH+7;
  doc.fontSize(3.5).fillColor('#666').font('Helvetica')
    .text('Signature / Signature', PHX, SGY);
  doc.moveTo(PHX,SGY+8).lineTo(PHX+PHW,SGY+8).strokeColor('#999').lineWidth(0.3).stroke();
  drawSignature(doc, PHX+2, SGY+14, '#111');

  // Data fields
  const DX=PHX+PHW+8, DW=152;

  function lbl(txt, x, y, w) {
    doc.fontSize(3.5).fillColor('#757575').font('Helvetica')
      .text(txt, x, y, {width:w||DW, lineBreak:false});
  }
  function val(txt, x, y, w, sz, bold) {
    doc.fontSize(sz||7.8).fillColor('#0A0D12')
      .font((bold!==false)?'Helvetica-Bold':'Helvetica')
      .text((txt||'—').toString().toUpperCase(), x, y+5, {width:w||DW, ellipsis:true, lineBreak:false});
  }
  function sep(y) {
    doc.moveTo(DX,y).lineTo(DX+DW,y).strokeColor('#C2B894').lineWidth(0.2).stroke();
  }

  let fY = PHY;

  lbl('Nom / Surname', DX, fY);
  val(data.nom, DX, fY, DW, 8.5);
  fY+=17; sep(fY);

  lbl('Prénom / First name', DX, fY);
  val(data.prenoms, DX, fY, DW, 7.5);
  fY+=16; sep(fY);

  lbl('Nationalité / Nationality', DX, fY);
  val(data.nationalite||'GUINEENNE', DX, fY, DW, 6.5, false);
  fY+=15; sep(fY);

  lbl('Date de naissance / Date of birth', DX, fY);
  val(formatDate(data.dateNaissance), DX, fY, DW, 7.5);
  fY+=16; sep(fY);

  const HW=(DW-6)/2;
  lbl("Date d'émission / Date of issuance", DX, fY, HW);
  val(formatDate(data.dateEmission), DX, fY, HW, 6.2, false);
  lbl("Date d'expiration / Date of expiry", DX+HW+6, fY, HW);
  val(formatDate(data.dateExpiration), DX+HW+6, fY, HW, 6.2, false);
  fY+=15; sep(fY);

  lbl("Numéro d'identité / ID number", DX, fY);
  val(data.id, DX, fY, DW, 8.5);
  fY+=17; sep(fY);

  lbl("Lieu de délivrance / Place of issuance", DX, fY);
  val((data.lieuDelivrance||'CONAKRY').toUpperCase()+' / M.S.P.C', DX, fY, DW, 6.5, false);

  // Right column: sexe / taille / ghost photo
  const RCX=DX+DW+6;
  const RCW=RX+CW-RCX-5;
  let rcY=PHY;

  doc.fontSize(3.5).fillColor('#757575').font('Helvetica')
    .text('Sexe / Sex', RCX, rcY, {width:RCW, lineBreak:false});
  doc.fontSize(11).fillColor('#0A0D12').font('Helvetica-Bold')
    .text(data.sexe==='M'?'M':'F', RCX, rcY+5, {width:RCW, lineBreak:false});
  rcY+=23;

  doc.fontSize(3.5).fillColor('#757575').font('Helvetica')
    .text('Taille / Height', RCX, rcY, {width:RCW, lineBreak:false});
  doc.fontSize(7).fillColor('#0A0D12').font('Helvetica')
    .text(data.taille||'—', RCX, rcY+5, {width:RCW, lineBreak:false});
  rcY+=20;

  if (data.photoPath && fs.existsSync(data.photoPath)) {
    const GPW=Math.min(RCW,50), GPH=Math.round(GPW*(PHH/PHW));
    try {
      doc.save().opacity(0.28);
      doc.image(data.photoPath, RCX, rcY, {width:GPW, height:GPH, cover:[GPW,GPH]});
      doc.restore();
    } catch {}
  }

  // ── VERSO ────────────────────────────────────────────
  drawCardBody(doc, VX, VY, CW, CH);
  drawHeader(doc, VX, VY, CW);

  let vY=VY+HDR+8;
  const VDX=VX+8, VDW=CW-16;

  function vLbl(txt,x,y,w){ doc.fontSize(3.5).fillColor('#757575').font('Helvetica').text(txt,x,y,{width:w||VDW,lineBreak:false}); }
  function vVal(txt,x,y,w){ doc.fontSize(6.5).fillColor('#0A0D12').font('Helvetica').text((txt||'—').toString().toUpperCase(),x,y+5,{width:w||VDW,ellipsis:true,lineBreak:false}); }
  function vSep(y){ doc.moveTo(VDX,y).lineTo(VDX+VDW,y).strokeColor('#C2B894').lineWidth(0.2).stroke(); }

  vLbl('Adresse / Address', VDX, vY); vVal(data.adresse, VDX, vY); vY+=14; vSep(vY);
  vLbl('Profession', VDX, vY, VDW/2); vVal(data.profession, VDX, vY, VDW/2);
  vLbl('Situation matrimoniale / Marital status', VDX+VDW/2+4, vY, VDW/2-4);
  vVal(data.situationMatrimoniale, VDX+VDW/2+4, vY, VDW/2-4);
  vY+=14; vSep(vY);
  vLbl('Email', VDX, vY); vVal(data.email||'—', VDX, vY); vY+=14; vSep(vY);
  vY+=4;

  // Fingerprint
  const FPW=46, FPH=54, FPX=VDX, FPY=vY;
  doc.rect(FPX,FPY,FPW,FPH).fill('#F2EDE2').strokeColor('#B0A888').lineWidth(0.4).stroke();
  drawFingerprint(doc, FPX+FPW/2, FPY+FPH/2+4, '#3A5080');
  doc.fontSize(3.5).fillColor('#888').text('EMPREINTE / FINGERPRINT', FPX, FPY+FPH+2, {width:FPW,align:'center'});

  // QR Code
  if (data.qrCodeDataUrl) {
    try {
      const qrBuf=Buffer.from(data.qrCodeDataUrl.split(',')[1],'base64');
      const QX=FPX+FPW+6, QY=vY, QS=56;
      doc.image(qrBuf, QX,QY, {width:QS,height:QS});
      doc.fontSize(3.5).fillColor('#666').text('VÉRIFIER EN LIGNE', QX, QY+QS+2, {width:QS,align:'center'});
      // Hash
      const HX=QX+QS+6, HW=VDW-FPW-6-QS-6;
      if (HW>20 && data.hashBlockchain) {
        doc.fontSize(3.5).fillColor('#757575').font('Helvetica').text('Blockchain SHA-256', HX, vY);
        doc.fontSize(3.2).fillColor('#0A0D12').font('Courier')
          .text(data.hashBlockchain.substring(0,28), HX, vY+7, {width:HW});
        doc.fontSize(3.2).fillColor('#0A0D12').font('Courier')
          .text(data.hashBlockchain.substring(28,56), HX, vY+14, {width:HW});
        doc.fontSize(3.5).fillColor('#757575').font('Helvetica')
          .text(`Bloc #${data.blockIndex||0}`, HX, vY+22);
      }
    } catch {}
  }

  // MRZ
  const MRZY=VY+CH-30;
  doc.rect(VX,MRZY-2,CW,32).fill('#EDE8D5');
  doc.moveTo(VX,MRZY-2).lineTo(VX+CW,MRZY-2).strokeColor('#B0A888').lineWidth(0.3).stroke();
  const nomMRZ=(data.nom||'').toUpperCase().replace(/\s/g,'<').padEnd(15,'<').substring(0,15);
  const preMRZ=(data.prenoms||'').toUpperCase().replace(/\s/g,'<').padEnd(15,'<').substring(0,15);
  let dobMRZ='000000';
  const dob=data.dateNaissance||'';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) dobMRZ=dob.substring(2,4)+dob.substring(5,7)+dob.substring(8,10);
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) { const [dd,mm,yyyy]=dob.split('/'); dobMRZ=yyyy.substring(2)+mm+dd; }
  const sexMRZ=data.sexe==='M'?'M':'F';
  const idMRZ=(data.id||'').replace(/[^A-Z0-9]/gi,'').toUpperCase().padEnd(9,'<').substring(0,9);
  doc.fontSize(6.5).font('Courier').fillColor('#0A0D12');
  doc.text(mrzLine(`IDGIN${idMRZ}<GIN<<<<<<<<<<<<<<`,30), VX+5, MRZY);
  doc.text(mrzLine(`${dobMRZ}${sexMRZ}3112315GIN<<<<<<<<<<<4`,30), VX+5, MRZY+8);
  doc.text(mrzLine(`${nomMRZ}<<${preMRZ}<<<<<<<<`,30), VX+5, MRZY+16);

  // Legend
  doc.fontSize(7.5).fillColor('#2D3748').font('Helvetica-Bold')
    .text("CARTE NATIONALE D'IDENTITÉ BIOMÉTRIQUE — RECTO / VERSO", RX, RY+CH+10);
  doc.fontSize(5.5).fillColor('#718096').font('Helvetica')
    .text(`IdentiGuinée · Bloc #${data.blockIndex||0} · Émis le ${formatDate(data.dateEmission)}`, RX, RY+CH+20);
}

function genererPasseport(doc, data) {
  const W=612, H=390;
  doc.rect(0,0,W,H).fill('#0D1B3E');
  doc.save();
  doc.strokeColor('#1E3A5F').lineWidth(0.3);
  for (let i=0;i<W;i+=15) doc.moveTo(i,0).bezierCurveTo(i+50,H/2,i-50,H/2,i,H).stroke();
  doc.restore();
  doc.rect(0,0,W,50).fill('#09142E');
  doc.rect(0,50,W,2).fill('#C8A830');
  doc.fontSize(14).fillColor('#C8A830').font('Helvetica-Bold')
    .text('RÉPUBLIQUE DE GUINÉE',20,10).text('PASSEPORT / PASSPORT',20,26);
  doc.fontSize(10).fillColor('#FFFFFF').font('Helvetica-Bold')
    .text('Type',W-150,10).text('P',W-150,22)
    .text('Code',W-100,10).text('GIN',W-100,22)
    .text('Passeport No.',W-220,10).text(data.id||'—',W-220,22);
  const PX=30,PY=70,PW=130,PH=170;
  doc.rect(PX-2,PY-2,PW+4,PH+4).fill('#C8A830');
  doc.rect(PX,PY,PW,PH).fill('#F1F5F9');
  if (data.photoPath&&fs.existsSync(data.photoPath)) {
    try { doc.image(data.photoPath,PX,PY,{width:PW,height:PH,cover:[PW,PH]}); } catch {}
  }
  const DX=PX+PW+30,DW=W-DX-30;
  let dY=70;
  function ppFld(label,val,x,y,w,bold) {
    doc.fontSize(6).fillColor('#8A9BB5').font('Helvetica').text(label,x,y);
    doc.fontSize(bold?11:9).fillColor('#FFFFFF').font(bold?'Helvetica-Bold':'Helvetica')
      .text((val||'—').toString().toUpperCase(),x,y+8,{width:w});
    doc.rect(x,y+20,w,0.3).fill('#1E3A5F');
  }
  ppFld('NOM / SURNAME',data.nom,DX,dY,DW,true); dY+=27;
  ppFld('PRÉNOMS / GIVEN NAMES',data.prenoms,DX,dY,DW,true); dY+=27;
  ppFld('NATIONALITÉ / NATIONALITY','GUINÉENNE',DX,dY,DW); dY+=22;
  ppFld('DATE DE NAISSANCE / DATE OF BIRTH',formatDate(data.dateNaissance),DX,dY,DW/2);
  ppFld('SEXE / SEX',data.sexe==='M'?'M':'F',DX+DW/2+10,dY,DW/2-10); dY+=22;
  ppFld('LIEU DE NAISSANCE / PLACE OF BIRTH',data.lieuNaissance,DX,dY,DW); dY+=22;
  ppFld('DATE DE DÉLIVRANCE / DATE OF ISSUE',formatDate(data.dateEmission),DX,dY,DW/2);
  ppFld("DATE D'EXPIRATION / DATE OF EXPIRY",formatDate(data.dateExpiration),DX+DW/2+10,dY,DW/2-10); dY+=22;
  ppFld('AUTORITÉ / AUTHORITY',data.lieuDelivrance,DX,dY,DW);
  const MRZY=H-60;
  doc.rect(0,MRZY-10,W,70).fill('#050B1A');
  doc.fontSize(12).font('Courier').fillColor('#FFFFFF');
  const nomMRZ=(data.nom||'').toUpperCase().replace(/ /g,'<').padEnd(20,'<').substring(0,20);
  const preMRZ=(data.prenoms||'').toUpperCase().replace(/ /g,'<').padEnd(15,'<').substring(0,15);
  let dobMRZ='000000';
  const dob=data.dateNaissance||'';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dob)) dobMRZ=dob.substring(2,4)+dob.substring(5,7)+dob.substring(8,10);
  const idMRZ=(data.id||'').replace(/-/g,'').padEnd(9,'<').substring(0,9);
  doc.text(mrzLine(`P<GIN${nomMRZ}<<${preMRZ}`,44),30,MRZY);
  doc.text(mrzLine(`${idMRZ}<8GIN${dobMRZ}4M2412311<<<<<<<<<<<<<<06`,44),30,MRZY+15);
}

module.exports = { generer };
