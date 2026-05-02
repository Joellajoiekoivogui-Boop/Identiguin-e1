'use client';
import Link from 'next/link';

const STATS = [
  { val: '13M+',   label: 'Citoyens à identifier', sub: 'Objectif national 2030' },
  { val: '95%',    label: 'Réduction de fraude',    sub: 'vs documents papier' },
  { val: '< 5min', label: 'Délai de délivrance',    sub: 'Versus plusieurs semaines' },
  { val: '24/7',   label: 'Vérification en ligne',  sub: 'Sans interruption' },
];

const FEATURES = [
  { icon: '🪪', title: "Carte d'Identité Biométrique", desc: "CINB conforme ISO/IEC 7810. Photo, données biométriques, QR code et signature cryptographique. Format carte biométrique paysage.", color: '#CE1126' },
  { icon: '📕', title: 'Passeport Électronique',        desc: 'Conforme OACI avec zone MRZ et ancrage blockchain. Même format carte que la CNI — conçu pour les voyages internationaux.',         color: '#1E3A5F' },
  { icon: '⛓',  title: 'Ancrage Blockchain',            desc: 'Chaque document est hashé SHA-256 et inscrit de façon immuable. Toute tentative de falsification est détectée instantanément.',   color: '#009460' },
  { icon: '🔍', title: 'Vérification Instantanée',      desc: "Identifiant unique ou scan QR code. Résultat en moins d'une seconde, 24h/24, 7j/7, sans installation requise.",                  color: '#B8960C' },
  { icon: '🔒', title: 'Chiffrement AES-256',           desc: 'Données personnelles chiffrées de bout en bout. Authentification JWT + bcrypt pour les agents agréés de la plateforme.',          color: '#7C3AED' },
  { icon: '📊', title: 'Tableau de Bord Admin',         desc: 'Gestion centralisée, statistiques temps réel, export CSV, révocation documentaire et audit trail complet.',                       color: '#0369A1' },
];

const STEPS = [
  { n: '01', titre: 'Formulaire en ligne',    desc: 'Saisie des données personnelles et téléversement sécurisé de la photo biométrique.' },
  { n: '02', titre: 'Validation automatique', desc: "Contrôle de qualité, détection de doublons et vérification de l'intégrité des données." },
  { n: '03', titre: 'Génération du document', desc: 'PDF au format carte biométrique avec identifiant unique, QR code et signature numérique.' },
  { n: '04', titre: 'Ancrage Blockchain',     desc: 'Le hash SHA-256 est inscrit de façon permanente et immuable sur la chaîne IdentiGuinée.' },
];

