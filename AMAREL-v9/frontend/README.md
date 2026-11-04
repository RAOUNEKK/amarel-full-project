# AMARÉL — Where Light Meets Living

AMARÉL is a responsive furniture and home décor storefront built with React, TypeScript, TanStack Start, Tailwind CSS, and Redux Toolkit. It talks to the API in `../backend` (set `VITE_API_URL` in `.env`). It includes a cinematic lamp hero, light/dark themes, product discovery, individual product pages, favourites, a shopping cart, and an owner dashboard.

## Features

- Creamy ivory light theme and warm espresso dark theme, with the preference saved locally.
- Animated cinematic homepage with the descending pendant-lamp sequence.
- Shop-by-category, New Arrivals, and curated Best Sellers sections.
- Search, category filters, and sorting.
- Product details routes with image gallery, quantity selector, favourites, and related products.
- Redux-managed cart and catalogue/favourites state.
- Products, cart, favourites and orders come from the backend API (cart and favourites are saved to the account when logged in).
- Responsive navigation, cart drawer, search overlay, and reduced-motion support.
- Customer accounts, a real checkout (cash on delivery, no online payment) and a My orders page.
- Owner dashboard for the admin account: products, stock and orders.

## Run locally

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

## Build and test

```bash
npm run build
npm test
```

## Main technologies

- React + TypeScript
- TanStack Start / TanStack Router
- Redux Toolkit + React-Redux
- Tailwind CSS v4
- Lucide icons
- Sonner toast notifications

## Limitations

Payment is cash on delivery only, there is no online payment, no emails and no delivery tracking. The contact form and newsletter form only validate the input, they do not send anything. Check product details, prices, delivery information and policies before using the site commercially.
