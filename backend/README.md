# v-noted — Backend

## ⚙️ Backend Architecture

The v-noted backend is a robust RESTful API built on Node.js, providing secure data persistence, Google OAuth authentication, and document generation (PDF/DOCX exports). 

### 🛠️ Tech Stack
- **Framework**: Express.js (Node.js)
- **Database**: Neon Serverless Postgres
- **ORM**: Drizzle ORM
- **Authentication**: JWT & Google Auth Library
- **Document Exporting**: PDFKit (PDFs) & Docx (Word Docs)
- **Language**: TypeScript

---

## 📁 Directory Structure

```text
backend/
├── src/
│   ├── db/                     # Drizzle schema definitions and DB connection logic
│   ├── routes/                 # Express route handlers (Auth, Notes, Categories, Tags)
│   ├── lib/                    # Shared utilities (Export services, constants)
│   └── index.ts                # Express application entry point
├── drizzle/                    # Generated SQL migration files
├── docs/                       # Backend-specific documentation
└── drizzle.config.ts           # Drizzle ORM configuration
```

---

## 🚀 Standalone Development

If you wish to run the backend independently of the root `concurrently` script:

### 1. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```

**CRITICAL**: You must provide a valid `DATABASE_URL` in your `.env` file pointing to a Neon Postgres instance.

### 2. Database Migrations
Before starting the server for the first time, push the schema to your Neon database:
```bash
npm run db:push
```

### 3. Install & Run
```bash
npm install
npm run dev
```

The Express server will start on **http://localhost:3000**.

---

## 🗄️ Database Management (Drizzle)

We use Drizzle ORM for type-safe database interactions.

| Command | Action |
|---|---|
| `npm run db:generate` | Generate SQL migration files based on schema changes |
| `npm run db:push` | Push schema changes directly to the database (Best for local dev) |
| `npm run db:migrate` | Run generated migrations against the database (Best for production) |
| `npm run db:studio` | Open Drizzle Studio to visually inspect and manage your data |
