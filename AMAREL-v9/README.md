# AMARÉL

**Student:** Raounek Nour El Yakine Harizi (ENSTA)
**Repository:** https://github.com/RAOUNEKK/amarel

AMARÉL is a furniture, lighting and décor store. The frontend is React + TypeScript (TanStack Start, Redux Toolkit, Tailwind) and the backend is a REST API with Node.js, Express and MongoDB (WAMD TD-TP 3).

```
frontend/   the store (React)
backend/    the API (Express, MongoDB, JWT, rate limiting)
```

The frontend never talks to MongoDB. It calls the API over HTTP, and the API reads and writes the database.

## How to run it

You need Node.js 18+ and a MongoDB Atlas database.

**1. Backend**

```bash
cd backend
npm install
cp .env.example .env      # fill in MONGODB_URI and JWT_SECRET
npm run seed              # loads the 42 products
npm run dev               # http://localhost:5000
```

**2. Frontend** (in another terminal)

```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:5000
npm run dev
```

Open the address Vite prints. The shop shows the products from MongoDB.

- Anyone can browse, fill a cart and **place an order without signing in**. Customers have no accounts and no login: the cart and favourites are kept in the visitor's browser, and orders are confirmed by phone. The orders a visitor places are remembered in the same browser and shown on the **My orders** page (package icon in the header, and in the cart drawer); their status is refreshed from the server using the order id + the phone number typed at checkout.
- **Order confirmation** asks for the full name, phone number, city, delivery address and optional notes. The delivery fee depends on the city, and the form shows the full final price (products + delivery). Payment is cash on delivery. Stock goes down when the order is placed.
- The **owner dashboard** is at `/admin` (there is no link to it for customers; open the address directly). Only the admin account can log in there. It manages products and stock and shows all orders (guest orders too) with everything the client entered in the confirmation form: name, phone, city, address, notes, the items, the delivery fee and the total. The admin changes the status of each order. Cancelling an order puts the items back in stock.
- When adding or editing a product, the admin can **upload a photo** (JPEG, PNG or WebP). Big photos are shrunk in the browser first, then stored in MongoDB and served by the API at `/api/images/<id>` (upload is admin-only, viewing is public, 4 MB max).
- **Delivery prices** are in `backend/src/config/delivery.js` (copy in `frontend/src/data/delivery.ts`, keep both the same). The amounts there are placeholders, set your real prices.

To get an admin account, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` before running `npm run seed`, then log in with them.

The backend README has the endpoints, the JWT and OAuth explanation, how checkout works, rate limiting and the testing steps. The Postman collection is in `backend/postman`.

## What is saved where

- Database: products, stock, accounts, cart and favourites (when logged in), orders (guest orders have no account attached).
- Browser only: authentication session token/user metadata, a cache of the public product catalogue, and the cart/favourites of a visitor who is not logged in (deleted when they log in or out).
- Not included: online payment (it is cash on delivery), emails, delivery tracking.

## Security

Never commit `.env`. It is ignored by git. Only the `.env.example` files with placeholders are committed.
