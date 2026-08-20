# Customer flow — Client

No account, no login. Everything happens over a phone number, an email address, and one unguessable link (`quoteToken`).

## 1. Get the "reçue" message

An SMS/email confirming the request landed, sent the moment the admin creates the intent (`INTENT_SUBMITTED` → `QUOTING`).

## 2. Open the quote link

**Route:** `/q/:token` — public, no authentication

Shows the product photo, quantity, the hub → destination route, and **one total**. No breakdown of product cost vs. margin vs. shipping — the public serialization (`serializeOrderForCustomer`) only ever includes `customerQuoteTotal`.

## 3. Accept or decline

Two buttons on the quote page:

- **Accepter** — doesn't change the order's status by itself. It flags the admin (in-app + email) to follow up on payment, since payment is confirmed by the admin off-platform in v1.
- **Refuser** — moves the order straight to `DECLINED`. Terminal; the admin gets no further action prompt for this order.

## 4. Get the delivery text

The same link keeps working after a decision. Once the admin marks the order paid and walks it through fulfillment, and the partner marks it delivered, reopening the link (or the original SMS) reflects `DELIVERED`.

## What the customer never sees

- Product cost (what the operator paid the reseller)
- Platform fee
- The logistics partner's itemized quote
- Any margin math — only the final total, at every stage
