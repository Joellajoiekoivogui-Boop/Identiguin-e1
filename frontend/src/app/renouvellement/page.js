'use client';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';

function RenouvellementContenu() {
  const searchParams = useSearchParams();
  const idInitial = searchParams.get('id') || '';

  const [documentId, setDocumentId] = useState(idInitial);
  const [eligibilite, setEligibilite] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [adresse, setAdresse] = useState('');
  const [profession, setProfession] = useState('');
  const [chargement, setChargement] = useState(false);
  const [verification, setVerification] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    if (idInitial) verifierEligibilite(idInitial);
  }, [idInitial]);

  const verifierEligibilite = async (id) => {
    const cible = (id || documentId).trim();
    if (!cible) { setErreur('Veuillez saisir un identifiant.'); return; }
    setVerification(true);
    setEligibilite(null);
    setErreur('');
    try {
      const { data } = await axios.get(`/api/renouvellement/${cible}`);
      setEligibilite(data);
      setDocumentId(cible);
      if (data.documentActuel) {
        setAdresse('');
        setProfession('');
      }
    } catch (e) {
      setErreur(e.response?.data?.error || 'Document introuvable.');
    } finally {
      setVerification(false);
    }
  };

  const gererPhoto = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const soumettre = async () => {
    if (!eligibilite?.eligible) return;
    setChargement(true);
    setErreur('');
    const payload = new FormData();
    if (adresse) payload.append('adresse', adresse);
    if (profession) payload.append('profession', profession);
    if (photo) payload.append('photo', photo);
    try {
      const { data } = await axios.post(`/api/renouvellement/${documentId}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResultat(data);
    } catch (e) {
      setErreur(e.response?.data?.error || 'Erreur lors du renouvellement.');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔄</div>
          <h1 className="text-3xl font-bold text-white mb-2">Renouvellement de Document</h1>
          <p className="text-gray-400">
            Renouvelez votre carte d'identité ou passeport avant expiration.
            L'ancien document sera révoqué sur la blockchain.
          </p>
        </div>

        {/* Étape 1 — Recherche */}
        {!resultat && (
          <div className="card-identite rounded-2xl p-6 mb-6">
            <label className="label-field">Identifiant du document à renouveler</label>
            <div className="flex gap-3 mt-1">
              <input
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value.toUpperCase())}
                placeholder="GN-2026-XXXXXX"
                className="input-field font-mono flex-1"
              />
              <button
                onClick={() => verifierEligibilite()}
                disabled={verification}
                className="btn-primaire whitespace-nowrap disabled:opacity-50"
              >
                {verification ? '⏳' : 'Vérifier'}
              </button>
            </div>
          </div>
        )}

        {erreur && (
          <div className="statut-invalide rounded-xl p-4 mb-4 text-sm">⚠️ {erreur}</div>
        )}

        {/* Éligibilité */}
        {eligibilite && !resultat && (
          <div className="space-y-4">
            {/* Info document actuel */}
            <div className="card-identite rounded-xl p-5">
              <h3 className="text-guinee-jaune font-bold text-xs uppercase tracking-wider mb-3">
                Document actuel
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Titulaire</p>
                  <p className="text-white font-bold">
                    {eligibilite.documentActuel.prenoms} {eligibilite.documentActuel.nom?.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Type</p>
                  <p className="text-white">{eligibilite.documentActuel.type === 'carte' ? '🪪 Carte d\'Identité' : '📕 Passeport'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Expiration</p>
                  <p className="text-red-400 font-bold">{eligibilite.documentActuel.dateExpiration}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Jours restants</p>
                  <p className={eligibilite.joursRestants < 30 ? 'text-red-400 font-bold' : 'text-orange-400 font-bold'}>
                    {eligibilite.joursRestants} jours
                  </p>
                </div>
              </div>
            </div>

            {/* Éligibilité */}
            {eligibilite.eligible ? (
              <div className="statut-valide rounded-xl p-4 text-sm">
                ✅ Ce document est éligible au renouvellement (moins de 6 mois avant expiration).
              </div>
            ) : (
              <div className="statut-expire rounded-xl p-4 text-sm">
                ⚠️ Ce document n'est pas encore éligible au renouvellement ({eligibilite.joursRestants} jours restants).
                Le renouvellement est possible dans les 6 derniers mois de validité.
              </div>
            )}

            {/* Formulaire de renouvellement */}
            {eligibilite.eligible && (
              <div className="card-identite rounded-xl p-6 space-y-4">
                <h3 className="text-white font-bold mb-2">Mise à jour des informations (optionnel)</h3>
                <p className="text-gray-400 text-sm -mt-2">
                  Les informations d'état civil restent identiques. Vous pouvez mettre à jour votre adresse, profession et photo.
                </p>

                <div>
                  <label className="label-field">Nouvelle adresse</label>
                  <input
                    type="text"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                    placeholder="Laisser vide pour conserver l'adresse actuelle"
                    className="input-field mt-1"
                  />
                </div>

                <div>
                  <label className="label-field">Nouvelle profession</label>
                  <input
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="Laisser vide pour conserver la profession actuelle"
                    className="input-field mt-1"
                  />
                </div>

                <div>
                  <label className="label-field">Nouvelle photo (optionnel)</label>
                  <div
                    onClick={() => fileRef.current.click()}
                    className={`mt-1 h-32 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                      photoPreview ? 'border-guinee-vert' : 'border-gray-600 hover:border-or'
                    }`}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Aperçu" className="h-full object-contain" />
                    ) : (
                      <p className="text-gray-500 text-sm">📷 Cliquer pour sélectionner</p>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={gererPhoto} className="hidden" />
                </div>

                <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-xs text-red-300">
                  ⚠️ En confirmant, l'ancien document <span className="font-mono">{documentId}</span> sera définitivement révoqué sur la blockchain.
                </div>

                <button
                  onClick={soumettre}
                  disabled={chargement}
                  className="btn-primaire w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {chargement ? '⏳ Renouvellement en cours...' : '🔄 Confirmer le renouvellement'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Résultat */}
        {resultat && (
          <div className="card-identite rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-guinee-jaune mb-2">Renouvellement réussi !</h2>
            <p className="text-gray-400 mb-6">
              Votre nouveau document est prêt. L'ancien document a été révoqué sur la blockchain.
            </p>

            <div className="bg-nuit-light rounded-xl p-5 text-left space-y-3 border border-or mb-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Ancien document (révoqué)</p>
                <p className="font-mono text-red-400 line-through">{resultat.ancienId}</p>
              </div>
              <div>
                <p className="text-xs text-guinee-jaune font-bold uppercase tracking-wider mb-1">Nouveau document</p>
                <p className="text-2xl font-mono font-bold text-white">{resultat.nouvelId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Hash Blockchain</p>
                <p className="hash-text">{resultat.hashBlockchain}</p>
              </div>
              <div className="flex justify-between text-sm">
                <div><p className="text-xs text-gray-500">Block</p><p className="text-green-400 font-mono">#{resultat.blockIndex}</p></div>
                <div className="text-right"><p className="text-xs text-gray-500">Statut</p><p className="text-green-400">✓ Ancré</p></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={resultat.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-primaire inline-block">
                Télécharger le nouveau PDF
              </a>
              <a href={`/verification?id=${resultat.nouvelId}`} className="btn-secondaire inline-block">
                Vérifier le nouveau document
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RenouvellementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Chargement...</div>}>
      <RenouvellementContenu />
    </Suspense>
  );
}