export default function HomePage() {
  return (
    <div style={{ background: '#F5F7FA' }}>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="hero-pad" style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '72px 24px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.02, backgroundImage: 'linear-gradient(45deg,#0F2544 25%,transparent 25%),linear-gradient(-45deg,#0F2544 25%,transparent 25%)', backgroundSize: '40px 40px' }} />
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'linear-gradient(to bottom,#CE1126,#FCD116,#009460)' }} />

        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 100, padding: '5px 16px', marginBottom: 28 }}>
            <span className="pulse-green" style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#047857', letterSpacing: '0.06em' }}>Système opérationnel — Blockchain active</span>
          </div>

          <h1 className="font-display" style={{ fontSize: 'clamp(28px,5.5vw,56px)', fontWeight: 700, color: '#0F172A', lineHeight: 1.1, marginBottom: 18, letterSpacing: '-0.02em' }}>
            Identité Numérique<br />
            <span style={{ color: '#0F2544' }}>Souveraine <span style={{ color: '#B8960C' }}>pour la Guinée</span></span>
          </h1>

          <p style={{ fontSize: 'clamp(13px,2vw,16px)', color: '#475569', maxWidth: 540, margin: '0 auto 14px', lineHeight: 1.75 }}>
            Plateforme nationale de délivrance de cartes d'identité et passeports biométriques, sécurisée par blockchain. Chaque document est infalsifiable.
          </p>
          <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 36, letterSpacing: '0.08em' }}>
            🇬🇳 &nbsp; REPUBLIQUE DE GUINEE &nbsp;·&nbsp; Travail · Justice · Solidarité
          </p>

          <div className="hero-btns" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/demande"      className="btn btn-primary"  style={{ fontSize: 14, padding: '12px 28px' }}>Faire une demande →</Link>
            <Link href="/verification" className="btn btn-outline"  style={{ fontSize: 14, padding: '12px 28px' }}>Vérifier un document</Link>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <section style={{ background: '#0F2544' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div className="rg-4">
            {STATS.map((s, i) => (
              <div key={s.label} className="stats-border" style={{ padding: '28px 20px', textAlign: 'center', borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div className="font-display" style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, color: '#C8A830', marginBottom: 4 }}>{s.val}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <span className="section-label" style={{ color: '#64748B' }}>Fonctionnalités</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(24px,3vw,32px)', fontWeight: 700, color: '#0F172A', marginTop: 10, marginBottom: 12 }}>Une infrastructure complète</h2>
            <p style={{ fontSize: 14, color: '#64748B', maxWidth: 480, margin: '0 auto' }}>De la demande à la vérification, chaque étape est sécurisée, traçable et conforme aux standards internationaux.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="card" style={{ padding: '24px 22px' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${f.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARCOURS ───────────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: '#fff', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="section-label" style={{ color: '#64748B' }}>Parcours citoyen</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, color: '#0F172A', marginTop: 10 }}>Comment ça fonctionne ?</h2>
          </div>
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            {STEPS.map((e, i) => (
              <div key={e.n} style={{ position: 'relative', padding: '0 20px', textAlign: 'center' }}>
                {i < STEPS.length - 1 && (
                  <div className="step-connector" style={{ position: 'absolute', top: 22, left: '60%', width: '80%', height: 1, background: 'linear-gradient(to right,#0F2544,#E2E8F0)' }} />
                )}
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0F2544', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', position: 'relative', zIndex: 1 }}>{e.n}</div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{e.titre}</h4>
                <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.7 }}>{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SÉCURITÉ ───────────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ padding: '64px 24px' }}>
        <div className="rg-2-col" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
          <div>
            <span className="section-label" style={{ color: '#64748B' }}>Sécurité & Confiance</span>
            <h2 className="font-display" style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 700, color: '#0F172A', marginTop: 10, marginBottom: 14 }}>Infrastructure de confiance nationale</h2>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.85, marginBottom: 28 }}>
              Chaque document est signé numériquement et son empreinte SHA-256 est ancrée de façon permanente sur la blockchain. Toute modification est détectée immédiatement.
            </p>
            <Link href="/demande" className="btn btn-primary">Commencer ma demande →</Link>
          </div>
          <div className="card" style={{ padding: 28 }}>
            {[
              { label: 'Chiffrement', val: 'AES-256 de bout en bout' },
              { label: 'Signature',   val: 'Certificat numérique X.509' },
              { label: 'Blockchain',  val: 'SHA-256 immuable' },
              { label: 'Auth',        val: 'JWT + bcrypt' },
              { label: 'Hébergement', val: 'Railway + Vercel' },
              { label: 'Conformité',  val: 'RGPD + réglementations GN' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{r.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#0F172A', fontWeight: 500 }}>{r.val}</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="section-pad" style={{ background: '#0F2544', padding: '64px 24px' }}>
        <div style={{ maxWidth: 580, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 38, marginBottom: 18 }}>🇬🇳</div>
          <h2 className="font-display" style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>Prêt à obtenir votre document officiel ?</h2>
          <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 32, lineHeight: 1.7 }}>La démarche prend moins de 5 minutes. Votre document est disponible immédiatement avec ancrage blockchain instantané.</p>
          <div className="hero-btns" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/demande" className="btn btn-gold" style={{ fontSize: 14, padding: '12px 28px' }}>Faire une demande →</Link>
            <Link href="/verification" style={{ display: 'inline-flex', alignItems: 'center', padding: '12px 28px', fontSize: 14, color: '#94A3B8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, textDecoration: 'none', fontWeight: 500 }}>
              Vérifier un document
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .steps-grid { grid-template-columns: 1fr 1fr !important; row-gap: 32px !important; }
        }
        @media (max-width: 480px) {
          .steps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
