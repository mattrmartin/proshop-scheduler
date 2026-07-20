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
- [x] Admin: create/open a week — Monday start + default hours, draft→open→published
      status, and a week-detail page for per-day business-hours tuning + per-day events
      (add/remove). Closed day = omitted from business_hours_by_day.
- [x] Staff intake: weekly hourly availability grid (drag/tap-select), greyed closed
      hours, per-day "want off" toggle, soft Thu-noon note. Saves free_hour_ranges +
      want_off per day; prefills on load. **Follow-ups:** verify drag on a real touch
      device; consider 30-min granularity if Cole wants it.
- [x] Cole's build board: availability underlay, assign per-person start/end per day
      ("C" = close, "X" = off, clear = blank), staff in rank order, soft experience
      display. Per-cell inline editor. **Follow-up:** show a per-day headcount tally.
- [x] Full shared board view (/board) + "just me" toggle + own-row highlight.
      Published-only for staff; admin preview. **SMS blast on publish still TODO
      (Twilio).**
- [ ] Publish → SMS blast to all staff ("Schedule's up" + link). Needs Twilio.
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
