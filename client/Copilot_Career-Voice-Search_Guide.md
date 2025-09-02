
# Career Exploration — Developer Guide (voice-first)

This document summarizes the current implementation and instructions to run and extend the voice-first Career Exploration page.

Overview
- The app uses a local Express proxy server (in `client/server`) that holds CareerOneStop credentials server-side and forwards selected API calls to the CareerOneStop Web API.
- The frontend is a React + Vite app (`client/`) and calls relative `/api/careers/...` endpoints which are proxied to the Express server in development.
- Voice input uses the browser SpeechRecognition API; short/generic utterances are resolved via the server `/api/careers/careeronestop/resolve/:keyword` endpoint, which returns ranked ONET suggestions.
- Details are fetched lazily when the user expands a card (ONET-first then title fallback).
- The UI keeps recent searches (up to 5) and supports selecting cards for side-by-side comparison.

Key implementation notes
- All CareerOneStop API credentials live server-side in `client/server/.env`. Do not commit credentials.
- Canonical route prefix: `/api/careers/careeronestop/*`. For backward compatibility the server also mounts a legacy path for older clients.
- Server telemetry for failed detail lookups is written as NDJSON to `client/server/404_titles.ndjson` using a structured `appendTelemetry` helper.
- The `/resolve/:keyword` endpoint attempts (in order): heuristics, telemetry lookup, and an upstream title search to return candidate ONET codes and titles. The frontend uses these suggestions to fetch details reliably.

Behavior summary
- Mic-first search: press the mic, speak a short career name (e.g., "nurse", "high school teacher"). The app attempts to resolve the utterance into ONET suggestions and will either automatically add a synthetic result (when a single strong suggestion exists) or show a chooser for multiple suggestions.
- Typed search: debounced 800ms; only triggers when 3+ characters typed.
- Cards: initially show a trimmed summary (title, short description, median salary label). Click "View details" to lazy-load selected detail fields (description, skills, tasks, wages, education, source link).
- Compare: select cards with "Select for comparison" and click "Compare selected" to fetch details in parallel and show a side-by-side summary.

Developer run & preview (local)
1. From the `client/server` folder, start the Express proxy (it reads `client/server/.env`):

```bash
cd client/server
npm install   # if you haven't installed server deps
npm start
```

2. In a separate terminal, from `client/` start the Vite dev server:

```bash
cd client
npm install   # if you haven't installed client deps
npm run dev
```

3. Open the app in your browser at the Vite dev server address (default http://localhost:5173). The Career Exploration page is reachable via the site navigation.

Quick verification endpoints (dev)
- Health: GET http://localhost:5177/api/careers/careeronestop/health → { status: 'ok' }
- Resolve: GET http://localhost:5177/api/careers/careeronestop/resolve/teacher → { suggestions: [...] }
- Search: GET http://localhost:5177/api/careers/careeronestop/search/nurse?limit=8 → JSON array

Notes, extensions and next steps
- Replace the current window.prompt chooser with an in-UI modal for better UX (recommended). The code currently uses a prompt for quick iteration.
- Add an admin route to view recent telemetry entries from `404_titles.ndjson` (useful for mapping generic utterances to ONET codes).
- Consider rotating telemetry files when they grow large.
- Keep `client/refer/` files untouched per project constraint.

QA checklist (current)
- [x] Mic works for speech input (uses browser SpeechRecognition when available).
- [x] Manual text search works; debounced at 800ms and requires 3+ chars.
- [x] Shows search cards and preserves recent queries (up to 5).
- [x] Salary numeric formatting: zero or missing shows as "Unknown" in UI.
- [x] "Find Texas colleges for this career" navigates to College page with state=TX param.

If you want, I will switch the suggestion prompt to an in-app modal and then open the app for you to preview. Otherwise I'll start the servers now and show the verification output.