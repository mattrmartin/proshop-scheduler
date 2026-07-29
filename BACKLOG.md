# Backlog — proshop-scheduler

Ordered. Top unblocked item first. Keep current: remove done, add deferred.

## Phase 0 — scaffold
- [x] Deployed to Vercel (production): https://proshop-scheduler.vercel.app — Git-linked
      to github.com/mattrmartin/proshop-scheduler, env vars set (Production).
      **Gotcha:** Hobby plan BLOCKS Git auto-deploys whose commit-author email isn't the
      Vercel account owner's. Commit as `mattrobm+golf@gmail.com` (repo git config already
      set) or deploys get stuck in BLOCKED state. Env vars are Production-only for now.

## Auth — finish before real launch
DECISION (owner, 2026-07-28): **REVERSED back to SMS.** Cole entered everyone's
phone numbers (no emails) and expects text sign-in + a text blast on publish, so
email magic-link fought his data + audience. Going SMS (Supabase phone provider
via Twilio). Two-track: build all code now; owner provisions Twilio + A2P 10DLC in
parallel; deploy the login the moment the phone provider is enabled so staff never
see a dead form. (Email magic-link code from the prior decision is left in the tree
unused — callback route + link_current_auth_user() by email — remove later if SMS sticks.)
- [~] **Phone-OTP auth** — CODE DONE (committed, NOT pushed). Login rewritten to
      phone → texted code → verify ([src/app/login/page.tsx]); migration
      20260728000006_phone_auth_link.sql adds link_current_auth_user_by_phone()
      (binds auth session to roster row by digit-normalized phone). Remaining OWNER steps:
      1. Twilio: account, buy US number, register A2P 10DLC (Sole Proprietor brand
         + campaign — the long pole), create a Messaging Service.
      2. Supabase dashboard → Auth → Providers → Phone → enable, plug in Twilio creds.
      3. Apply migration 20260728000006 (MCP here points at golf-tracker — use
         interactive `/mcp` or the dashboard SQL editor).
      4. Deploy (push main) — phone login + publish blast go live together.
      5. Test: text code to a rostered phone → lands as that person; demo buttons OK.
- [ ] **Remove the dev/demo bypass** once phone login is verified end-to-end: the
      "View as Cole/Morgan (demo)" buttons + DEMO_ACCOUNTS in [src/app/login/page.tsx].
      Also the seeded dev users (mattrobm+cole@gmail.com / +morgan). Do this LAST.

## Notifications — SMS (Twilio)
- [~] **Publish blast** — CODE DONE (committed, NOT pushed). setWeekStatus texts all
      staff the board link on the open→published transition; [src/lib/sms.ts] is a
      server-only Twilio sender that no-ops until creds are set. Goes live with the
      Twilio setup above. Twilio env: TWILIO_ACCOUNT_SID / _AUTH_TOKEN /
      _MESSAGING_SERVICE_SID (or _FROM_NUMBER), + NEXT_PUBLIC_SITE_URL.
- [ ] **Post-publish edit → notify only the affected person** (reuse [src/lib/sms.ts]).
- [ ] **Auto-reminders** to non-submitters (Wed + Thu AM) — needs a scheduled job.

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
- [~] Publish → SMS blast to all staff ("Schedule's up" + link). CODE DONE (see
      Notifications above); goes live with Twilio setup.
- [ ] Post-publish edit → notify only affected person.
- [ ] Auto-reminders to non-submitters (Wed + Thu AM).
- [x] **Copy a person's schedule from last week** (Cole's ask) — per-person "↺ copy
      last wk" on the build board; weekday-matched, skips days closed this week.

## Deferred (v2+) — do NOT build in MVP
- Auto-generated / solver schedules (keep model forward-compatible).
- Standing / fixed assignments.
- Shift swaps / change-request flow.
- Hard tier-enforcement rules.
- Carts vs range as separate areas.

## Needs Cole input before/while building
- Full staff roster + count; any co-admins.
- Season-wide outer business-hours range (grid bounds).
