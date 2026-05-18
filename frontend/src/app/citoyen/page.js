'use client';
import { useState } from 'react';
import axios from 'axios';
import { saveCitoyenCache, getCitoyenCache } from '../../utils/offlineDB';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

const STATUT_STYLE = {
  VALIDE:  { bg: '#ECFDF5', border: '#A7F3D0', color: '#047857', icon: '✅' },
  EXPIRÉ:  { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B', icon: '❌' },
  RÉVOQUÉ: { bg: '#FFF7ED', border: '#FED7AA', color: '#92400E', icon: '🚫' },
};

export default function CitoyenPage() {
  const [numero,    setNumero]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [resultat,  setResultat]  = useState(null);
  const [erreur,    setErreur]    = useState('');
  const [fromCache, setFromCache] = useState(false);

  const chercher = async () => {
    if (!numero.trim()) { setErreur('Veuillez saisir votre numéro d\'acte de naissance.'); return; }
    setLoading(true); setErreur(''); setResultat(null); setFromCache(false);
    try {
      const { data } = await axios.post(`${API}/api/citoyen/mes-documents`, { numeroActe: numero.trim().toUpperCase() });
      setResultat(data);
      saveCitoyenCache(numero.trim().toUpperCase(), data).catch(() => {});
    } catch (e) {
      const isOffline = !navigator.onLine || e.response?.data?.offline === true || !e.response;
      if (isOffline) {
        const cached = await getCitoyenCache(numero.trim().toUpperCase());
        if (cached) {
          setResultat(cached.data);
          setFromCache(true);
          return;
        }
        setErreur('Hors ligne — aucune donnée en cache pour ce numéro d\'acte.');
      } else {
        setErreur(e.response?.data?.error || 'Acte de naissance introuvable.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', padding: '40px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ height: 3, width: 48, background: 'linear-gradient(to right,#CE1126,#FCD116,#009460)', borderRadius: 2, marginBottom: 14 }} />
          <h1 style={{ fontSize: 'clamp(20px,4vw,26px)', fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
            Espace Citoyen
          </h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>Consultez tous vos documents d'identité en saisissant votre numéro d'acte de naissance.</p>
        </div>

        {/* Formulaire */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 28, marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
            Numéro d'acte de naissance
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={numero}
              onChange={e => setNumero(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && chercher()}
              placeholder="Ex : AN-2015-000001"
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 14, fontFamily: 'monospace', letterSpacing: '0.05em', outline: 'none' }}
            />
            <button
              onClick={chercher}
              disabled={loading}
              style={{ padding: '10px 22px', background: '#0F2544', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '⏳' : 'Rechercher'}
            </button>
          </div>
          {erreur && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 5, padding: '8px 12px', fontSize: 12, color: '#991B1B', marginTop: 12 }}>
              ⚠ {erreur}
            </div>
          )}
        </div>

        {/* Résultats */}
        {resultat && (
          <div>
            {fromCache && (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, padding: '8px 14px', fontSize: 11, color: '#1D4ED8', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                📡 Données hors ligne — dernière synchronisation disponible. Reconnectez-vous pour actualiser.
              </div>
            )}
            {/* Titulaire */}
            <div style={{ background: '#0F2544', borderRadius: 8, padding: '18px 24px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FCD116', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>👤</div>
              <div>
                <div style={{ color: '#FCD116', fontWeight: 700, fontSize: 16 }}>{resultat.titulaire.prenoms} {resultat.titulaire.nom}</div>
                <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 2 }}>
                  Né(e) le {resultat.titulaire.dateNaissance} à {resultat.titulaire.lieuNaissance}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', background: '#1E3A5F', borderRadius: 6, padding: '6px 14px', color: '#FCD116', fontSize: 12, fontWeight: 700 }}>
                {resultat.total} document{resultat.total > 1 ? 's' : ''}
              </div>
            </div>

            {resultat.total === 0 ? (
              <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 32, textAlign: 'center', color: '#64748B', fontSize: 14 }}>
                Aucun document émis pour ce numéro d'acte.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {resultat.documents.map(doc => {
                  const st = STATUT_STYLE[doc.statut] || STATUT_STYLE.VALIDE;
                  return (
                    <div key={doc.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '18px 22px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ fontSize: 20 }}>{doc.type === 'carte' ? '🪪' : '📕'}</span>
                            <span style={{ fontWeight: 700, fontSize: 15, color: '#0F172A' }}>
                              {doc.type === 'carte' ? "Carte Nationale d'Identité" : 'Passeport Électronique'}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, border: `1px solid ${st.border}`, padding: '2px 10px', borderRadius: 100 }}>
                              {st.icon} {doc.statut}
                            </span>
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#0F2544', fontWeight: 700, marginBottom: 6 }}>{doc.id}</div>
                          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, color: '#64748B' }}>Émis le <strong style={{ color: '#0F172A' }}>{doc.dateEmission}</strong></span>
                            <span style={{ fontSize: 11, color: '#64748B' }}>Expire le <strong style={{ color: doc.joursRestants !== null && doc.joursRestants <= 180 && doc.joursRestants >= 0 ? '#D97706' : '#0F172A' }}>{doc.dateExpiration}</strong></span>
                            {doc.joursRestants !== null && doc.joursRestants >= 0 && doc.joursRestants <= 180 && (
                              <span style={{ fontSize: 11, color: '#D97706', fontWeight: 600 }}>⚠ Expire dans {doc.joursRestants} jours</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <a href={`/verification?id=${doc.id}`} style={{ padding: '7px 14px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 12, color: '#374151', textDecoration: 'none', fontWeight: 600 }}>
                            Vérifier
                          </a>
                          <a href={`${API}/api/documents/pdf/${doc.id}`} target="_blank" rel="noopener noreferrer"
                            style={{ padding: '7px 14px', background: '#0F2544', borderRadius: 6, fontSize: 12, color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
                            ⬇ PDF
                          </a>
                          {doc.statut === 'VALIDE' && doc.joursRestants !== null && doc.joursRestants <= 180 && (
                            <a href={`/renouvellement?id=${doc.id}`} style={{ padding: '7px 14px', background: '#D97706', borderRadius: 6, fontSize: 12, color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
                              Renouveler
                            </a>
                          )}
                        </div>
                      </div>
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                        <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace' }}>Hash: {doc.hashBlockchain?.substring(0, 40)}…</span>
                        <span style={{ fontSize: 10, color: '#94A3B8', marginLeft: 16 }}>Bloc #{doc.blockIndex}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
