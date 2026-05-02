'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ background: '#F1F5F9', borderTop: '1px solid #E2E8F0', padding: '48px 24px 28px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>

          {/* Branding */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: 'linear-gradient(135deg,#0F2544,#1E3A5F)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🇬🇳</div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0F2544' }}>Identi<span style={{ color: '#B8960C' }}>Guinée</span></span>
            </div>
            <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.7, maxWidth: 220, marginBottom: 16 }}>
              Plateforme souveraine de gestion de l'identité biométrique numérique pour la République de Guinée.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['🔒 AES-256', '⛓ Blockchain', '✓ OACI'].map(b => (
                <span key={b} style={{ fontSize: 10, color: '#64748B', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 100, padding: '3px 9px', fontWeight: 500 }}>{b}</span>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 14 }}>Services</div>
            {[
              { href: '/demande',      label: "Carte d'Identité Nationale" },
              { href: '/demande',      label: 'Passeport Électronique' },
              { href: '/renouvellement', label: 'Renouvellement' },
              { href: '/verification', label: 'Vérifier un document' },
            ].map(l => (
              <Link key={l.label} href={l.href} style={{ display: 'block', fontSize: 13, color: '#475569', textDecoration: 'none', marginBottom: 9, transition: 'color 0.15s' }}
                onMouseOver={e => e.currentTarget.style.color = '#0F2544'}
                onMouseOut={e => e.currentTarget.style.color = '#475569'}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Plateforme */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 14 }}>Plateforme</div>
            {[
              { href: '/dashboard',   label: 'Explorateur Blockchain' },
              { href: '/admin/login', label: 'Espace Administrateur' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={{ display: 'block', fontSize: 13, color: '#475569', textDecoration: 'none', marginBottom: 9, transition: 'color 0.15s' }}
                onMouseOver={e => e.currentTarget.style.color = '#0F2544'}
                onMouseOut={e => e.currentTarget.style.color = '#475569'}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Sécurité */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 14 }}>Sécurité & Conformité</div>
            <ul style={{ listStyle: 'none' }}>
              {[
                'Chiffrement de bout en bout AES-256',
                'Signature numérique X.509',
                'Blockchain immuable SHA-256',
                'Authentification JWT + bcrypt',
                'Conformité RGPD & normes locales',
              ].map(item => (
                <li key={item} style={{ fontSize: 12, color: '#64748B', marginBottom: 7, paddingLeft: 16, position: 'relative', lineHeight: 1.5 }}>
                  <span style={{ position: 'absolute', left: 0, color: '#009460', fontWeight: 700 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Séparateur tricolore */}
        <div style={{ height: 2, background: 'linear-gradient(to right,#CE1126 0% 33%,#FCD116 33% 66%,#009460 66% 100%)', marginBottom: 20, borderRadius: 1 }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#94A3B8' }}>© 2026 IdentiGuinée — République de Guinée. Tous droits réservés.</p>
          <p style={{ fontSize: 11, color: '#CBD5E1', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Travail · Justice · Solidarité</p>
        </div>
      </div>
    </footer>
  );
}
