'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

const AUDIT_ICONS = { DOCUMENT_CREE:'📄', DOCUMENT_TELECHARGE:'⬇', DOCUMENT_REVOQUE:'🚫', ADMIN_LOGIN:'🔑', EXPORT_CSV:'📊', ACTE_AJOUTE:'➕', ACTE_MODIFIE:'✏️', ACTE_SUPPRIME:'🗑️' };

function Badge({ label, color, bg }) {
  return <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, padding: '2px 8px', borderRadius: 100, border: `1px solid ${color}40` }}>{label}</span>;
}

function BarChart({ data, total, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Object.entries(data).sort().slice(-8).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', width: 70, flexShrink: 0 }}>{k}</span>
          <div style={{ flex: 1, height: 8, background: '#1E293B', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.round((v/total)*100)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', width: 24, textAlign: 'right' }}>{v}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const { admin, logout, chargement: authChargement } = useAuth();
  const router = useRouter();
  const [stats,     setStats]     = useState(null);
  const [documents, setDocuments] = useState([]);
  const [actes,     setActes]     = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [onglet,    setOnglet]    = useState('stats');
  const [loading,   setLoading]   = useState(true);
  const [recherche, setRecherche] = useState('');
  const [rechercheActe, setRechercheActe] = useState('');
  const [exportEnCours, setExportEnCours] = useState(false);
  const [confirmation,  setConfirmation]  = useState(null);
  const [formeActe,     setFormeActe]     = useState(null); // null | 'new' | acte object
  const [erreurActe,    setErreurActe]    = useState('');
  const [champActe,     setChampActe]     = useState({ numero:'', nom:'', prenoms:'', dateNaissance:'', lieuNaissance:'', sexe:'M' });

  useEffect(() => { if (!authChargement && !admin) router.push('/admin/login'); }, [admin, authChargement, router]);

  const headers = useCallback(() => ({ Authorization: `Bearer ${admin?.token}` }), [admin]);

  const chargerDonnees = useCallback(async () => {
    if (!admin) return;
    try {
      const h = headers();
      const [sRes, dRes, aRes, lgRes] = await Promise.all([
        axios.get(`${API}/api/admin/stats`,     { headers: h }),
        axios.get(`${API}/api/admin/documents`, { headers: h }),
        axios.get(`${API}/api/admin/actes`,     { headers: h }),
        axios.get(`${API}/api/admin/audit`,     { headers: h }),
      ]);
      setStats(sRes.data); setDocuments(dRes.data); setActes(aRes.data); setAuditLogs(lgRes.data);
    } catch { logout(); }
    finally { setLoading(false); }
  }, [admin, headers, logout]);

  useEffect(() => { chargerDonnees(); }, [chargerDonnees]);

  const exporterCSV = async () => {
    setExportEnCours(true);
    try {
      const res = await axios.get(`${API}/api/admin/export/csv`, { headers: headers(), responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `identiguinee_export_${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Erreur export CSV.'); }
    finally { setExportEnCours(false); }
  };

  const revoquerDoc = async (id) => {
    try {
      await axios.post(`${API}/api/admin/revoquer/${id}`, {}, { headers: headers() });
      setConfirmation(null); chargerDonnees();
    } catch { alert('Erreur révocation.'); }
  };

  const soumettreActe = async () => {
    setErreurActe('');
    try {
      if (formeActe === 'new') {
        await axios.post(`${API}/api/admin/actes`, champActe, { headers: headers() });
      } else {
        await axios.put(`${API}/api/admin/actes/${formeActe.numero}`, champActe, { headers: headers() });
      }
      setFormeActe(null); setChampActe({ numero:'', nom:'', prenoms:'', dateNaissance:'', lieuNaissance:'', sexe:'M' });
      chargerDonnees();
    } catch (e) { setErreurActe(e.response?.data?.error || 'Erreur.'); }
  };

  const supprimerActe = async (numero) => {
    if (!confirm(`Supprimer l'acte ${numero} ?`)) return;
    await axios.delete(`${API}/api/admin/actes/${numero}`, { headers: headers() });
    chargerDonnees();
  };

  const ouvrirEditionActe = (acte) => {
    setChampActe({ ...acte });
    setFormeActe(acte);
    setErreurActe('');
  };

  const docsFiltres  = documents.filter(d => `${d.nom} ${d.prenoms} ${d.id}`.toLowerCase().includes(recherche.toLowerCase()));
  const actesFiltres = actes.filter(a => `${a.nom} ${a.prenoms} ${a.numero}`.toLowerCase().includes(rechercheActe.toLowerCase()));

  const ONGLETS = [
    { id:'stats',     label:'📊 Statistiques' },
    { id:'documents', label:'📋 Documents' },
    { id:'actes',     label:'🗂 Actes de naissance' },
    { id:'audit',     label:'🔍 Journaux d\'audit' },
  ];

  if (authChargement || loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0A0F1E' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>⛓️</div>
          <p style={{ color:'#94A3B8' }}>Chargement...</p>
        </div>
      </div>
    );
  }
  if (!admin) return null;

  const sty = {
    page:  { minHeight:'100vh', padding:'32px 20px', background:'#0A0F1E' },
    card:  { background:'#0F172A', border:'1px solid #1E293B', borderRadius:12 },
    th:    { padding:'10px 14px', color:'#FCD116', fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', textAlign:'left', borderBottom:'1px solid #1E293B' },
    td:    { padding:'10px 14px', borderBottom:'1px solid #0F172A', fontSize:12, color:'#CBD5E1' },
    input: { width:'100%', padding:'8px 12px', background:'#0A0F1E', border:'1px solid #1E293B', borderRadius:6, color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box' },
    btn:   (bg,color='#fff') => ({ padding:'8px 16px', background:bg, color, border:'none', borderRadius:6, fontSize:12, fontWeight:700, cursor:'pointer' }),
  };

  return (
    <div style={sty.page}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ color:'#fff', fontWeight:700, fontSize:26, margin:0 }}>Panneau d'Administration</h1>
            <p style={{ color:'#64748B', fontSize:12, marginTop:4 }}>Connecté : <span style={{ color:'#FCD116', fontFamily:'monospace' }}>{admin.username}</span></p>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={exporterCSV} disabled={exportEnCours} style={sty.btn('#1E293B','#CBD5E1')}>
              {exportEnCours ? '⏳ Export...' : '⬇ Export CSV'}
            </button>
            <button onClick={logout} style={sty.btn('#7F1D1D','#FCA5A5')}>Déconnexion</button>
          </div>
        </div>

        {/* Stat cards */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:28 }}>
            {[
              { icon:'📄', label:'Documents', val:stats.totalDocuments, color:'#FCD116' },
              { icon:'⛓️', label:'Blocs blockchain', val:stats.totalBlocs, color:'#60A5FA' },
              { icon:'🪪', label:'Cartes d\'identité', val:stats.parType?.carte||0, color:'#34D399' },
              { icon:'📕', label:'Passeports', val:stats.parType?.passeport||0, color:'#A78BFA' },
              { icon:'⚠️', label:'Exp. dans 6 mois', val:stats.expireBientot||0, color:'#FBBF24' },
            ].map(c => (
              <div key={c.label} style={{ ...sty.card, padding:'16px 18px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontSize:22 }}>{c.icon}</span>
                  <span style={{ fontSize:26, fontWeight:800, color:c.color }}>{c.val}</span>
                </div>
                <p style={{ color:'#64748B', fontSize:11, margin:0 }}>{c.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Onglets */}
        <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid #1E293B', paddingBottom:0, overflowX:'auto' }}>
          {ONGLETS.map(o => (
            <button key={o.id} onClick={() => setOnglet(o.id)} style={{
              padding:'10px 18px', borderRadius:'8px 8px 0 0', fontSize:13, fontWeight:600, cursor:'pointer',
              background: onglet===o.id ? '#1E293B' : 'transparent',
              color: onglet===o.id ? '#FCD116' : '#64748B',
              border: onglet===o.id ? '1px solid #1E293B' : '1px solid transparent',
              borderBottom: onglet===o.id ? '1px solid #1E293B' : '1px solid transparent',
              whiteSpace:'nowrap',
            }}>{o.label}</button>
          ))}
        </div>

        {/* ── STATS ── */}
        {onglet==='stats' && stats && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ ...sty.card, padding:24 }}>
              <h3 style={{ color:'#FCD116', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:18 }}>Répartition par type</h3>
              {Object.entries(stats.parType||{}).map(([type,count]) => (
                <div key={type} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <span style={{ fontSize:18 }}>{type==='carte'?'🪪':'📕'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ color:'#CBD5E1', fontSize:12 }}>{type==='carte'?"Carte d'identité":'Passeport'}</span>
                      <span style={{ color:'#fff', fontWeight:700, fontSize:12 }}>{count} ({Math.round((count/stats.totalDocuments)*100)}%)</span>
                    </div>
                    <div style={{ height:8, background:'#1E293B', borderRadius:4, overflow:'hidden' }}>
                      <div style={{ width:`${(count/stats.totalDocuments)*100}%`, height:'100%', background: type==='carte'?'#34D399':'#A78BFA', borderRadius:4 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ ...sty.card, padding:24 }}>
              <h3 style={{ color:'#FCD116', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:18 }}>Émissions par mois</h3>
              <BarChart data={stats.parMois||{}} total={stats.totalDocuments} color="#60A5FA" />
            </div>
            {stats.dernierDocument && (
              <div style={{ ...sty.card, padding:24, gridColumn:'1/-1' }}>
                <h3 style={{ color:'#FCD116', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>Dernier document émis</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16 }}>
                  {[['Titulaire',`${stats.dernierDocument.prenoms} ${stats.dernierDocument.nom?.toUpperCase()}`],['ID',stats.dernierDocument.id],['Type',stats.dernierDocument.type],['Émis le',stats.dernierDocument.dateEmission]].map(([l,v])=>(
                    <div key={l}><p style={{ color:'#475569', fontSize:10, marginBottom:4, textTransform:'uppercase' }}>{l}</p><p style={{ color:'#fff', fontWeight:600, fontSize:13, margin:0 }}>{v}</p></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {onglet==='documents' && (
          <div>
            <div style={{ display:'flex', gap:10, marginBottom:14 }}>
              <input value={recherche} onChange={e=>setRecherche(e.target.value)} placeholder="Rechercher par nom, prénom ou ID..." style={{ ...sty.input, flex:1 }} />
              <span style={{ color:'#64748B', fontSize:12, alignSelf:'center' }}>{docsFiltres.length} résultat(s)</span>
            </div>
            {stats?.expireBientot > 0 && (
              <div style={{ background:'#451A03', border:'1px solid #92400E', borderRadius:8, padding:'10px 16px', marginBottom:14, fontSize:12, color:'#FCD116' }}>
                ⚠️ {stats.expireBientot} document(s) expirent dans moins de 6 mois. Vérifiez la colonne "Expiration".
              </div>
            )}
            <div style={sty.card}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr>{['ID','Titulaire','Type','Émission','Expiration','Actions'].map(h=><th key={h} style={sty.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {docsFiltres.length===0 ? (
                      <tr><td colSpan={6} style={{ ...sty.td, textAlign:'center', padding:32, color:'#475569' }}>Aucun document trouvé.</td></tr>
                    ) : docsFiltres.map(d => (
                      <tr key={d.id} style={{ background: d.alerteExpiration ? '#1C1208' : 'transparent' }}>
                        <td style={sty.td}><span style={{ fontFamily:'monospace', color:'#FCD116', fontSize:11 }}>{d.id}</span></td>
                        <td style={sty.td}>{d.prenoms} {d.nom?.toUpperCase()}</td>
                        <td style={sty.td}>{d.type==='carte'?'🪪 Carte':'📕 Passeport'}</td>
                        <td style={sty.td}>{d.dateEmission}</td>
                        <td style={sty.td}>
                          <span style={{ color: d.alerteExpiration ? '#FBBF24' : '#CBD5E1' }}>{d.dateExpiration}</span>
                          {d.alerteExpiration && <span style={{ display:'block', fontSize:10, color:'#FBBF24' }}>⚠ {d.joursRestants}j restants</span>}
                        </td>
                        <td style={sty.td}>
                          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                            <a href={`/verification?id=${d.id}`} target="_blank" style={{ ...sty.btn('#1E3A5F','#60A5FA'), textDecoration:'none' }}>Voir</a>
                            <a href={`${API}/api/documents/pdf/${d.id}`} target="_blank" style={{ ...sty.btn('#14532D','#34D399'), textDecoration:'none' }}>PDF</a>
                            <button onClick={()=>setConfirmation(d)} style={sty.btn('#7F1D1D','#FCA5A5')}>Révoquer</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ACTES DE NAISSANCE ── */}
        {onglet==='actes' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
              <input value={rechercheActe} onChange={e=>setRechercheActe(e.target.value)} placeholder="Rechercher un acte..." style={{ ...sty.input, maxWidth:320 }} />
              <button onClick={()=>{ setFormeActe('new'); setChampActe({numero:'',nom:'',prenoms:'',dateNaissance:'',lieuNaissance:'',sexe:'M'}); setErreurActe(''); }} style={sty.btn('#166534','#fff')}>
                ➕ Nouvel acte
              </button>
            </div>

            {/* Formulaire ajout/édition */}
            {formeActe && (
              <div style={{ ...sty.card, padding:22, marginBottom:18 }}>
                <h3 style={{ color:'#FCD116', fontSize:13, fontWeight:700, marginBottom:16 }}>{formeActe==='new'?'Ajouter un acte de naissance':'Modifier l\'acte'}</h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
                  {[
                    { key:'numero', label:'Numéro d\'acte', placeholder:'AN-AAAA-XXXXXX', disabled: formeActe!=='new' },
                    { key:'nom', label:'Nom de famille', placeholder:'DIALLO' },
                    { key:'prenoms', label:'Prénom(s)', placeholder:'Mamadou' },
                    { key:'dateNaissance', label:'Date de naissance', type:'date' },
                    { key:'lieuNaissance', label:'Lieu de naissance', placeholder:'Conakry' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize:11, color:'#94A3B8', display:'block', marginBottom:4 }}>{f.label}</label>
                      <input
                        value={champActe[f.key]||''}
                        onChange={e=>setChampActe(c=>({...c,[f.key]:e.target.value}))}
                        placeholder={f.placeholder}
                        type={f.type||'text'}
                        disabled={f.disabled}
                        style={{ ...sty.input, opacity: f.disabled?0.5:1 }}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize:11, color:'#94A3B8', display:'block', marginBottom:4 }}>Sexe</label>
                    <select value={champActe.sexe||'M'} onChange={e=>setChampActe(c=>({...c,sexe:e.target.value}))} style={{ ...sty.input }}>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                </div>
                {erreurActe && <div style={{ color:'#FCA5A5', fontSize:12, marginTop:10 }}>⚠ {erreurActe}</div>}
                <div style={{ display:'flex', gap:10, marginTop:16 }}>
                  <button onClick={soumettreActe} style={sty.btn('#166534')}>✅ Enregistrer</button>
                  <button onClick={()=>setFormeActe(null)} style={sty.btn('#1E293B','#94A3B8')}>Annuler</button>
                </div>
              </div>
            )}

            <div style={sty.card}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr>{['Numéro','Nom','Prénom(s)','Naissance','Lieu','Sexe','Actions'].map(h=><th key={h} style={sty.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {actesFiltres.length===0 ? (
                      <tr><td colSpan={7} style={{ ...sty.td, textAlign:'center', padding:24, color:'#475569' }}>Aucun acte trouvé.</td></tr>
                    ) : actesFiltres.map(a => (
                      <tr key={a.numero}>
                        <td style={sty.td}><span style={{ fontFamily:'monospace', color:'#60A5FA', fontSize:11 }}>{a.numero}</span></td>
                        <td style={sty.td}>{a.nom}</td>
                        <td style={sty.td}>{a.prenoms}</td>
                        <td style={sty.td}>{a.dateNaissance}</td>
                        <td style={sty.td}>{a.lieuNaissance}</td>
                        <td style={sty.td}><Badge label={a.sexe==='M'?'M ♂':'F ♀'} color={a.sexe==='M'?'#60A5FA':'#F472B6'} bg={a.sexe==='M'?'#1E3A5F':'#500724'} /></td>
                        <td style={sty.td}>
                          <div style={{ display:'flex', gap:6 }}>
                            <button onClick={()=>ouvrirEditionActe(a)} style={sty.btn('#1E3A5F','#60A5FA')}>✏️</button>
                            <button onClick={()=>supprimerActe(a.numero)} style={sty.btn('#7F1D1D','#FCA5A5')}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p style={{ color:'#475569', fontSize:11, marginTop:8 }}>{actes.length} acte(s) enregistré(s)</p>
          </div>
        )}

        {/* ── AUDIT ── */}
        {onglet==='audit' && (
          <div>
            <div style={{ marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'#64748B', fontSize:12 }}>{auditLogs.length} entrée(s) — 100 dernières</span>
              <button onClick={chargerDonnees} style={sty.btn('#1E293B','#94A3B8')}>🔄 Actualiser</button>
            </div>
            <div style={sty.card}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr>{['Horodatage','Action','Détails','IP'].map(h=><th key={h} style={sty.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {auditLogs.length===0 ? (
                      <tr><td colSpan={4} style={{ ...sty.td, textAlign:'center', padding:24, color:'#475569' }}>Aucun log disponible.</td></tr>
                    ) : auditLogs.map(log => (
                      <tr key={log.id}>
                        <td style={{ ...sty.td, fontFamily:'monospace', fontSize:11, whiteSpace:'nowrap' }}>{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                        <td style={sty.td}>
                          <span style={{ fontWeight:700, color:'#FCD116' }}>{AUDIT_ICONS[log.action]||'📝'} {log.action}</span>
                        </td>
                        <td style={{ ...sty.td, fontSize:11 }}>
                          {log.documentId && <span style={{ color:'#60A5FA', fontFamily:'monospace' }}>{log.documentId}</span>}
                          {log.nom && <span style={{ color:'#CBD5E1' }}> · {log.prenoms} {log.nom}</span>}
                          {log.numero && <span style={{ color:'#60A5FA', fontFamily:'monospace' }}>{log.numero}</span>}
                          {log.par && <span style={{ color:'#94A3B8' }}> par {log.par}</span>}
                        </td>
                        <td style={{ ...sty.td, fontFamily:'monospace', fontSize:10, color:'#475569' }}>{log.ip||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal révocation */}
      {confirmation && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:20 }}>
          <div style={{ ...sty.card, padding:28, maxWidth:440, width:'100%' }}>
            <h3 style={{ color:'#FCA5A5', fontWeight:700, fontSize:16, marginBottom:8 }}>⚠️ Confirmer la révocation</h3>
            <p style={{ color:'#CBD5E1', fontSize:13, marginBottom:20 }}>
              Révoquer <span style={{ fontFamily:'monospace', color:'#FCD116' }}>{confirmation.id}</span> de <strong>{confirmation.prenoms} {confirmation.nom?.toUpperCase()}</strong>. Action permanente sur la blockchain.
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={()=>setConfirmation(null)} style={sty.btn('#1E293B','#94A3B8')}>Annuler</button>
              <button onClick={()=>revoquerDoc(confirmation.id)} style={sty.btn('#991B1B','#fff')}>Révoquer définitivement</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
