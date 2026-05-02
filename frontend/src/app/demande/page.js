'use client';
import { useState, useRef } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const STEPS = ['Type de document', 'Informations personnelles', 'Photo & envoi'];

const FIELDS = [
  { name: 'nom',                  label: 'Nom de famille',          type: 'text',   placeholder: 'DIALLO',       required: true,  full: false },
  { name: 'prenoms',              label: 'Prénom(s)',                type: 'text',   placeholder: 'Mamadou Oumar', required: true, full: false },
  { name: 'dateNaissance',        label: 'Date de naissance',       type: 'date',   required: true,              full: false },
  { name: 'lieuNaissance',        label: 'Lieu de naissance',       type: 'text',   placeholder: 'Conakry',       full: false },
  { name: 'sexe',                 label: 'Sexe',                    type: 'select', options: [['M','Masculin'],['F','Féminin']], required: true, full: false },
  { name: 'nationalite',          label: 'Nationalité',             type: 'text',   placeholder: 'Guinéenne',    full: false },
  { name: 'adresse',              label: 'Adresse complète',        type: 'text',   placeholder: 'Quartier, Commune, Conakry', full: true },
  { name: 'profession',           label: 'Profession',              type: 'text',   placeholder: 'Ex : Enseignant', full: false },
  { name: 'situationMatrimoniale',label: 'Situation matrimoniale',  type: 'select', options: [['Célibataire','Célibataire'],['Marié(e)','Marié(e)'],['Divorcé(e)','Divorcé(e)'],['Veuf/Veuve','Veuf / Veuve']], full: false },
  { name: 'email',                label: 'Email (optionnel)',       type: 'email',  placeholder: 'vous@exemple.gn', full: false },
];

