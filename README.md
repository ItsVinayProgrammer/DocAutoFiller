# DocAutoFiller

DocAutoFiller is a browser-first prototype for loan intake and document review. It extracts text from uploaded PDFs, merges multiple documents into a single borrower profile, flags conflicts, scores confidence, runs validation and risk checks, and stores reviewed applications in Firestore.

> **Prototype only:** upload mock or dummy PDFs only. Never use real customer documents or actual PII.

## Highlights

- Multi-document PDF upload with browser-side text extraction.
- Field parsing, confidence scoring, and merge/conflict handling.
- Validation gating, risk flags, and a rule-based review summary.
- Firestore persistence plus an internal `/admin` review dashboard.
- Compact tabbed workflow for upload, review, and admin actions.
- Error boundary protection so demo crashes fail gracefully.

## Tech Stack

- React 19.1
- Vite 7
- TypeScript 5.9
- Firebase 11 / Firestore
- pdfjs-dist 4.10
- react-router-dom 7.15

##  Security & Privacy

- Use dummy PDFs only. Real PII should never enter this prototype.
- Keep Firebase values in `.env.local`; never commit that file.
- The repository ignores `.env`, `.env.*`, `dist/`, and `*.tsbuildinfo`.
- Firestore reads and writes are disabled when the required `VITE_FIREBASE_*` variables are missing.
- PDF text extraction happens in the browser before data is normalized and submitted.
- Image-only or scanned PDFs are not OCR'd yet.

## Getting Started

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

If you prefer a different shell, copy `.env.example` to `.env.local` with the equivalent command for your environment.

## ⚙️ Environment Variables

Populate `.env.local` with your Firebase web app values:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

The app uses safe placeholders when these values are missing, which keeps the UI usable for demos while disabling Firestore operations.

##  Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check the app and create a production build. |
| `npm run preview` | Preview the production build locally. |

## Workflow

1. Upload one or more borrower PDFs.
2. The app extracts text locally with pdf.js.
3. Parsers infer document type and borrower fields.
4. Merge logic combines values and records conflicts/confidence.
5. Review mode shows validation, risk, and summary signals.
6. Submit the final application to Firestore.
7. Open `/admin` to inspect submitted records.

## Project Structure

```text
src/
	App.tsx
	main.tsx
	components/
	firebase/
	types/
	utils/
	styles.css
```

## Firestore Data

The app saves reviewed applications to the `loanApplications` collection. Representative fields include:

```json
{
	"finalFormData": {},
	"uploadedDocuments": [],
	"fieldConfidenceScores": {},
	"fieldConflicts": [],
	"validationErrors": {},
	"riskFlags": [],
	"aiReviewSummary": "",
	"reviewStatus": "Pending Review",
	"auditTrail": [],
	"createdAt": "...",
	"updatedAt": "..."
}
```

## 📝 Notes

- `src/firebase/firebaseConfig.ts` is env-driven and falls back to placeholders when Firebase is not configured.
- Scanned PDFs are out of scope until OCR is added.
- This is a prototype intended for portfolio/demo use, not production handling of real borrower data.
