'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { href: '/demande',        label: 'Faire une demande' },
  { href: '/verification',   label: 'Vérifier un document' },
  { href: '/renouvellement', label: 'Renouvellement' },
  { href: '/dashboard',      label: 'Blockchain' },
];

export default function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { admin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50" style={{ background: 'rgba(8,17,31,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(30,47,71,0.8)' }}>
      {/* Bande tricolore */}
      <div className="tricolore" style={{ height: '3px' }} />

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 3,
              background: 'linear-gradient(135deg, #D4AF37, #E8C56A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>🇬🇳</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F0EDE8', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                Identi<span style={{ color: '#D4AF37' }}>Guinée</span>
              </div>
              <div style={{ fontSize: 9, color: '#4A6080', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1 }}>
                Identité Numérique Nationale
              </div>
            </div>
          </Link>

          {/* Nav desktop */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="hidden-mobile">
            {NAV.map(({ href, label }) => {
              const active = path === href;
              return (
                <Link key={href} href={href} style={{
                  padding: '6px 14px',
                  fontSize: 12, fontWeight: 500,
                  letterSpacing: '0.02em',
                  borderRadius: 3,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  background: active ? 'rgba(212,175,55,0.12)' : 'transparent',
                  color: active ? '#D4AF37' : '#8A9BB5',
                  border: active ? '1px solid rgba(212,175,55,0.25)' : '1px solid transparent',
                }}>
                  {label}
                </Link>
              );
            })}

            {/* Séparateur */}
            <div style={{ width: 1, height: 20, background: '#1E2F47', margin: '0 8px' }} />

            {admin ? (
              <>
                <Link href="/admin" style={{
                  padding: '6px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', borderRadius: 3, textDecoration: 'none',
                  color: path === '/admin' ? '#08111F' : '#D4AF37',
                  background: path === '/admin' ? '#D4AF37' : 'rgba(212,175,55,0.1)',
                  border: '1px solid rgba(212,175,55,0.3)',
                }}>
                  ⚙ Admin
                </Link>
                <button onClick={logout} style={{
                  marginLeft: 8, fontSize: 11, color: '#4A6080',
                  background: 'none', border: 'none', cursor: 'pointer',
                  transition: 'color 0.15s',
                }} onMouseOver={e => e.target.style.color = '#EF4444'}
                  onMouseOut={e => e.target.style.color = '#4A6080'}>
                  Quitter
                </button>
              </>
            ) : (
              <Link href="/admin/login" style={{
                padding: '6px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase', borderRadius: 3, textDecoration: 'none',
                color: '#4A6080', border: '1px solid rgba(30,47,71,0.8)',
                transition: 'all 0.15s',
              }}>
                🔐 Espace Admin
              </Link>
            )}
          </nav>

          {/* Burger mobile */}
          <button
            onClick={() => setOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'none' }}
            className="show-mobile"
            aria-label="Menu"
          >
            <div style={{ width: 22, height: 2, background: open ? '#D4AF37' : '#8A9BB5', marginBottom: 5, transform: open ? 'rotate(45deg) translate(5px,5px)' : 'none', transition: 'all 0.2s' }} />
            <div style={{ width: 22, height: 2, background: '#8A9BB5', opacity: open ? 0 : 1, transition: 'opacity 0.2s' }} />
            <div style={{ width: 22, height: 2, background: open ? '#D4AF37' : '#8A9BB5', marginTop: 3, transform: open ? 'rotate(-45deg) translate(5px,-5px)' : 'none', transition: 'all 0.2s' }} />
          </button>
        </div>

        {/* Menu mobile */}
        {open && (
          <div style={{ borderTop: '1px solid #1E2F47', paddingBottom: 12 }}>
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} style={{
                display: 'block', padding: '10px 4px',
                fontSize: 13, color: path === href ? '#D4AF37' : '#8A9BB5',
                textDecoration: 'none', borderBottom: '1px solid rgba(30,47,71,0.5)',
              }}>
                {label}
              </Link>
            ))}
            <Link href={admin ? '/admin' : '/admin/login'} onClick={() => setOpen(false)} style={{
              display: 'block', padding: '10px 4px', fontSize: 12, color: '#4A6080', textDecoration: 'none',
            }}>
              {admin ? '⚙ Panneau Admin' : '🔐 Espace Admin'}
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: block !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </header>
  );
}
