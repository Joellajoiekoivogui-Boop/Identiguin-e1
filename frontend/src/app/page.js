'use client';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const STATS = [
  { val: '13M+',  label: 'Citoyens à identifier',  sub: 'Objectif national' },
  { val: '95%',   label: 'Réduction de la fraude', sub: 'Falsifications évitées' },
  { val: '< 5min', label: 'Délai de délivrance',    sub: 'Contre plusieurs semaines' },
  { val: '24 / 7', label: 'Vérification en ligne',  sub: 'Sans interruption' },
];

const FEATURES = [
  { icon: '🪪', title: 'Carte d\'Identité Biométrique', desc: 'CINB conforme ISO/IEC 7810 avec photo, données biométriques, QR code et signature cryptographique X.509.' },
  { icon: '📕', title: 'Passeport Électronique',        desc: 'Passeport conforme aux normes OACI avec zone MRZ, biométrie faciale et ancrage blockchain.' },
  { icon: '⛓',  title: 'Ancrage Blockchain',            desc: 'Chaque document est hashé SHA-256 et inscrit de façon immuable. Falsification détectée instantanément.' },
  { icon: '🔍', title: 'Vérification Instantanée',      desc: 'ID unique ou QR code — la réponse est disponible en moins d\'une seconde, 24h/24, 7j/7.' },
  { icon: '🔒', title: 'Chiffrement AES-256',           desc: 'Toutes les données sensibles sont chiffrées de bout en bout. Authentification multi-facteurs pour les agents.' },
  { icon: '📊', title: 'Tableau de bord Admin',         desc: 'Gestion centralisée, statistiques en temps réel, export CSV, révocation et audit trail complet.' },
];

