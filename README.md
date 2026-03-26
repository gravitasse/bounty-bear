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

## OpenClaw Skill Installation Guide

The Bounty Bear UI is fully positioned to act as the actual frontend terminal for an OpenClaw agent skill.

We have provided a dedicated live-wired template at `openclaw/bounty-bear-client.html` that strips out the cinematic fake timers and replaces them with a live `EventSource` web stream ready to connect to your local OpenClaw server.

### Option 1: Interactive 1-Click Install (Recommended)

The easiest way to set up the Bounty Bear skill. Run this from the project root:

```bash
chmod +x install-skill.sh
./install-skill.sh
```

The script will ask you for your OpenClaw or n8n URL (e.g., `http://127.0.0.1:8080/v1/agent/stream`), automatically configure the client, and tell you when it's ready.

---

### Option 2: Manual Installation

#### Step 1: Install the Agent Personality

Your OpenClaw backend needs to know it is the Bounty Bear so it behaves correctly and emits the proper cinematic status updates.
```bash
# Copy the provided personality definition to your OpenClaw agent directory
cp openclaw/AGENT.md ~/.openclaw/workspace/AGENT.md

# Restart your gateway to load the new personality
openclaw gateway restart
```

### Step 2: Configure the API Stream

Open `openclaw/bounty-bear-client.html` in your code editor and locate the API URL variable on line 724:

```javascript
const OPENCLAW_API_URL = "http://localhost:3000/api/stream"; // Change this!
```

**End-User Example:**
If your OpenClaw gateway is running locally on port 8080, your URL would look like this:
`const OPENCLAW_API_URL = "http://127.0.0.1:8080/v1/agent/stream";`

*Note: The Bounty Bear expects a valid Server-Sent Events (SSE) stream that emits serialized JSON objects.*

### Step 3: Match the Event Payload

Your backend (OpenClaw, n8n, or a custom Python/Node script) must send data in a specific "Streaming" format called **Server-Sent Events (SSE)**. 

Think of this like a "text message feed" from your server to the Bounty Bear. For the Bear to understand your messages, they need to be formatted as specific JSON "packets":

1.  **Thinking/Searching Packets**: For every live update (like querying a site), send:
    `{ "type": "status", "message": "Querying LinkedIn..." }`
2.  **Success Packets**: When the target is caught, send:
    `{ "type": "final_response", "content": "Full name, location, and bio here." }`

#### How do I actually do this?

- **If you are using Node.js / Express**:
  Your server route should look like this. Note the `text/event-stream` header which is required for the "live" feel:
  ```javascript
  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');

    // To send a progress update:
    const statusUpdate = { type: 'status', message: 'Hacking mainframe...' };
    res.write(`data: ${JSON.stringify(statusUpdate)}\n\n`);

    // To send the final result:
    const result = { type: 'final_response', content: 'John Doe caught in Berlin.' };
    res.write(`data: ${JSON.stringify(result)}\n\n`);
  });
  ```

- **If you are using n8n**:
  In your "HTTP Response" node:
  1. Set **Response Mode** to `Last Node`.
  2. Set a custom Header: `Content-Type: text/event-stream`.
  3. In the Body, use an expression to format your output exactly like the JSON packets above, prefixed with `data: ` and ending with two newlines (`\n\n`).

- **Troubleshooting**: 
  If the Bear doesn't speak, check your browser's "Network" tab. Each message from your server **must** start with `data: ` and contain the exact JSON keys `"type"` and `"message"` or `"content"`.

### Step 4: Launch the Interface
You don't need NPM, React, or a build step. Simply double-click `openclaw/bounty-bear-client.html` to open it in your browser natively. 
Type your target name, hit Enter, and the retro UI will dynamically narrate OpenClaw's live web scraping and thinking process exactly like the 1991 movie!
---

## Tech Stack

| Component | Technology       | Why                              |
| :-------- | :--------------- | :------------------------------- |
| UI | Pure HTML/CSS/JS | Zero dependencies, runs anywhere |
| Voice | Web Speech API | Built into all browsers |
| Audio | Web Audio API | Success sound synthesis (cha-ching) |
| Persistence | LocalStorage | Remembers your bounties & history |
| Offline | Service Worker | PWA support |
| Styling | CSS Variables | Easy theming |
| Fonts | Google Fonts | VT323, Press Start 2P |

## Key Features

- **Retro Terminal UI**: Authentic CRT scanlines and phosphor green aesthetic.
- **Cinematic Voice**: Deep robotic narration with film-accurate dialogue and pauses.
- **Bounty Log**: Historically tracks all targets ever identified and caught.
- **Session Persistence**: Your total bounty count and catch history save automatically.
- **Universal Compatibility**: Zero-dependency PWA runs on anything from a 1991 laptop to a 2026 smartphone.
- **OpenClaw Skill Native**: Architected to plug directly into OpenClaw as a live frontend.

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
- [x] Long-term memory (Session Persistence)
- [ ] Piper TTS WASM for better voice
- [ ] Actual person lookup APIs
- [ ] OpenClaw skill package
- [x] Sound effects (Synthesized clicks)

---

## License

MIT - Do whatever you want with it.

---

*"The best way to predict the future is to invent it." - Alan Kay*

**The bear always gets his man.** 🐻💰
