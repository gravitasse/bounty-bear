# Bounty Bear — CLAUDE.md

Complete project context for Claude Code. Read this first every session.

---

## What This Project Is

**Bounty Bear** is a two-part project:

1. **The Demo** — a cinematic retro terminal AI search agent inspired by the 1991 film "Until the End of the World" (Wim Wenders). A bear "finds" people with dramatic voice, sound effects, and CRT aesthetics.

2. **The Game** — a distributed async geocaching-style game built on top of the demo's aesthetic. Players post real-world bounties with GPS coordinates, clues, and passcodes. Other players hunt them down and claim the reward.

---

## Repo Structure

```
knowledge-navigator-agent/          ← local folder name (repo is "bounty-bear" on GitHub)
├── web-demo/
│   ├── bounty-bear.html            ← THE DEMO (standalone, no build needed)
│   ├── prophecy.html               ← 1991 vs 2026 tribute page
│   ├── index.html                  ← Knowledge Navigator demo
│   └── audio/
│       └── im-searching.mp3        ← Bear audio from film
├── openclaw/
│   ├── bounty-bear-client.html     ← Live SSE streaming frontend for OpenClaw
│   ├── AGENT.md                    ← Bear personality for OpenClaw agent
│   └── config.json                 ← Status message templates
├── game/                           ← THE GAME (Next.js 16 app)
│   ├── app/
│   │   ├── layout.tsx              ← VT323 font, global styles
│   │   ├── globals.css             ← CRT scanlines, animations, CSS vars
│   │   ├── login/page.tsx          ← Email/password auth
│   │   └── play/page.tsx           ← Main game board (server component)
│   ├── components/
│   │   ├── BountyBoard.tsx         ← Lists active bounties, opens detail
│   │   ├── BountyDetail.tsx        ← Clue viewer + passcode claim flow
│   │   └── CreateBountyModal.tsx   ← 3-step bounty creation (GPS, clues, passcode)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           ← Browser Supabase client
│   │   │   └── server.ts           ← Server Supabase client
│   │   └── audio.ts                ← Web Audio API (cha-ching) + Web Speech API (bear voice)
│   ├── supabase/migrations/
│   │   └── 001_initial_schema.sql  ← Full DB schema (already run on Supabase)
│   ├── proxy.ts                    ← Auth guard — redirects /play to /login if not authed
│   ├── .env.local                  ← Supabase credentials (gitignored)
│   └── vercel.json                 ← framework: nextjs
├── docs/
│   ├── GAME_DESIGN.md              ← Full game design spec
│   ├── ARCHITECTURE.md             ← Tech stack decisions
│   ├── DATABASE.md                 ← Full schema design reference
│   ├── API.md                      ← API endpoint design
│   └── DEPLOYMENT.md               ← Deployment notes
├── vercel.json                     ← Routes / to web-demo/bounty-bear.html (demo)
├── manifest.json                   ← PWA manifest
└── sw.js                           ← Service worker (offline PWA)
```

---

## Deployments

| What | URL | Vercel Project |
|---|---|---|
| Demo (LinkedIn link — DO NOT BREAK) | bounty-bear.vercel.app | bounty-bear (prj_1XkWaoerYSHHrmTq1qM3cETMjoMh) |
| Game | bounty-bear-game.vercel.app | bounty-bear-game |

- **GitHub repo**: gravitasse/bounty-bear
- **Vercel team**: tyson-krocks-projects (team_w4UYuIlEPyY0CZz0ZEFIqzuB)
- **Deploy game**: `cd game && vercel --prod` (Vercel CLI already linked)
- **Deploy demo**: push to main → auto-deploys via GitHub

---

## Database

- **Supabase project**: zbxdtfgfhmkodwjgqaqx
- **URL**: https://zbxdtfgfhmkodwjgqaqx.supabase.co
- **Tables**: users, bounties, hunts, claims, notifications, achievements, user_achievements, leaderboards
- **Key features**: PostGIS for geo queries, RLS on all tables, auto user profile trigger on signup
- **Credentials**: stored in game/.env.local (never commit)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Demo | Pure HTML/CSS/JS — zero dependencies |
| Game frontend | Next.js 16, TypeScript, Tailwind CSS |
| Fonts | VT323 (terminal body) + Press Start 2P (logo) — via next/font/google |
| Auth | Supabase email/password |
| Database | Supabase PostgreSQL + PostGIS |
| Realtime | Supabase Realtime (postgres_changes — live bounty board) |
| Audio | Web Audio API (cha-ching + blip synth) + Web Speech API (bear voice) |
| Map | Leaflet + react-leaflet (CartoDB dark tiles, SSR disabled) |
| Hosting | Vercel |

---

## Game Mechanics (Implemented)

- **Sign up / login** — email + password, Supabase auth
- **Bounty board** — live via Supabase Realtime; new bounties slide in without reload
- **Post bounty** — 3-step flow: location name + GPS + reward + difficulty → 3 clues → passcode
  - GPS auto-detect OR manual lat/lng entry; lat/lng stored in verification_data JSONB
