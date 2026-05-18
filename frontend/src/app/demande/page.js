'use client';
import { useState, useRef } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const STEPS = ['Acte de naissance', 'Type', 'Informations', 'Photo & Envoi'];

const FIELDS = [
  { name: 'nom',                   label: 'Nom de famille',          type: 'text',   placeholder: 'DIALLO',                     required: true,  full: false, fromActe: true },
  { name: 'prenoms',               label: 'Prénom(s)',                type: 'text',   placeholder: 'Mamadou Oumar',              required: true,  full: false, fromActe: true },
  { name: 'dateNaissance',         label: 'Date de naissance',       type: 'date',   required: true,                            full: false,     fromActe: true },
  { name: 'lieuNaissance',         label: 'Lieu de naissance',       type: 'text',   placeholder: 'Conakry',                    required: true,  full: false, fromActe: true },
  { name: 'sexe',                  label: 'Sexe',                    type: 'select', options: [['M','Masculin'],['F','Féminin']], required: true, full: false, fromActe: true },
  { name: 'taille',                label: 'Taille',                  type: 'text',   placeholder: 'Ex : 1m75',                  required: false, full: false },
  { name: 'nationalite',           label: 'Nationalité',             type: 'text',   placeholder: 'Guinéenne',                  full: false },
  { name: 'couleurYeux',           label: 'Couleur des yeux',        type: 'select',
    options: [['MARRON','Marron'],['NOIR','Noir'],['NOISETTE','Noisette'],['VERT','Vert'],['BLEU','Bleu'],['GRIS','Gris']], full: false },
  { name: 'adresse',               label: 'Adresse complète',        type: 'text',   placeholder: 'Quartier, Commune, Conakry', full: true },
  { name: 'profession',            label: 'Profession / Occupation', type: 'text',   placeholder: 'Ex : Enseignant',            full: false },
  { name: 'situationMatrimoniale', label: 'Situation matrimoniale',  type: 'select',
    options: [['Célibataire','Célibataire'],['Marié(e)','Marié(e)'],['Divorcé(e)','Divorcé(e)'],['Veuf/Veuve','Veuf / Veuve']], full: false },
  { name: 'lieuDelivrance',        label: 'Lieu de délivrance',      type: 'text',   placeholder: 'Conakry',                    full: false },
  { name: 'email',                 label: 'Email (optionnel)',        type: 'email',  placeholder: 'vous@exemple.gn',            full: false },
];

