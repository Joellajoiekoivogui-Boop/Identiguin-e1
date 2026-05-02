'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

function StatCard({ icone, label, valeur, couleur }) {
  return (
    <div className="card-identite rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icone}</span>
        <span className={`text-3xl font-bold ${couleur}`}>{valeur}</span>
      </div>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  );
}

export default function AdminPage() {
  const { admin, logout, chargement: authChargement } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [onglet, setOnglet] = useState('stats');
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [exportEnCours, setExportEnCours] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    if (!authChargement && !admin) router.push('/admin/login');
  }, [admin, authChargement, router]);

  const chargerDonnees = useCallback(async () => {
    if (!admin) return;
    try {
      const headers = { Authorization: `Bearer ${admin.token}` };
      const [statsRes, docsRes] = await Promise.all([
        axios.get('/api/admin/stats', { headers }),
        axios.get('/api/admin/documents', { headers }),
      ]);
      setStats(statsRes.data);
      setDocuments(docsRes.data);
    } catch {
      logout();
    } finally {
      setChargement(false);
    }
  }, [admin, logout]);

  useEffect(() => { chargerDonnees(); }, [chargerDonnees]);

  const exporterCSV = async () => {
    setExportEnCours(true);
    try {
      const res = await axios.get('/api/admin/export/csv', {
        headers: { Authorization: `Bearer ${admin.token}` },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `identiguinee_export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erreur lors de l\'export CSV.');
    } finally {
      setExportEnCours(false);
    }
  };

  const revoquerDocument = async (id) => {
    try {
      await axios.post(`/api/admin/revoquer/${id}`, {}, {
        headers: { Authorization: `Bearer ${admin.token}` },
      });
      setConfirmation(null);
      chargerDonnees();
    } catch {
      alert('Erreur lors de la révocation.');
    }
  };

  const docsFiltres = documents.filter((d) =>
    `${d.nom} ${d.prenoms} ${d.id}`.toLowerCase().includes(recherche.toLowerCase())
  );

  if (authChargement || chargement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">⛓️</div>
          <p className="text-gray-400">Chargement du panneau d'administration...</p>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Panneau d'Administration</h1>
            <p className="text-gray-400 text-sm mt-1">
              Connecté en tant que <span className="text-guinee-jaune font-mono">{admin.username}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={exporterCSV} disabled={exportEnCours} className="btn-secondaire text-sm disabled:opacity-50">
              {exportEnCours ? '⏳ Export...' : '⬇ Export CSV'}
            </button>
            <button onClick={logout} className="px-4 py-2 rounded-lg border border-red-700 text-red-400 hover:bg-red-900/30 text-sm transition-colors">
              Déconnexion
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icone="📄" label="Total documents" valeur={stats.totalDocuments} couleur="text-guinee-jaune" />
            <StatCard icone="⛓️" label="Blocs blockchain" valeur={stats.totalBlocs} couleur="text-blue-400" />
            <StatCard icone="🪪" label="Cartes d'identité" valeur={stats.parType?.carte || 0} couleur="text-green-400" />
            <StatCard icone="📕" label="Passeports" valeur={stats.parType?.passeport || 0} couleur="text-purple-400" />
          </div>
        )}

        {/* Onglets */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2">
          {[
            { id: 'stats', label: '📊 Statistiques' },
            { id: 'documents', label: '📋 Documents' },
          ].map((o) => (
            <button
              key={o.id}
              onClick={() => setOnglet(o.id)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                onglet === o.id ? 'bg-guinee-jaune text-nuit' : 'text-gray-400 hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Contenu stats */}
        {onglet === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-identite rounded-xl p-6">
              <h3 className="text-guinee-jaune font-bold text-xs uppercase tracking-wider mb-4">
                Répartition par type
              </h3>
              {Object.entries(stats.parType || {}).map(([type, count]) => (
                <div key={type} className="flex items-center gap-3 mb-3">
                  <span className="text-lg">{type === 'carte' ? '🪪' : '📕'}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300 capitalize">{type === 'carte' ? "Carte d'identité" : 'Passeport'}</span>
                      <span className="text-white font-bold">{count}</span>
                    </div>
                    <div className="h-2 bg-nuit rounded-full overflow-hidden">
                      <div
                        className="h-full bg-guinee-jaune rounded-full"
                        style={{ width: `${(count / stats.totalDocuments) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-identite rounded-xl p-6">
              <h3 className="text-guinee-jaune font-bold text-xs uppercase tracking-wider mb-4">
                Émissions par mois
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.parMois || {}).sort().slice(-6).map(([mois, count]) => (
                  <div key={mois} className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs font-mono w-16">{mois}</span>
                    <div className="flex-1 h-2 bg-nuit rounded-full overflow-hidden">
                      <div
                        className="h-full bg-guinee-vert rounded-full"
                        style={{ width: `${(count / Math.max(...Object.values(stats.parMois))) * 100}%` }}
                      />
                    </div>
                    <span className="text-white text-xs font-bold w-4">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {stats.dernierDocument && (
              <div className="card-identite rounded-xl p-6 md:col-span-2">
                <h3 className="text-guinee-jaune font-bold text-xs uppercase tracking-wider mb-4">
                  Dernier document émis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-gray-500 text-xs mb-1">Nom</p><p className="text-white font-bold">{stats.dernierDocument.prenoms} {stats.dernierDocument.nom?.toUpperCase()}</p></div>
                  <div><p className="text-gray-500 text-xs mb-1">ID</p><p className="text-guinee-jaune font-mono">{stats.dernierDocument.id}</p></div>
                  <div><p className="text-gray-500 text-xs mb-1">Type</p><p className="text-white capitalize">{stats.dernierDocument.type}</p></div>
                  <div><p className="text-gray-500 text-xs mb-1">Date émission</p><p className="text-white">{stats.dernierDocument.dateEmission}</p></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contenu documents */}
        {onglet === 'documents' && (
          <div>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher par nom, prénom ou ID..."
                className="input-field flex-1"
              />
              <span className="text-gray-500 text-sm flex items-center">{docsFiltres.length} résultat(s)</span>
            </div>

            <div className="card-identite rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 text-left">
                      <th className="px-4 py-3 text-guinee-jaune font-bold text-xs uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-guinee-jaune font-bold text-xs uppercase tracking-wider">Titulaire</th>
                      <th className="px-4 py-3 text-guinee-jaune font-bold text-xs uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-guinee-jaune font-bold text-xs uppercase tracking-wider">Émission</th>
                      <th className="px-4 py-3 text-guinee-jaune font-bold text-xs uppercase tracking-wider">Expiration</th>
                      <th className="px-4 py-3 text-guinee-jaune font-bold text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docsFiltres.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucun document trouvé.</td></tr>
                    ) : (
                      docsFiltres.map((d) => (
                        <tr key={d.id} className="border-b border-gray-800 hover:bg-nuit-card transition-colors">
                          <td className="px-4 py-3 font-mono text-guinee-jaune text-xs">{d.id}</td>
                          <td className="px-4 py-3 text-white">{d.prenoms} {d.nom?.toUpperCase()}</td>
                          <td className="px-4 py-3 text-gray-300 capitalize">{d.type === 'carte' ? '🪪 Carte' : '📕 Passeport'}</td>
                          <td className="px-4 py-3 text-gray-400">{d.dateEmission}</td>
                          <td className="px-4 py-3 text-gray-400">{d.dateExpiration}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <a
                                href={`/verification?id=${d.id}`}
                                target="_blank"
                                className="px-2 py-1 rounded text-xs border border-blue-700 text-blue-400 hover:bg-blue-900/30 transition-colors"
                              >
                                Voir
                              </a>
                              <a
                                href={`/api/documents/pdf/${d.id}`}
                                target="_blank"
                                className="px-2 py-1 rounded text-xs border border-green-700 text-green-400 hover:bg-green-900/30 transition-colors"
                              >
                                PDF
                              </a>
                              <button
                                onClick={() => setConfirmation(d)}
                                className="px-2 py-1 rounded text-xs border border-red-700 text-red-400 hover:bg-red-900/30 transition-colors"
                              >
                                Révoquer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmation révocation */}
      {confirmation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="card-identite rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-red-400 font-bold text-lg mb-2">⚠️ Confirmer la révocation</h3>
            <p className="text-gray-300 text-sm mb-4">
              Vous allez révoquer le document <span className="font-mono text-guinee-jaune">{confirmation.id}</span> de{' '}
              <span className="font-bold">{confirmation.prenoms} {confirmation.nom?.toUpperCase()}</span>.
              Cette action sera enregistrée de façon permanente sur la blockchain.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmation(null)} className="btn-secondaire text-sm">Annuler</button>
              <button
                onClick={() => revoquerDocument(confirmation.id)}
                className="px-6 py-2 rounded-lg bg-red-700 text-white font-bold text-sm hover:bg-red-600 transition-colors"
              >
                Révoquer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
