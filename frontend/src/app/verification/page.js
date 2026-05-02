'use client';
import { useState, useEffect, Suspense, lazy } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';

const QRScanner = lazy(() => import('../../components/QRScanner'));
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const STATUTS = {
  VALIDE:  { bg: 'rgba(0,148,96,0.10)',  border: 'rgba(0,148,96,0.35)',  text: '#6EE7B7', icon: '✅', label: 'DOCUMENT VALIDE' },
  INVALIDE:{ bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.35)', text: '#FCA5A5', icon: '❌', label: 'DOCUMENT INVALIDE' },
  EXPIRÉ:  { bg: 'rgba(252,209,22,0.08)',border: 'rgba(252,209,22,0.30)',text: '#FDE68A', icon: '⚠', label: 'DOCUMENT EXPIRÉ' },
  RÉVOQUÉ: { bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.35)', text: '#FCA5A5', icon: '🚫', label: 'DOCUMENT RÉVOQUÉ' },
};

const S = {
  page: { minHeight: '100vh', padding: '48px 24px' },
  wrap: { maxWidth: 660, margin: '0 auto' },
  card: { background: 'linear-gradient(135deg,#0D1B2E 0%,#162440 100%)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 3, padding: 24, marginBottom: 14 },
  row:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid rgba(30,47,71,0.6)' },
  lbl:  { fontSize: 9, color: '#4A6080', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 },
  val:  { fontSize: 13, color: '#F0EDE8', fontWeight: 500 },
};

function StatutBanner({ statut }) {
  const c = STATUTS[statut] || STATUTS.INVALIDE;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 3, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
      <span style={{ fontSize: 28 }}>{c.icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: c.text, letterSpacing: '0.06em' }}>{c.label}</div>
        {statut === 'RÉVOQUÉ' && <div style={{ fontSize: 11, color: '#FCA5A5', marginTop: 2, opacity: 0.8 }}>Ce document a été révoqué ou remplacé. Utilisez le nouveau document fourni.</div>}
        {statut === 'EXPIRÉ'  && <div style={{ fontSize: 11, color: '#FDE68A', marginTop: 2, opacity: 0.8 }}>Ce document est arrivé à expiration. Procédez au renouvellement.</div>}
      </div>
    </div>
  );
}

