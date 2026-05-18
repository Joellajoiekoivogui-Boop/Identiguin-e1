const nodemailer = require('nodemailer');

function creerTransport() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

async function envoyerConfirmationDocument(doc) {
  if (!doc.email) return;
  const transport = creerTransport();
  if (!transport) return; // Email non configuré — on passe silencieusement

  const typeLabel = doc.type === 'passeport' ? 'Passeport Électronique' : "Carte Nationale d'Identité";
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#C04400;padding:20px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:18px">RÉPUBLIQUE DE GUINÉE</h1>
        <p style="color:#FFD080;margin:4px 0;font-size:13px">IdentiGuinée — Plateforme d'Identité Numérique</p>
      </div>
      <div style="padding:30px;background:#f9f9f9">
        <h2 style="color:#0F172A">Votre document est prêt ✅</h2>
        <p>Bonjour <strong>${doc.prenoms} ${doc.nom?.toUpperCase()}</strong>,</p>
        <p>Votre <strong>${typeLabel}</strong> a été généré avec succès et ancré sur la blockchain IdentiGuinée.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr style="background:#f1f5f9"><td style="padding:8px 12px;font-weight:bold;color:#64748B;font-size:12px">IDENTIFIANT</td><td style="padding:8px 12px;font-family:monospace;font-weight:bold;color:#0F172A">${doc.id}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:bold;color:#64748B;font-size:12px">TYPE</td><td style="padding:8px 12px">${typeLabel}</td></tr>
          <tr style="background:#f1f5f9"><td style="padding:8px 12px;font-weight:bold;color:#64748B;font-size:12px">DATE D'ÉMISSION</td><td style="padding:8px 12px">${doc.dateEmission}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:bold;color:#64748B;font-size:12px">DATE D'EXPIRATION</td><td style="padding:8px 12px">${doc.dateExpiration}</td></tr>
          <tr style="background:#f1f5f9"><td style="padding:8px 12px;font-weight:bold;color:#64748B;font-size:12px">HASH BLOCKCHAIN</td><td style="padding:8px 12px;font-family:monospace;font-size:11px;word-break:break-all">${doc.hashBlockchain}</td></tr>
        </table>
        <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:8px;padding:15px;margin:20px 0">
          <p style="color:#047857;margin:0;font-size:13px">🔒 Ce document est sécurisé par la blockchain IdentiGuinée. Conservez précieusement votre identifiant.</p>
        </div>
        <p><a href="${doc.verificationUrl}" style="background:#C04400;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold">Vérifier mon document</a></p>
      </div>
      <div style="background:#1e293b;padding:15px;text-align:center">
        <p style="color:#94A3B8;font-size:11px;margin:0">IdentiGuinée · Ministère de la Sécurité et de la Protection Civile</p>
      </div>
    </div>`;

  await transport.sendMail({
    from: `"IdentiGuinée" <${process.env.EMAIL_USER}>`,
    to: doc.email,
    subject: `✅ Votre ${typeLabel} est prêt — ${doc.id}`,
    html,
  });
}

async function envoyerAlerteExpiration(doc, joursRestants) {
  if (!doc.email) return;
  const transport = creerTransport();
  if (!transport) return;

  await transport.sendMail({
    from: `"IdentiGuinée" <${process.env.EMAIL_USER}>`,
    to: doc.email,
    subject: `⚠️ Votre document expire dans ${joursRestants} jours — ${doc.id}`,
    html: `<p>Bonjour ${doc.prenoms} ${doc.nom},<br>Votre document <strong>${doc.id}</strong> expire dans <strong>${joursRestants} jours</strong>. Pensez à le renouveler.</p>`,
  });
}

module.exports = { envoyerConfirmationDocument, envoyerAlerteExpiration };
