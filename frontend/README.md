<p align="center">
  <img src="src/assets/svg/vnoted_light_mode_svg.svg" width="180" alt="v-noted logo">
</p>

## 🖥️ Frontend Architecture

The v-noted frontend is a highly interactive, keyboard-centric Single Page Application (SPA) designed for speed and a premium developer experience.

### 🛠️ Tech Stack
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS Variables (Design System)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query v5 + Axios
- **Rich Text Editor**: Tiptap (Markdown, Code Highlighting via lowlight, Task Lists)
- **Routing**: React Router v6

---

## 📁 Directory Structure

```text
frontend/
├── src/
│   ├── app/                    # App shell (providers, router)
│   ├── pages/                  # Route-level pages (Settings, SharedNote, Dashboard)
│   ├── features/               # Domain-specific modules (Auth, Notes, Categories, Tags)
│   ├── components/             # Shared UI components (Modals, Dropdowns)
│   ├── services/               # API clients and interceptors
│   ├── store/                  # Zustand state management
│   └── styles/                 # Global CSS and Tailwind configuration
├── public/                     # Static assets (Favicons, Robots.txt)
└── vite.config.ts              # Vite bundler configuration
```

---

## 🚀 Standalone Development

If you wish to run the frontend independently of the root `concurrently` script:

### 1. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```

Ensure the variables are set correctly:
- `VITE_API_URL`: Points to your backend (Defaults to `http://localhost:3000` for local dev)
- `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID for authentication.

### 2. Install & Run
```bash
npm install
npm run dev
```

The frontend will be available at **http://localhost:5173**.

### 3. Build for Production
To generate the static production bundle and PWA service workers:
```bash
npm run build
```
The output will be generated in the `dist/` folder, ready to be served by any static host (e.g., Vercel, Netlify, S3).
