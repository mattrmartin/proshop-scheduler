# Backlog — proshop-scheduler

Ordered. Top unblocked item first. Keep current: remove done, add deferred.

## Phase 0 — scaffold
- [ ] Deploy skeleton to Vercel (git remote now set: github.com/mattrmartin/proshop-scheduler).

## Auth — finish before real launch
- [ ] **Enable phone/SMS auth** (staff): Supabase dashboard → Auth → Phone provider
      on, Twilio creds (Account SID / Auth Token / Message Service SID). Client wiring
      + env are done; only the dashboard toggle + Twilio remain (owner).
- [ ] **Remove the dev admin bypass** once real auth is live: the "Sign in as Cole
      (dev)" button + NEXT_PUBLIC_DEV_ADMIN_* env vars in [src/app/login/page.tsx].
      Also revisit the seeded dev admin (email mattrobm+cole@gmail.com, placeholder
      phone) — give Cole a real phone identity.

## Phase 1 — core loop (MVP)
- [x] Admin: create/open a week (Monday start + default business hours; draft→open→
      published status). **Remaining in this item:** per-day business-hours tuning and
      per-day events (Ladies Mem. Guest, 18ers, FNF, …) — build next.
- [ ] Week detail: edit per-day business hours + add/remove per-day events.
- [ ] Staff intake: weekly hourly availability grid (drag-select), greyed closed hours,
      per-day "want off" toggle. Soft Thu-noon deadline.
- [ ] Cole's build board: availability grid, assign per-person start/end per day
      ("C" = close), staff in rank order, soft experience-mix display.
- [ ] Publish → SMS blast; full shared board view + "just me" toggle.
- [ ] Post-publish edit → notify only affected person.
- [ ] Auto-reminders to non-submitters (Wed + Thu AM).

## Deferred (v2+) — do NOT build in MVP
- Auto-generated / solver schedules (keep model forward-compatible).
- Standing / fixed assignments.
- Shift swaps / change-request flow.
- Hard tier-enforcement rules.
- Carts vs range as separate areas.

## Needs Cole input before/while building
- Full staff roster + count; any co-admins.
- Season-wide outer business-hours range (grid bounds).
