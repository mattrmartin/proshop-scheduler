# Backlog — proshop-scheduler

Ordered. Top unblocked item first. Keep current: remove done, add deferred.

## Phase 0 — scaffold
- [x] Deployed to Vercel (production): https://proshop-scheduler.vercel.app — Git-linked
      to github.com/mattrmartin/proshop-scheduler, env vars set (Production).
      **Gotcha:** Hobby plan BLOCKS Git auto-deploys whose commit-author email isn't the
      Vercel account owner's. Commit as `mattrobm+golf@gmail.com` (repo git config already
      set) or deploys get stuck in BLOCKED state. Env vars are Production-only for now.

## Auth — finish before real launch
- [ ] **Enable phone/SMS auth** (staff): Supabase dashboard → Auth → Phone provider
      on, Twilio creds (Account SID / Auth Token / Message Service SID). Client wiring
      + env are done; only the dashboard toggle + Twilio remain (owner).
- [ ] **Remove the dev admin bypass** once real auth is live: the "Sign in as Cole
      (dev)" button + NEXT_PUBLIC_DEV_ADMIN_* env vars in [src/app/login/page.tsx].
      Also revisit the seeded dev admin (email mattrobm+cole@gmail.com, placeholder
      phone) — give Cole a real phone identity.

## UX polish from Cole/Morgan demo feedback
- [x] Create-week date defaults to next un-opened Monday.
- [x] Availability grid: fixed touch-scroll trap (removed touch-action:none).
- [x] Week detail: "Availability responses" tracker (submitted vs waiting).
- [ ] **Quick shift presets** in Cole's cell editor (+ staff intake): one-click
      "Open / Mid / Close / Off". Needs Cole's default preset times.
- [ ] **Empty-publish guard**: confirm before publishing a week with 0 shifts.
- [ ] (Maybe) soft per-day headcount target Cole can set; board flags days under
      it. No enforcement. Deferred unless eyeballing isn't enough.

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
      display. Per-cell inline editor. Per-day working-headcount tally in the footer.
- [x] Full shared board view (/board) + "just me" toggle + own-row highlight.
      Published-only for staff; admin preview. **SMS blast on publish still TODO
      (Twilio).**
- [x] Admin roster management (/admin/roster): add/edit people, rank order, E.164
      phones, no-auth rows for people who haven't logged in yet.
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
