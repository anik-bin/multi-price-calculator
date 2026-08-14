# Multi-Rate Pricing Calculator

A web app for creating documents (quotes/proposals/invoices) with line
items, per-line discounts and tax, correct server-side totals, a
draft/finalized lifecycle, and a summary report over a date range. Built as
a take-home assignment focused on careful numeric logic, document lifecycle
management, and API validation.

**Stack**: Next.js (App Router) + TypeScript, PostgreSQL on Neon, Prisma,
zod for validation, JWT + bcrypt for auth.

## Prerequisites

- Node.js 20+
- A PostgreSQL database (this project was built against [Neon](https://neon.tech))

## Setup

```bash
git clone <this-repo>
cd multi-price-calculator
npm install
```

Copy the example env file and fill in your own values:

```bash
cp .env.example .env
```

| Variable       | Description                                              |
| -------------- | ---------------------------------------------------------- |
| `DATABASE_URL` | Postgres connection string (Neon pooled URL recommended) |
| `JWT_SECRET`   | Long random string used to sign session tokens            |

Run migrations and start the dev server:

```bash
npx prisma migrate dev
npm run dev
```

The app is now at [http://localhost:3000](http://localhost:3000).

Run the calculation module's test suite (the highest-value test surface in
this project):

```bash
npm test
```

## Calculation and rounding policy

All money is stored and calculated as **integer cents** — never floats,
never a float-based decimal library — and all percentages (discount %, tax
%) are stored as **integer basis points** (1 bp = 0.01%, so 10% = 1000 bps).
This avoids floating-point drift entirely: every intermediate value is an
integer, and the only arithmetic operation that can produce a fraction
(`amount * bps / 10000`) is immediately rounded back to an integer cent
before it's used again.

Per line, in this exact order:

1. **Subtotal** = quantity × unit price
2. **Discount** — fixed amount subtracted, or percent off the subtotal
   (never both on the same line — enforced by the line item's zod schema).
   Rounded to the nearest cent (round-half-up) if it's a percent discount.
   A **fixed discount that exceeds the line subtotal is clamped** to the
   subtotal (`Math.min(discountValue, subtotalCents)` in
   `lib/calc/pricing.ts`) — a line's discount can never make it go negative.
3. **Tax** — the tax percent is applied to the **post-discount** amount,
   not the raw subtotal. Rounded to the nearest cent (round-half-up).
4. **Line total** = discounted amount + tax

Document-level totals (subtotal, total discount, total tax, grand total)
are **plain sums of the already-rounded per-line values** — not
recalculated from a document-level rate — so they always reconcile exactly
to the line items shown on screen.

This is implemented in a single module, `lib/calc/pricing.ts`, used by
every API route that creates or edits a line item — the client never
computes or sends a total; it only sends raw inputs (quantity, unit price,
discount, tax) and displays whatever the server returns.

### Worked example (also the calculation module's core test case)

| Line         | Qty | Unit price | Discount    | Tax | Subtotal | Discount amt | After discount | Tax amt | Line total |
| ------------ | --- | ---------- | ----------- | --- | -------- | ------------- | --------------- | ------- | ---------- |
| Widget A     | 2   | 100.00     | 10%         | 5%  | 200.00   | 20.00         | 180.00          | 9.00    | 189.00     |
| Widget B     | 1   | 50.00      | —           | 5%  | 50.00    | 0.00          | 50.00           | 2.50    | 52.50      |
| Service fee  | 1   | 200.00     | $20 fixed   | —   | 200.00   | 20.00         | 180.00          | 0.00    | 180.00     |

**Document totals**: Subtotal $450.00, Total discount $40.00, Total tax
$11.50, Grand total: $421.50 (450 − 40 + 11.50).

This exact table is asserted line-for-line in `lib/calc/pricing.test.ts`,
and is also what renders in the app's line-item table and printable view
when these three lines are entered.

## Finalize / immutability rules

A document is either `DRAFT` or `FINALIZED`:

- **Draft**: fully editable — metadata (title/customer/issue date), and
  line items (add/edit/remove) can all change freely. Every change
  recalculates and re-persists the document's totals server-side.
- **Finalize** (`POST /api/documents/:id/finalize`) is one-way. Before
  flipping the status, it re-validates every line item (rejects with `422`
  if any line has `quantity <= 0` or a negative unit price) — a
  belt-and-suspenders check on top of create/edit validation, since this is
  the last gate before the document becomes immutable.
- **Finalized documents are immutable via the API**, not just hidden
  controls in the UI: `PATCH`/`DELETE` on the document itself, and any
  create/edit/delete on its line items, all return a specific `403` (e.g.
  `"Cannot edit a finalized document"`, `"Cannot add a line item to a
  finalized document"`) rather than a generic `400`.
- **Finalized documents cannot be deleted either** — see [Assumptions and
  tradeoffs](#assumptions-and-tradeoffs) below.

## API overview

All routes are scoped to the authenticated user — ownership is checked on
every request (not just list views), and a document that exists but isn't
yours returns the same `404` as one that doesn't exist at all, so there's
no way to probe for other users' document IDs.

| Method | Route                                       | Description                                    |
| ------ | -------------------------------------------- | ----------------------------------------------- |
| POST   | `/api/auth/signup`                          | Create an account                              |
| POST   | `/api/auth/login`                           | Log in, sets session cookie                    |
| POST   | `/api/auth/logout`                          | Clear session cookie                           |
| GET    | `/api/documents`                            | List your documents                            |
| POST   | `/api/documents`                            | Create a document (starts as `DRAFT`)          |
| GET    | `/api/documents/:id`                        | Get a document with its line items             |
| PATCH  | `/api/documents/:id`                        | Update metadata (draft only)                   |
| DELETE | `/api/documents/:id`                        | Delete a document (draft only)                 |
| POST   | `/api/documents/:id/finalize`               | Finalize a draft                               |
| POST   | `/api/documents/:id/duplicate`              | Duplicate a finalized document into a new draft |
| POST   | `/api/documents/:id/line-items`             | Add a line item (draft only)                   |
| PATCH  | `/api/documents/:id/line-items/:lineItemId` | Edit a line item (draft only)                  |
| DELETE | `/api/documents/:id/line-items/:lineItemId` | Remove a line item (draft only)                |
| GET    | `/api/reports/summary?from=&to=`            | Summary totals over an issue-date range        |

Validation errors are always specific and field-level (e.g. `"discount
percent must be between 0 and 100"`), never a generic `"invalid input"` —
enforced by zod schemas in `lib/validation/`.

## Stretch goals implemented

- **Duplicate a finalized document into a new draft**
  (`POST /api/documents/:id/duplicate`) — only works on a finalized source
  document (`403` otherwise). Copies the line items but never the source's
  cached totals; the new draft's totals are always recomputed by the
  calculation module, same as every other write path.
- **Printable view** (`/documents/:id/print`) — a standalone HTML view
  (no dashboard nav) with a `@media print` stylesheet, reachable only once
  a document is finalized. Users print it or use the browser's native
  "Save as PDF" — this covers both the HTML and PDF options from the
  assignment without a server-side PDF renderer.

Not implemented: finalize-time quantity/price validation is covered above
under Finalize rules, which was the other stretch item listed.

## Assumptions and tradeoffs

- **Money as integer cents / percents as integer basis points**,
  everywhere — database columns, calculation module, API payloads. Dollar
  and percent strings only exist at the UI edge (`lib/format.ts`), purely
  for display and form input.
- **The server is the only source of truth for calculations.** The client
  never computes or sends a total — it sends raw line inputs and renders
  whatever the API returns.
- **Finalized documents are immutable *and* not deletable.** A finalized
  document is treated as a settled record — allowing deletion would let it
  silently vanish from a report it was already counted in. If a finalized
  document needs to change, the intended path is duplicate-into-draft, edit,
  and finalize the copy.
- **The summary report only counts finalized documents.** A draft's totals
  can still change (or the draft can be deleted outright), so including
  drafts would let the report's numbers shift between two loads with
  nothing having actually "happened."
- **Email lookup is case-insensitive** — emails are lowercased and trimmed
  at both signup and login, since Postgres string equality is
  case-sensitive by default and this avoids duplicate-looking accounts or
  users getting locked out by casing.
- **Ownership is enforced at the query level**, not fetched-then-checked —
  every lookup filters by `userId` directly, so a document belonging to
  another user returns `null`/`404` the same way a nonexistent one would.

## What I'd improve before production
- Improve the UI. Right now it just runs on premade templates
- Rate limiting on the auth routes (signup/login currently have none).
- Refresh-token rotation / session revocation — the JWT is a long-lived
  7-day token with no server-side invalidation on logout beyond clearing
  the cookie.
- Pagination on the documents list and the reporting endpoint, both
  currently unbounded.
- An audit log for finalize/duplicate actions.
- Server-side PDF generation for the printable view, instead of relying on
  the browser's print-to-PDF (fine for this scope, but not scriptable /
  automatable for e.g. emailing a PDF).
- Dark-mode theme tokens exist in `app/globals.css` but there's no toggle
  wired up to use them.
- More integration tests on the API routes (auth flow, ownership scoping, immutability rejection)

## Deployed URL

https://multipricecalc.vercel.app
