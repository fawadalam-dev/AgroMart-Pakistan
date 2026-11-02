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

The frontend can be deployed as a static Vite site. Vercel builds with `npm run build` and publishes the `dist` directory. The Express API is a separate service and requires Node.js and MongoDB.

To run the API locally with MongoDB Atlas:

1. Create an Atlas project/cluster and a database user with a strong password.
2. In Atlas **Network Access**, allow your current IP address. Avoid `0.0.0.0/0` for a public deployment.
3. Choose **Connect → Drivers**, copy the Node.js connection URI, and replace its database name with `agromart`. Add the URI to `MONGODB_URI` in `.env`. URL-encode special characters in the database user's password.
4. Copy `.env.example` to `.env` if needed, then replace the example `JWT_SECRET` and `ADMIN_SETUP_KEY` with different, unique random secrets. Keep `.env` private and never use frontend `VITE_` variables for secrets.

Then run:

```bash
npm run server:dev
```

The API provides `POST /api/auth/register`, `POST /api/auth/login`, one-time `POST /api/auth/admin-setup`, and `GET /api/health`. Product routes include `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PUT /api/products/:id`, `PATCH /api/products/:id/status`, and `DELETE /api/products/:id`. Public product reads return approved products only. Product writes and the `?status=all` listing require an administrator bearer token. Create the first admin with the setup key from `.env`; disable/remove `ADMIN_SETUP_KEY` after setup.

The website's registration/login forms and the shop's product list now use the API; admin product create/edit/delete actions save to MongoDB. Existing browser-local accounts and products are not automatically migrated; create accounts again through the API and add shared products through the admin dashboard. Existing orders, favorites, profile details, and other account features are still browser-local. To use Thunder Client in VS Code, install the Thunder Client extension, import `thunder-client/AgroMart-API.postman_collection.json`, and use the `AgroMart API` collection. Start the API first. Run **Health check**; create the first administrator once using the configured setup key, then log in and copy the returned `token` into the collection's `token` variable for admin product requests. Change the sample emails, passwords, phone numbers, and product ID to your own test values.

The AI Farmer Assistant can optionally use `VITE_AI_API_URL`, `VITE_AI_API_KEY`, and `VITE_AI_MODEL`; weather information uses Open-Meteo services.

## Data and account limitations

Browser-stored orders, favorites, profile details, and other non-account data are local to the current browser profile and do not sync across devices. The API-backed registration and login require the Express server and MongoDB to be available. ZIP backups contain private user data; do not publish or send them to others.
