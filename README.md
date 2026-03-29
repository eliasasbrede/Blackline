<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Blackline — Selective Disclosure Engine

Blackline is a privacy-first document redaction platform that combines AI-powered entity recognition with human-in-the-loop verification and cryptographic proof of integrity.

Built for legal teams, compliance officers, and privacy engineers who need precise, auditable control over what gets disclosed and what stays redacted.

## Features

- **AI-Powered Redaction** — Instruction-first dual-path engine: user instructions take priority over generic NLP classification. Powered by Google Gemini.
- **Manual Override** — Highlight any text span in the original document to create a custom redaction directly.
- **Human Verification** — Every AI suggestion must be individually approved or rejected before release. Bulk accept/reject and undo/redo included.
- **Cryptographic Manifest** — SHA-256 hashes of both original and redacted documents, timestamped and reviewer-attributed.
- **Export** — Download the redacted document and JSON manifest for archival or audit.
- **Midnight Wallet Integration (Preview)** — Connect a Midnight Lace wallet to sign the attestation payload. Full on-chain persistence is planned for a future release.

## Supported Formats

| Format | Status |
|--------|--------|
| `.txt`  | ✅ Supported |
| `.md`   | ✅ Supported |
| `.pdf`  | 🔜 Planned |
| `.docx` | 🔜 Planned |

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐
│  Vite + React        │────▶│  Express API Server   │
│  (localhost:3000)    │ /api│  (localhost:3001)      │
│                      │◀────│                        │
│  • Landing           │     │  • /api/redact          │
│  • Upload            │     │  • Gemini 2.5 Flash     │
│  • Redaction Review  │     │  • Dual-path engine     │
│  • Manifest          │     │  • Mock fallback        │
│  • Midnight Proof    │     └──────────────────────┘
└─────────────────────┘
```

## Getting Started

### Prerequisites

- **Node.js** v18+
- A [Gemini API key](https://aistudio.google.com/apikey) (free tier works)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/blackline.git
cd blackline

# Install dependencies
npm install

# Configure your API key
cp .env.example .env
# Edit .env and replace YOUR_GEMINI_API_KEY_HERE with your real key

# Start both frontend and backend
npm run dev:all
```

The app will be available at **http://localhost:3000**.

> **Note:** If you don't set a `GEMINI_API_KEY`, the server falls back to a regex-based mock engine for testing purposes.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:all` | Start frontend + backend concurrently |
| `npm run dev` | Start Vite dev server only |
| `npm run dev:server` | Start Express API server only |
| `npm run build` | Production build |
| `npm run lint` | TypeScript type check |

## Tech Stack

- **Frontend:** React 19, Tailwind CSS v4, Motion (Framer Motion), Lucide Icons
- **Backend:** Express, Google Gemini AI (`@google/genai`)
- **Blockchain:** Midnight Network SDK (preview integration)
- **Build:** Vite 6, TypeScript 5.8

## Current Limitations

- PDF and DOCX file support is not yet implemented
- No user authentication or multi-user sessions
- Midnight on-chain attestation requires a compiled Compact contract (`compactc`), which is not bundled — wallet signing works in preview mode
- Document size is capped at 100,000 characters
- The Gemini free tier has rate limits; a paid API key is recommended for production use
- CORS is handled via Vite proxy in development; production deployment requires proper CORS configuration

## License

MIT

---

<div align="center">
<sub>© 2026 Blackline Protocol · Selective Disclosure v1.0</sub>
</div>
