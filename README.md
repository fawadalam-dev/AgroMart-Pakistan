# AgroMart Pakistan

## Run locally

Install dependencies and start the website:

```bash
npm install
npm run dev
```

The current frontend still stores its data in this browser's local storage. Data is not shared between browsers or devices and can be cleared by the browser. Use **Settings → Download ZIP backup** regularly. Keep backup ZIP files private because they may contain account and farm information.

Checkout currently supports **Cash on Delivery only**. Online card, Easypaisa, JazzCash, and bank payments are not processed; connecting a merchant payment gateway is required before enabling them. Orders are also saved only in the current browser and are not submitted to the API, so this checkout is not yet a live order-taking service. Delivery is Rs 200 below Rs 10,000 and free at or above Rs 10,000; the Rs 50 cash collection fee is shown in the order total.

To restore a backup, open **Settings → Restore from ZIP** and select an AgroMart backup. The app can restore both its browser ZIP backups and the archived legacy `server/data.json` backup.

On the next app load, a one-time cleanup removes all non-admin accounts and their saved profile data, along with existing orders, carts, favorites, and reviews from that browser. Admin accounts and products are kept. Because data is browser-local, each browser profile is cleaned the first time it loads the updated app.

Every new non-admin AgroMart account is a unified user account: users can shop, place orders, save favorites, write reviews, and use the Farmer Dashboard without separate customer or farmer accounts. Existing customer/farmer roles are migrated to the unified `user` role.

## Deployment

The app and Express API can be deployed to Vercel with a hosted PostgreSQL database such as Neon. Local development uses SQLite by default; setting `DATABASE_URL` switches the API to PostgreSQL.

### Local development

Set `JWT_SECRET` in `.env` to a random value of at least 32 characters. The local SQLite database is created at `data/agromart.sqlite`; set `SQLITE_DB_PATH` to use another file. Start the API with:

```powershell
npm run server:dev
```

If you forget the admin password, stop the API and run `npm run admin:reset-password` from the project folder. Enter the existing admin email, then enter and confirm a new password (at least 12 characters; password input is hidden). This changes only that admin's password and keeps the account and products. Start the API again after the command completes.

To change the admin email, run `npm run admin:change-email` from the project folder and enter the current admin email followed by the new email. This changes only the admin email and keeps the password, account, and products.

### Deploy to Vercel with Neon PostgreSQL

1. Create a PostgreSQL database using the Neon integration in the Vercel Marketplace, or create a Neon project directly. Copy its pooled PostgreSQL connection string; keep it private.
2. Before deploying, back up the local `data/agromart.sqlite` file and stop the local API. Add `DATABASE_URL` to the project `.env` with the hosted connection string, then run `npm run db:migrate:postgres`. The command copies local users (including password hashes) and products into an empty PostgreSQL database in one transaction. Product fields are stored in typed SQL columns, with section/image lists stored as JSONB. If `SQLITE_DB_PATH` points to a different file, set it in `.env` too. It refuses to overwrite a non-empty destination; it does not delete or alter the SQLite source.
3. Import the project into Vercel. In **Project Settings → Environment Variables**, set `DATABASE_URL`, `JWT_SECRET` (a unique random value of at least 32 characters), and `ADMIN_SETUP_KEY` (a separate random secret). Set `VITE_API_URL` to `/api` for Production and Preview, then redeploy so Vite builds the frontend with the correct API URL.
4. Vercel serves the Express API through `api/[...path].js`. Verify the deployment at `/api/health`; it should report PostgreSQL as connected.

Do not put database credentials or server secrets in `VITE_` variables. Do not commit `.env`. Browser-local orders, carts, favorites, and profile data are not stored in SQLite and are not included in this migration. Vercel Functions have request-size limits; large base64 product images may need object storage before uploading them through the live API.

The API provides `POST /api/auth/register`, `POST /api/auth/login`, one-time `POST /api/auth/admin-setup`, and `GET /api/health`. Product routes include `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PUT /api/products/:id`, `PATCH /api/products/:id/status`, and `DELETE /api/products/:id`. Public product reads return approved products only. Product writes and the `?status=all` listing require an administrator bearer token. Create the first admin with the setup key from `.env`; disable/remove `ADMIN_SETUP_KEY` after setup.

The website's registration/login forms and shop's product list use the API; admin product create/edit/delete actions save to the configured SQL database. To use Thunder Client in VS Code, install the Thunder Client extension, import `thunder-client/AgroMart-API.postman_collection.json`, and use the `AgroMart API` collection. Start the API first. Run **Health check**; create the first administrator once using the configured setup key, then log in and copy the returned `token` into the collection's `token` variable for admin product requests. Change the sample emails, passwords, phone numbers, and product ID to your own test values.

The AI Farmer Assistant can optionally use `VITE_AI_API_URL`, `VITE_AI_API_KEY`, and `VITE_AI_MODEL`; weather information uses Open-Meteo services.

## Data and account limitations

Browser-stored orders, favorites, profile details, and other non-account data are local to the current browser profile and do not sync across devices. The API-backed registration and login require the Express server and configured database to be available. ZIP backups contain private user data; do not publish or send them to others.