- **Claim bounty** — tap bounty → see clues (proximity-gated at 200m) → enter passcode → cinematic bear sequence in-layout → cha-ching + voice → points awarded
- **Cinematic boot sequence** — "CLICK TO START" gates audio; bear intro monologue with scrolling terminal text + MP3 + speech synthesis (speakSequence with onend-based pauses)
- **Points system** — 1000 starting balance, earn reward_points on successful claim
- **Anti-self-claim** — can't claim your own bounty
- **Profile page** — /profile shows hunter stats, claimed bounties, posted bounties
- **Leaderboard page** — /leaderboard shows top 50 hunters by points, highlights current user
- **Map view** — Leaflet map shows all bounties with GPS coords; tap to select and hunt
- **Audio controls** — bear icon toggles voice mute; all audio stops when claim sequence begins

---

## Game Mechanics (Not Yet Built)

- [ ] GPS verification on claim (currently just passcode)
- [ ] Notifications (bounty claimed, new bounty nearby)
- [ ] Hunt tracking (hunts table exists but unused)
- [ ] Achievements system
- [ ] Server-side passcode verification (currently client-side — fine for MVP)
- [ ] QR code or photo verification method
- [ ] Multi-stage waypoint bounties (cgeo-style chained clues)

---

## Demo Features (Already Shipped)

- CRT scanline effect, phosphor green on black
- VT323 monospace font throughout
- Bear emoji with pulse-ready animation
- Voice synthesis (Web Speech API) — deep male voice
- Cha-ching sound on success (Web Audio API synthesis)
- Bear dialogue: "I'm the bear!", "I can find them anywhere!", "I'm searching...", "I GOT HIM!", "Finders fee!"
- Progress bar animation during search
- Mobile-optimized layout (bear scales during search, condenses on result)
- PWA — installable on iOS/Android
- OpenClaw SSE streaming integration

---

## Key Design Decisions

- **One GitHub repo, two Vercel projects** — demo and game are separate deployments from same repo
- **game/ subfolder** — Next.js app lives in `game/`, demo in root. Vercel CLI deployed from `game/` with `vercel --prod`
- **Passcode verification** is client-side (the passcode is fetched as part of the bounty). This is fine for MVP but should move server-side before real money/prizes are involved
- **Email/password auth** — switched from magic link because Supabase free tier email deliverability is unreliable
- **No "Confirm email"** in Supabase — turned off for smoother signup flow
- **Auto user profile creation** — trigger on auth.users insert + fallback in /play page server component
- **Next.js 16 breaking changes** — middleware renamed to `proxy`, check node_modules/next/dist/docs/ before assuming API compatibility

---

## Progress Timeline

### Phase 1 — Demo (Shipped ✅)
- Retro terminal UI with CRT aesthetic
- Bear search animation with voice and sound
- Mobile optimization (extensive polish)
- PWA support
- OpenClaw SSE streaming client
- XSS protection

### Phase 2 — Game Scaffold (Shipped ✅)
- Next.js 16 app in game/
- Supabase DB with full schema (PostGIS, RLS, triggers)
- Auth (email/password)
- Bounty board
- Create bounty (GPS + clues + passcode)
- Claim bounty (passcode verification + cinematic sequence)
- CRT aesthetic applied to game UI
- Bear voice + cha-ching on claim

### Phase 3 — UI Overhaul (Shipped ✅)
- Full 3-column layout matching demo exactly: sidebar (280px bear+stats) | terminal (1fr) | info panel (320px)
- Press Start 2P font for header logo (via next/font/google variable)
- Bear container with state-based animations: ready (green pulse-ready), searching (amber pulse), found (green glow)
- Bear status label updates live during claim sequence
- Cinematic claim sequence stays INSIDE the layout — no fullscreen takeover
- All CSS variables match demo exactly: --terminal-bg: #0d1117, --text: #e0e0e0, --border: #333, --amber: #ffb000
- Mobile: bear+stats in compact horizontal row, info panel toggleable with 📋 button

### Phase 4 — Feature Drop (Shipped ✅)

- **Boot sequence** — "CLICK TO START" button gates all audio; bear intro monologue scrolls line by line in terminal synced with speech
- **speakSequence** — onend-callback-based speech with genuine inter-utterance pauses (fixes Chrome synthesis queue issue)
- **MP3 playback** — im-searching.mp3 plays during boot intro, stops when claim begins
- **Audio mute toggle** — bear icon in sidebar mutes/unmutes voice
- **Supabase Realtime** — live bounty board via postgres_changes subscription; new bounties animate in
- **Proximity clue unlocking** — clues locked behind 200m GPS radius (stored in verification_data JSONB, no migration needed)
- **Map view** — Leaflet + CartoDB dark tiles; bear icons for each bounty, user location dot, "HUNT THIS" popup
- **Leaderboard page** — /leaderboard, server-rendered, top 50 by points
- **Profile page** — /profile, server-rendered, claimed + posted bounties
- **Migration 002** — hunt_id nullable in claims, expanded bounties RLS for profile page

### Phase 5 — Next Up

- GPS verification on claim
- Notifications
- Server-side passcode verification
- Multi-stage waypoint bounties
- Achievements

---

## Working With This Project

- **Always deploy game via CLI**: `cd game && vercel --prod`
- **Demo deploys automatically** via GitHub push to main — never break bounty-bear.vercel.app
- **Test claim flow** requires two accounts (can't claim your own bounty)
- **Supabase SQL editor** at supabase.com — use for schema changes and debugging
- **The .env.local file** in game/ has real credentials — never commit it
