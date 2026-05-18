'use client';
import { useState, useEffect, Suspense, lazy } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { getDocumentOffline } from '../../utils/offlineDB';

const QRScanner = lazy(() => import('../../components/QRScanner'));
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

function buildOfflineResult(doc) {
  const now = new Date();
  const [d, m, y] = (doc.dateExpiration || '').split('/');
  const exp = y ? new Date(`${y}-${m}-${d}`) : null;
  const joursRestants = exp ? Math.ceil((exp - now) / 86400000) : null;
  const statut = doc.statut === 'RÉVOQUÉ' ? 'RÉVOQUÉ'
    : (joursRestants !== null && joursRestants < 0 ? 'EXPIRÉ' : 'VALIDE');
  return {
    valide: statut === 'VALIDE',
    statut,
    documentId: doc.id,
    type: doc.type,
    titulaire: { nom: doc.nom, prenoms: doc.prenoms, dateNaissance: doc.dateNaissance, nationalite: doc.nationalite },
    dateEmission: doc.dateEmission,
    dateExpiration: doc.dateExpiration,
    joursRestants,
    renouvellementDe: null,
    blockchain: { hash: doc.hash, blockIndex: doc.blockIndex, timestamp: doc.timestamp, integrite: null },
    _fromCache: true,
  };
}

