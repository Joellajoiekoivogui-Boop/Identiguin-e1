'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function LoginPage() {
  const { login }  = useAuth();
  const router     = useRouter();
  const [loading,  setLoading]  = useState(false);
  const [erreur,   setErreur]   = useState('');

  const acceder = async () => {
    setErreur(''); setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/admin/login`, {});
      login(data.token, data.username);
      router.push('/admin');
    } catch {
      setErreur('Erreur de connexion au serveur. Vérifiez que le backend est démarré.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: '#0F2544', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>🛡️</div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
            Espace Administrateur
          </h1>
          <p style={{ fontSize: 12, color: '#64748B' }}>
            Panneau de gestion IdentiGuinée
          </p>
        </div>

        <div className="card" style={{ padding: 32, boxShadow: '0 4px 16px rgba(15,37,68,0.10)' }}>
          <div style={{ height: 3, background: 'linear-gradient(to right,#CE1126 0% 33%,#FCD116 33% 66%,#009460 66% 100%)', borderRadius: 2, marginBottom: 28 }} />

          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: '16px 20px', marginBottom: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🎯</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0369A1', marginBottom: 4 }}>Mode Démonstration</div>
            <div style={{ fontSize: 12, color: '#0284C7' }}>
              Accès libre au panneau d'administration pour la présentation du projet.
            </div>
          </div>

          {erreur && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 5, padding: '10px 13px', fontSize: 12, color: '#991B1B', marginBottom: 20 }}>
              ⚠ {erreur}
            </div>
          )}

          <button
            onClick={acceder}
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700 }}
          >
            {loading ? '⏳ Connexion...' : 'Accéder au panneau admin →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 16 }}>
            Aucun identifiant requis — mode démo activé
          </p>
        </div>
      </div>
    </div>
  );
}
