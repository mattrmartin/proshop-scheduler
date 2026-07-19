# proshop-scheduler — Project Context

Staff shift scheduling for the Hayden Lake Country Club pro shop. Replaces a
Thursday-noon group text (staff text availability → Cole mentally solves a Mon–Sun
grid → shares a spreadsheet) with a structured intake + fast build-and-publish board.

This spec was produced by a full requirements interview (`/grill-me`) with the
product owner, cross-checked against Cole's real July 13–19 schedule sheet. Treat it
as settled unless the owner reopens a decision.

## Core stance
- **Assist, don't decide.** The app structures intake and gives Cole a fast board.
  It does **not** auto-generate schedules in MVP. Cole places every person by hand.
- **Mirror the proven sheet first**, add improvements (auto-suggest, standing
  assignments) later. Data model is built forward-compatible for those.

## Actors / auth
- **Cole = admin** — opens the week, sets business hours + events, assigns exact
  times, publishes. (Confirm whether any co-admins exist.)
- **Everyone else = staff** (~26 people) — submit availability, view the board.
- **Auth = SMS magic-link, phone-number identity, no passwords.** Supabase phone
  auth (needs a Twilio provider — setup + small cost).

## Staff intake — weekly hourly availability
- Weekly calendar grid; **drag to mark free hours**.
- **Closed hours greyed out** per that week's business hours.
- Separate **"want day off" toggle** per day — a stronger signal than merely
  "unavailable" (this is the yellow highlight on Cole's sheet; respect it even when short).
- Deadline **Thursday noon, soft** — recommended, late submissions still accepted.
- **Non-submitters show as "no response," NOT assumed unavailable.** Cole decides.
- **Auto-reminders** nudge anyone who hasn't submitted (Wed + Thu AM).

## Cole's build side
- Opens a week: dates, **business hours** (drift with season / first tee time — they
  set the grid's vertical bounds), and **per-day events** (Ladies Mem. Guest, 18ers,
  9ers, FNF, …) — the demand signal. **No hard headcount target; Cole eyeballs it.**
- Sees the **availability grid**; assigns each person an **exact start/end per day**.
- **Atomic unit = per-person slot.** Times are wildly individual (6:00–2:00, 1:00–7:00,
  4:00–C). **"C" = open-ended close.** Supports staggered starts (e.g. two closers at
  12:00, two more at 3:00/4:00). NOT a shared "block + headcount."
- Staff listed in **rank order** (senior inside staff at top → outside kids at bottom,
  a few deliberate exceptions). **Experience is a soft eyeball guide** — the board shows
  the mix; it does **NOT** block a "bad" schedule.
- **Department = Inside / Outside only.** No carts/range split.

## Publish + view
- Publish → **SMS blast** ("Schedule's up" + link) to all staff.
- Default view = **full shared board** (everyone, like the sheet), viewer's own row
  highlighted, with a **"just me"** toggle.
- Post-publish edits allowed; **only the affected person** is notified of their change.

## Cell/state semantics (from the sheet)
- A time range = working. **"X"** = not working (assigned off). **Blank** = no
  assignment. **Yellow** = requested day off (respected).

## Explicitly OUT of scope (v2+)
- Auto-generated / solver schedules (model stays forward-compatible for it).
- Standing / fixed assignments — for now Kelly/Lindsey/Braxton enter their usual
  hours as availability like everyone else.
- Shift swaps / change-request flow — staff text Cole, as today.
- Hard tier-enforcement rules (no "must have ≥1 senior" blocking).
- Carts vs range as separate areas.

## Data model — early sketch (refine in first plan)
- **User** { id, name, phone, role (admin|staff), department (inside|outside), rank (int) }
- **Week** { id, start_date, business_hours_by_day, status (draft|open|published) }
- **Event** { week_id, date, label }
- **Availability** { user_id, week_id, date, free_hour_ranges[], want_off (bool), note }
- **Assignment** { week_id, user_id, date, start, end | close_flag }

## Open items to confirm with Cole (texts already drafted, some pending)
- Full staff roster + count; any co-admins besides Cole.
- Outer business-hours range across the season (grid bounds).
- Exact deadline behavior nuances / how he handles no-shows today.
