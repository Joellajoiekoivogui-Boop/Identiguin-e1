import Link from 'next/link';

const S = {
  wrap:    { background: '#0D1B2E', borderTop: '1px solid #1E2F47', padding: '48px 24px 28px' },
  inner:   { maxWidth: 1160, margin: '0 auto' },
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 },
  heading: { fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 14 },
  link:    { display: 'block', fontSize: 12, color: '#4A6080', textDecoration: 'none', marginBottom: 8, transition: 'color 0.15s' },
  small:   { fontSize: 11, color: '#4A6080', lineHeight: 1.7 },
  badge:   { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#4A6080', background: '#0D1B2E', border: '1px solid #1E2F47', borderRadius: 3, padding: '3px 8px' },
};

export default function Footer() {
  return (
    <footer style={S.wrap}>
      <div style={S.inner}>
        <div style={S.grid}>

          {/* Identité */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 30, height: 30, borderRadius: 3, background: 'linear-gradient(135deg,#D4AF37,#E8C56A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                🇬🇳
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#F0EDE8' }}>
                Identi<span style={{ color: '#D4AF37' }}>Guinée</span>
              </span>
            </div>
            <p style={{ ...S.small, maxWidth: 220 }}>
              Plateforme souveraine de gestion de l'identité biométrique numérique pour la République de Guinée. Sécurisée par blockchain.
            </p>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={S.badge}>🔒 AES-256</span>
              <span style={S.badge}>⛓ Blockchain</span>
              <span style={S.badge}>✓ OACI</span>
            </div>
          </div>

          {/* Services */}
          <div>
            <div style={S.heading}>Services</div>
            {[
              { href: '/demande?type=carte',       label: 'Carte d\'Identité Nationale' },
              { href: '/demande?type=passeport',   label: 'Passeport Électronique' },
              { href: '/renouvellement',           label: 'Renouvellement de document' },
              { href: '/verification',             label: 'Vérifier un document' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={S.link}
                onMouseOver={e => e.currentTarget.style.color = '#D4AF37'}
                onMouseOut={e => e.currentTarget.style.color = '#4A6080'}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Plateforme */}
          <div>
            <div style={S.heading}>Plateforme</div>
            {[
              { href: '/dashboard',    label: 'Explorateur blockchain' },
              { href: '/admin/login',  label: 'Espace administrateur' },
            ].map(l => (
              <Link key={l.href} href={l.href} style={S.link}
                onMouseOver={e => e.currentTarget.style.color = '#D4AF37'}
                onMouseOut={e => e.currentTarget.style.color = '#4A6080'}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Sécurité */}
          <div>
            <div style={S.heading}>Sécurité & Conformité</div>
            <ul style={{ listStyle: 'none' }}>
              {[
                'Chiffrement de bout en bout AES-256',
                'Signature numérique X.509',
                'Blockchain immuable SHA-256',
                'Authentification multi-facteurs',
                'Conformité RGPD & normes locales',
                'Hébergement souverain Guinée',
              ].map(item => (
                <li key={item} style={{ ...S.small, marginBottom: 6, paddingLeft: 14, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#009460' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Séparateur */}
        <div className="sep-or" style={{ marginBottom: 20 }} />

        {/* Bottom */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <p style={{ ...S.small, fontSize: 11 }}>
            © 2026 IdentiGuinée — République de Guinée. Tous droits réservés.
          </p>
          <p style={{ ...S.small, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Travail — Justice — Solidarité
          </p>
        </div>
      </div>
    </footer>
  );
}
