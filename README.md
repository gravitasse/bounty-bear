# Knowledge Navigator Agent

Inspired by the AI search scene from **["Until the End of the World" (1991)](https://en.wikipedia.org/wiki/Until_the_End_of_the_World)** directed by Wim Wenders.

**Video Reference:** [YouTube Clip](https://youtu.be/kKhzsx2gVgM?si=dM2196iuutp6OW66)

In this 1991 sci-fi film, there's a prescient depiction of an AI agent searching for a person and providing real-time feedback - decades before modern AI assistants existed.

## The Vision

The film showed an AI that:
- **Searches in real-time** with visual feedback of the search progress
- **Reports status** as it works through databases
- **Has personality** in how it communicates findings
- **Shows intermediate results** before final answer

## This Project

Recreates the Knowledge Navigator experience for modern AI agents:

1. **OpenClaw Integration** - Agent personality + real-time status updates via Telegram
2. **Web Demo** - Visual interface showing the 1991 film experience
3. **MCP Server** - Tools that report progress as they work

## Structure

```
├── openclaw/           # OpenClaw agent configuration
│   ├── AGENT.md        # Phil personality + behavior rules
│   └── config.json     # OpenClaw settings
├── web-demo/           # Browser-based demo
│   └── index.html      # Visual Knowledge Navigator interface
├── mcp-server/         # MCP tools with progress reporting
│   └── server.ts       # TypeScript MCP server
└── README.md
```

## Key Features

### 1. Real-Time Feedback
Instead of silent processing, the agent narrates:
```
🔍 Searching for "Dr. Sarah Chen publications"...
📚 Found 47 papers in IEEE database
🎯 Filtering to renewable energy topics...
✅ Here are the 5 most relevant:
```

### 2. Personality Layer
Phil has a defined character:
- Professional but warm
- Uses "sir" or "ma'am" appropriately
- Shows enthusiasm for interesting findings
- Admits uncertainty gracefully

### 3. Progress Visualization
Web demo shows:
- Avatar with state (thinking, speaking, listening)
- Progress bars for multi-step tasks
- Real-time log of actions being taken

## Quick Start

### OpenClaw Setup
```bash
cp openclaw/AGENT.md ~/.openclaw/workspace/AGENT.md
# Restart openclaw gateway
```

### Web Demo
```bash
open web-demo/index.html
```

## Inspiration

- ["Until the End of the World" (1991)](https://en.wikipedia.org/wiki/Until_the_End_of_the_World) - Wim Wenders' sci-fi epic
- [YouTube Clip of AI Search Scene](https://youtu.be/kKhzsx2gVgM?si=dM2196iuutp6OW66)
- [The Criterion Collection](https://www.criterion.com/films/28767-until-the-end-of-the-world)

---

*"The best way to predict the future is to invent it." - Alan Kay*
