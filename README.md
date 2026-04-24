# v-noted — Capture. Organize. Retrieve.

> A production-quality, developer-first note-taking app. Fast, minimal, keyboard-centric, and fully cloud-synced.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

Open **http://localhost:5174** → click **"Continue with Google"** to log in.

---

## 🏗️ Architecture

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite + TypeScript |
| **Styling** | Vanilla CSS (Premium Dark Theme + Responsive Sidebar) |
| **Editor** | Tiptap (Markdown support + Task Lists + Code Highlighting) |
| **State** | Zustand (Cloud-synced Categories, Tags, and UI state) |
| **Data Fetching** | TanStack Query v5 + Axios |
| **Backend** | AWS Lambda (Unified Handler) + API Gateway |
| **Database** | Amazon DynamoDB (Single Table Design) |
| **Public Sharing** | Unique UUID-based share links (No auth required for viewers) |

---

## ✨ Features

- **Account-Based Sync**: Categories, Tags, and Notes are tied to your Google account and synced across all devices.
- **Onboarding Experience**: New accounts are automatically initialized with "Work", "Personal", and "Others" categories and a "Welcome" note.
- **Note Sharing**: Toggle public sharing on any note to generate a view-only link for guests.
- **Premium Aesthetics**: High-contrast dark mode, smooth floating dropdowns, and micro-animations.
- **Developer-First**: Code blocks with syntax highlighting and task-list support.

---

## 📁 Project Structure

```
v-noted/
├── src/
│   ├── app/                    # App shell (providers, router)
│   ├── pages/                  # Route-level pages (Settings, SharedNote, Dashboard)
│   ├── features/               # Domain-specific modules (Auth, Notes, Categories, Tags)
│   │   ├── notes/              # Note CRUD + Editor extensions
│   │   ├── categories/         # Server-synced category management
│   │   └── tags/               # Server-synced tag management
│   ├── components/             # Shared UI components (Modals, Dropdowns)
│   ├── services/               # API clients and interceptors
│   └── styles/                 # Global CSS and Tiptap overrides
└── backend/                    # AWS Infrastructure
    ├── functions/              # Unified Lambda handler
    ├── lib/                    # DynamoDB & Auth utilities
    └── template.yaml           # SAM template defining APIs and Tables
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+N` | New note |
| `Ctrl+K` | Focus global search |
| `Escape` | Clear search / Close modals |

---

## 🌐 Deployment Guide

### 1. Backend (AWS SAM)

The backend uses a single DynamoDB table with a GSI for efficient timestamp-based querying.

**Prerequisites:**
- AWS CLI (`aws configure`)
- AWS SAM CLI
- Node.js 20.x

**Commands:**
```bash
cd backend

# 1. Build artifacts
sam build

# 2. Deploy infrastructure
sam deploy --stack-name v-noted \
           --resolve-s3 \
           --capabilities CAPABILITY_IAM \
           --parameter-overrides JwtSecret=<YOUR_SECRET> GoogleClientId=<YOUR_CLIENT_ID>
```

### 2. Frontend (Build & S3)

**Environment Variables (.env):**
```env
VITE_API_URL=https://<your-api-id>.execute-api.<region>.amazonaws.com/prod
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
```

**Commands:**
```bash
# 1. Generate production bundle
npm run build

# 2. Upload to S3
# Copy the contents of the 'dist' folder to your S3 bucket root.
```

---

## 🛠️ Development Notes

- **One-Time Sync**: Old `localStorage` data migration was disabled in favor of a "Start Fresh" approach.
- **Authentication**: JWT tokens are stored in `localStorage` and sent via an Axios interceptor to the backend.
- **CORS**: Ensure your S3/CloudFront domain is allowed in the backend handler headers if you encounter issues.
