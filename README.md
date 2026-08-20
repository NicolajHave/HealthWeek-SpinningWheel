# Health Week — Team Spin Wheel

A single-screen kiosk app for a one-day Health Week event. Teams come up to the
screen one at a time, enter their team PIN, spin a six-segment wheel, and get
either a prize or a short physical exercise. **Each team can spin once, ever.**
Between spins the screen shows a live board of every team and a running count of
reps completed by the whole company.

Next.js (App Router, TypeScript) · Supabase (Postgres + Storage) · Vercel · Tailwind.

---

## The wheel

| Key | Label | Type | Reps |
| --- | --- | --- | --- |
| `power_up` | The Power-Up | prize | 0 |
| `squats` | 15 Air Squats | exercise | 15 |
| `calf_raises` | 20 Calf Raises | exercise | 20 |
| `wall_sit` | 30 sec Wall Sit | exercise | 30 |
| `jumping_jacks` | 20 Jumping Jacks | exercise | 20 |
| `lunges` | 20 Walking Lunges | exercise | 20 |

Segment order clockwise from top: `power_up`, `squats`, `jumping_jacks`,
`wall_sit`, `lunges`, `calf_raises`. The array index in `lib/segments.ts` **is**
the wheel position — segment `i` is centered at `i * 60 + 30` degrees clockwise
from top. Changing the order changes the wheel; nothing else needs touching.

The wall sit counts its seconds as reps. It is a morale number, not a
measurement.

Once a team has spun, the only way off the result screen is **We did it!**.
There is no opt-out button: the team presses it, the reps land, and the photo
step follows. The scaling line stays — *take it at your own pace, half reps
count, sit it out if you need to* — because that is about individuals inside a
team, not about whether the team finishes.

## Design

The screen is read from 2–3 metres in a lit room, so the type is large and the
contrast is absolute. Within that, it follows the Selected identity: light
ground, near-black ink, and no colour of its own.

```
--paper  #EFEFEF   ground
--ink    #111111   type, rules, the prize
--lane   #D9D9D9   wheel segment alternation
--rule   #C2C2C2   hairlines and waiting tiles
--mute   #8A8A8A   secondary annotation
```

**There is no accent colour.** The prize is the one inverted element — a solid
ink wedge on the wheel, a full-bleed ink reveal on the result screen. It reads
from across the room without borrowing a colour the brand does not use. The only
colour that ever appears on the board comes from the team photos, which is the
point: the system stays quiet and the room fills it in.

**Type.** Statements are set in the display face, large and light, never
uppercase. Every label, number and button is **Suisse Int'l Mono**, uppercase
and widely tracked — the annotation voice from the guideline sheets. The board
is laid out as numbered sections (`1. REPS BANKED TODAY`, `2. TEAMS THAT HAVE
SPUN`) with hairline rules and corner registration marks, the same construction
as the guideline artboards. `Selected Health Week` sits top-left as a section of
the main brand, alongside Selected Destinations, Selected Archive and the rest,
and honours the H/4 clear-space rule.

Two things are stand-ins:

- **The display face.** Only the mono was supplied, so headlines fall back to
  Inter via Google Fonts. Drop the real Selected display face into
  `public/fonts` and change `--font-display` in `app/globals.css` — one line.
- **The wordmark.** `Selected Health Week` is set as live text in
  `components/Marks.tsx`. Replace it with the supplied SVG when it is to hand.

Suisse Int'l Mono is licensed from Swiss Typefaces and is served from
`/public/fonts`, so it is downloadable by anyone who reaches the deployment.
Check that the company's licence covers web use before this goes further than a
one-day internal event.

## Setup

### 1. Supabase — already provisioned

This app runs in the existing **SELECTED** project
(`xpfoozuhndqnhvfyokki`, `https://xpfoozuhndqnhvfyokki.supabase.co`).

That project is shared with other apps that already own a `teams` table, so
everything here is namespaced: tables are **`hw_teams`** and **`hw_spins`**, and
the storage bucket is **`hw-team-photos`**. Nothing outside those three objects
was touched.

`supabase/schema.sql` and `supabase/seed.sql` have both been applied — 14 teams
are seeded, RLS is on with no policies, the bucket exists, and `hw_spins` is
empty and ready for the day. Re-running either file is safe; both are
idempotent.

**Replace the placeholder team names and PINs in `supabase/seed.sql` before the
event**, and re-apply. PINs must be 4 digits, unique, without a leading zero and
without confusable runs (no `0000`, no `1234`). The PINs currently in the file
are committed to this repository, so regenerate them if that matters to you.

To clear a test day and start clean: `delete from hw_spins;`

### 2. Environment

Copy `.env.example` to `.env.local` for local work, and set the same values in
the Vercel project before the first deploy. The service role key is in the
Supabase dashboard under **Settings → API → service_role**; paste it straight
into Vercel and `.env.local` and keep it out of the repository:

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xpfoozuhndqnhvfyokki.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key. **Never** prefix with `NEXT_PUBLIC_` |
| `ADMIN_PIN` | Unlocks `/admin` |
| `KIOSK_SECRET` | Unlocks spinning on the physical screen |
| `POWER_UP_LOCATION` | Where the Power-Up is collected, e.g. `the kitchen on the ground floor` |
| `POWER_UP_PRIZE` | What the Power-Up is, plural, e.g. `smoothies` |
| `PHOTO_PRIZE` | The best-photo prize, singular, e.g. `smoothie` |
| `KIOSK_LOCATION` | Where the screen stands, shown to desk viewers |

