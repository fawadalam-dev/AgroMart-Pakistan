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

## Deploy on Vercel

Import this repository into Vercel. Vercel will use `npm run build`, publish `dist`, and expose the backend through `api/index.js`.

Add these Vercel Environment Variables for Production:

- `VITE_API_URL=/api`
- `MONGODB_URI=<your MongoDB Atlas connection string>`
- `MONGODB_DB=agromart`
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

Products, orders, and users are stored in MongoDB. The old `server/data.json` file is imported automatically on first startup when the MongoDB collections are empty. Authentication passwords are hashed with bcrypt and login returns a JWT token.

All browser app state is routed through the MongoDB-backed `/api/state` API. The browser no longer persists app data in its native local storage.

Copy `.env.example` to `.env` before deployment and replace the JWT secret and admin password with private values.

For social login, create OAuth apps in Google Cloud Console and Meta for Developers. Add their client ID/secret values to `.env`, then register these callback URLs with each provider:

- Google: `http://localhost:4000/api/auth/google/callback`
- Facebook: `http://localhost:4000/api/auth/facebook/callback`

Set `CLIENT_URL` to the frontend URL and `API_PUBLIC_URL` to the public backend URL in production.

The Atlas URI must use the real database password instead of `<db_password>`. If the password contains characters such as `@`, `:`, `/`, or `#`, URL-encode it first. Add the finished URI to Vercel Environment Variables as `MONGODB_URI`; never commit the password to GitHub.

