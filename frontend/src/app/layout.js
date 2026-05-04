import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PWAInstall from '../components/PWAInstall';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: "IdentiGuinée — Plateforme Nationale d'Identité Numérique",
  description: "Plateforme souveraine de gestion d'identité biométrique sécurisée par blockchain pour la République de Guinée.",
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'IdentiGuinée',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export const viewport = {
  themeColor: '#0F2544',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="IdentiGuinée" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0F2544" />
      </head>
      <body className="min-h-screen flex flex-col bg-nuit">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <PWAInstall />
        </AuthProvider>
      </body>
    </html>
  );
}
