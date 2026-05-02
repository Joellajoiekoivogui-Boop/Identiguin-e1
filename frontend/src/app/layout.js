import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'IdentiGuinée — Plateforme Nationale d\'Identité Numérique',
  description: 'Plateforme souveraine de gestion d\'identité biométrique sécurisée par blockchain pour la République de Guinée.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="min-h-screen flex flex-col bg-nuit">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
