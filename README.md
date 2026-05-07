<p align="center">
  <img src="src/assets/svg/vnoted_light_mode_svg.svg" width="180" alt="v-noted logo">
</p>

<p align="center">
  <strong>Capture. Organize. Retrieve.</strong><br>
  <em>A production-quality, developer-first note-taking app. Fast, minimal, keyboard-centric, and fully cloud-synced.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white" alt="AWS">
  <img src="https://img.shields.io/badge/DynamoDB-4053D6?style=for-the-badge&logo=amazondynamodb&logoColor=white" alt="DynamoDB">
</p>

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

## ✨ Features

- ☁️ **Account-Based Sync**: Categories, Tags, and Notes are tied to your Google account and synced across all devices.
- ⚡ **Onboarding Experience**: New accounts are automatically initialized with "Work", "Personal", and "Others" categories and a "Welcome" note.
- 🔗 **Note Sharing**: Toggle public sharing on any note to generate a view-only link for guests.
- 🎨 **Premium Aesthetics**: High-contrast dark/light mode, smooth transitions, and micro-animations.
- 💻 **Developer-First**: Tiptap editor with code highlighting, task-lists, and markdown support.
- ⌨️ **Keyboard-Centric**: Optimized for speed with global shortcuts (`Ctrl+N`, `Ctrl+K`).
- 📱 **PWA Support**: Installable on desktop and mobile with offline manifest support.

---

## 🏗️ Architecture

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite + TypeScript |
| **Styling** | Tailwind CSS + Vanilla CSS Variables (Custom Design System) |
| **Editor** | Tiptap (Markdown support + Task Lists + Code Highlighting) |
| **State** | Zustand (Cloud-synced Categories, Tags, and UI state) |
| **Data Fetching** | TanStack Query v5 + Axios |
| **Backend** | AWS Lambda (Node.js 20.x) + API Gateway |
| **Database** | Amazon DynamoDB (Single Table Design) |
| **Public Sharing** | Unique UUID-based share links |

---

## 📁 Project Structure

```text
v-noted/
├── src/
│   ├── app/                    # App shell (providers, router)
│   ├── pages/                  # Route-level pages (Settings, SharedNote, Dashboard)
│   ├── features/               # Domain-specific modules (Auth, Notes, Categories, Tags)
│   ├── components/             # Shared UI components (Modals, Dropdowns)
│   ├── services/               # API clients and interceptors
│   ├── store/                  # Zustand state management
│   └── styles/                 # Global CSS and Tailwind configuration
└── backend/                    # AWS Infrastructure
    ├── functions/              # Lambda handlers (Auth, Notes, Reports)
    ├── lib/                    # DynamoDB utilities and shared logic
    └── template.yaml           # SAM template defining APIs and Tables
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+N` | Create new note |
| `Ctrl+K` | Focus global search |
| `Escape` | Clear search / Close active modals |

---

## ☁️ Infrastructure (AWS)

v-noted is built on a serverless architecture for maximum scalability and zero maintenance:

- **Compute**: AWS Lambda (Node.js 20.x) handles all business logic across three main bundles:
  - `AuthFunction`: Manages Google OAuth and JWT-based session handling.
  - `NotesFunction`: Handles CRUD for Notes, Categories, Tags, and real-time presence.
  - `ReportsFunction`: Dedicated service for note exports (PDF/DOCX).
- **API**: AWS API Gateway (REST) provides a unified entry point with CORS protection.
- **Database**: Amazon DynamoDB using a **Single Table Design** for efficient data access.
  - Primary Key (`PK`/`SK`) for relational data modeling.
  - Global Secondary Index (`created_at-index`) for sorted note retrieval.
- **Security**: JWT authentication, DynamoDB Point-in-Time Recovery (PITR), and IAM-based least-privilege access.

---

## 🌐 Deployment Guide

### 1. Backend (AWS SAM)

**Prerequisites:**
- AWS CLI & SAM CLI
- Node.js 20.x

**Commands:**
```bash
cd backend
sam build
sam deploy --stack-name v-noted \
           --resolve-s3 \
           --capabilities CAPABILITY_IAM \
           --parameter-overrides JwtSecret=<YOUR_SECRET> GoogleClientId=<YOUR_CLIENT_ID>
```

### 2. Frontend (Build & Deploy)

**Environment Variables (.env):**
```env
VITE_API_URL=https://<your-api-id>.execute-api.<region>.amazonaws.com/prod
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
```

**Commands:**
```bash
# Automated Build & Deployment (S3 + CloudFront Invalidation)
npm run deploy
```

---

## 🛠️ Development Notes

- **Authentication**: JWT tokens are stored in `localStorage` and sent via an Axios interceptor to the backend.
- **CORS**: Ensure your S3/CloudFront domain is allowed in the backend handler headers or API Gateway configuration.
- **Exporting**: PDF/DOCX generation is handled server-side in the `ReportsFunction`.
