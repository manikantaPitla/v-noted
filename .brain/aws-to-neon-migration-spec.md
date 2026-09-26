# AWS to Neon Postgres Migration Spec

## Goal
Completely remove all AWS integration from the codebase and replace the data layer with Neon Postgres. This is a full migration — no AWS SDK calls, AWS Lambda handler patterns, or DynamoDB-specific code should remain afterward. All application data (users, notes, categories, tags) will live in Neon.

## Step 0 — Decide and explain before writing any code
Before making any changes, lay out your plan and reasoning. For each of the following, state what you're deciding and why, based on what you actually see in this codebase — don't default to a choice without justifying it against the project's structure:
- Framework: stay on plain Node.js/Express, or move to NestJS? Base this on the current code's complexity, structure, and how well each option fits the existing feature-sliced design — not on general preference
- ORM/data access: TypeORM, another ORM (Prisma, Drizzle, Kysely), or plain SQL with a query builder? Justify against this project's type-safety needs and structure
- Any other structural decision you think is significant (e.g. how to restructure backend/functions and backend/lib once Lambda handlers no longer exist)

Present this as a short plan and wait for my confirmation before proceeding to implementation, unless the choice is genuinely trivial.

## What to remove
- All AWS SDK dependencies (@aws-sdk/*, aws-sdk) from package.json and code
- The DynamoDB single-table access layer (backend/lib DynamoDB logic, PK/SK patterns, GSI queries)
- AWS SAM infrastructure (backend/template.yaml) — replace with a plain Node.js server setup suited to running on a persistent host (e.g. Render/Railway), not Lambda
- Any AWS-specific Lambda handler signatures (event/context params) — convert to standard HTTP request handlers
- References to AWS API Gateway routing/CORS config — replace with equivalent framework-level routing and CORS middleware

## What to add
- Neon Postgres as the new database. I will attach the connection string separately — use a placeholder environment variable (e.g. DATABASE_URL) wherever the connection is configured. [I WILL ATTACH THE CONNECTION STRING]
- Redesign the current DynamoDB single-table schema (users, notes, categories, tags via PK/SK) into a proper relational schema: separate tables for users, notes, categories, tags, and any join tables needed for many-to-many relationships (e.g. note_tags)

## Code quality bar
Write this to a top-tier MNC engineering standard — production-grade, not a prototype:
- Use appropriate data structures and algorithms where they genuinely improve performance or clarity (e.g. maps/sets for lookups, proper indexing strategy in schema design) — don't force complexity where a simple approach is correct and sufficient
- Clean, idiomatic TypeScript: consistent naming, single-responsibility functions/modules, no dead code, no leftover AWS-era patterns retrofitted awkwardly onto the new stack
- Comments should be minimal and only where genuinely needed (non-obvious business logic, tricky edge cases, "why" not "what") — written like a human engineer explaining a decision to a teammate, not boilerplate or auto-generated filler
- Proper error handling throughout: no swallowed errors, meaningful error messages, consistent error response shape across the API
- Backend robustness: input validation on all endpoints, proper transaction handling for multi-step DB writes, connection pooling configured correctly for Neon's serverless model, sensible logging (not console.log scattered everywhere)
- Maintainability: easy for another engineer to pick up cold — clear module boundaries, no hidden coupling between unrelated features
- Avoid over-engineering: don't add caching layers, abstraction layers, or generic solutions that aren't actually needed yet

## Constraints
- Keep the existing Google OAuth + JWT auth flow as-is; only the data storage layer (and framework, if changed) changes
- Preserve existing API contracts/routes where possible so the frontend doesn't need changes
- Flag any part of the current AWS-specific logic (e.g. presence tracking, PDF/DOCX export via Lambda) that will need special handling once it's no longer running on Lambda

## Output
1. The Step 0 plan and reasoning, before any code changes
2. List of all AWS-related files/dependencies removed
3. The new database schema (tables + relationships, with reasoning for any indexes chosen)
4. Any manual steps I still need to do (e.g. running migrations, setting env vars)
