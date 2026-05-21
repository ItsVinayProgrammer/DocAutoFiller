# DocAutoFiller

Prototype React + Vite app for document-driven loan onboarding. Users upload a PDF, the app extracts text, parses key fields with simple rules, lets the user review/edit the data, and stores the final submission in Firebase Firestore.

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Firebase setup

1. Create a Firebase project in the Firebase console.
2. Enable Firestore in production or test mode.
3. Copy your Firebase web app config into `src/firebase/firebaseConfig.ts`.
4. Make sure the Firestore security rules allow your prototype app to write to the `loanApplications` collection during testing.
5. Optional: enable Authentication if you later want to add sign-in.
6. Optional: enable Storage if you want to keep uploaded documents.

## How extraction works

- `src/utils/extractPdfText.ts` uses `pdfjs-dist` to read text from PDF pages in the browser.
- `src/utils/parseFields.ts` applies simple regex and label-based rules to find fields such as email, phone, PAN, Aadhaar, income, and loan amount.
- `src/utils/validators.ts` validates required fields and key formats before submission.
- The raw extracted text is kept and saved to Firestore for audit/debugging.

## Firestore payload

Each document written to `loanApplications` includes:

- `extractedFields`
- `rawExtractedText`
- `createdAt`
- `status: "Submitted"`
- `source: "Document Upload Prototype"`

## Notes

- Image-only PDFs or scanned documents will need OCR later.
- `src/firebase/firebaseConfig.ts` currently contains placeholder Firebase values.
