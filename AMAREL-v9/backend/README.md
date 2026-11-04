# AMARÉL Backend

**Student:** Raounek Nour El Yakine Harizi (ENSTA, Systems Security Engineering)
**Module:** WAMD, TD-TP 3
**Repository:** https://github.com/RAOUNEKK/amarel

## What this is

This is the backend for AMARÉL, the furniture and lighting store I built in React for TD-TP 2. Before this, the 42 products lived inside the frontend code and an admin change only stayed in the browser. Now the products are stored in MongoDB and the React app can get them over HTTP. The backend also handles sign-up, login, account-backed carts and favourites, guest checkout (no account needed), and order history. Cart and favourite changes are stored on the user's MongoDB record, not browser storage. Product mutations and order administration require an administrator account.

## Technologies

- Node.js and Express.js for the REST API
- MongoDB Atlas with Mongoose
- bcryptjs to hash passwords
- jsonwebtoken for JWT
- express-rate-limit
- cors and dotenv
- Postman / Thunder Client for testing

## Folder structure

```
backend/
  src/
    config/database.js
    models/        User.js, Product.js
    controllers/   authController.js, productController.js
    routes/        authRoutes.js, productRoutes.js
    middleware/    authMiddleware.js, rateLimiter.js, errorMiddleware.js
    utils/ApiError.js
    app.js
    server.js
  seed/            seed.js, products.json (the 42 AMARÉL products)
  postman/         AMAREL.postman_collection.json
  .env.example
```

## Database models

**Product**: name, description, price (DA), category (`Furniture`, `Lighting` or `Décor`), imageUrl, stock, badge (optional), bestseller (optional), createdAt/updatedAt.

**User**: name, email (unique), passwordHash, role (`customer` or `admin`), favorites (list of product ids), cart (list of product + quantity), createdAt/updatedAt.

