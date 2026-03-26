# Bounty Bear 🐻

> *"I'm the Bear. The Bounty Bear. I can find them anywhere!"*

An AI search agent inspired by **["Until the End of the World" (1991)](https://en.wikipedia.org/wiki/Until_the_End_of_the_World)** directed by Wim Wenders.

**Watch the original scene:** [YouTube](https://youtu.be/kKhzsx2gVgM)

In 1991, this film predicted AI agents with real-time feedback, personality, and the ability to find anyone, anywhere. 35 years later, we're living it.

---

## Quick Start

```bash
# Clone and run - no dependencies needed
git clone https://github.com/YOUR_USERNAME/bounty-bear
cd bounty-bear
open web-demo/bounty-bear.html
```

That's it. No npm install. No server. Just open the HTML.

---

## Features

### Multi-Platform (PWA)

Works everywhere:

- Mac, Windows, Linux (browser)
- iOS (Safari, add to home screen)
- Android (Chrome, install as app)
- Offline support (service worker)

### Voice Output

- **Web Speech API** - works in all modern browsers
- Press `V` to toggle voice on/off
- Bear speaks the key lines from the film

### Retro Terminal Aesthetic

- CRT scanline effect
- Phosphor green on black
- Real-time progress bars
- Animated bear avatar

### The Dialogue (from the 1991 film)

```text
"I'm the bear - the bounty bear!"
"I can find them anywhere!"
"I'm searching..."
"I am identifying..."
"I got him!"
"This is your guy!"
"Finders fee: 500 thousand dollars!"
```

---

## Project Structure

```text
bounty-bear/
├── web-demo/
│   ├── bounty-bear.html   # Main interactive demo (with voice)
│   ├── prophecy.html      # Film tribute page
│   └── index.html         # Knowledge Navigator demo
├── openclaw/
│   ├── AGENT.md           # Agent personality for OpenClaw
│   └── config.json        # Status message templates
├── manifest.json          # PWA manifest
├── sw.js                  # Service worker for offline
├── icons/                 # App icons
├── LICENSE                # MIT
└── README.md
```

---

## Demos

### Bounty Bear Terminal

```bash
open web-demo/bounty-bear.html
```

The full 1991 experience:

- Type a name, press Enter
- Watch the bear search
- Hear "I GOT HIM!"
- Collect your bounty

### The Prophecy Page

```bash
open web-demo/prophecy.html
```

A tribute showing 1991 vs 2026 - what the film predicted vs what we have now.

---

## OpenClaw Integration

Copy the agent personality to OpenClaw:

```bash
cp openclaw/AGENT.md ~/.openclaw/workspace/AGENT.md
openclaw gateway restart
```

Now your OpenClaw agent will narrate searches in real-time like the Bounty Bear.

---

## Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| UI | Pure HTML/CSS/JS | Zero dependencies, runs anywhere |
| Voice | Web Speech API | Built into all browsers |
| Offline | Service Worker | PWA support |
| Styling | CSS Variables | Easy theming |
| Fonts | Google Fonts | VT323, Press Start 2P |

---

## The Meta Moment

This project was built by an AI agent (Claude) after a human asked it to recreate the 1991 vision.

The prophecy typed itself.

---

## Inspiration

- ["Until the End of the World" (1991)](https://en.wikipedia.org/wiki/Until_the_End_of_the_World) - Wim Wenders
- [YouTube: The AI Search Scene](https://youtu.be/kKhzsx2gVgM)
- [The Criterion Collection](https://www.criterion.com/films/28767-until-the-end-of-the-world)

---

## Future Ideas

- [ ] Real web search integration (Tavily, DuckDuckGo)
- [ ] Long-term memory (IndexedDB, vector store)
- [ ] Piper TTS WASM for better voice
- [ ] Actual person lookup APIs
- [ ] OpenClaw skill package
- [ ] Sound effects (modem dial, cash register)

---

## License

MIT - Do whatever you want with it.

---

*"The best way to predict the future is to invent it." - Alan Kay*

**The bear always gets his man.** 🐻💰
