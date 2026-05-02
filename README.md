# IdentiGuinée 🇬🇳

Plateforme Nationale d'Identité Numérique Sécurisée par Blockchain

## Structure du projet

```
identiguinee/
├── backend/     Node.js + Express (API, PDF, Blockchain, QR Code)
└── frontend/    Next.js 14 + Tailwind CSS
```

## Démarrage rapide

### 1. Backend (Terminal 1)
```bash
cd backend
npm install
npm run dev     # Démarre sur http://localhost:5000
```

### 2. Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev     # Démarre sur http://localhost:3000
```

## Pages disponibles

| Page | URL | Description |
|------|-----|-------------|
| Accueil | `/` | Présentation de la plateforme |
| Demande | `/demande` | Formulaire multi-étapes (carte ou passeport) |
| Vérification | `/verification` | Vérifier un document par ID |
| Dashboard | `/dashboard` | Vue de la blockchain et des documents émis |

## API Backend

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/documents/create` | Créer un document |
| GET | `/api/documents/pdf/:id` | Télécharger le PDF |
| GET | `/api/documents/chain` | Voir la blockchain |
| GET | `/api/verification/:id` | Vérifier un document |
| GET | `/api/health` | Statut de l'API |

## Modules implémentés

- **PDF Generation** : pdfGenerator.js — Carte d'identité et passeport en PDF haute résolution
- **Blockchain simulée** : blockchainService.js — SHA-256, blocs chainés, stockés dans data/blockchain.json
- **QR Code** : qrcodeService.js — QR code de vérification encodé dans le PDF
