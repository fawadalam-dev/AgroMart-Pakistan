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

The backend requires MongoDB Community Server running locally. Its default connection is `mongodb://127.0.0.1:27017`, using the `agromart` database. Install MongoDB Community Server for Windows, start the MongoDB service, then run `npm run server`.

The frontend runs at `http://localhost:5173` and the API runs at `http://localhost:4000`.

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

Products, orders, and users are stored in MongoDB. The old `server/data.json` file is imported automatically on first startup when the MongoDB collections are empty. Authentication passwords are hashed with bcrypt and login returns a JWT token.

All browser app state is routed through the MongoDB-backed `/api/state` API. The browser no longer persists app data in its native local storage.

Copy `.env.example` to `.env` before deployment and replace the JWT secret and admin password with private values.

For social login, create OAuth apps in Google Cloud Console and Meta for Developers. Add their client ID/secret values to `.env`, then register these callback URLs with each provider:

- Google: `http://localhost:4000/api/auth/google/callback`
- Facebook: `http://localhost:4000/api/auth/facebook/callback`

Set `CLIENT_URL` to the frontend URL and `API_PUBLIC_URL` to the public backend URL in production.

