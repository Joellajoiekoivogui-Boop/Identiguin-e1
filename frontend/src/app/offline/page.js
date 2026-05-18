export default function OfflinePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>

        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#0F2544', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 24px' }}>
          📡
        </div>

        <div style={{ height: 3, width: 48, background: 'linear-gradient(to right,#CE1126,#FCD116,#009460)', borderRadius: 2, margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Vous êtes hors ligne</h1>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: 32, lineHeight: 1.6 }}>
          Pas de connexion internet détectée. Les fonctionnalités en cache restent disponibles.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32, textAlign: 'left' }}>
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#047857', marginBottom: 8 }}>✅ Disponible hors ligne</div>
            {['Vérification (données en cache)', 'Espace citoyen (dernière recherche)', 'Navigation entre les pages', 'Consultation des pages'].map(t => (
              <div key={t} style={{ fontSize: 11, color: '#065F46', marginBottom: 4 }}>→ {t}</div>
            ))}
          </div>
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#991B1B', marginBottom: 8 }}>❌ Nécessite internet</div>
            {['Créer un document', 'Télécharger un PDF', 'Révoquer un document', "Panneau d'administration"].map(t => (
              <div key={t} style={{ fontSize: 11, color: '#7F1D1D', marginBottom: 4 }}>→ {t}</div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/verification" style={{ padding: '10px 20px', background: '#0F2544', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Vérifier un document
          </a>
          <a href="/citoyen" style={{ padding: '10px 20px', border: '1px solid #CBD5E1', color: '#374151', borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Espace Citoyen
          </a>
          <a href="/" style={{ padding: '10px 20px', border: '1px solid #CBD5E1', color: '#374151', borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}
