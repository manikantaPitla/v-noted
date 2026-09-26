<h1 align="center">V-NOTED</h1>

<p align="center">
  <strong>Capture. Organize. Retrieve.</strong><br>
  <em>A production-quality, developer-first note-taking app. Fast, minimal, keyboard-centric, and fully cloud-synced.</em>
</p>

---

## 🏗️ Architecture Overview

v-noted is built on a modern, decoupled architecture designed for speed and reliability:

- **Frontend**: A React 18 SPA built with Vite, TypeScript, and Tailwind CSS.
- **Backend**: A robust Express.js REST API providing secure data access.
- **Database**: Neon Serverless Postgres, accessed via Drizzle ORM.

### Dive Deeper
For detailed technical documentation, environment setup, and framework specifics, see the respective README files:

👉 **[Frontend Documentation](./frontend/README.md)**
👉 **[Backend Documentation](./backend/README.md)**

---

## 🚀 Quick Start (Full Stack)

To run the entire application (frontend and backend) concurrently from the root directory:

### 1. Configure Environment Variables
Before starting, both the frontend and backend require environment variables to be set up.

**Frontend:**
```bash
cd frontend
cp .env.example .env
```
*(No further changes needed for local development. `VITE_API_URL` defaults to `http://localhost:3000`)*

**Backend:**
```bash
cd ../backend
cp .env.example .env
```
*Open `backend/.env` and replace `DATABASE_URL` with your actual Neon Postgres connection string.*

### 2. Install Dependencies
Return to the project root and install dependencies for the root workspace, frontend, and backend simultaneously:
```bash
cd ..
npm run install:all
```

### 3. Start Development Servers
Start both the React application and the Express backend concurrently:
```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## ⌨️ Keyboard Shortcuts (Global)

| Shortcut | Action |
|---|---|
| `Ctrl+N` | Create new note |
| `Ctrl+K` | Focus global search |
| `Escape` | Clear search / Close active modals |
