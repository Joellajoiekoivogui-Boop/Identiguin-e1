'use client';
import { useEffect, useRef, useState } from 'react';

export default function QRScanner({ onScan, onFermer }) {
  const scannerRef = useRef(null);
  const instanceRef = useRef(null);
  const [erreurCam, setErreurCam] = useState('');
  const [actif, setActif] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function demarrer() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (ignore) return;

        instanceRef.current = new Html5Qrcode('ig-qr-reader');
        await instanceRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (texte) => {
            // Extraire l'ID du QR code (format URL ou ID direct)
            const match = texte.match(/id=([A-Z0-9-]+)/);
            const id = match ? match[1] : texte.trim();
            onScan(id);
            arreter();
          },
          () => {}
        );
        if (!ignore) setActif(true);
      } catch (e) {
        if (!ignore) setErreurCam('Impossible d\'accéder à la caméra. Vérifiez les permissions du navigateur.');
      }
    }

    demarrer();

    return () => {
      ignore = true;
      arreter();
    };
  }, []);

  const arreter = async () => {
    if (instanceRef.current) {
      try {
        await instanceRef.current.stop();
        instanceRef.current.clear();
      } catch {}
      instanceRef.current = null;
    }
    setActif(false);
  };

  const fermer = async () => {
    await arreter();
    onFermer();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className="card-identite rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold flex items-center gap-2">
            <span>📷</span> Scanner le QR Code
          </h3>
          <button onClick={fermer} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {erreurCam ? (
          <div className="statut-invalide rounded-lg p-4 text-sm text-center">
            <p className="text-2xl mb-2">🚫</p>
            <p>{erreurCam}</p>
          </div>
        ) : (
          <>
            <div
              id="ig-qr-reader"
              ref={scannerRef}
              className="rounded-xl overflow-hidden bg-nuit"
              style={{ width: '100%' }}
            />
            {!actif && (
              <p className="text-center text-gray-400 text-sm mt-3 animate-pulse">
                Démarrage de la caméra...
              </p>
            )}
            {actif && (
              <p className="text-center text-guinee-vert text-sm mt-3">
                ● Pointez la caméra vers le QR code du document
              </p>
            )}
          </>
        )}

        <button onClick={fermer} className="btn-secondaire w-full mt-4 text-sm">
          Annuler
        </button>
      </div>
    </div>
  );
}
