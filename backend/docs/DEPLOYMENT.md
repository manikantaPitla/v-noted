# Backend Deployment Guide

v-noted backend — Express server with Neon Postgres.

## Prerequisites

1. **Node.js (v20.x or later)**
2. **npm**
3. **A Neon Postgres database** — [neon.tech](https://neon.tech)

## Local Development

```bash
cd backend
npm install

# Set your Neon connection string in .env
# DATABASE_URL=postgresql://...

# Push schema to database
npm run db:push

# Start development server (with hot reload)
npm run dev
```

Server starts on `http://localhost:3000` by default.

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres pooled connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `JWT_SECRET` | Secret key for signing JWTs |
| `PORT` | Server port (default: 3000) |

## Database Management

```bash
# Push schema changes to database
npm run db:push

# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio (visual DB browser)
npm run db:studio
```

## Production Deployment

Build and run with any Node.js host (Render, Railway, Fly.io, etc.):

```bash
npm run build
npm start
```

Set all environment variables on your hosting platform. Use the Neon **pooled** connection string (the `-pooler` endpoint) for production.
