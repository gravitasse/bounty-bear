# Bounty Bear 🐻

> *"I'm the Bear. The Bounty Bear. I can find them anywhere!"*

**🔗 Live Demo: [bounty-bear.vercel.app](https://bounty-bear.vercel.app)**

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
- Click the search box or voice button to initialize audio
- Press `V` to toggle voice on/off (when not typing)
- Bear speaks the key lines from the film
- Speech queues naturally - no cutoffs or overlapping

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

## OpenClaw Integration Architecture

The Bounty Bear UI is fully positioned to act as the actual frontend terminal for an OpenClaw agent skill.

Currently, `bounty-bear.html` runs a simulated search (`performSearch`) to demonstrate the cinematic timing, audio, and CRT aesthetic. To turn this into a live, functional skill:

1. **The Backend (Brain)**:
   Copy the provided `openclaw/AGENT.md` personality into your OpenClaw gateway (`cp openclaw/AGENT.md ~/.openclaw/workspace/AGENT.md`). This guarantees the OpenClaw backend natively emits search status updates (`🔍 Searching...`, `📡 Querying...`) while it leverages its real tools to browse the web.
2. **The Frontend (Face & Voice)**:
   We already built a dedicated client interface for this! Open `openclaw/bounty-bear-client.html`. This is a clone of the cinematic demo but with the fake `sleep()` timers ripped out and replaced with a live `EventSource` connection.
3. **The Synchronization**:
   Simply change `OPENCLAW_API_URL` inside the client file to point to your local OpenClaw streaming endpoint. When a new status event arrives, the frontend will automatically print it to the green CRT terminal and use `speak()` to narrate exactly what the backend is doing in real-time, utilizing our perfectly tuned deep robotic voice!

This architecture transforms the project from a stunning 1991 movie replica into a completely functional, real-world AI agent interface.
---

## Tech Stack

| Component | Technology       | Why                              |
| :-------- | :--------------- | :------------------------------- |
| UI | Pure HTML/CSS/JS | Zero dependencies, runs anywhere |
| Voice | Web Speech API | Built into all browsers |
| Offline | Service Worker | PWA support |
| Styling | CSS Variables | Easy theming |
| Fonts | Google Fonts | VT323, Press Start 2P |

---

## How the Voice Works

Browsers require user interaction before playing audio (autoplay policy). Here's how we handle it:

1. **First click on search box** → initializes audio, plays the original film MP3 snippet alongside the TTS intro.
2. **Cinematic Pacing** → Utterances are perfectly timed with `sleep()` delays to match the 1991 film, including a massive 12.3-second silent progress bar climb and a 5-second dramatic pause before announcing the prize money!
3. **Emergency Mute** → Pressing the 🔊 button or `V` key instantly triggers `stopAllAudio()` to forcefully halt both the Web Speech API and any background MP3 tracks immediately.

```javascript
function stopAllAudio() {
  if (synth) synth.cancel(); // cuts TTS mid-sentence
  const imAudio = document.getElementById('imSearchingAudio');
  if (imAudio) {
    imAudio.pause(); // forcefully stop the MP3
    imAudio.currentTime = 0;
  }
}
```

This ensures full control over the audio while delivering a perfectly paced, suspenseful user experience.

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