const ETAPES = [
  { n: '01', titre: 'Formulaire en ligne',  desc: 'Saisie des données personnelles et téléversement de la photo.' },
  { n: '02', titre: 'Validation auto.',     desc: 'Contrôle de qualité, détection de doublons et vérification des données.' },
  { n: '03', titre: 'Génération du PDF',    desc: 'Document officiel avec ID unique, QR code, drapeau et signature numérique.' },
  { n: '04', titre: 'Ancrage Blockchain',   desc: 'Le hash SHA-256 est inscrit de façon permanente et immuable sur la chaîne.' },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: '96px 24px 80px', overflow: 'hidden' }}>
        {/* Gradient de fond */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Grille décorative */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.035,
          backgroundImage: 'linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative' }}>

          {/* Badge statut */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,148,96,0.08)', border: '1px solid rgba(0,148,96,0.25)',
            borderRadius: 3, padding: '5px 14px', marginBottom: 32,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#009460' }} className="pulse-or" />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6EE7B7' }}>
              Système Opérationnel — Blockchain Active
            </span>
          </div>

          {/* Titre */}
          <h1 className="font-display" style={{ fontSize: 'clamp(36px, 6vw, 62px)', fontWeight: 700, lineHeight: 1.08, marginBottom: 20, color: '#F0EDE8', letterSpacing: '-0.02em' }}>
            Identité Numérique<br />
            <span style={{ color: '#D4AF37' }}>Souveraine</span> pour la Guinée
          </h1>

          <p style={{ fontSize: 16, color: '#8A9BB5', maxWidth: 560, margin: '0 auto 16px', lineHeight: 1.7 }}>
            Plateforme nationale de délivrance de cartes d'identité et passeports biométriques, sécurisée par blockchain. Chaque document est infalsifiable.
          </p>

          {/* Drapeaux et pays */}
          <p style={{ fontSize: 13, color: '#4A6080', marginBottom: 40, letterSpacing: '0.06em' }}>
            🇬🇳 &nbsp; REPUBLIQUE DE GUINEE &nbsp; — &nbsp; Travail · Justice · Solidarité
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/demande" className="btn btn-or" style={{ fontSize: 12 }}>
              Faire une demande →
            </Link>
            <Link href="/verification" className="btn btn-outline">
              Vérifier un document
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid #1E2F47', borderBottom: '1px solid #1E2F47' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }} className="stats-grid">
            {STATS.map((s, i) => (
              <div key={s.label} style={{
                padding: '28px 24px', textAlign: 'center',
                borderRight: i < STATS.length - 1 ? '1px solid #1E2F47' : 'none',
              }}>
                <div className="font-display" style={{ fontSize: 32, fontWeight: 700, color: '#D4AF37', lineHeight: 1.1, marginBottom: 4 }}>
                  {s.val}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#F0EDE8', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: '#4A6080', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ───────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 12 }}>
              Fonctionnalités
            </div>
            <h2 className="font-display" style={{ fontSize: 34, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>
              Une infrastructure complète
            </h2>
            <p style={{ fontSize: 14, color: '#8A9BB5', maxWidth: 500, margin: '0 auto' }}>
              De la demande à la vérification, chaque étape est sécurisée, traçable et conforme aux standards internationaux.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="card" style={{ padding: '28px 24px', transition: 'border-color 0.2s' }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.18)'}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 12, color: '#8A9BB5', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ─────────────────────────────────────────────── */}
      <section style={{ padding: '64px 24px', background: '#0D1B2E', borderTop: '1px solid #1E2F47', borderBottom: '1px solid #1E2F47' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 12 }}>
              Parcours
            </div>
            <h2 className="font-display" style={{ fontSize: 32, fontWeight: 700, color: '#F0EDE8' }}>
              Comment ça fonctionne ?
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 0 }}>
            {ETAPES.map((e, i) => (
              <div key={e.n} style={{ position: 'relative', padding: '0 24px', textAlign: 'center' }}>
                {/* Connecteur */}
                {i < ETAPES.length - 1 && (
                  <div style={{ position: 'absolute', top: 20, left: '60%', width: '80%', height: 1, background: 'linear-gradient(to right, #D4AF37, #1E2F47)' }} />
                )}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #D4AF37, #E8C56A)',
                  color: '#08111F', fontWeight: 700, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', position: 'relative', zIndex: 1,
                }}>
                  {e.n}
                </div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#F0EDE8', marginBottom: 8 }}>{e.titre}</h4>
                <p style={{ fontSize: 11, color: '#4A6080', lineHeight: 1.7 }}>{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SÉCURITÉ ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }} className="two-col">
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 12 }}>
              Sécurité & Confiance
            </div>
            <h2 className="font-display" style={{ fontSize: 30, fontWeight: 700, color: '#F0EDE8', marginBottom: 16 }}>
              Infrastructure de confiance nationale
            </h2>
            <p style={{ fontSize: 13, color: '#8A9BB5', lineHeight: 1.8, marginBottom: 24 }}>
              Chaque document émis est signé numériquement par un certificat X.509 et son empreinte SHA-256 est ancrée de façon permanente sur la blockchain. Aucune modification n'est possible sans que la fraude soit détectée immédiatement.
            </p>
            <Link href="/demande" className="btn btn-or">Commencer ma demande →</Link>
          </div>

          <div className="card" style={{ padding: 28 }}>
            {[
              { label: 'Chiffrement', val: 'AES-256 de bout en bout', ok: true },
              { label: 'Signature',   val: 'Certificat X.509 officiel', ok: true },
              { label: 'Blockchain',  val: 'SHA-256, immuable',         ok: true },
              { label: 'Auth',        val: 'JWT + bcrypt, 2FA',         ok: true },
              { label: 'Hébergement', val: 'Souverain — Guinée',        ok: true },
              { label: 'Conformité',  val: 'RGPD + réglementations GN', ok: true },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1E2F47' }}>
                <span style={{ fontSize: 11, color: '#8A9BB5', fontWeight: 500 }}>{r.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#F0EDE8' }}>{r.val}</span>
                  <span style={{ color: '#009460', fontSize: 12 }}>✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section style={{ padding: '64px 24px', background: '#0D1B2E', borderTop: '1px solid #1E2F47' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 20 }}>🇬🇳</div>
          <h2 className="font-display" style={{ fontSize: 30, fontWeight: 700, color: '#F0EDE8', marginBottom: 12 }}>
            Prêt à obtenir votre document officiel ?
          </h2>
          <p style={{ fontSize: 13, color: '#8A9BB5', marginBottom: 32 }}>
            La démarche prend moins de 5 minutes. Votre document est disponible immédiatement avec ancrage blockchain instantané.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/demande" className="btn btn-or">Faire une demande →</Link>
            <Link href="/verification" className="btn btn-ghost">Vérifier un document</Link>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .two-col    { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