function VerifContenu() {
  const params = useSearchParams();
  const initId = params.get('id') || '';

  const [id,       setId]       = useState(initId);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');
  const [scanner,  setScanner]  = useState(false);

  useEffect(() => { if (initId) doVerif(initId); }, [initId]);

  const doVerif = async (cible) => {
    const q = (cible || id).trim().toUpperCase();
    if (!q) { setError('Veuillez saisir un identifiant.'); return; }
    setLoading(true); setResult(null); setError('');
    try {
      const { data } = await axios.get(`${API}/api/verification/${q}`);
      setResult(data); setId(q);
    } catch (e) {
      setError(e.response?.data?.error || 'Impossible de joindre le serveur de vérification.');
    } finally { setLoading(false); }
  };

  const onScan = (v) => { setScanner(false); setId(v); doVerif(v); };

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 6, fontFamily: 'Playfair Display, Georgia, serif' }}>
            Vérification de Document
          </h1>
          <p style={{ fontSize: 13, color: '#8A9BB5' }}>
            Confirmez instantanément l'authenticité d'un document IdentiGuinée par identifiant ou QR code.
          </p>
        </div>

        {/* Formulaire */}
        <div style={S.card}>
          <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D4AF37', display: 'block', marginBottom: 8 }}>
            Identifiant unique du document
          </label>
          <form onSubmit={e => { e.preventDefault(); doVerif(); }} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <input
              type="text" value={id}
              onChange={e => setId(e.target.value.toUpperCase())}
              placeholder="GN-2026-XXXXXX"
              className="field-input font-mono-ig"
              style={{ flex: 1, fontSize: 15, letterSpacing: '0.06em' }}
            />
            <button type="submit" disabled={loading} className="btn btn-or" style={{ flexShrink: 0 }}>
              {loading ? '…' : 'Vérifier'}
            </button>
          </form>

          <button onClick={() => setScanner(true)} style={{
            width: '100%', padding: '9px', background: 'transparent',
            border: '1px dashed #1E2F47', borderRadius: 3, cursor: 'pointer',
            fontSize: 11, color: '#4A6080', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8, transition: 'all 0.15s',
          }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.color = '#D4AF37'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#1E2F47'; e.currentTarget.style.color = '#4A6080'; }}>
            📷 Scanner le QR code avec la caméra
          </button>
          <p style={{ fontSize: 10, color: '#4A6080', marginTop: 8 }}>Format : GN-AAAA-XXXXXX — ex : GN-2026-A7X9K3</p>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 3, padding: '10px 14px', fontSize: 12, color: '#FCA5A5', marginBottom: 14 }}>
            ⚠ {error}
          </div>
        )}

        {/* Résultat */}
        {result && (
          <div>
            <StatutBanner statut={result.statut} />

            {/* Titulaire */}
            {result.titulaire && (
              <div style={S.card}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
                  Informations du titulaire
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                  {[
                    { l: 'Nom complet',     v: `${result.titulaire.prenoms} ${(result.titulaire.nom || '').toUpperCase()}` },
                    { l: 'Date de naissance', v: result.titulaire.dateNaissance },
                    { l: 'Nationalité',     v: result.titulaire.nationalite },
                    { l: 'Type de document', v: result.type === 'carte' ? "🪪 Carte d'Identité" : '📕 Passeport' },
                    { l: "Date d'émission",  v: result.dateEmission },
                    { l: "Date d'expiration", v: result.dateExpiration, warn: result.statut !== 'VALIDE' },
                  ].map(r => (
                    <div key={r.l} style={{ borderBottom: '1px solid rgba(30,47,71,0.6)', padding: '9px 0' }}>
                      <div style={S.lbl}>{r.l}</div>
                      <div style={{ ...S.val, color: r.warn ? '#FDE68A' : '#F0EDE8' }}>{r.v}</div>
                    </div>
                  ))}
                </div>

                {result.renouvellementDe && (
                  <div style={{ marginTop: 14, padding: '8px 12px', background: 'rgba(30,80,160,0.12)', border: '1px solid rgba(30,80,160,0.3)', borderRadius: 3, fontSize: 11, color: '#93C5FD' }}>
                    🔄 Renouvellement de <span className="font-mono-ig">{result.renouvellementDe}</span>
                  </div>
                )}

                {result.valide && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #1E2F47', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <a href={`${API}/api/documents/pdf/${result.documentId}`} target="_blank" rel="noopener noreferrer" className="btn btn-or" style={{ fontSize: 11, padding: '7px 16px' }}>
                      ⬇ Télécharger le PDF
                    </a>
                    <a href={`/renouvellement?id=${result.documentId}`} className="btn btn-ghost" style={{ fontSize: 11, padding: '7px 16px' }}>
                      Renouveler →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Blockchain */}
            {result.blockchain && (
              <div style={{ background: '#0D1B2E', border: '1px solid #1E2F47', borderRadius: 3, padding: 20 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#009460', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  ⛓ Preuve Blockchain
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={S.lbl}>Hash SHA-256</div>
                  <div className="hash-display">{result.blockchain.hash}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {[
                    { l: 'Bloc',       v: `#${result.blockchain.blockIndex}`,                                    c: '#6EE7B7' },
                    { l: 'Intégrité',  v: result.blockchain.integrite ? '✓ Intact' : '✗ Altéré',              c: result.blockchain.integrite ? '#6EE7B7' : '#FCA5A5' },
                    { l: 'Ancré le',   v: new Date(result.blockchain.timestamp).toLocaleDateString('fr-FR'),   c: '#93C5FD' },
                  ].map(b => (
                    <div key={b.l} style={{ background: '#08111F', borderRadius: 3, padding: '10px 12px' }}>
                      <div style={S.lbl}>{b.l}</div>
                      <div className="font-mono-ig" style={{ fontSize: 12, fontWeight: 700, color: b.c }}>{b.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Aide */}
        {!result && !loading && (
          <div style={{ background: '#0D1B2E', border: '1px solid #1E2F47', borderRadius: 3, padding: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#8A9BB5', marginBottom: 10 }}>Comment vérifier un document ?</div>
            {[
              "Saisissez l'identifiant unique imprimé sur le document (format : GN-AAAA-XXXXXX)",
              'Ou cliquez sur « Scanner le QR code » pour utiliser votre caméra',
              'La vérification est instantanée et disponible 24h/24, 7j/7',
            ].map(t => (
              <div key={t} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span style={{ color: '#D4AF37', flexShrink: 0 }}>—</span>
                <span style={{ fontSize: 11, color: '#4A6080' }}>{t}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {scanner && (
        <Suspense fallback={null}>
          <QRScanner onScan={onScan} onFermer={() => setScanner(false)} />
        </Suspense>
      )}
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A9BB5' }}>Chargement…</div>}>
      <VerifContenu />
    </Suspense>
  );
}
