# Shred — AI Fitness Coach (PWA)

A standalone, installable fitness app. Offline calorie/macro engine + a chat **AI agent** that runs your plan (logs workouts, tweaks exercises, tracks weight) using **your own free API key**.

No build step. No backend. No cost. Drop it on GitHub Pages and install it to your iPhone home screen.

---

## What it does

- **Onboarding** asks weight, height, age, sex, activity, and goal.
- **Calorie engine (100% offline math)** — Mifflin-St Jeor BMR → TDEE → goal-adjusted calories + protein/carb/fat macros + water target. Recalculates automatically as your logged weight changes.
- **The Plan** — a personalised 7-day split generated from age, sex, weight, goal, diet preference, and training focus using a 200+ exercise library.
- **AI agent** — a chat coach that can operate the app: mark exercises/habits done, replace today with legs/upper/no-chest/cardio focus, add/remove exercises, log food with protein, adjust today's macro target, log weight, write notes, and navigate screens. Toggle **Agent mode** for instant actions, or off for Apply/Skip confirmation.
- **Food + Protein Tracking** — food log updates protein gained vs protein needed in real time, with manual protein entry or automatic estimates from food names.
- **Body + Progress** — weight history, 7-day average, trend chart, weekly completion, training history.
- **Installable PWA** — add to home screen, opens fullscreen, works offline (the AI chat needs internet).

---

## The AI: bring your own free key

The app never ships a key. Each person pastes their own, stored **only in their browser's localStorage** on their device. Supported providers:

| Provider | Free tier | Get a key |
|---|---|---|
| **Groq** (fastest) | ~14,400 req/day, no card | https://console.groq.com/keys |
| **Google Gemini** (most volume) | 1,500 req/day, 1M tokens/min | https://aistudio.google.com/apikey |
| **OpenAI-compatible** | any base URL (OpenRouter, Together, local…) | — |

Open **Settings → AI Provider**, pick one, paste the key, hit **Test Key**, done.

> Because a static site can't hide secrets, never commit a key to the repo. The Settings flow keeps it on-device only — which is exactly right for personal/local use.

---

## Deploy to GitHub Pages

1. Put all these files in your repo root (or a folder):
   - `index.html`, `engine.js`, `ai.js`, `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`
2. Repo **Settings → Pages → Deploy from branch** → pick your branch + root.
3. Open the Pages URL on your iPhone in **Safari**.
4. Tap **Share → Add to Home Screen**. It now opens like a native app.

That's it — same as the deploy your senior already had, but now it's the full app.

---

## Files

- `index.html` — the whole app (UI, screens, AI agent, router).
- `engine.js` — offline calorie/macro math (no network).
- `ai.js` — provider-agnostic AI wrapper (Groq / Gemini / OpenAI-compatible).
- `sw.js` — service worker; caches the shell for offline, always sends AI calls to network.
- `manifest.webmanifest` + icons — PWA install metadata.

## Privacy

All data (profile, logs, weight, API key) lives in your browser's localStorage on your device. Nothing is sent anywhere except your chat messages, which go directly to the AI provider you chose. Use **Settings → Export** to back up, or **Reset Everything** to wipe.

## Note

Calorie/macro numbers are estimates from standard equations, not medical advice. Adjust based on real-world results over a few weeks.
