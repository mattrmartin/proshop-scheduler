# Backlog — proshop-scheduler

Ordered. Top unblocked item first. Keep current: remove done, add deferred.

## Phase 0 — scaffold
- [ ] **Enable phone/SMS auth** in the Supabase dashboard: Auth → Phone provider
      on, Twilio creds (Account SID / Auth Token / Message Service SID). Client
      wiring + env are done; only the dashboard toggle + Twilio remain (owner).
- [ ] Deploy skeleton to Vercel (needs a git remote first — none set yet).

## Phase 1 — core loop (MVP)
- [ ] Admin: create/open a week (dates, per-day business hours, per-day events).
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
