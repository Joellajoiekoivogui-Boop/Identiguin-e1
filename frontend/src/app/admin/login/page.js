'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      const { data } = await axios.post(`${API}/api/admin/login`, form);
      login(data.token, data.username);
      router.push('/admin');
    } catch (err) {
      setErreur(err.response?.data?.error || 'Identifiants incorrects. Réessayez.');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo / titre */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: '#F0EDE8', marginBottom: 6 }}>
            Espace Administrateur
          </h1>
          <p style={{ fontSize: 12, color: '#8A9BB5' }}>
            Accès réservé au personnel autorisé d'IdentiGuinée
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={soumettre} className="card-elevated" style={{ padding: 32 }}>

          {/* Barre tricolore */}
          <div className="tricolore" style={{ height: 4, borderRadius: 2, marginBottom: 28 }} />

          {/* Champ identifiant */}
          <div style={{ marginBottom: 20 }}>
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

          {/* Champ mot de passe */}
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

          {/* Erreur */}
          {erreur && (
            <div className="statut-invalide" style={{ borderRadius: 3, padding: '10px 14px', marginBottom: 20, fontSize: 13 }}>
              ⚠️ {erreur}
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            disabled={chargement}
            className="btn btn-or"
            style={{ width: '100%', fontSize: 13 }}
          >
            {chargement ? '⏳ Connexion en cours...' : 'Se connecter →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#4A6080', marginTop: 20 }}>
            Identifiants par défaut :{' '}
            <span className="font-mono-ig" style={{ color: '#8A9BB5' }}>admin / IdentiGuinee2026</span>
          </p>
        </form>

      </div>
    </div>
  );
}
