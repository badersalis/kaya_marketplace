# Admin flow — Opérateur (Super Admin)

Signs in at `/login`. Bound to a **hub** — every order they create inherits it as the corridor's origin.

## 1. Set up your hub (first login only)

**Route:** `/hub-setup`

Kaya guesses a nearby hub from your IP (`GET /geo/detect`) and suggests it. Confirm it, or fill in a new hub's name, city, country, coordinates, timezone, and currency. This is authoritative — detection only pre-fills it, and it's editable any time from the same page (nav: **Mon hub**).

Order creation is blocked (`400`) until this is set.

## 2. Find a product (optional)

**Route:** `/products`

Pick a store (Jumia, Temu, Amazon — logo chips at the top). Results load immediately without typing, using a broad default query so the page shows a general catalog listing to browse; typing and hitting **Rechercher** narrows it down.

Not every store supports keyword search — Temu's search page is a client-rendered SPA with nothing to scrape, and Amazon actively blocks automated requests with a 503 telling you to use their official API. Both are still manageable as stores (logo, domains) and support pasting a direct product link; only keyword browsing is unavailable, and the page says so plainly when you pick one of them.

Click **Réserver** to save an item for later — no customer attached yet. It shows up under **Réservations** (`/reservations`).

## 3. Create the intent

**Route:** `/orders` → **+ Nouvelle intention**, or `/reservations` → **Créer une commande** on a saved item

Fields: customer name, phone, optional email, destination city/country, the product link (pasting it auto-detects the store and pre-fills title/image via `GET /providers/resolve`), quantity, and a rough volume tier. No pricing fields here — sourcing cost and logistics come later.

**On submit:**
- Status: `INTENT_SUBMITTED` → `QUOTING` (automatic — there's no separate admin action between the two)
- A logistics partner is auto-assigned
- Customer gets a "reçue" SMS/email
- Partner gets a quote request — price-free

If created from a reservation, the reservation flips to `CONVERTED` and links to the new order.

## 4. Price it

**Where:** the Quoting Desk inside the order (expand any order card while it's `QUOTING`/`QUOTED`)

Once the partner's logistics quote lands, enter the **coût produit** (what you're paying the reseller) and its currency. Leave **frais plateforme** blank to apply the default rate (`PLATFORM_FEE_PERCENT`, 12% by default), or override it per order.

Once both the product cost and an accepted logistics quote are present, the order advances to `QUOTED` automatically — no button needed for that transition.

## 5. Send the quote

**Button:** Envoyer le devis au client (only enabled once the order is `QUOTED`)

Computes `customerQuoteTotal = productCost + logisticsCost + platformFee` and sends the customer a link to their tokenized quote page (`/q/:token`) by SMS/email. They see only the total.

Status: `QUOTED` → `QUOTE_SENT`.

## 6. Confirm payment

**Button:** Marquer payé

Once the customer accepts (via their link) and pays off-platform (mobile money, transfer), mark it. The partner is notified to get ready.

Status: `QUOTE_SENT` → `PAID`.

## 7. Walk it to the hub

Three sequential actions, each requiring a short note (logged to the order's history):

| Button | Resulting status |
|---|---|
| Marquer acheté | `PURCHASED` |
| Marquer reçu au hub | `RECEIVED_HUB` |
| Confirmer et transmettre au partenaire | `CONFIRMED_HUB` — notifies the partner to collect |

## 8. Correct course, anytime

**Modifier le statut manuellement** — available on every order. Moves it to almost any admin-owned status by hand; a note is always required and every change is written to `OrderStatusHistory`.

One guardrail: you can't mark an order `PURCHASED` while it's still unpaid unless you explicitly check **Forcer même si non payé** (with a note explaining why).

## Other things admins manage

- **Boutiques** (`/stores`) — add/edit stores: name, domains (for link auto-detection), type, default currency, logo, active toggle.
- **Réservations** (`/reservations`) — everything saved from Products that hasn't become an order yet; remove anything no longer needed.
