# AgroMart Pakistan

## Run locally

Install dependencies and start the website:

```bash
npm install
npm run dev
```

The app stores its data in this browser's local storage. Data is not shared between browsers or devices and can be cleared by the browser. Use **Settings → Download ZIP backup** regularly. Keep backup ZIP files private because they may contain account and farm information.

To restore a backup, open **Settings → Restore from ZIP** and select an AgroMart backup. The app can restore both its browser ZIP backups and the archived legacy `server/data.json` backup.

On the next app load, a one-time cleanup removes all non-admin accounts and their saved profile data, along with existing orders, carts, favorites, and reviews from that browser. Admin accounts and products are kept. Because data is browser-local, each browser profile is cleaned the first time it loads the updated app.

Every new non-admin AgroMart account is a unified user account: users can shop, place orders, save favorites, write reviews, and use the Farmer Dashboard without separate customer or farmer accounts. Existing customer/farmer roles are migrated to the unified `user` role.

## Deployment

The frontend can be deployed as a static Vite site. Vercel builds with `npm run build` and publishes the `dist` directory. No database or custom backend API environment variables are required.

The AI Farmer Assistant can optionally use `VITE_AI_API_URL`, `VITE_AI_API_KEY`, and `VITE_AI_MODEL`; weather information uses Open-Meteo services. These are external service integrations, separate from AgroMart's removed database/backend.

## Data and account limitations

Browser storage is local to the current browser profile. Accounts do not sync across devices, and browser-only authentication is intended for a local/single-device app, not a public production service. ZIP backups contain private user data; do not publish or send them to others.
