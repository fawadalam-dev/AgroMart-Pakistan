# AgroMart - Home

Minimal Vite + React scaffold with a Home page and top navigation.

Run:

```bash
npm install
npm run dev
```
# AgroMart Pakistan

## Run the app

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Start the backend API in a second terminal:

```bash
npm run server
```

Farmer land records use OpenStreetMap for map tiles and Open-Meteo geocoding for Pakistan location search. No Google Maps API key is required.

The backend stores users, products, orders, and app state in `server/data.json`. No database server or cloud credentials are required. Keep a backup of this file because it contains the app's local data.

The frontend runs at `http://localhost:5173` and the API runs at `http://localhost:4000`.

## Deploy on Vercel

Import this repository into Vercel. Vercel will use `npm run build`, publish `dist`, and expose the backend through `api/index.js`.

The JSON file is suitable for local development only. Vercel's serverless filesystem is ephemeral, so changes to `server/data.json` are not durable between deployments or function instances. Use a persistent database service if you need production data storage.

Add these Vercel Environment Variables for OAuth and authentication:

- `VITE_API_URL=/api`
- `JWT_SECRET=<long random secret>`
- `ADMIN_EMAIL=<admin email>`
- `ADMIN_PASSWORD=<admin password>`
- `ADMIN_NAME=<admin display name>`
- `CLIENT_URL=https://<your-vercel-domain>`
- `API_PUBLIC_URL=https://<your-vercel-domain>`

Add Google/Facebook OAuth callback URLs using the Vercel domain:

- `https://<your-vercel-domain>/api/auth/google/callback`
- `https://<your-vercel-domain>/api/auth/facebook/callback`

Backend checks:

- `GET /api/health`
- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/orders`
- `POST /api/orders`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/reset-password`

Products, orders, users, and browser app state are stored in `server/data.json`. Authentication passwords are hashed with bcrypt and login returns a JWT token.

All browser app state is routed through the `/api/state` API and saved in the JSON file. The browser no longer persists app data in its native local storage.

Copy `.env.example` to `.env` before deployment and replace the JWT secret and admin password with private values.

For social login, create OAuth apps in Google Cloud Console and Meta for Developers. Add their client ID/secret values to `.env`, then register these callback URLs with each provider:

- Google: `http://localhost:4000/api/auth/google/callback`
- Facebook: `http://localhost:4000/api/auth/facebook/callback`

Set `CLIENT_URL` to the frontend URL and `API_PUBLIC_URL` to the public backend URL in production.

