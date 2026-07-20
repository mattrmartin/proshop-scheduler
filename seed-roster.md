# Seed roster — proshop-scheduler

Deduced from Cole's schedule sheets (July 13–19 and July 20–26). **Names, department,
and rank are read off the sheet** (row grouping = department, row order = rank).
**Phones are NOT on the sheet — fill from Cole before seeding `users`.**

Confidence: names + set are solid (identical across both weeks). Rank is
approximate — owner noted "a few are out of order." Cole to sanity-check.

## Inside / shop staff (senior → junior)
| rank | name | role | phone | notes |
|---|---|---|---|---|
| — | Matt Bunn | ? | TODO | **Special "In/Out" row — never has shift times. Likely NOT a scheduled worker (member/owner presence flag). Confirm with Cole before adding as staff.** |
| 1 | Cole Lorenz | admin | TODO | Assistant head pro. The admin user. |
| 2 | Morgan Baum | staff | TODO | |
| 3 | Joey Garcia | staff | TODO | |
| 4 | Jack Bredeson | staff | TODO | |
| 5 | Landon Bunn | staff | TODO | |
| 6 | George Fong | staff | TODO | |

## Outside staff (senior → junior; "kids" at bottom)
| rank | name | role | phone | notes |
|---|---|---|---|---|
| 1 | Mike Lindsey | staff | TODO | |
| 2 | Kelly DeShaw | staff | TODO | |
| 3 | Braxton Stewart | staff | TODO | |
| 4 | Caleb Monrroy | staff | TODO | |
| 5 | Keegan Nitti | staff | TODO | |
| 6 | Gavyn Blackwelder | staff | TODO | |
| 7 | Zee Garcia | staff | TODO | |
| 8 | Max Taylor | staff | TODO | |
| 9 | Jacob Melun | staff | TODO | |
| 10 | Mac Kelly | staff | TODO | |
| 11 | Sam Weymouth | staff | TODO | |
| 12 | Ben Smith | staff | TODO | |
| 13 | Jack Boland | staff | TODO | |
| 14 | Gracie McVey | staff | TODO | |
| 15 | Charlie McVey | staff | TODO | |
| 16 | Simon Fong | staff | TODO | |
| 17 | Ethan Skiles | staff | TODO | |
| 18 | Sophia Monrroy | staff | TODO | |

## Open questions for Cole (before/while seeding)
- **Phones** for everyone (required for SMS auth).
- **Matt Bunn** — scheduled staff, or just an in/out presence row? (Determines whether he's a `users` row at all.)
- **Rank exceptions** — confirm the few that are "out of order."
- **Second highlight color (cyan/blue)** seen on the 13–19 sheet (Simon Fong Sat, Ethan Skiles Fri/Sat) — meaning vs yellow (want-off)? Possibly "confirmed" vs "requested." May imply an extra availability/assignment state to model.
- **"Clean Pick"** notes under Wed/Sun on the 20–26 sheet — a task/event tag, not a person. Decide if events need a free-text task field.

## Observed name overlaps (likely relatives — not a data concern, just context)
- Garcia: Joey (inside) & Zee (outside)
- Fong: George (inside) & Simon (outside)
- Bunn: Matt (special) & Landon (inside)
- Monrroy: Caleb & Sophia (outside)
- McVey: Gracie & Charlie (outside)
