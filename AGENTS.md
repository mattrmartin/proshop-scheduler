# AGENTS.md — proshop-scheduler

## Stack
- **Next.js** (App Router) + TypeScript (strict).
- **Supabase** — Postgres, RLS, and **phone/SMS auth** (magic-link identity via a
  Twilio provider).
- **Tailwind v4 + shadcn v4** for UI.
- **Vercel** for deploy.

## Code standards
- TS strict; never `any`; no `@ts-ignore` / `@ts-expect-error` without a stated reason.
- Never swallow an error — surface or re-throw.
- No TODO without a linked ticket.
- Simplest thing that works. Surgical changes. Don't gold-plate.
- Keep layer boundaries clean (UI / data-access / domain). Analytics-style logic gets tests.

## Runtime / deploy notes (carried from sibling golf-tracker)
- **Don't fs-read repo data files at runtime on Vercel** — import JSON so it's bundled.
- **Supabase/PostgREST selects silently cap at 1000 rows** — paginate unbounded reads
  as tables grow.

## Product guardrails (see PROJECT_CONTEXT.md for the full spec)
- MVP **assists** Cole; it does not auto-generate schedules.
- Atomic scheduling unit = **per-person slot** with its own start/end ("C" = close).
- Experience/rank is a **soft** display guide, never a hard blocker.
- Department is **Inside / Outside** only.