The four copy variables appear verbatim in user-facing text. Fill them in with
the real answers before deploying — no placeholders should reach the room.

### 3. Deploy

Vercel project, `main` branch auto-deploy. HTTPS is required for the camera and
Vercel provides it.

---

## The morning of the event

Run through this on the kiosk machine, in order:

1. Open the deployment at **`/?kiosk=<KIOSK_SECRET>`**. This sets an httpOnly,
   `SameSite=Lax` cookie that expires after 24 hours, then redirects to `/` so
   the secret does not sit in the address bar. **Never type the URL with the
   secret again.** Without the cookie the app renders the board read-only — no
   tap-to-spin, no keypad, just a line saying where the screen is.
2. Tap the screen once. The app goes fullscreen on first interaction, so no
   browser chrome is visible or tappable.
3. Do one rehearsal spin with a spare team, take a photo with the actual camera,
   then reset that team from `/admin`. Grant the camera permission when the
   browser prompts — it only asks once.
4. Disable OS sleep and the screensaver. The app requests a Wake Lock and
   re-requests it whenever the page becomes visible again, but the OS setting is
   the real fix.
5. Leave it on the board for 30 minutes untouched and confirm the screen is
   still showing the board.

PINs have to reach the teams **in advance** — a printed card per team, or an
email to each team lead that morning. There is no host at the screen to hand
them out.

---

## `/admin`

Gated by `ADMIN_PIN` and deliberately exempt from the kiosk cookie, so the
organiser can fix things from their own phone without walking to the screen.
Shows every team with its current status and a reset button per row. Reset
deletes the team's spin row and any photo they shared, and lets them spin again.

Someone will spin for the wrong team within the first twenty minutes. This is
the fix.

---

## Photos

Opt-in, never automatic, and always skippable with an equally prominent button.
Nothing leaves the browser until the team presses **Use this one**. There is no
keep-but-hide option: a photo that is not on the board cannot be judged and has
no reason to exist, and one decision makes the consent unambiguous.

If camera permission is denied the step is skipped silently — no error in front
of the room.

The bucket is private; the board renders signed URLs issued server-side.

**Retention: delete the bucket contents after the event.** Tell the teams
*"Photos are deleted after Health Week"*, and put the deletion date in someone's
calendar.

---

## Unattended operation

Nobody will be there to fix a frozen screen, so:

- **Idle timeout** returns every screen to the board on its own. 30 seconds on
  PIN, READY and the error screen; 90 seconds on RESULT and PHOTO, because teams
  need time to actually do the exercise and to line up for a photo. Never during
  the spin. A subtle progress line appears in the last 8 seconds. Any touch,
  key or click resets it.
- **Error boundary self-heals**: an unhandled render error shows one calm line
  and returns to the board after 5 seconds, never a stack trace.
- **Poll failures degrade quietly**: the board keeps its last good state and
  retries on the next 5-second tick rather than blanking.
- **Wake Lock** is requested on load and re-requested on visibility change.

---

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run typecheck
```

Locally the kiosk cookie is set the same way: `/?kiosk=<KIOSK_SECRET>`.

## Layout

```
app/actions.ts        every server action; the only place Supabase is touched
app/page.tsx          the single kiosk route
app/kiosk/route.ts    sets the kiosk cookie, then redirects to a clean URL
app/admin/            PIN-gated team list and per-team reset
components/Kiosk.tsx  the state machine: BOARD → PIN → READY → SPINNING → RESULT → PHOTO
components/Wheel.tsx  the wheel, drawn as SVG so labels stay crisp
components/Marks.tsx  the lockup and the registration marks
lib/segments.ts       the six segments; index = wheel position
public/fonts/         Suisse Int'l Mono, self-hosted
supabase/             schema and seed
```

## What was verified, and what was not

Verified against the live database: a second insert for the same team raises
`23505` and leaves exactly one row holding the **first** segment (which is what
makes `spin()` idempotent); deleting a spin row lets that team spin again, which
is what `resetTeam` does; the `anon` role can read zero rows from `hw_teams` and
its insert into `hw_spins` is rejected by RLS; and the board aggregates
(`spunCount`, `repsBanked`, `powerUpCount`, per-team status) come out as
`getBoard()` computes them.

Verified in the browser: the board at 1920×1080, the keypad, the wheel settling
with the winning segment under the pointer and its label upright, both result
screens, and the photo step — including the capture and review flow, and the
camera-denied path skipping silently.

**Not yet verified: the app talking to Supabase over the network.** The build
environment's egress policy blocks `supabase.co`, and the service role key is
not readable from here, so no server action has actually made a round trip.
That is what the rehearsal spin in step 3 of the morning checklist is for — do
it before the first team arrives.

---

## Still open for the organiser

- Real team names and count, and regenerated PINs (`supabase/seed.sql`).
- How PINs reach the teams, before the event.
- `POWER_UP_LOCATION` and `POWER_UP_PRIZE` — the result screen says them out loud.
- Who judges best photo, and when.
- The photo deletion date.

Settled: one `power_up` segment (16.7%); the best-photo prize runs
unconditionally alongside it and is announced on the board from the start of the
day.