const S = {
  page:    { minHeight: '100vh', padding: '48px 24px' },
  wrap:    { maxWidth: 780, margin: '0 auto' },
  title:   { fontSize: 28, fontWeight: 700, color: '#F0EDE8', marginBottom: 6, fontFamily: 'Playfair Display, Georgia, serif' },
  sub:     { fontSize: 13, color: '#8A9BB5', marginBottom: 40 },
  card:    { background: 'linear-gradient(135deg,#0D1B2E 0%,#162440 100%)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 3, padding: 32 },
  sLabel:  { fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 6, display: 'block' },
  err:     { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 3, padding: '10px 14px', fontSize: 12, color: '#FCA5A5', marginTop: 16 },
};

export default function DemandePage() {
  const [step,          setStep]          = useState(0);
  const [type,          setType]          = useState('');
  const [form,          setForm]          = useState({ nationalite: 'Guinéenne' });
  const [photo,         setPhoto]         = useState(null);
  const [preview,       setPreview]       = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [result,        setResult]        = useState(null);
  const [error,         setError]         = useState('');
  const fileRef = useRef();

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onPhoto = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('La photo ne doit pas dépasser 5 Mo.'); return; }
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  };

  const validate = () => {
    setError('');
    if (step === 0 && !type)           return setError('Sélectionnez un type de document.'), false;
    if (step === 1 && !form.nom?.trim()) return setError('Le nom est obligatoire.'), false;
    if (step === 1 && !form.prenoms?.trim()) return setError('Le(s) prénom(s) sont obligatoires.'), false;
    if (step === 1 && !form.dateNaissance)   return setError('La date de naissance est obligatoire.'), false;
    if (step === 1 && !form.sexe)            return setError('Le sexe est obligatoire.'), false;
    return true;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const prev = () => { setStep(s => s - 1); setError(''); };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true); setError('');
    const payload = new FormData();
    payload.append('type', type);
    Object.entries(form).forEach(([k, v]) => payload.append(k, v || ''));
    if (photo) payload.append('photo', photo);
    try {
      const { data } = await axios.post(`${API}/api/documents/create`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      setStep(3);
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur de connexion au serveur. Vérifiez que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setStep(0); setType(''); setForm({ nationalite: 'Guinéenne' }); setPhoto(null); setPreview(null); setResult(null); setError(''); };

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={S.title}>Demande de Document</h1>
          <p style={S.sub}>Remplissez le formulaire ci-dessous pour obtenir votre document officiel sécurisé.</p>
        </div>

        {/* Indicateur étapes */}
        {step < 3 && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`} title={s}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 11, color: i === step ? '#D4AF37' : '#4A6080', marginLeft: 8, marginRight: 4, whiteSpace: 'nowrap' }} className="step-label">
                  {s}
                </span>
                {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} style={{ margin: '0 12px' }} />}
              </div>
            ))}
          </div>
        )}

        <div style={S.card}>

          {/* ÉTAPE 0 — Type */}
          {step === 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 20 }}>
                Sélectionnez le type de document
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { val: 'carte',     icon: '🪪', title: "Carte Nationale d'Identité", sub: 'CINB Biométrique — Validité 10 ans', tag: 'Le plus demandé' },
                  { val: 'passeport', icon: '📕', title: 'Passeport Électronique',      sub: 'Conforme OACI — Validité 5 ans',    tag: 'Voyage international' },
                ].map(d => (
                  <button key={d.val} onClick={() => setType(d.val)} style={{
                    position: 'relative', padding: '20px 18px', borderRadius: 3, textAlign: 'left',
                    background: type === d.val ? 'rgba(212,175,55,0.08)' : '#0D1B2E',
                    border: `1px solid ${type === d.val ? '#D4AF37' : '#1E2F47'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: 700, color: '#08111F', background: '#D4AF37', padding: '2px 7px', borderRadius: 2 }}>
                      {d.tag}
                    </span>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>{d.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F0EDE8', marginBottom: 4 }}>{d.title}</div>
                    <div style={{ fontSize: 11, color: '#4A6080' }}>{d.sub}</div>
                    {type === d.val && <div style={{ marginTop: 10, fontSize: 11, color: '#D4AF37', fontWeight: 600 }}>✓ Sélectionné</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 1 — Infos */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 20 }}>
                Informations personnelles
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
                {FIELDS.map(f => (
                  <div key={f.name} style={{ gridColumn: f.full ? '1 / -1' : undefined }}>
                    <label style={S.sLabel}>{f.label}{f.required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}</label>
                    {f.type === 'select' ? (
                      <select name={f.name} value={form[f.name] || ''} onChange={onChange} className="field-input">
                        <option value="">— Sélectionner —</option>
                        {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    ) : (
                      <input type={f.type} name={f.name} value={form[f.name] || ''} onChange={onChange}
                        placeholder={f.placeholder} className="field-input" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 2 — Photo */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 6 }}>
                Photo d'identité
              </p>
              <p style={{ fontSize: 12, color: '#8A9BB5', marginBottom: 20 }}>
                Fond blanc, visage bien visible, format JPG ou PNG. Taille max : 5 Mo.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28 }}>
                {/* Zone photo */}
                <div onClick={() => fileRef.current.click()} style={{
                  height: 270, border: `2px dashed ${preview ? '#009460' : '#1E2F47'}`,
                  borderRadius: 3, cursor: 'pointer', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: '#0D1B2E', transition: 'border-color 0.15s',
                }}>
                  {preview
                    ? <img src={preview} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>📷</div>
                        <p style={{ fontSize: 11, color: '#4A6080', textAlign: 'center', padding: '0 16px' }}>
                          Cliquez pour sélectionner votre photo
                        </p>
                      </>
                  }
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />

                {/* Récapitulatif */}
                <div>
                  <div style={{ background: '#0D1B2E', border: '1px solid #1E2F47', borderRadius: 3, padding: 18, marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                      Récapitulatif
                    </div>
                    {[
                      { l: 'Type',        v: type === 'carte' ? "Carte d'Identité" : 'Passeport' },
                      { l: 'Nom complet', v: `${form.prenoms || ''} ${(form.nom || '').toUpperCase()}` },
                      { l: 'Naissance',   v: form.dateNaissance || '—' },
                      { l: 'Nationalité', v: form.nationalite || 'Guinéenne' },
                    ].map(r => (
                      <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1E2F47' }}>
                        <span style={{ fontSize: 11, color: '#4A6080' }}>{r.l}</span>
                        <span style={{ fontSize: 11, color: '#F0EDE8', fontWeight: 500, textAlign: 'right', maxWidth: 180 }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(0,148,96,0.08)', border: '1px solid rgba(0,148,96,0.25)', borderRadius: 3, padding: 12, fontSize: 11, color: '#6EE7B7' }}>
                    ✓ Vos données sont chiffrées AES-256 et ne sont jamais partagées avec des tiers.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 — Succès */}
          {step === 3 && result && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <h2 className="font-display" style={{ fontSize: 26, fontWeight: 700, color: '#D4AF37', marginBottom: 8 }}>
                Document généré avec succès
              </h2>
              <p style={{ fontSize: 13, color: '#8A9BB5', marginBottom: 28 }}>
                Votre document a été ancré sur la blockchain IdentiGuinée. Conservez précieusement votre identifiant.
              </p>

              <div className="card-inset corner-accent" style={{ padding: 24, marginBottom: 24, textAlign: 'left' }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Identifiant unique</div>
                  <div className="font-mono-ig" style={{ fontSize: 26, fontWeight: 700, color: '#F0EDE8', letterSpacing: '0.05em' }}>{result.documentId}</div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Hash Blockchain (SHA-256)</div>
                  <div className="hash-display">{result.hashBlockchain}</div>
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 9, color: '#4A6080', marginBottom: 2 }}>Bloc</div>
                    <div className="font-mono-ig" style={{ color: '#6EE7B7', fontWeight: 700 }}>#{result.blockIndex}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: '#4A6080', marginBottom: 2 }}>Statut</div>
                    <div style={{ color: '#6EE7B7', fontWeight: 600, fontSize: 12 }}>✓ Ancré sur la blockchain</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                <a href={`${API}/api/documents/pdf/${result.documentId}`} target="_blank" rel="noopener noreferrer" className="btn btn-or">
                  ⬇ Télécharger le PDF officiel
                </a>
                <a href={`/verification?id=${result.documentId}`} className="btn btn-outline">
                  Vérifier le document
                </a>
              </div>
              <button onClick={reset} style={{ fontSize: 11, color: '#4A6080', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Faire une nouvelle demande
              </button>
            </div>
          )}

          {/* Erreur */}
          {error && <div style={S.err}>⚠ {error}</div>}

          {/* Navigation */}
          {step < 3 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid #1E2F47' }}>
              <button onClick={prev} disabled={step === 0} className="btn btn-ghost" style={{ opacity: step === 0 ? 0.3 : 1 }}>
                ← Précédent
              </button>
              {step < 2
                ? <button onClick={next} className="btn btn-or">Suivant →</button>
                : <button onClick={submit} disabled={loading} className="btn btn-or">
                    {loading ? '⏳ Génération en cours...' : 'Générer mon document →'}
                  </button>
              }
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .step-label { display: none; }
        }
      `}</style>
    </div>
  );
}
