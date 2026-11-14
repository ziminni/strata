# Strata

Climate-smart crop-rotation adviser for Central Luzon rice farmers. Mobile-first React UI + FastAPI backend.

## Run it

**Frontend only (current phase)** — no backend needed; data is saved in the browser:

```bash
cd frontend
npm install                      # first time only
npm run dev                      # http://localhost:5173
```

Open it in a phone-sized window (or devtools device mode). The AI adviser needs the backend;
everything else works offline.

**With the backend (later)**:

```bash
cd backend && source .venv/bin/activate && fastapi dev main.py   # :8000, set GEMINI_API_KEY for chat
cd frontend && VITE_API_MODE=remote npm run dev                    # Vite proxies /api → :8000
```

## Architecture

```
backend/
  main.py                 FastAPI app, CORS, router registration, DB init
  app/data.py             crops, provinces, climate baseline, scenarios, rotation plans
  app/schemas.py          Pydantic models (Farm, LogIn, PostIn, ChatRequest)
  app/db.py               SQLite (strata.db): farm profile, logs, community posts
  app/engine/climate.py   monthly climate per province × scenario (NASA POWER + CMIP6 deltas)
  app/engine/rotation.py  plan scoring: soil, water, income, resilience, ease + reasons
  app/routers/            /api/meta, /farm, /climate, /plans, /season, /logs, /posts, /chat

frontend/src/
  api.js                  API client: mock (default, in-browser) or remote (FastAPI) via VITE_API_MODE
  mock/                   in-browser stand-in for the backend: same routes + response shapes, localStorage
  context/AppContext.jsx  app state: meta, farm, season, logs, sensor, mode, navigation, chat
  lib/                    date/format helpers, crop-calendar math, weather prototype
  hooks/                  useApi (fetch + refetch on farm change), useSensor (simulated device)
  components/             header, tab bar, sheets, plan cards, UI primitives, speech
  pages/analysis/         SimpleView (farmer home, sky weather) + DetailedView sections
  pages/ChatPage.jsx, pages/CommunityPage.jsx
  index.css               Tailwind v4 theme tokens + shared component classes
```

**Backend owns:** domain data, scoring, persistence, and the AI adviser (Gemini, with an
`evaluate_plans` tool that re-ranks plans for "what if" questions).
**Frontend owns:** rendering, crop-calendar date math, the prototype weather forecast and
the simulated field sensor.

## Prototype stand-ins to replace later
- Weather: generated from climatology (`lib/weather.js`) → PAGASA forecast feed
- Field sensor: simulated (`hooks/useSensor.js`) → device ingest endpoint
- Users: single local user (`db.ME`) → real auth
- Read-aloud / dictation: browser Web Speech APIs (dictation needs Chrome/Safari)
