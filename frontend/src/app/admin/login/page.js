'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function LoginPage() {
  const { login }   = useAuth();
  const router      = useRouter();
  const [form,      setForm]      = useState({ username: '', password: '' });
  const [erreur,    setErreur]    = useState('');
  const [chargement,setChargement]= useState(false);

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur(''); setChargement(true);
    try {
      const { data } = await axios.post(`${API}/api/admin/login`, form);
      login(data.token, data.username);
      router.push('/admin');
    } catch (err) {
      setErreur(err.response?.data?.error || 'Identifiants incorrects. Réessayez.');
    } finally { setChargement(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Accroche */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: '#0F2544', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>🛡️</div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
            Espace Administrateur
          </h1>
          <p style={{ fontSize: 12, color: '#64748B' }}>
            Accès réservé au personnel autorisé d'IdentiGuinée
          </p>
        </div>

        {/* Formulaire */}
        <div className="card" style={{ padding: 32, boxShadow: '0 4px 16px rgba(15,37,68,0.10)' }}>

          {/* Tricolore */}
          <div style={{ height: 3, background: 'linear-gradient(to right,#CE1126 0% 33%,#FCD116 33% 66%,#009460 66% 100%)', borderRadius: 2, marginBottom: 28 }} />

          <form onSubmit={soumettre}>
            <div style={{ marginBottom: 18 }}>
              <label className="field-label">Identifiant</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="admin"
                className="field-input"
                autoComplete="username"
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="field-label">Mot de passe</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••••••"
                className="field-input"
                autoComplete="current-password"
                required
              />
            </div>

            {erreur && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 5, padding: '10px 13px', fontSize: 12, color: '#991B1B', marginBottom: 20 }}>
                ⚠️ {erreur}
              </div>
            )}

            <button
              type="submit"
              disabled={chargement}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 14 }}
            >
              {chargement ? '⏳ Connexion...' : 'Se connecter →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 20 }}>
            Identifiants par défaut :{' '}
            <span className="font-mono-ig" style={{ color: '#64748B', fontSize: 11 }}>admin / IdentiGuinee2026</span>
          </p>
        </div>
      </div>
    </div>
  );
}
