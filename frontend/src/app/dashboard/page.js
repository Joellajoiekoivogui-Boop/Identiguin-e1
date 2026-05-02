'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const S = {
  page: { minHeight: '100vh', padding: '48px 24px' },
  wrap: { maxWidth: 1100, margin: '0 auto' },
  card: { background: 'linear-gradient(135deg,#0D1B2E 0%,#162440 100%)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 3, padding: 24 },
};

export default function DashboardPage() {
  const [chain,   setChain]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/documents/chain`)
      .then(r => setChain(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const docs      = chain.filter(b => b.data?.id && b.data?.nom);
  const cartes    = docs.filter(b => b.data.type === 'carte').length;
  const passeports= docs.filter(b => b.data.type === 'passeport').length;

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 6, fontFamily: 'Playfair Display, Georgia, serif' }}>
            Explorateur Blockchain
          </h1>
          <p style={{ fontSize: 13, color: '#8A9BB5' }}>
            Vue en temps réel de la chaîne de blocs IdentiGuinée — chaque document émis est inscrit ici de façon permanente.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { icon: '⛓', label: 'Total blocs',       val: chain.length, color: '#D4AF37' },
            { icon: '📄', label: 'Documents émis',    val: docs.length,  color: '#E8C56A' },
            { icon: '🪪', label: 'Cartes d\'identité', val: cartes,       color: '#6EE7B7' },
            { icon: '📕', label: 'Passeports',         val: passeports,   color: '#C084FC' },
          ].map(s => (
            <div key={s.label} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <span style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.val}</span>
              </div>
              <div style={{ fontSize: 11, color: '#4A6080' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Chaîne */}
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                ⛓ Chaîne de blocs — {chain.length} blocs
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6EE7B7' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#009460', display: 'inline-block' }} />
                Blockchain opérationnelle — Intégrité vérifiée
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href="/demande" className="btn btn-or" style={{ fontSize: 11, padding: '7px 14px' }}>+ Nouveau document</a>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#4A6080', fontSize: 13 }}>
              Chargement de la chaîne…
            </div>
          ) : chain.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⛓</div>
              <p style={{ color: '#4A6080', fontSize: 13 }}>Aucun bloc disponible. Démarrez le serveur backend puis créez votre premier document.</p>
            </div>
          ) : (
            <div style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
              {[...chain].reverse().map(bloc => (
                <div key={bloc.hash} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '12px 14px', borderRadius: 3, marginBottom: 4,
                  background: '#08111F', border: '1px solid rgba(30,47,71,0.8)',
                  transition: 'border-color 0.15s',
                }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.25)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(30,47,71,0.8)'}>
                  {/* Index */}
                  <div style={{ background: '#162440', border: '1px solid #1E2F47', borderRadius: 2, padding: '4px 8px', fontSize: 11, fontWeight: 700, color: '#D4AF37', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
                    #{bloc.index}
                  </div>
                  {/* Contenu */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {bloc.data?.id ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#F0EDE8' }}>
                            {bloc.data.prenoms} {(bloc.data.nom || '').toUpperCase()}
                          </span>
                          <span className="chip chip-or">{bloc.data.type === 'carte' ? '🪪 Carte' : '📕 Passeport'}</span>
                          {bloc.data.renouvellementDe && <span className="chip" style={{ fontSize: 9, color: '#93C5FD', background: 'rgba(30,80,160,0.1)', border: '1px solid rgba(30,80,160,0.3)' }}>Renouvellement</span>}
                        </div>
                        <div style={{ fontSize: 11, color: '#4A6080', fontFamily: 'JetBrains Mono, monospace', marginBottom: 3 }}>{bloc.data.id}</div>
                      </>
                    ) : bloc.data?.type === 'REVOCATION' ? (
                      <div style={{ fontSize: 12, color: '#FCA5A5' }}>🚫 Révocation — {bloc.data.documentId}</div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#4A6080' }}>{bloc.data?.message || 'Bloc système'}</div>
                    )}
                    <div className="hash-display" style={{ marginTop: 2 }}>{bloc.hash}</div>
                  </div>
                  {/* Date */}
                  <div style={{ fontSize: 10, color: '#4A6080', flexShrink: 0, textAlign: 'right' }}>
                    <div>{new Date(bloc.timestamp).toLocaleDateString('fr-FR')}</div>
                    <div>{new Date(bloc.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
