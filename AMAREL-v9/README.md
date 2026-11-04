# AMARÉL

> A furniture, lighting and décor store with a customer shop, a cash-on-delivery checkout and an owner dashboard.

**Live demo:** https://amarel-shop.vercel.app/
**Owner dashboard:** https://amarel-shop.vercel.app/admin (admin login required)
**Repository:** https://github.com/RAOUNEKK/amarel-full-project

**Student:** Harizi Raounek Nour El Yakine (ENSTA), Systems Security
**Course project:** WAMD TD-TP 3

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project structure](#project-structure)
5. [Run it locally](#run-it-locally)
6. [Environment variables](#environment-variables)
7. [Deployment](#deployment)
8. [API overview](#api-overview)
9. [Security](#security)
10. [What is saved where](#what-is-saved-where)
11. [Limitations](#limitations)

---

## Features

### For customers (no account needed)

- Browse the catalogue of 42 products in three categories: Furniture, Lighting and Décor.
- Search, cart and favourites, kept in the visitor's browser.
- **Guest checkout:** full name, phone, city, delivery address and optional notes. The delivery fee depends on the city, and the form shows the final price (products + delivery).
- Payment is **cash on delivery**. Orders are confirmed by phone. Stock goes down when the order is placed.
- **My orders** page: the orders placed from this browser are remembered, and their status is refreshed from the server using the order id and the phone number given at checkout.

### For the owner (`/admin`)

- Admin-only login (JWT). There is no link to the dashboard for customers.
- Add, edit and delete products, and change stock directly in the table.
- Upload product photos (JPEG, PNG or WebP, 4 MB max). Large photos are shrunk in the browser first, then stored in MongoDB.
- See all orders, guest orders included, with the client's details, the items, the delivery fee and the total.
- Change the status of each order. Cancelling an order puts the items back in stock.
- Orders, revenue and stock refresh automatically every 30 seconds, so there is no need to reload the page.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, TanStack Start (SSR), Redux Toolkit, Tailwind CSS, Vite |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB Atlas |
| Auth | JWT, bcrypt password hashing, optional Google OAuth 2.0 / OpenID Connect |
| Protection | CORS allow-list, rate limiting (express-rate-limit) |
| Hosting | Vercel (frontend), Render (API), MongoDB Atlas (data) |

---

## Architecture

```
  Browser ──▶ Frontend (Vercel) ──HTTPS──▶ API (Render) ──▶ MongoDB Atlas
```

The frontend never talks to MongoDB. It calls the REST API over HTTP, and the API reads and writes the database.

---

## Project structure

```
frontend/             the store (React)
  src/routes/         pages (shop, cart, orders, admin...)
  src/components/     UI components
  src/store/          Redux slices
  src/lib/api.ts      all calls to the backend
  src/data/           delivery prices and the product types
  public/products/    product photos

backend/              the API
  src/routes/         endpoints
  src/controllers/    request handling
  src/models/         Mongoose models (Product, User, Order, Image)
  src/middleware/     auth, rate limiting, error handling
  src/config/         database connection, delivery prices
  seed/               products.json and the seed script
  postman/            Postman collection
```

---

## Run it locally

You need **Node.js 18+** and a **MongoDB Atlas** database.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run seed              # loads the 42 products and creates the admin account
npm run dev               # http://localhost:5000
```

### 2. Frontend (in another terminal)

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000
npm run dev
```

Open the address Vite prints. The shop shows the products from MongoDB.

To reload the catalogue from scratch (this deletes all products first):

```bash
npm run seed:reset
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB Atlas connection string (with the database name, e.g. `/amarel`) |
| `JWT_SECRET` | yes | Long random secret used to sign tokens |
| `JWT_EXPIRES_IN` | no | Token lifetime (default `1d`) |
| `CLIENT_ORIGIN` | in production | Comma-separated list of allowed frontend origins (CORS) |
| `REQUIRE_ADMIN` | no | `true` = only admins can create, update or delete products |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | for seeding | Credentials of the owner account created by `npm run seed` |
| `GOOGLE_CLIENT_ID` | no | Enables Google sign-in |
| `API_RATE_LIMIT`, `LOGIN_RATE_LIMIT`, `ORDER_RATE_LIMIT` | no | Requests per 15 minutes per IP |
| `PORT` | no | Set automatically by most hosts (default `5000`) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL of the backend, with no trailing slash. It is read at build time, so redeploy after changing it. |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Deployment

The project is deployed on three free services.

### 1. Database: MongoDB Atlas

1. Create a free cluster and a database user.
2. Under **Network Access**, allow `0.0.0.0/0` (Render's IP addresses change).
3. Copy the connection string and add the database name before the `?`.
4. Run `npm run seed` once from your computer with `MONGODB_URI` pointing at Atlas.

### 2. Backend: Render (Web Service)

| Setting | Value |
|---|---|
| Root Directory | the folder containing `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |

Environment variables: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `REQUIRE_ADMIN=true`, and `CLIENT_ORIGIN` set to the frontend URL (no trailing slash).

The free tier sleeps when idle, so the first request after a pause can take about 50 seconds.

### 3. Frontend: Vercel

| Setting | Value |
|---|---|
| Root Directory | the folder containing `frontend` |
| Build Command, Output Directory | leave the defaults |
| Environment variable | `VITE_API_URL=<your Render URL>` |

After the first deployment, set `CLIENT_ORIGIN` on Render to the Vercel URL and let it redeploy.

---

## API overview

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Create an account |
| POST | `/api/auth/login` | public (rate limited) | Log in, returns a JWT |
| GET | `/api/auth/me` | logged in | Current user |
| GET | `/api/products`, `/api/products/:id` | public | List or read products |
| POST, PUT, DELETE | `/api/products`, `/api/products/:id` | admin | Manage products |
| GET | `/api/images/:id` | public | Serve an uploaded photo |
| POST | `/api/orders` | public (rate limited) | Place an order (guest or logged in) |
| POST | `/api/orders/lookup` | public | Status of orders by id + phone |
| GET | `/api/orders/mine` | logged in | Orders of the current account |
| GET | `/api/orders` | admin | All orders |
| PATCH | `/api/orders/:id/status` | admin | Change an order's status |
| GET, PUT | `/api/cart`, `/api/favorites` | logged in | Saved cart and favourites |

The backend README has the details: the JWT and OAuth explanation, how checkout works, rate limiting and the testing steps. The Postman collection is in `backend/postman`.

---

## Security

- Passwords are hashed with bcrypt. Authentication uses signed JWTs.
- Admin routes check the user's role on the server, not only in the interface.
- CORS only accepts the origins listed in `CLIENT_ORIGIN` in production.
- Rate limits protect the API in general, the login and the order endpoint.
- Order totals and delivery fees are computed by the server, and stock is checked at order time.
- Never commit `.env`. It is ignored by git, and only the `.env.example` files with placeholders are committed.

---

## What is saved where

- **Database:** products, stock, accounts, cart and favourites (when logged in), orders (guest orders have no account attached), uploaded photos.
- **Browser only:** the session token, a cache of the public catalogue, and the cart and favourites of a visitor who is not logged in.

---

## Limitations

- No online payment (cash on delivery only), no emails, no delivery tracking.
- Delivery prices in `backend/src/config/delivery.js` are not real
- The free hosting tiers sleep when idle, and MongoDB Atlas free is limited to 512 MB, which includes uploaded photos.
