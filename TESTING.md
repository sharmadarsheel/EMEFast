# EMEFast v3 — Verification

## Static checks completed
- Backend Python syntax compilation: PASS
- Hospital matching pure-logic tests: PASS
- ZIP integrity: PASS
- No generated `__pycache__`, `.pyc`, `.db`, `.sqlite`, `.log`, `.next`, or `node_modules` included
- No demo login buttons in production UI
- No hard-coded JWT secret fallback
- No ambulance dispatch API/module

## Runtime checks required on a machine with package-registry access
1. `cd backend && python -m pip install -r requirements.txt`
2. Set `JWT_SECRET` in `.env`.
3. `uvicorn main:app --reload --port 8000`
4. `cd frontend-v2 && npm ci && npm run build && npm run dev`
5. Verify microphone, GPS, hospital responses and audio upload in a real browser.

This environment could not download npm/Python dependencies, so a successful Next.js build and live browser test are not falsely reported as passed.
