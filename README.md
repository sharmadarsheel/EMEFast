# EMEFast AI v3 — Apple Edition

**Emergency Medical Fast Response System**

A React/Next.js PWA + FastAPI emergency coordination prototype with an Apple-inspired dark/glass visual system.

## Included

- 3-second hold SOS with cancellation and haptic feedback where supported.
- GPS acquisition on emergency creation.
- Real audio recording using the browser `MediaRecorder` API.
- Optional Hindi/English browser speech transcription using Web Speech API.
- Voice recording upload and hospital-side playback attached to the emergency case.
- Hospital capability/resource eligibility gate before recommendation.
- Hospital accept/reject workflow with rejection audit reason.
- Resource reservation with database row locking and 15-minute holds.
- User, hospital and admin dashboards.
- WebSocket realtime endpoint with REST fallback.
- PWA manifest, safe-area viewport and offline shell caching.
- SQLite for local development and PostgreSQL/Neon via `DATABASE_URL`.

## Important production boundaries

This repository does **not** fake platform capabilities:

- A web PWA cannot silently send an SMS to 108. A native bridge or approved messaging provider is required.
- A web PWA cannot render arbitrary Dynamic Island UI.
- Continuous background GPS is not guaranteed on iOS Safari/PWA.
- Real ABDM/ABHA health-record access requires approved credentials, consent artefacts, compliant APIs and deployment controls.
- Local filesystem voice storage is suitable for a prototype; production should use authenticated object storage with encryption, retention and access auditing.

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
python seed.py
python -m uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend-v2
npm ci
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000/api` in `frontend-v2/.env.local`.

## Verification

Run backend preflight:

```bash
cd backend
python verify.py
```

Run the E2E suite after dependencies/database are available:

```bash
python test_emefast_e2e.py
```

Frontend production verification:

```bash
cd frontend-v2
npm ci
npm run build
```

The source package is structured for these checks, but this build environment cannot honestly claim a completed E2E/build run when package dependencies or a database are unavailable.

## EMEFast Light runtime
This package intentionally excludes `node_modules`.
If using the existing Windows dependency installation, `start_emefast.bat` uses:
`C:\Users\GITANSH-PC\Desktop\EMEFast_v3\EMEFast_v3\frontend-v2\node_modules`
without creating a `node_modules` directory inside this Light package.

For manual startup from Git Bash:
```bash
export NODE_PATH="/c/Users/GITANSH-PC/Desktop/EMEFast_v3/EMEFast_v3/frontend-v2/node_modules"
export PATH="/c/Users/GITANSH-PC/Desktop/EMEFast_v3/EMEFast_v3/frontend-v2/node_modules/.bin:$PATH"
cd "/c/Users/GITANSH-PC/Desktop/EMEFast_Light/EMEFast_v3_Apple_Edition_FINAL/frontend-v2"
node "/c/Users/GITANSH-PC/Desktop/EMEFast_v3/EMEFast_v3/frontend-v2/node_modules/next/dist/bin/next" dev -p 3001
```

## V4 UX / location behavior

- Liquid Glass is used primarily for the navigation and interactive control layer; content surfaces remain calmer and more legible.
- Light and dark themes share the same hierarchy and switch without hard-coded dark content backgrounds.
- Emergency location is accepted only when browser device GPS reports an accuracy of 100 m or better. Coarse Wi-Fi/IP estimates are shown as approximate and are not used to open an SOS case.
- The app cannot override Windows/browser location permissions. If precise location is blocked, enable Windows Location and allow precise location for the site in Chrome/Edge, then use Refresh location.
- The SOS button uses pointer capture so a small finger/mouse movement does not cancel the three-second hold.

## V14 map/location notes
- EMEFast now uses Google Maps as the primary map implementation through `GoogleLiveMap`.
- Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `frontend-v2/.env.local`; enable Maps JavaScript API and Directions API and configure billing/restrictions.
- Browser device location still requires a secure context (HTTPS) except localhost. Google Maps does not bypass browser/Windows location permissions.
- `start_emefast_https.bat` starts Next.js with experimental local HTTPS for testing. A browser may ask you to accept the development certificate.
- The map never labels the stored case coordinate as live device GPS. A live blue marker appears only after the browser returns a location.
- The header has a higher stacking context than the map so the map cannot visually overlap it.
- Hospital selection buttons have explicit hit targets and the discovery page is isolated from header pointer layers.


## V15 Working Map
- Uses Leaflet + OpenStreetMap; no Google Maps API key is required.
- Emergency creation and navigation use the same LiveMap component.
- Browser geolocation is used when permission is granted; case coordinates are never relabeled as live device GPS.
- Google Maps API key is not required for local development.

## V16 deployment target
The deployment package uses **`backend/mock-server.mjs` as the active Node API**. This is intentional for the current connected demo/pilot build. The older FastAPI files remain in the repository as legacy/reference code and are **not** the Render start target.

For internet deployment, use the included `render.yaml`, `vercel.json`, `package.json`, and `DEPLOYMENT.md`. Set `NEXT_PUBLIC_API_URL` in Vercel and `CORS_ORIGINS` in Render. Production `DEMO_MODE=0` means hospitals must explicitly accept or decline an emergency.

V16 location behavior: no hard-coded Arya College/device-location fallback. Browser GPS is used only when supplied by the browser; otherwise the operator can place the incident manually on the map.
