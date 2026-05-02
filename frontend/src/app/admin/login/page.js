'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

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
      const { data } = await axios.post('/api/admin/login', form);
      login(data.token, data.username);
      router.push('/admin');
    } catch (e) {
      setErreur(e.response?.data?.error || 'Erreur de connexion. Vérifiez vos identifiants.');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🛡️</div>
          <h1 className="text-2xl font-bold text-white mb-1">Espace Administrateur</h1>
          <p className="text-gray-400 text-sm">Accès réservé au personnel autorisé d'IdentiGuinée</p>
        </div>

        <form onSubmit={soumettre} className="card-identite rounded-2xl p-8 space-y-5">
          <div className="h-1 tricolore-bar rounded-full -mt-2 mb-6" />

          <div>
            <label className="label-field">Identifiant</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="admin"
              className="input-field mt-1"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="label-field">Mot de passe</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••••••"
              className="input-field mt-1"
              autoComplete="current-password"
              required
            />
          </div>

          {erreur && (
            <div className="statut-invalide rounded-lg p-3 text-sm">
              ⚠️ {erreur}
            </div>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="btn-primaire w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {chargement ? '⏳ Connexion...' : 'Se connecter →'}
          </button>

          <p className="text-center text-xs text-gray-600 pt-2">
            Identifiants par défaut : <span className="font-mono text-gray-500">admin / IdentiGuinee2026</span>
          </p>
        </form>
      </div>
    </div>
  );
}
