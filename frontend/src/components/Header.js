'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { href: '/demande',        label: 'Faire une demande' },
  { href: '/verification',   label: 'Vérifier' },
  { href: '/renouvellement', label: 'Renouvellement' },
  { href: '/dashboard',      label: 'Blockchain' },
];

export default function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { admin, logout } = useAuth();

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      boxShadow: '0 1px 3px rgba(15,37,68,0.06)',
    }}>
      {/* Bande tricolore (3px) */}
      <div style={{
        height: 3,
        background: 'linear-gradient(to right, #CE1126 0% 33.33%, #FCD116 33.33% 66.66%, #009460 66.66% 100%)',
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58 }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 6,
              background: 'linear-gradient(135deg, #0F2544, #1E3A5F)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, flexShrink: 0,
            }}>🇬🇳</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F2544', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                Identi<span style={{ color: '#B8960C' }}>Guinée</span>
              </div>
              <div style={{ fontSize: 9, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1 }}>
                Identité Numérique Nationale
              </div>
            </div>
          </Link>

          {/* Nav desktop */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="hd-nav">
            {NAV.map(({ href, label }) => {
              const active = path === href;
              return (
                <Link key={href} href={href} style={{
                  padding: '6px 13px',
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  borderRadius: 5,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  background: active ? '#EEF2F8' : 'transparent',
                  color: active ? '#0F2544' : '#64748B',
                  borderBottom: active ? '2px solid #0F2544' : '2px solid transparent',
                }}>
                  {label}
                </Link>
              );
            })}

            <div style={{ width: 1, height: 18, background: '#E2E8F0', margin: '0 8px' }} />

            {admin ? (
              <>
                <Link href="/admin" style={{
                  padding: '6px 12px', fontSize: 12, fontWeight: 600,
                  borderRadius: 5, textDecoration: 'none',
                  background: path === '/admin' ? '#0F2544' : '#F1F5F9',
                  color: path === '/admin' ? '#fff' : '#334155',
                  border: '1px solid #E2E8F0',
                }}>
                  ⚙ Admin
                </Link>
                <button onClick={logout} style={{
                  marginLeft: 6, fontSize: 12, color: '#94A3B8',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px 8px', borderRadius: 5,
                  transition: 'color 0.15s',
                }}>
                  Déconnexion
                </button>
              </>
            ) : (
              <Link href="/admin/login" style={{
                padding: '6px 12px', fontSize: 12, fontWeight: 600,
                borderRadius: 5, textDecoration: 'none',
                color: '#64748B', border: '1px solid #E2E8F0',
                background: '#F8FAFC', transition: 'all 0.15s',
              }}>
                🔐 Admin
              </Link>
            )}
          </nav>

          {/* Burger mobile */}
          <button
            onClick={() => setOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'none' }}
            className="hd-burger"
            aria-label="Menu"
          >
            <div style={{ width: 22, height: 2, background: '#64748B', marginBottom: 5, transform: open ? 'rotate(45deg) translate(5px,5px)' : 'none', transition: 'all 0.2s' }} />
            <div style={{ width: 22, height: 2, background: '#64748B', opacity: open ? 0 : 1, transition: 'opacity 0.2s' }} />
            <div style={{ width: 22, height: 2, background: '#64748B', marginTop: 3, transform: open ? 'rotate(-45deg) translate(5px,-5px)' : 'none', transition: 'all 0.2s' }} />
          </button>
        </div>

        {/* Menu mobile */}
        {open && (
          <div style={{ borderTop: '1px solid #E2E8F0', paddingBottom: 12, background: '#fff' }}>
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} style={{
                display: 'block', padding: '11px 4px',
                fontSize: 14, color: path === href ? '#0F2544' : '#64748B',
                fontWeight: path === href ? 600 : 400,
                textDecoration: 'none', borderBottom: '1px solid #F1F5F9',
              }}>
                {label}
              </Link>
            ))}
            <Link href={admin ? '/admin' : '/admin/login'} onClick={() => setOpen(false)} style={{
              display: 'block', padding: '11px 4px', fontSize: 13, color: '#94A3B8', textDecoration: 'none',
            }}>
              {admin ? '⚙ Panneau Admin' : '🔐 Espace Admin'}
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hd-nav    { display: none !important; }
          .hd-burger { display: block !important; }
        }
        @media (min-width: 769px) {
          .hd-burger { display: none !important; }
        }
      `}</style>
    </header>
  );
}
