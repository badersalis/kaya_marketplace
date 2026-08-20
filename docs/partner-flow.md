# Partner flow — Partenaire logistique

Signs in at `/login`, lands on `/deliveries`. Never sees `productCost`, `platformFee`, or the customer's total — enforced by the API's response shape, not by hiding fields in the UI.

## 1. Check incoming requests

**Route:** `/deliveries`

Every order sitting at `QUOTING` is a request for a logistics quote. Expand it to see the **price-free** view: product name, quantity, volume tier, and the hub → destination route. No product cost, no fee, no total.

## 2. Submit an itemized quote

Add line items (e.g. Transport, Manutention) with amounts and a currency; the total sums as you go. Optional note field.

Submitting creates (or updates) the order's `LogisticsQuote`. If the admin has already entered the product cost, the order advances to `QUOTED` automatically the moment your quote lands. Resubmitting before it's sent to the customer revises the same quote in place.

## 3. Wait for the handoff

Once the admin walks the order through purchase and hub receipt and confirms it's ready, you're notified — in-app, email, and SMS.

Status you're waiting for: `CONFIRMED_HUB`.

## 4. Run the shipping leg

Three buttons, strictly in order — no skipping, no going back:

| Button | From | To |
|---|---|---|
| Marquer pris en charge | `CONFIRMED_HUB` | `PICKED_UP` |
| Marquer en route | `PICKED_UP` | `IN_TRANSIT` |
| Marquer livré | `IN_TRANSIT` | `DELIVERED` |

Marking it delivered sends the customer a notification. This is the only status range the partner can move an order through — every other transition belongs to the admin.
