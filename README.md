# Daily Verses — Progressive Web App

A mobile-first, installable PWA for daily scripture memorization. Users work
through a fixed bank of 100 verses, three at a time: new verses are drilled
with fill-in-the-blank exercises at increasing blank density, then graduate
into a spaced-repetition review schedule.

This is the client only. It talks to **verse-memorize-api**, an Express +
SQLite backend expected to live in a sibling directory
(`../verse-memorize-api`) and to be running on port 3000.

**The backend service's README is the spec for how progression works** — stages, streak
thresholds, the interval ladder, the relearning queue. This app renders that
model; it never decides a transition itself. See
[Progression model](#progression-model) below for what the UI has to know.

The backend service manages and serves the data for this PWA is
in [this GitHub repo](https://github.com/johntchampion/daily-verses-service).

## Stack

- React 19 + TypeScript + Vite (React Compiler enabled via Babel plugin)
- `react-router-dom` for navigation
- `vite-plugin-pwa` for the manifest and service worker
- Plain `fetch` in a small hand-rolled REST API client — no data-fetching library
- Plain global CSS (`src/index.css`) — no component library, no CSS-in-JS

## Getting started

```sh
# 1. Start the backend service (sibling repo; needs JWT_SECRET in its .env)
cd ../verse-memorize-api && npm install && npm run dev   # listens on :3000

# 2. Start this app
npm install
npm run dev                                              # http://localhost:5173
```

The API has no CORS middleware, and none is needed: the Vite dev server
proxies `/api` and `/auth` to `localhost:3000` (see `vite.config.ts`), so the
client always talks same-origin. A production deployment should keep that
arrangement (serve `dist/` and the API behind one origin).

Other scripts:

```sh
npm run build      # tsc -b + vite build + service worker → dist/
npm run lint       # eslint (includes React Compiler rules — keep it clean)
npm run preview    # serve the production build locally
```

## Project layout

```
src/
  api/client.ts        fetch wrapper: JWT header, 401 → forced logout, ApiError
  api/types.ts         mirrors backend response shapes — keep in sync with the
                       API's routes/* when they change
  context/auth.ts      AuthContext + useAuth (split from the provider so fast
                       refresh works)
  context/AuthContext.tsx
  hooks/useApi.ts      fetch-on-mount + loading/error + refetch
  hooks/usePushReminders.ts  reconciles the account preference with this
                       browser's PushSubscription; owns the toggle's states
  sw.ts                the service worker: precache, navigation fallback,
                       push and notificationclick
  lib/push.ts          permission, subscribe/unsubscribe, capability checks
  lib/exercise.ts      exercise parsing, answer derivation, progression labels
  lib/path.ts          today's session read as a path of stops, for the Today tab
  lib/dates.ts         user-timezone day boundaries (mirrors the API's)
  routes/              one file per screen: Onboarding, Login, Signup,
                       ForgotPassword, ResetPassword, Today, Practicing,
                       AllVerses, Session, VerseDetail, Settings
  components/          TileExercise, TypedExercise, SlotRow, StageLadder,
                       TabBar, ProgressBar, TranslationTag, settings/ToggleCard,
                       settings/PasswordCard
  index.css            the whole design system (tokens + component classes)
```

Routes: `/login`, `/signup`, `/forgot-password` are public; `/`, `/session`,
`/verses`, `/verses/:id`, `/settings` are guarded (`RequireAuth` in `App.tsx`).
The JWT is kept in `localStorage` so a home-screen relaunch stays signed in; an
expired token or any 401 clears it and redirects to `/login`.

`/reset-password` is the exception: it carries no guard at all, not even the
`RedirectIfAuthed` the other public routes use. The link arrives by email and is
often opened in a browser that is still signed in — on the very device whose
session the reset is about to end — and redirecting an authenticated visitor to
Today would make that link unusable exactly where it is most likely to be
clicked. It reads its token from the query string once and immediately replaces
the URL, so a spent token is not left in history or in a referrer.

A revoked session is not the same as an expired one: `tokenIsExpired` reads only
the `exp` claim, so a token killed by someone else's password reset still looks
valid until a request comes back 401. `AuthProvider` records that as `signedOut`
and `RequireAuth` sends those users to `/login` rather than to its usual
fallback — without it, the root's `/welcome` fallback would drop a returning
user into onboarding.

## Translations

Verse text is served in whichever translation the account prefers
(`user.translation` on `GET /api/me`, changed with `PATCH /api/me`). Settings
lists the choices from `GET /api/translations`, which is also the only source
of translation names and licence text — everywhere else, the code alone is
enough, because `GET /api/verses`, `GET /api/verses/:id` and
`GET /api/session/today` each echo a top-level `translation` describing the
text in that same response. `TranslationTag` renders that code beside the
reference on every surface showing verse text, and the full licence appears
once, under the picker in Settings.

Reading the code off the response rather than off the profile is deliberate:
it always credits the words actually on screen. The session runner leans on
the same field — it refuses to start if `GET /api/session/today` and the
per-verse text fetches disagree, since `parseExercise` aligns the two token by
token and a mid-load preference change would otherwise crash it.

Switching translations touches no progress: `user_verse.verse_id` is the same
slug in every translation file, so a verse keeps its stage, streak and
schedule across a change. Signup does not offer a choice; new accounts get the
API's default and change it in Settings.

## Things to understand before changing the session runner

**The client judges correctness, and never shows it.** `POST /api/attempt` takes
a `correct: boolean` — the server never sees the user's actual answer and never
sends an answer key. That judgement now reaches only the review and mastered
schedules; a verse in a learning slot advances on having been practised, whatever
the words did. Nothing in the UI reports it, because users were protecting a score
instead of guessing. The runner therefore fetches each queued verse's full
text (`GET /api/verses/:id`) and
`lib/exercise.ts` derives per-blank answers by aligning the full text with the
exercise's `blankedText`, token by token. The alignment relies on both sides
using the same whitespace tokenization and word-core regex
(`/[\p{L}\p{N}'’-]+/u`) as the backend's `exerciseBuilder.ts`. **If the
backend tokenizer changes, `lib/exercise.ts` must change with it.**

**Exercise semantics** (product decisions):

- _Tile exercises_ (`tile_fill_blank`) cover the three learning tiers **and
  `review`**, which blanks every word. They validate on tap: a correct tile
  fills the next blank and dims; a wrong tile shakes and changes nothing. When
  all blanks are filled the Next button activates.
- **Wrong taps are unlimited, and invisible.** Nothing is drawn, nothing is spent
  and nothing cuts the exercise short: the only way through is still to find the
  right tile, however many tries that takes. Guessing a word and seeing what
  happens is the behaviour this is meant to encourage — the hearts that used to
  sit in the header taught users to protect a budget instead, which is the
  opposite of practising.
- `slipBudget` in `lib/exercise.ts` survives, but only to set the `correct` this
  reports. One budget covers the verse text and the reference phase together,
  because they are one attempt. **Review is the only place it has any effect** —
  a learning tier ignores correctness, and `mastered` is typed rather than tapped
  — so it is proportional (`SLIP_RATE`, with a `MIN_SLIPS` floor) rather than a
  flat allowance: a fixed budget of four wrong taps on a 70-blank full-density
  review is a near-certain failure, which would reset the interval on every visit
  and churn verses back into learning instead of letting the ladder climb.
- _Typed exercises_ (`type_fill_blank`) are reached **only at `mastered`**. They
  validate on "Check": one free-text input compared against the full verse,
  forgiving case, punctuation, and whitespace (`normalizeTypedText`). The
  comparison is kept — full recall can't be self-checked without it — but it is
  one neutral card either way rather than a pass colour and a fail colour.
- _The reference phase_ runs after the verse text on every stage but
  `learning_light` (`usesReferencePhase`). The reference turns into
  book/chapter/verse blanks and the tile bank becomes suggestions for each in
  turn; typed exercises hide the reference and ask for it in a second input
  (`referencesMatch`, which forgives abbreviations and roman numerals but not
  the chapter or verse). The API sends `reference` as one opaque string, so the
  split and the decoys are derived client-side in `lib/reference.ts` — a
  reference that won't parse silently skips the phase.
- Session state (current index, taps so far) is purely local; only submitted
  attempts hit the server. Whatever `/api/attempt` reports surfaces as a line on
  the completion screen — a verse sent back for another round included, not just
  wins. Queue exhaustion calls `POST /api/session/complete`.
- **The attempt is recorded when the exercise is finished, not when Next is
  tapped.** `record` fires from the tap that fills the last blank or answers the
  last part of the reference, so the verse's new progress is back while the user
  is still looking at what they just did — which is the only way the progression
  chip can show the move it describes. `next` then only advances, and doubles as
  the retry for an attempt that never landed (including the exercise that arrives
  already complete: a one-word verse gets zero blanks, so nothing fires `record`).
  Firing from the handler rather than an effect makes exactly-once structural —
  the response re-renders the exercise, so a render-driven fire would post again
  on the answer to its own request. `POST /api/attempt` is not idempotent, and a
  duplicate now buys a tier a whole repetition early.
- A failed `record` is silent: one retry inside the hook, then nothing on screen.
  The user asked for nothing, so a modal over a verse they are reading would be
  wrong. Tapping Next posts again and surfaces the alert then, and will not
  advance past an attempt that hasn't landed — the day's plan row would be left
  outstanding and the exercise would simply reappear.
- **The progression chip is learning-only.** `upgradeProgress` reports a run and a
  target for a slotted verse, and for `review`/`mastered` reports the stage label
  and nothing else: no segments, no interval, no counting. Their schedule is the
  server's business, and narrating it only invites the user to play to it.
- **Progress through the day is the server's, not the runner's.** The day's
  plan is persisted, and every exercise `GET /api/session/today` returns says
  whether it has been answered. The runner loads only the ones that haven't, so
  leaving part-way through and coming back resumes rather than restarting —
  and there is no way to redo a stop or skip ahead to one.
- `/session?practice=1` runs the drill instead
  (`GET /api/session/today?practice=true`): one exercise per slotted verse,
  re-randomised on every call. It counts toward nothing, so the runner skips
  `POST /api/session/complete` at the end of it. Attempts still hit
  `/api/attempt` and still move verses along the ladder — only the day's
  bookkeeping is untouched.
- **The recap is the server's too.** `GET /api/session/today` returns `events`
  (everything the day has moved) alongside `count`, so the completion screen
  reports the whole day rather than only the sitting it was open for. It also
  returns `correctCount`, which the client deliberately does not render. `/api/attempt` and `/api/session/complete` return deltas, which the
  runner appends as it goes. `lib/sessionEvents.ts` only dresses them — no
  stage comparing left in the client, which is what stopped the same upgrade
  being announced again by the two repetitions of that verse still queued
  behind it.
- A drill's recap is drill-scoped: `?practice=true` serves no `events`, so the
  screen shows only what that round moved. Its attempts
  are still recorded, so resuming the day's session afterwards includes them.

There's a standalone cross-check script pattern worth reusing if you touch the
parser: import the backend's `buildExercise` and this repo's `parseExercise`
in one `tsx` script and assert that every stage/instance/verse combination
aligns and that every blank's answer appears in the word bank. `review` is the
case worth covering — it blanks every token, so alignment has the least slack
there.

## The Today tab

Today draws the day as a **path**: one stop per exercise, in the order the
runner will take them, marked done / here / ahead. `lib/path.ts` builds it from
`GET /api/session/today` alone.

Two things about it are derived rather than served. The **grouping** — "Coming
back today", "Round 1", "Round 2" — comes from counting each verse's
appearances: the plan interleaves a verse's repetitions round-robin, so a
learning verse's nth appearance is its nth round, and a heading is drawn
wherever that label changes. A heading can legitimately repeat, which is what a
slot refilled mid-session looks like: its exercises land at the tail of the
plan and start a fresh "Round 1". The **time estimates** are a flat per-blank
guess (`lib/path.ts`); nothing on the wire knows how long an exercise takes, so
they're rounded hard to keep from implying otherwise.

Only the live stop is a link, and it leads exactly where the button at the
bottom does — into the day's plan at the first exercise outstanding. Once every
stop is done, the button becomes the practice drill instead.

The tab is the one screen with **no page scroll of its own**: `.today-shell` is
exactly `100dvh`, and the stops scroll inside `.path-scroll` between a heading
and a button that both hold still. That region ends in a `mask-image` rather
than a hard edge, so a stop crossing either boundary fades out instead of being
cut — its padding matches the opaque part of the mask, so the first and last
stops sit at full strength at rest. `PathList` scrolls the live stop into the
middle on mount when it would otherwise start off screen (or inside the fade,
which is why the check has a margin — `FADE` there and the mask stops in the
CSS are the same numbers and have to move together).

## Progression model

The rules live in the backend service; three of their consequences are easy to get wrong
here.

**A learning tier advances on 3 _attempts_ within one calendar day, and never
falls.** Correctness is not consulted in a slot at all — the repetition is the
whole mechanism, so the UI has nothing to say about how the words went. The run
carries across days in the database but is dead for an upgrade once `streak_date`
isn't today, so any "N / 3" the UI draws has to be gated on that date. See
`SlotRow`, `ProgressCard` and the session's `UpgradeMeter`. The day is the
_user's_, from their profile timezone: `lib/dates.ts` mirrors the server's
`todayInTimezone`, and comparing against the browser's own day would disagree for
anyone travelling. (Backward movement is review's alone: 2 missed due dates, and
those _do_ span days.) `consecutive_incorrect` still arrives on both `/api/me` and
the verse row, and is now always 0 for a slotted verse.

Note that the day plans exactly three repetitions per slotted verse, which is the
same number as the threshold: **finishing the day's session moves every slotted
verse up one tier**, so light → medium → heavy → graduated is three days of
showing up. `consecutive_correct` therefore never exceeds 2 between exercises.

**A verse can move up at most once per day.** After that the extra repetitions are
practice, and `/api/me` reports `tierChangeUsedToday` so the slot card can say so
instead of showing a progress bar that can't fill. Since an
upgrade is now the only thing that can spend the cap, the card names the
direction. `UpgradeMeter` reads `last_upgrade_date` for the same thing, and the
scheduled regimes want the equivalent guard for a different reason: review moves
once per _due date_, so a verse whose `due_at` is already past today has spent
its move too, however many exercises for it the day still holds.

**A verse pulled out of review still reports `status: 'review'`.** Two failed
reviews set `needsRelearning` and park the verse — no `due_at`, out of the
session — until a slot frees up. Status is derived from `stage`, which doesn't
change while it waits, so `needsRelearning` must be checked _alongside_ status
or a demoted verse counts as kept (`isKept` in `AllVerses`). There is no numeric
strength score and no `decayed` stage; both were removed in the rewrite.

## Design system

Everything visual is tokens and classes in `src/index.css`, themed around the
printed page: bible-paper background, blue-black ink, "red-letter" carmine for
actions/accents, and gilt gold reserved for streaks and mastery. Verse text is
set in a book-serif stack (Iowan Old Style → Palatino → Georgia) — no font
downloads. When adding UI, use the existing tokens (`--paper`, `--ink`,
`--carmine`, `--gilt`, `--rule`, …) and classes rather than inventing new
colors; gilt specifically means "achievement", don't spend it on chrome.

## PWA

`vite-plugin-pwa` precaches the app shell so repeat launches are fast and the
app is installable (manifest + iOS meta tags in `index.html`; icons in
`public/icons/`). The app is **not** offline-functional by design — session data
and attempt submission require the network.

The worker is **hand-written** at [`src/sw.ts`](./src/sw.ts) and built with
`strategies: 'injectManifest'`, because push notifications need a `push`
handler and a generated worker has nowhere to put one. That swap moves three
responsibilities from the plugin to us, and all three fail quietly:

1. **`skipWaiting()` / `clientsClaim()`.** `registerType: 'autoUpdate'` still
   sets these — but on the options only `generateSW` reads. Under
   `injectManifest` `sw.ts` must call them itself, or every install is stranded
   on the worker it first saw. This one can only be caught on the _second_
   deploy after a change, so check it there.
2. **The navigation fallback.** `generateSW` served `index.html` for
   navigations by default; `sw.ts` re-registers it with `NavigationRoute` +
   `createHandlerBoundToURL`. Without it a cold launch straight to `/settings`
   404s. It is skipped when the precache is empty, which is the case under
   `vite dev`.
3. **`cleanupOutdatedCaches()`**, or old precaches accumulate forever.

`src/sw.ts` needs `lib: WebWorker` where the app needs `DOM`, so it has its own
project (`tsconfig.worker.json`, referenced from `tsconfig.json` so `tsc -b`
checks it) and its own ESLint globals block.

Unlike before, the worker **does** register under `vite dev`
(`devOptions.enabled`), because push only works in a secure context and
`localhost` is the one available for free. Nothing is precached in dev, so
pages stay live. Use `npm run build && npm run preview` to test install
behavior and the precache.

### Testing push locally

`http://localhost:5173` counts as a secure context, so desktop Chrome works
under `npm run dev`. A phone on the LAN (`http://192.168.x.x:5173`) does
**not** — no service worker, no push, no diagnostics — and iOS additionally
requires the app to be installed to the Home Screen, which requires a real
origin. In practice: deploy to the real HTTPS host and use the settings
screen's **Send a test notification** button, which hits `POST /api/push/test`
and makes the loop fast. A tunnel (ngrok/Cloudflare) with the API proxied
through the same hostname is the fallback. Avoid `@vitejs/plugin-basic-ssl` —
a self-signed certificate can block service-worker registration outright on
iOS.

The backend service needs `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` set, or
`GET /api/push/key` answers `503` and the toggle renders as unavailable.

A fresh device usually lands on **Allow notifications on this device** rather
than the test button, because the reminder preference is per _account_ while a
`PushSubscription` is per _browser install_: signing in somewhere new inherits
the preference but nothing else. The card shows that button whenever the
preference is on and this browser has no usable subscription — permission never
asked for, or the server's row pruned after a `404`/`410`. Where permission is
granted the repair is silent, so the button appearing means the browser needs a
prompt, not that something is broken. A hard _denied_ is different again: the
switch stays on, the button does not appear, and the card says this device is
blocked, because `requestPermission()` resolves straight back to `denied`
without asking anyone. Reset the permission to _Ask_ in site settings to get the
button back — no need to flip the toggle.