const STATUTS = {
  VALIDE:  { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46', icon: '✅', label: 'DOCUMENT VALIDE' },
  INVALIDE:{ bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', icon: '❌', label: 'DOCUMENT INVALIDE' },
  EXPIRÉ:  { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', icon: '⚠',  label: 'DOCUMENT EXPIRÉ' },
  RÉVOQUÉ: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', icon: '🚫', label: 'DOCUMENT RÉVOQUÉ' },
};

function StatutBanner({ statut }) {
  const c = STATUTS[statut] || STATUTS.INVALIDE;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{c.icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: c.text, letterSpacing: '0.04em' }}>{c.label}</div>
        {statut === 'RÉVOQUÉ' && <p style={{ fontSize: 11, color: c.text, marginTop: 3, opacity: 0.8 }}>Ce document a été révoqué. Utilisez le document de remplacement fourni.</p>}
        {statut === 'EXPIRÉ'  && <p style={{ fontSize: 11, color: c.text, marginTop: 3, opacity: 0.8 }}>Ce document est expiré. Procédez au renouvellement.</p>}
      </div>
    </div>
  );
}

function VerifContenu() {
  const params = useSearchParams();
  const initId = params.get('id') || '';

  const [id,      setId]      = useState(initId);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState('');
  const [scanner, setScanner] = useState(false);

  useEffect(() => { if (initId) doVerif(initId); }, [initId]);

  const doVerif = async (cible) => {
    const q = (cible || id).trim().toUpperCase();
    if (!q) { setError('Veuillez saisir un identifiant.'); return; }
    setLoading(true); setResult(null); setError('');
    try {
      const { data } = await axios.get(`${API}/api/verification/${q}`);
      setResult(data); setId(q);
    } catch (e) {
      const isOffline = !navigator.onLine || e.response?.data?.offline === true || !e.response;
      if (isOffline) {
        const cached = await getDocumentOffline(q);
        if (cached) { setResult(buildOfflineResult(cached)); setId(q); return; }
        setError('Hors ligne et document non trouvé en cache local.');
      } else {
        setError(e.response?.data?.error || 'Impossible de joindre le serveur.');
      }
    } finally { setLoading(false); }
  };

  const onScan = v => { setScanner(false); setId(v); doVerif(v); };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', padding: '40px 24px' }}>
      <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {/* Titre */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ height: 3, width: 48, background: 'linear-gradient(to right,#CE1126,#FCD116,#009460)', borderRadius: 2, marginBottom: 14 }} />
          <h1 className="font-display" style={{ fontSize: 'clamp(22px,4vw,28px)', fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
            Vérification de document
          </h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>Confirmez instantanément l'authenticité d'un document IdentiGuinée.</p>
        </div>

        {/* Champ de recherche */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <label className="field-label" style={{ marginBottom: 10 }}>Identifiant unique du document</label>
          <form onSubmit={e => { e.preventDefault(); doVerif(); }} style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <input
              type="text" value={id}
              onChange={e => setId(e.target.value.toUpperCase())}
              placeholder="GN-2026-XXXXXX"
              className="field-input font-mono-ig"
              style={{ flex: '1 1 200px', fontSize: 15, letterSpacing: '0.05em' }}
            />
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flexShrink: 0, padding: '10px 20px' }}>
              {loading ? '…' : 'Vérifier'}
            </button>
          </form>

          <button onClick={() => setScanner(true)} style={{
            width: '100%', padding: '9px 14px',
            background: '#F8FAFC', border: '1px dashed #CBD5E1',
            borderRadius: 5, cursor: 'pointer',
            fontSize: 12, color: '#64748B',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s',
          }}
            onMouseOver={e => { e.currentTarget.style.background = '#EEF2F8'; e.currentTarget.style.borderColor = '#0F2544'; e.currentTarget.style.color = '#0F2544'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#64748B'; }}>
            📷 Scanner le QR code avec la caméra
          </button>
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>Format : GN-AAAA-XXXXXX — ex : GN-2026-A7X9K3</p>
        </div>

        {/* Erreur */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 5, padding: '10px 14px', fontSize: 12, color: '#991B1B', marginBottom: 14 }}>
            ⚠ {error}
          </div>
        )}

        {/* Résultat */}
        {result && (
          <div>
            {result._fromCache && (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, padding: '8px 14px', fontSize: 11, color: '#1D4ED8', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                📡 Données hors ligne — résultat depuis le cache local. Reconnectez-vous pour une vérification temps réel.
              </div>
            )}
            <StatutBanner statut={result.statut} />

            {/* Alerte expiration proche */}
            {result.statut === 'VALIDE' && result.joursRestants !== null && result.joursRestants >= 0 && result.joursRestants <= 180 && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 6, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>⚠</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E' }}>Document expirant bientôt</div>
                  <div style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>
                    Ce document expire dans <strong>{result.joursRestants} jour{result.joursRestants > 1 ? 's' : ''}</strong>. Pensez à le renouveler avant le {result.dateExpiration}.
                  </div>
                  <a href={`/renouvellement?id=${result.documentId}`} style={{ display: 'inline-block', marginTop: 8, padding: '5px 12px', background: '#D97706', color: '#fff', borderRadius: 5, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                    Renouveler maintenant →
                  </a>
                </div>
              </div>
            )}

            {result.titulaire && (
              <div className="card" style={{ padding: 24, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0F2544', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
                  Informations du titulaire
                </div>
                <div className="verif-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                  {[
                    { l: 'Nom complet',       v: `${result.titulaire.prenoms} ${(result.titulaire.nom || '').toUpperCase()}` },
                    { l: 'Date de naissance', v: result.titulaire.dateNaissance },
                    { l: 'Nationalité',       v: result.titulaire.nationalite },
                    { l: 'Type de document',  v: result.type === 'carte' ? "🪪 Carte d'Identité" : '📕 Passeport' },
                    { l: "Date d'émission",   v: result.dateEmission },
                    { l: "Date d'expiration", v: result.dateExpiration, warn: result.statut !== 'VALIDE' },
                  ].map(r => (
                    <div key={r.l} style={{ padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{r.l}</div>
                      <div style={{ fontSize: 13, color: r.warn ? '#92400E' : '#0F172A', fontWeight: 500 }}>{r.v}</div>
                    </div>
                  ))}
                </div>

                {result.renouvellementDe && (
                  <div style={{ marginTop: 14, padding: '8px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 5, fontSize: 11, color: '#1D4ED8' }}>
                    🔄 Renouvellement de <span className="font-mono-ig">{result.renouvellementDe}</span>
                  </div>
                )}

                {result.valide && (
                  <div className="verif-btns" style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <a href={`${API}/api/documents/pdf/${result.documentId}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: 12, padding: '8px 16px' }}>
                      ⬇ Télécharger le PDF
                    </a>
                    <a href={`/renouvellement?id=${result.documentId}`} className="btn btn-outline" style={{ fontSize: 12, padding: '8px 16px' }}>
                      Renouveler →
                    </a>
                  </div>
                )}
              </div>
            )}

            {result.blockchain && (
              <div className="card" style={{ padding: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  ⛓ Preuve Blockchain
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Hash SHA-256</div>
                  <div className="hash-display">{result.blockchain.hash}</div>
                </div>
                <div className="rg-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {[
                    { l: 'Bloc',      v: `#${result.blockchain.blockIndex}`, c: '#059669' },
                    { l: 'Intégrité', v: result.blockchain.integrite === null ? '— hors ligne' : result.blockchain.integrite ? '✓ Intact' : '✗ Altéré', c: result.blockchain.integrite === null ? '#94A3B8' : result.blockchain.integrite ? '#059669' : '#DC2626' },
                    { l: 'Ancré le',  v: new Date(result.blockchain.timestamp).toLocaleDateString('fr-FR'), c: '#0369A1' },
                  ].map(b => (
                    <div key={b.l} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 5, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{b.l}</div>
                      <div className="font-mono-ig" style={{ fontSize: 12, fontWeight: 700, color: b.c }}>{b.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Guide */}
        {!result && !loading && (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 12 }}>Comment vérifier un document ?</div>
            {[
              "Saisissez l'identifiant unique imprimé sur le document (format GN-AAAA-XXXXXX)",
              "Ou cliquez sur « Scanner le QR code » pour utiliser votre caméra",
              "La vérification est instantanée et disponible 24h/24, 7j/7",
            ].map(t => (
              <div key={t} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <span style={{ color: '#059669', fontWeight: 700, flexShrink: 0 }}>→</span>
                <span style={{ fontSize: 12, color: '#64748B' }}>{t}</span>
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

      <style>{`
        @media (max-width: 520px) {
          .verif-grid { grid-template-columns: 1fr !important; }
          .verif-btns { flex-direction: column !important; }
          .verif-btns a { text-align: center; }
          .rg-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', background: '#F5F7FA' }}>Chargement…</div>}>
      <VerifContenu />
    </Suspense>
  );
}
