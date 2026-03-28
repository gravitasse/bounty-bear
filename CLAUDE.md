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
| Font | VT323 (via next/font/google) — retro terminal look |
| Auth | Supabase email/password |
| Database | Supabase PostgreSQL + PostGIS |
| Realtime | Supabase Realtime (not yet wired) |
| Audio | Web Audio API (cha-ching synth) + Web Speech API (bear voice) |
| Hosting | Vercel |

---

## Game Mechanics (Implemented)

- **Sign up / login** — email + password, Supabase auth
- **Bounty board** — lists all active bounties with first clue visible
- **Post bounty** — 3-step flow: location name + GPS + reward + difficulty → 3 clues → passcode
  - GPS auto-detect OR manual lat/lng entry
- **Claim bounty** — tap bounty → see all clues → enter passcode → cinematic bear sequence → cha-ching + voice → points awarded
- **Points system** — 1000 starting balance, earn reward_points on successful claim
- **Anti-self-claim** — can't claim your own bounty

---

## Game Mechanics (Not Yet Built)

From docs/GAME_DESIGN.md:
- [ ] Leaderboard page
- [ ] Proximity-based clue unlocking (currently all clues visible)
- [ ] GPS verification on claim (currently just passcode)
- [ ] Notifications (bounty claimed, new bounty nearby)
- [ ] Hunt tracking (hunts table not yet used)
- [ ] Achievements system
- [ ] Profile page
- [ ] Map view (Mapbox planned)
- [ ] QR code verification method
- [ ] Photo verification method

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

### Phase 3 — Next Up
- Leaderboard
- Proximity-based clue unlocking (needs GPS polling during hunt)
- Map view
- Notifications
- Profile page
- Polish the claim flow to fully match demo cinematic experience

---

## Working With This Project

- **Always deploy game via CLI**: `cd game && vercel --prod`
- **Demo deploys automatically** via GitHub push to main — never break bounty-bear.vercel.app
- **Test claim flow** requires two accounts (can't claim your own bounty)
- **Supabase SQL editor** at supabase.com — use for schema changes and debugging
- **The .env.local file** in game/ has real credentials — never commit it