**Order**: user (empty for guest orders), items (product, name, price, image, quantity, copied at purchase time), subtotal, deliveryFee (from the city), total (subtotal + deliveryFee), status (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`), paymentMethod (cash on delivery), shippingAddress (fullName, phone, address, city, notes), createdAt/updatedAt.

The API sends `id` instead of `_id`, and each product also has an `image` field (same value as `imageUrl`) so the React app does not need changes to read it.

## API endpoints

| Method | Endpoint | What it does | Access |
|---|---|---|---|
| POST | /api/auth/register | Create an account | Public |
| POST | /api/auth/login | Log in, returns a JWT | Public (5 tries / 15 min) |
| GET | /api/auth/me | Shows the logged-in user | Token |
| GET | /api/products | All products (`?category=Lighting`, `?bestseller=true`) | Public |
| GET | /api/products/:id | One product | Public |
| POST | /api/products | Create a product | Admin token |
| PUT | /api/products/:id | Update a product | Admin token |
| DELETE | /api/products/:id | Delete a product | Admin token |
| GET | /api/favorites | The logged-in user's favourite product ids | Token |
| PUT | /api/favorites | Save the whole favourites list | Token |
| GET | /api/cart | The logged-in user's cart | Token |
| PUT | /api/cart | Save the whole cart | Token |
| POST | /api/images | Upload a product photo (raw JPEG/PNG/WebP body, 4 MB max) | Admin |
| GET | /api/images/:id | Get an uploaded photo | Public |
| POST | /api/orders | Place an order (checkout). No account needed, a valid token just links the order to the account | Public |
| POST | /api/orders/lookup | Status of orders a guest's browser remembers (`orders: [{ id, phone }]`, only returned when the phone matches) | Public |
| GET | /api/orders/mine | My orders | Token |
| GET | /api/orders/:id | One order (mine, or any if admin) | Token |
| GET | /api/orders | All orders | Admin |
| PATCH | /api/orders/:id/status | Change an order's status | Admin |

Status codes used: 200, 201, 400 (bad input or bad id), 401 (missing/invalid token or wrong credentials), 403 (not admin), 404, 409 (email already used), 429 (rate limit), 500.

Every error has the same shape:

```json
{ "success": false, "message": "Invalid input", "errors": ["price is required"] }
```

## Cart and favourites persistence

A customer must sign in before adding products to the cart or favourites. The frontend reads the account's cart and favourite product IDs from `GET /api/cart` and `GET /api/favorites`. Updates are sent to `PUT /api/cart` and `PUT /api/favorites`. The backend stores these fields on the authenticated MongoDB user document, so they are available after signing in on another browser or device. The frontend only caches the public product catalogue locally; it does not persist account cart/favourite data in localStorage.

## How checkout works

`POST /api/orders` takes `items` (`productId`, `quantity`) and a `shippingAddress` (`fullName`, `phone`, `address`, `city`, optional `notes`). The city must be one in `src/config/delivery.js`; its delivery fee is added to the products total on the server, so the browser can't change the price. Orders are rate limited per IP (`ORDER_RATE_LIMIT`, default 10 per 15 min). The server:

1. ignores any price sent by the client and reads prices from the database,
2. takes the stock with one atomic update per product (only if enough is left), so two people can't buy the last unit,
3. undoes the stock changes if any line fails (for example one product is sold out, answer `409`),
4. saves the order with a copy of the names and prices (as a guest order when nobody is logged in), then empties the user's cart if there is one.

When an admin sets an order to `Cancelled`, the items go back into stock. A cancelled order can't be changed again. Payment is cash on delivery, no card data is handled.

## How JWT works here

1. The user sends email and password to `POST /api/auth/login`.
2. The password is compared with the bcrypt hash stored in MongoDB.
3. If it matches, the server signs a JWT (with `JWT_SECRET`, valid 1 day by default) and returns it.
4. For protected routes the client sends `Authorization: Bearer <token>`.
5. The `protect` middleware checks the token and loads the user. If it is missing or invalid, the answer is `401`.

The secret is only read from the environment, never written in the code. Passwords are never stored in plain text. Product create/update/delete routes require a user whose database role is `admin`; the admin dashboard also checks this role.

## OAuth 2.0 (Google)

`protect` also accepts a Google OAuth 2.0 access token, so you can test it in Postman or Thunder Client:

1. In Google Cloud Console, create an OAuth client ID and register the redirect URI of your testing tool exactly as it is (for Postman: `https://oauth.pstmn.io/v1/callback`).
2. Put the client ID in `GOOGLE_CLIENT_ID` in `.env`.
3. In Postman, Authorization tab, choose OAuth 2.0, flow Authorization Code (With PKCE).
   - Auth URL: `https://accounts.google.com/o/oauth2/v2/auth`
   - Token URL: `https://oauth2.googleapis.com/token`
   - Scope: `openid email profile`
4. Get the token and call a protected route (for example `GET /api/auth/me`). The server asks Google if the token is valid and creates a customer account for that email the first time. No token or a bad token gives `401`.

## Rate limiting

- All `/api` routes: 100 requests per 15 minutes per IP
- `POST /api/auth/login`: 5 requests per 15 minutes per IP
- Over the limit the API answers `429 Too Many Requests`

To test it, send the login request 6 times in a row. The 6th one returns 429. (You can lower the limits with `API_RATE_LIMIT` and `LOGIN_RATE_LIMIT` in `.env` while testing.)

## Installation

You need Node.js 18 or newer.

```bash
cd backend
npm install
cp .env.example .env     # then edit it
```

### MongoDB and environment variables

1. Create a free cluster on MongoDB Atlas, add a database user, and allow your IP in Network Access.
2. Copy the connection string and add a database name, for example `mongodb+srv://USER:PASSWORD@cluster.mongodb.net/amarel`.
3. Fill in `.env`:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_secret
CLIENT_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:8080
```

A good secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

`.env` is in `.gitignore` and must never be committed. Only `.env.example` (placeholders) goes on GitHub.

### Load the products

```bash
npm run seed          # inserts the 42 products if the collection is empty
npm run seed:reset    # wipes products and inserts them again
```

If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `.env`, the seed also creates an admin account.

### Run

```bash
npm run dev     # with nodemon
npm start       # plain node
```

The API is at `http://localhost:5000`. Open `/api/products` to check it.

## Admin account

Role-based access control: a role (`customer` or `admin`) is stored on each account and read from the database on every request. Registration always creates customers (a `role` sent by the browser is ignored), so the admin is created by the seed script from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`. The admin sees all orders and changes their status (always enforced: `401` without a valid token, `403` for a customer), and the owner dashboard in the frontend only opens for the admin.

Product create/update/delete routes always require an administrator account and return `403` for customers. Create the administrator account through the seed script using `ADMIN_EMAIL` and `ADMIN_PASSWORD`; public registration cannot assign the admin role.

## Testing

Import `postman/AMAREL.postman_collection.json` in Postman or Thunder Client. Run "Login" first, the token is saved in a variable and used by the protected requests. The collection covers register, duplicate email, valid and invalid login, all product operations, missing/invalid token, invalid id and missing fields, then favourites, cart and the whole order flow (create, my orders, admin list, status change, cancel). For the admin requests, run `npm run seed` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` set and put that password in the "Login as admin" request.

## Connecting the React app

Already done in this project (see `../frontend`). The shop loads products from `GET /api/products` when it starts, and the admin page (`/admin`) asks you to log in or register, then creates, edits, deletes and changes stock through the API with the token in the `Authorization` header. If the backend is down, the shop falls back to the local product list so the page still opens.
