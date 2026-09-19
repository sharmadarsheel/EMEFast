# EMEFast deployment

## Architecture
- Frontend: `frontend-v2` on Vercel
- API: `backend/mock-server.mjs` on Render
- Map: Leaflet + OpenStreetMap, no Google Maps key

## Vercel
1. Import this repository.
2. Use the repository root as the project root. `vercel.json` runs the Next.js build from `frontend-v2`.
3. Set `NEXT_PUBLIC_API_URL` to the Render API URL ending in `/api`.
4. Deploy.

## Render
1. Create a Node Web Service from this repository, or use the included `render.yaml`.
2. Root directory: `backend`.
3. Build: `npm install --omit=dev`.
4. Start: `node mock-server.mjs`.
5. Set `DEMO_MODE=0`. This disables the demo auto-accept behavior so hospitals must explicitly Accept/Decline.
6. Set `CORS_ORIGINS` to the exact Vercel origin, for example `https://your-app.vercel.app`. Multiple origins may be comma-separated.

## Important
This package uses the included Node demo API and JSON/file storage. It is deployment-ready for a connected demo/pilot, not a production clinical deployment. Render's default filesystem may be ephemeral, so persistent case/voice storage needs a managed database/object store before real clinical use. Authentication is also demo-level.

## Location
The frontend never invents an Arya College or other fallback location. Production geolocation requires HTTPS and browser permission. If precise GPS is unavailable, use the manual incident pin.

## Verification
After deployment test `/api/health`, then create an emergency in one browser and confirm the same case appears in hospital view. Accept/Decline from hospital view and confirm the ambulance/medical-operator view updates.
