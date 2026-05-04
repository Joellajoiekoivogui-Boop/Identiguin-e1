'use client';
import { useEffect, useState } from 'react';

export default function PWAInstall() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Capture install prompt
    const handler = (e) => { e.preventDefault(); setPrompt(e); setVisible(true); };
    window.addEventListener('beforeinstallprompt', handler);

    // Detect if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true);
    window.addEventListener('appinstalled', () => { setInstalled(true); setVisible(false); });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') { setInstalled(true); setVisible(false); }
  };

  if (!visible || installed) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, maxWidth: 380, width: 'calc(100% - 32px)',
      background: '#0F2544', borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 14,
      border: '1px solid rgba(200,168,48,0.35)',
      animation: 'slideUp 0.3s ease',
    }}>
      <div style={{ fontSize: 34, flexShrink: 0 }}>🇬🇳</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
          Installer IdentiGuinée
        </div>
        <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.4 }}>
          Accédez directement depuis votre écran d'accueil, même hors ligne.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button onClick={install} style={{
          background: 'linear-gradient(135deg,#C8A830,#DAB94A)',
          border: 'none', borderRadius: 6, padding: '7px 14px',
          fontSize: 12, fontWeight: 700, color: '#0F2544', cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
          Installer
        </button>
        <button onClick={() => setVisible(false)} style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6, padding: '5px 10px',
          fontSize: 11, color: '#64748B', cursor: 'pointer',
        }}>
          Plus tard
        </button>
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
