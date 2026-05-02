const QRCode = require('qrcode');

async function generate(text) {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: { dark: '#0A1628', light: '#FFFFFF' },
  });
}

module.exports = { generate };
