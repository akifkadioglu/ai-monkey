# AI Monkey

**The next generation of userscript managers. Write in English, not JavaScript.**

AI Monkey is a Chrome extension that lets you automate any website using plain English instructions. Describe what you want — an AI turns it into code and runs it instantly.

```
// ==AIMonkey==
// @name        Clean YouTube
// @description Remove all Shorts and distractions from YouTube
// @match       YouTube
// ==/AIMonkey==

Hide all YouTube Shorts sections from the homepage.
Remove the Shorts link from the sidebar navigation.
Make the video player fill the full width of the page.
```

No JavaScript. No debugging. Just say what you want.

---

## A Brief History of Userscripts

### The Beginning: Greasemonkey (2004)

It started with **Greasemonkey**, a Firefox extension created by Aaron Boodman. For the first time, ordinary users could inject custom JavaScript into any webpage. The web was no longer read-only — you could reshape it. Greasemonkey spawned an entire ecosystem: [userscripts.org](https://en.wikipedia.org/wiki/Userscript) became a hub where thousands shared scripts to fix annoyances, add features, and customize the web.

### The Evolution: Tampermonkey & Violentmonkey

As browsers evolved, so did the tools:

- **Tampermonkey** (2010) brought userscripts to Chrome and became the most popular userscript manager in the world, with millions of users. Cross-browser, polished, and packed with features — it set the standard.
- **Violentmonkey** (2013) offered a fast, open-source alternative with a clean UI and modern codebase. It proved that userscript managers could be both powerful and elegant.

Together, they carried the userscript tradition into the modern web. But they all shared one requirement: **you had to write JavaScript.**

### The Next Generation: AI Monkey (2025)

**AI Monkey** removes that barrier entirely.

Instead of writing code, you write instructions in plain English. An AI reads the page, understands your intent, and generates the JavaScript for you. The same power that Greasemonkey unlocked in 2004 — but now accessible to everyone, not just developers.

| | Greasemonkey | Tampermonkey | Violentmonkey | **AI Monkey** |
|---|---|---|---|---|
| Language | JavaScript | JavaScript | JavaScript | **English** |
| First Release | 2004 | 2010 | 2013 | **2025** |
| Requires Coding | Yes | Yes | Yes | **No** |
| URL Matching | Glob patterns | Glob patterns | Glob patterns | **English** ("YouTube", "all sites") |
| AI-Powered | No | No | No | **Yes** |
| Multi-Provider | — | — | — | **5 LLM providers** |

---

## Features

- **English-first** — Write scripts in plain English, match URLs by site name
- **Multi-provider AI** — Bring your own key: OpenAI, Anthropic, Google, Groq, or OpenRouter
- **Smart caching** — LLM responses are cached so repeat visits are instant and free
- **Full script manager** — Create, edit, enable/disable, import/export scripts
- **URL matching in English** — Say "YouTube" or "all shopping sites" instead of `*://*.youtube.com/*`
- **Execution logs** — See every run: status, tokens used, generated code, errors
- **70+ built-in site mappings** — YouTube, GitHub, Reddit, Amazon, and many more recognized by name
- **Category matching** — "all sites", "everywhere", "all social media" just work
- **Page context extraction** — AI sees a compact DOM summary, not raw HTML
- **Run-at timing** — Control when scripts fire: document-start, document-idle, or document-end
- **Dark mode ready** — Clean, modern UI throughout

## Getting Started

### 1. Install

Load as an unpacked extension:

1. Clone this repo: `git clone https://github.com/sahin/ai-monkey.git`
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `ai-monkey` folder

### 2. Configure

1. Click the AI Monkey icon in your toolbar
2. Go to **Settings**
3. Choose your AI provider and enter your API key
4. Pick a model (or use the default)

### 3. Create a Script

1. Open the **Dashboard** from the popup
2. Click **New Script**
3. Give it a name and describe where it should run (e.g., "YouTube")
4. Write your instructions in plain English
5. Save and navigate to a matching page — it runs automatically

## Supported Providers

| Provider | Models | Notes |
|---|---|---|
| **OpenAI** | GPT-4o, GPT-4o Mini, GPT-4.1, o3, o4-mini | Best all-around |
| **Anthropic** | Claude Sonnet 4, Claude Opus 4, Claude Haiku 3.5 | Excellent at following instructions |
| **Google** | Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.0 Flash | Fast and capable |
| **Groq** | Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B | Ultra-fast inference |
| **OpenRouter** | Any model via routing | Access all providers through one key |

## Architecture

```
English instructions
        |
        v
  +-----------+     +-------------+     +-----------+
  | URL Match |---->| Page Context |---->| LLM Call  |
  | (English) |     | (DOM summary)|     | (any provider)|
  +-----------+     +-------------+     +-----------+
                                              |
                                              v
                                      +-------------+
                                      | JavaScript  |
                                      | (generated) |
                                      +-------------+
                                              |
                                              v
                                      +-------------+
                                      | Page Inject |
                                      | (MAIN world)|
                                      +-------------+
```

- **Chrome MV3** with module service worker
- **No build system** — pure ES modules, no bundler, no dependencies
- **ISOLATED world** for safe page context extraction
- **MAIN world** for executing generated code with full page access

## Development

```bash
# Start the auto-reload dev server
node dev-reload.js

# The extension reloads automatically when you change any .js, .html, .css, or .json file

# Manually bump version
node bump-version.js
```

## License

MIT

---

*From Greasemonkey to Tampermonkey to Violentmonkey — and now AI Monkey. The web is yours to shape, no code required.*
