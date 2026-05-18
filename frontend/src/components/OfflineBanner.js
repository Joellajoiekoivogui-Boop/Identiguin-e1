'use client';
import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [syncInfo, setSyncInfo] = useState(null);

  useEffect(() => {
    setOffline(!navigator.onLine);

    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);

    // Charger les métadonnées du dernier sync
    import('../utils/offlineDB').then(({ getSnapshotMeta }) => {
      getSnapshotMeta().then(meta => { if (meta) setSyncInfo(meta); });
    });

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  if (!offline) return null;

  const syncDate = syncInfo?.value
    ? new Date(syncInfo.value).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div style={{
      background: '#78350F',
      color: '#FEF3C7',
      padding: '8px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontSize: 12,
      fontWeight: 600,
      borderBottom: '2px solid #D97706',
    }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>📡</span>
      <span>
        Mode hors ligne — vérification et consultation depuis les données en cache
        {syncDate && <span style={{ fontWeight: 400, opacity: 0.8 }}> · mis à jour le {syncDate} ({syncInfo.total} docs)</span>}
      </span>
      <a href="/offline" style={{ marginLeft: 'auto', color: '#FCD34D', fontSize: 11, textDecoration: 'underline', flexShrink: 0 }}>
        En savoir plus
      </a>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: '#FCA5A5', flexShrink: 0,
        animation: 'ofp 2s infinite',
      }} />
      <style>{`@keyframes ofp { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
    </div>
  );
}