export default function DemandePage() {
  const [step,        setStep]        = useState(0);
  const [type,        setType]        = useState('');
  const [form,        setForm]        = useState({ nationalite: 'Guinéenne', lieuDelivrance: 'Conakry' });
  const [photo,       setPhoto]       = useState(null);
  const [preview,     setPreview]     = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState('');
  const [numeroActe,  setNumeroActe]  = useState('');
  const [acteData,    setActeData]    = useState(null);
  const [acteLoading, setActeLoading] = useState(false);
  const fileRef = useRef();

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onPhoto = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('La photo ne doit pas dépasser 5 Mo.'); return; }
    setPhoto(f); setPreview(URL.createObjectURL(f)); setError('');
  };

  const validate = () => {
    setError('');
    if (step === 1 && !type)                      return setError('Sélectionnez un type de document.'), false;
    if (step === 2 && !form.nom?.trim())           return setError('Le nom est obligatoire.'), false;
    if (step === 2 && !form.prenoms?.trim())       return setError('Les prénoms sont obligatoires.'), false;
    if (step === 2 && !form.dateNaissance)         return setError('La date de naissance est obligatoire.'), false;
    if (step === 2 && !form.lieuNaissance?.trim()) return setError('Le lieu de naissance est obligatoire.'), false;
    if (step === 2 && !form.sexe)                  return setError('Le sexe est obligatoire.'), false;
    return true;
  };

  const next = async () => {
    setError('');
    if (step === 0) {
      if (!numeroActe.trim()) {
        setError("Veuillez saisir votre numéro d'acte de naissance.");
        return;
      }
      setActeLoading(true);
      try {
        const { data } = await axios.get(`${API}/api/actes-naissance/${numeroActe.trim().toUpperCase()}`);
        setActeData(data);
        setForm(f => ({
          ...f,
          nom: data.nom,
          prenoms: data.prenoms,
          dateNaissance: data.dateNaissance,
          lieuNaissance: data.lieuNaissance,
          sexe: data.sexe,
        }));
        setStep(1);
      } catch (e) {
        setError(e.response?.data?.error || "Numéro d'acte introuvable dans le registre civil.");
      } finally {
        setActeLoading(false);
      }
      return;
    }
    if (validate()) setStep(s => s + 1);
  };

  const prev = () => {
    setStep(s => s - 1);
    setError('');
    if (step === 1) { setActeData(null); setForm({ nationalite: 'Guinéenne', lieuDelivrance: 'Conakry' }); }
  };

  const reset = () => {
    setStep(0); setType('');
    setForm({ nationalite: 'Guinéenne', lieuDelivrance: 'Conakry' });
    setPhoto(null); setPreview(null); setResult(null); setError('');
    setNumeroActe(''); setActeData(null);
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true); setError('');
    const payload = new FormData();
    payload.append('type', type);
    payload.append('numeroActeNaissance', numeroActe);
    Object.entries(form).forEach(([k, v]) => payload.append(k, v || ''));
    if (photo) payload.append('photo', photo);
    try {
      const { data } = await axios.post(`${API}/api/documents/create`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data); setStep(4);
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur de connexion au serveur.');
    } finally { setLoading(false); }
  };

  const sexeLabel = v => v === 'M' ? 'Masculin' : v === 'F' ? 'Féminin' : v;

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', padding: '40px 24px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>

        {/* Titre */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ height: 3, width: 48, background: 'linear-gradient(to right,#CE1126,#FCD116,#009460)', borderRadius: 2, marginBottom: 14 }} />
          <h1 className="font-display" style={{ fontSize: 'clamp(22px,4vw,28px)', fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
            Demande de document officiel
          </h1>
          <p style={{ fontSize: 13, color: '#64748B' }}>Remplissez le formulaire ci-dessous pour obtenir votre document sécurisé par blockchain.</p>
        </div>

        {/* Indicateur étapes */}
        {step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 6, padding: '14px 20px', overflowX: 'auto' }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none', minWidth: 0 }}>
                <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`} style={{ flexShrink: 0 }}>{i < step ? '✓' : i + 1}</div>
                <span style={{ fontSize: 12, color: i === step ? '#0F2544' : '#94A3B8', fontWeight: i === step ? 600 : 400, margin: '0 8px', whiteSpace: 'nowrap' }} className="step-lbl">{s}</span>
                {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} style={{ margin: '0 4px', minWidth: 16 }} />}
              </div>
            ))}
          </div>
        )}

        {/* Carte principale */}
        <div className="card card-pad" style={{ padding: 32 }}>

          {/* ── Étape 0 : Acte de naissance ── */}
          {step === 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748B', marginBottom: 8 }}>
                Vérification de l'acte de naissance
              </p>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>
                Saisissez votre numéro d'acte de naissance délivré par la mairie ou le centre d'état civil. Vos données seront vérifiées contre le registre civil national avant toute émission de document.
              </p>

              <div style={{ marginBottom: 20 }}>
                <label className="field-label">
                  Numéro d'acte de naissance <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>
                </label>
                <input
                  type="text"
                  value={numeroActe}
                  onChange={e => setNumeroActe(e.target.value.toUpperCase())}
                  placeholder="Ex : AN-2015-000001"
                  className="field-input"
                  style={{ fontFamily: 'monospace', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                  onKeyDown={e => e.key === 'Enter' && next()}
                />
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
                  Format : AN-AAAA-XXXXXX — disponible sur votre acte de naissance original
                </p>
              </div>

              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 6, padding: '12px 16px', fontSize: 12, color: '#92400E', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>⚠</span>
                <span>Si vos données personnelles ne correspondent pas à votre acte de naissance enregistré dans le registre civil, la délivrance du document sera <strong>refusée automatiquement</strong>.</span>
              </div>
            </div>
          )}

          {/* ── Étape 1 : Type ── */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748B', marginBottom: 20 }}>Sélectionnez le type de document</p>
              <div className="type-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { val: 'carte',     icon: '🪪', title: "Carte Nationale d'Identité", sub: 'CINB Biométrique · Validité 10 ans', tag: 'Le plus demandé',     tagColor: '#059669', tagBg: '#ECFDF5' },
                  { val: 'passeport', icon: '📕', title: 'Passeport Électronique',      sub: 'Conforme OACI · Validité 5 ans',    tag: 'Voyage international', tagColor: '#0369A1', tagBg: '#EFF6FF' },
                ].map(d => (
                  <button key={d.val} onClick={() => setType(d.val)} style={{
                    position: 'relative', padding: '22px 18px', borderRadius: 6, textAlign: 'left',
                    background: type === d.val ? '#F8FAFC' : '#fff',
                    border: `2px solid ${type === d.val ? '#0F2544' : '#E2E8F0'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: type === d.val ? '0 4px 12px rgba(15,37,68,0.10)' : 'none',
                  }}>
                    <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, fontWeight: 700, color: d.tagColor, background: d.tagBg, padding: '2px 8px', borderRadius: 100 }}>{d.tag}</span>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{d.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{d.title}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{d.sub}</div>
                    {type === d.val && <div style={{ marginTop: 10, fontSize: 11, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} /> Sélectionné</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Étape 2 : Infos ── */}
          {step === 2 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748B', marginBottom: 4 }}>Informations personnelles</p>

              {acteData && (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#047857', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🔒</span>
                  <span>Les champs <strong>verrouillés</strong> proviennent de l'acte de naissance <strong>{acteData.numero}</strong> et ne peuvent pas être modifiés.</span>
                </div>
              )}

              <div className="rg-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
                {FIELDS.map(f => {
                  const locked = f.fromActe && acteData;
                  return (
                    <div key={f.name} style={{ gridColumn: f.full ? '1/-1' : undefined }}>
                      <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {f.label}
                        {f.required && <span style={{ color: '#EF4444' }}>*</span>}
                        {locked && (
                          <span style={{ fontSize: 10, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>
                            🔒 Acte de naissance
                          </span>
                        )}
                      </label>
                      {f.type === 'select' ? (
                        <select
                          name={f.name}
                          value={form[f.name] || ''}
                          onChange={onChange}
                          className="field-input"
                          disabled={!!locked}
                          style={locked ? { background: '#F1F5F9', color: '#475569', cursor: 'not-allowed', border: '1px solid #CBD5E1' } : {}}
                        >
                          <option value="">— Sélectionner —</option>
                          {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      ) : (
                        <input
                          type={f.type}
                          name={f.name}
                          value={form[f.name] || ''}
                          onChange={onChange}
                          placeholder={f.placeholder}
                          className="field-input"
                          readOnly={!!locked}
                          style={locked ? { background: '#F1F5F9', color: '#475569', cursor: 'not-allowed', border: '1px solid #CBD5E1' } : {}}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Étape 3 : Photo ── */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748B', marginBottom: 4 }}>Photo d'identité biométrique</p>
              <p style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>Fond uni clair, visage bien visible, JPG/PNG, max 5 Mo.</p>
              <div className="rg-photo" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
                <div onClick={() => fileRef.current.click()} style={{
                  height: 250, border: `2px dashed ${preview ? '#059669' : '#CBD5E1'}`,
                  borderRadius: 6, cursor: 'pointer', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: preview ? '#fff' : '#F8FAFC', transition: 'border-color 0.15s',
                }}>
                  {preview
                    ? <img src={preview} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <><div style={{ fontSize: 32, marginBottom: 10, opacity: 0.4 }}>📷</div><p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', padding: '0 16px' }}>Cliquez pour choisir votre photo</p></>
                  }
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
                <div>
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: 6, padding: 16, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0F2544', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Récapitulatif</div>
                    {[
                      { l: 'Acte',        v: numeroActe },
                      { l: 'Type',        v: type === 'carte' ? "Carte d'Identité" : 'Passeport' },
                      { l: 'Nom complet', v: `${form.prenoms || ''} ${(form.nom || '').toUpperCase()}`.trim() },
                      { l: 'Naissance',   v: form.dateNaissance || '—' },
                      { l: 'Lieu naiss.', v: form.lieuNaissance || '—' },
                      { l: 'Sexe',        v: sexeLabel(form.sexe) || '—' },
                      { l: 'Nationalité', v: form.nationalite || 'Guinéenne' },
                      { l: 'Taille',      v: form.taille || '—' },
                      { l: 'Yeux',        v: form.couleurYeux || '—' },
                      { l: 'Autorité',    v: form.lieuDelivrance || '—' },
                      { l: 'Adresse',     v: form.adresse || '—' },
                    ].map(r => (
                      <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>{r.l}</span>
                        <span style={{ fontSize: 11, color: '#0F172A', fontWeight: 500, textAlign: 'right', maxWidth: 180 }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 6, padding: '10px 13px', fontSize: 11, color: '#047857' }}>
                    ✓ Données chiffrées AES-256. Jamais partagées avec des tiers.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Étape 4 : Succès ── */}
          {step === 4 && result && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ECFDF5', border: '2px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>✅</div>
              <h2 className="font-display" style={{ fontSize: 'clamp(20px,3vw,24px)', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Document généré avec succès</h2>
              <p style={{ fontSize: 13, color: '#64748B', marginBottom: 28 }}>Votre document a été ancré sur la blockchain IdentiGuinée. Conservez précieusement votre identifiant.</p>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: '20px 24px', marginBottom: 24, textAlign: 'left', background: '#FAFBFC' }}>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Identifiant unique</div>
                  <div className="font-mono-ig" style={{ fontSize: 'clamp(18px,4vw,24px)', fontWeight: 700, color: '#0F2544', letterSpacing: '0.04em', wordBreak: 'break-all' }}>{result.documentId}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Hash Blockchain (SHA-256)</div>
                  <div className="hash-display">{result.hashBlockchain}</div>
                </div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 3 }}>Bloc</div>
                    <div className="font-mono-ig" style={{ color: '#059669', fontWeight: 700, fontSize: 13 }}>#{result.blockIndex}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 3 }}>Statut</div>
                    <div style={{ color: '#059669', fontWeight: 600, fontSize: 12 }}>✓ Ancré sur la blockchain</div>
                  </div>
                </div>
              </div>

              <div className="success-btns" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                <a href={`${API}/api/documents/pdf/${result.documentId}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: 13 }}>
                  ⬇ Télécharger le PDF officiel
                </a>
                <a href={`/verification?id=${result.documentId}`} className="btn btn-outline" style={{ fontSize: 13 }}>Vérifier le document</a>
              </div>
              <button onClick={reset} style={{ fontSize: 12, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Faire une nouvelle demande
              </button>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 5, padding: '10px 14px', fontSize: 12, color: '#991B1B', marginTop: 16 }}>
              ⚠ {error}
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid #E2E8F0', gap: 12 }}>
              <button onClick={prev} disabled={step === 0} className="btn btn-ghost" style={{ opacity: step === 0 ? 0.3 : 1 }}>← Précédent</button>
              {step < 3
                ? <button onClick={next} disabled={acteLoading} className="btn btn-primary">
                    {acteLoading ? '⏳ Vérification...' : 'Suivant →'}
                  </button>
                : <button onClick={submit} disabled={loading} className="btn btn-primary">
                    {loading ? '⏳ Génération...' : 'Générer mon document →'}
                  </button>
              }
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .step-lbl     { display: none !important; }
          .type-grid    { grid-template-columns: 1fr !important; }
          .success-btns { flex-direction: column !important; }
          .success-btns a { text-align: center; }
          .card-pad     { padding: 20px !important; }
          .rg-photo     { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
