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

## Operating loop (daily-use views) — done
- [x] /today: who's on today (both roles), grouped + ranked, viewer highlighted.
- [x] Staff home leads with "Your shifts" (next + upcoming); availability secondary.
- [x] Cole dashboard "Today" strip.
- [x] app_today() so dates match the DB/data clock.
- [x] Fix serif font fallback → Geist sans.
- [ ] Staff month calendar of shifts (list exists; calendar is the richer follow-up).

## Auto-open model + dashboard redesign (in progress)
Decision: Cole no longer opens weeks. Standing hours setting drives a rolling
window of the next 3 Mondays (ensure_open_weeks). "draft" dropped → weeks are
Accepting → Published. Edits lock at publish.
- [x] Migration: settings table, drop draft, ensure_open_weeks() (auto-open).
- [x] Cole dashboard: open weeks + submission progress rings + Build; published below.
- [x] Build-board wizard prefills start/end from submitted availability (skips want-off).
- [x] Business-hours rows fit one line.
- [x] Staff list shows auto-opened weeks + ✓ Submitted / Tap-to-fill.
- [ ] **Settings UI** for standing business hours (seasonal change in one place)
      + "apply to all upcoming weeks" button. (settings table exists; no UI yet.)
- [ ] **Staff inline picker**: expand the week card to the grid instead of a new
      page (#5); + archive of submitted weeks, editable while status=open (#6).
- [x] **Publish** restored on the build board (regression from dashboard redesign)
      + Unpublish-to-edit, with an **empty-publish confirm guard**.
- [x] **Shift presets** in the cell editor (6–2, 6–C, 9–5, 12–C) — fill-and-save.
- [ ] (Maybe) soft per-day headcount target. Deferred.

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
