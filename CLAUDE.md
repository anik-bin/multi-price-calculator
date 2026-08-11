@AGENTS.md
# Multi-Rate Pricing Calculator

This file gives Claude Code persistent context for this project. Read it fully
at the start of every session before making changes.

---

## 1. What this project is

This is a take-home assignment (Full Stack Developer role, 3-6 years
experience level, ~6-8 hour estimated scope). A web application where users
create documents with line items, apply per-line discounts and tax rules,
compute totals correctly, and view a summary report for a date range. It
tests careful numeric logic, document lifecycle management, and API
validation — the kind of patterns used in quotes, proposals, and billing
tools. No tax compliance knowledge is required or expected.

### Functional requirements

**Authentication**
- Sign up and log in (email + password is sufficient).
- Each user must only see and modify their own data.

**Documents**
- Fields: Title, Customer, Issue date, Status (`draft` or `finalized`), Line items.
- Each line item has: Description, Quantity (>= 1), Unit price (>= 0),
  optional Discount (fixed amount OR percent — never both), optional Tax
  (percent applied to the line).

**Calculations (server-side only — the client is never the source of truth)**

Per line, in this exact order:
1. Line subtotal = quantity x unit price
2. Apply discount — fixed amount subtracted, OR percent off subtotal (not both)
3. Apply tax percent on the *discounted* line amount (not the raw subtotal)
4. Line total = discounted amount + tax

Document totals:
- Subtotal = sum of (qty x unit price) before discounts
- Total discount = sum of all line discount amounts
- Total tax = sum of all line tax amounts
- Grand total = sum of all line totals

**Rounding policy (decided for this project)**
- Money is stored and calculated as **integer cents** everywhere. No floats,
  no float-based decimal libraries.
- Round to the nearest cent at each intermediate step per line: discount
  amount, then tax amount. Use standard round-half-up.
- Document-level totals are plain sums of the already-rounded per-line
  values, so they always reconcile exactly to the per-line numbers. This
  policy must be stated in the README with the worked example below.

**Verified worked example (must match exactly — use as the calculation
module's core test case):**

| Line | Qty | Unit price | Discount | Tax | Subtotal | Discount amt | After discount | Tax amt | Line total |
|---|---|---|---|---|---|---|---|---|---|
| Widget A | 2 | 100.00 | 10% | 5% | 200.00 | 20.00 | 180.00 | 9.00 | 189.00 |
| Widget B | 1 | 50.00 | — | 5% | 50.00 | 0.00 | 50.00 | 2.50 | 52.50 |
| Service fee | 1 | 200.00 | $20 fixed | — | 200.00 | 20.00 | 180.00 | 0.00 | 180.00 |

Document totals: Subtotal 450.00, Total discount 40.00, Total tax 11.50,
Grand total 421.50 (450 - 40 + 11.50).

**Fixed discount exceeding subtotal**: clamp to the line subtotal (discount
amount cannot make the line negative). Document this choice in the README.

**Document lifecycle**
- `draft`: fully editable — add, edit, remove lines, edit metadata.
- `finalized`: read-only — no edits to lines, amounts, or metadata.
- Endpoint to finalize a draft document.
- Any attempt to edit a finalized document must be rejected by the API with
  a clear, specific error message (not a generic 400).
- Duplicating a finalized document into a new draft is a stretch goal —
  decide and document whether it's supported.

**Summary report**
- Filtered by issue date range.
- Returns: number of documents, sum of grand totals, sum of total tax, sum
  of total discount.

**API**
- REST. CRUD for documents and line items, respecting draft/finalized rules.
- Endpoint to finalize a document.
- Validation with specific, actionable error messages (e.g. "discount
  percent must be between 0 and 100", not "invalid input").

**Stretch goals (optional, lower priority)**
- Duplicate a finalized document into a new draft.
- Finalize validation — reject finalize if any line has quantity <= 0 or
  negative prices.
- Printable view (HTML or PDF) of a document.

### What gets evaluated (keep these in mind for every decision)
- **Correctness** — line and document totals correct for mixed discount/tax.
- **Calculation design** — single shared module, consistent rounding.
- **Lifecycle** — finalized docs immutable via the API, not just the UI.
- **Validation** — specific errors for bad input.
- **Reporting** — summary totals match individual documents in range.
- **Tests** — calculation unit tests are the highest-value test surface.
- **Communication** — README clarity, especially the rounding policy.

---

## 2. Stack

- **Framework**: Next.js (App Router) + TypeScript — single codebase, single
  deploy target, no separate backend/frontend repos or CORS setup.
- **Database**: PostgreSQL, hosted on Neon.
- **ORM**: Prisma.
- **Validation**: zod.
- **Auth**: bcrypt for password hashing, JWT for sessions.
- **Testing**: Jest, focused on the calculation module.
- **Deployment**: Vercel (frontend + API routes), Neon (database).
- **Money handling**: integer cents (`Int` columns in Prisma). Never floats,
  never client-computed totals.

---

## 3. Project structure

```
multi-rate-pricing-calculator/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── app/
│   ├── api/                          # ALL backend routes live here
│   │   ├── auth/
│   │   │   ├── signup/route.ts
│   │   │   └── login/route.ts
│   │   ├── documents/
│   │   │   ├── route.ts              # GET (list), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts          # GET, PATCH, DELETE one doc
│   │   │       ├── finalize/route.ts # POST finalize
│   │   │       └── line-items/
│   │   │           ├── route.ts
│   │   │           └── [lineItemId]/route.ts
│   │   └── reports/
│   │       └── summary/route.ts      # GET with date-range query params
│   ├── (auth)/                       # FRONTEND — Claude Code territory
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/                  # FRONTEND — Claude Code territory
│   │   ├── documents/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   └── reports/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── calc/
│   │   ├── pricing.ts                # CORE calculation module — see rules
│   │   └── pricing.test.ts
│   ├── auth/
│   │   ├── hash.ts
│   │   ├── jwt.ts
│   │   └── session.ts
│   ├── validation/
│   │   ├── document.schema.ts
│   │   └── lineItem.schema.ts
│   ├── db.ts                         # single shared Prisma client instance
│   └── errors.ts
├── types/
│   └── index.ts
├── middleware.ts
├── .env                              # gitignored
├── .env.example                      # committed, no secrets
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
└── CLAUDE.md
```

(If the project does not use a `src/` directory, all paths above are relative
to the repo root as shown. Do not introduce a `src/` layer partway through —
stay consistent with whatever was chosen at project init.)

---

## 4. Working rules — read carefully

**Division of labor:**
- I (Aniket) am writing the backend myself: schema design, the calculation
  module, and the main API route handlers. I ask for help when I'm stuck or
  want a specific feature built for me — I will say so explicitly.
- **You (Claude Code) own the entire frontend.** Work inside `app/(auth)/`
  and `app/(dashboard)/` only, unless I explicitly ask you to touch backend
  code for a specific feature.
- Do not restructure, refactor, or "improve" backend code on your own
  initiative. If something in the backend looks wrong or blocks frontend
  work, flag it to me — don't silently fix it.

**The calculation module (`lib/calc/pricing.ts`) is off-limits by default.**
This is the most heavily evaluated part of the assignment and I am building
and testing it myself. Do not modify, rewrite, or "optimize" it. If the
frontend needs a type or function signature from it, import and use what's
there — don't change it to suit the frontend.

**Non-negotiable technical rules, regardless of which part of the app you're
touching:**
- All monetary calculations happen server-side. The client never computes or
  sends totals — it only sends raw inputs (qty, unit price, discount, tax)
  and displays what the API returns.
- Money is always integer cents in the data layer and calculation logic.
  Convert to/from display format (e.g. "$189.00") only at the UI edge.
- A line's discount is fixed OR percent, never both — enforce this in
  validation, not just the UI.
- Tax is calculated on the post-discount line amount, not the raw subtotal.
- Finalized documents are immutable. Any API call attempting to edit a
  finalized document's lines or metadata must return a clear, specific error
  — this must be enforced in the API route, not just hidden in the UI.
- Every user only sees and modifies their own documents — check ownership
  server-side on every request, not just at the list-view level.
- Validation errors must be specific (e.g. name the field and the rule
  violated), never a generic "invalid request."

**When building frontend features:**
- Call the real API routes under `app/api/` — do not mock or stub data
  unless I explicitly ask for a scaffolding pass before the backend is ready.
- Match whatever request/response shape the API route actually returns. If
  it's unclear or seems inconsistent, ask rather than guessing.
- Keep UI functional and clean over highly polished — this is a take-home
  assignment on a 3-day deadline, not a production product.

---

## 5. Git commit rules

**All commits must use the following author identity — never a Claude or AI
signature, never a co-author line:**

```
Aniket Bindhani <aniketbindhani44@gmail.com>
```

If you (Claude Code) create any commits, configure and use this identity
exactly:

```bash
git config user.name "Aniket Bindhani"
git config user.email "aniketbindhani44@gmail.com"
```

- Do not add `Co-Authored-By: Claude` or any similar AI-attribution trailer
  to commit messages.
- Do not mention Claude, Claude Code, or AI assistance in commit messages.
- Write commit messages as if Aniket wrote the code himself — clear,
  conventional, present-tense (e.g. `Add document finalize endpoint`, not
  `Added` or `Adding`).

---

## 6. Commands

- `npm run dev` — start the Next.js dev server
- `npm test` — run calculation module unit tests
- `npx prisma studio` — inspect the database
- `npx prisma migrate dev` — run a new migration
- `npx prisma generate` — regenerate the Prisma client after schema changes

---

## 7. Current status

*(Update this section as phases complete, so a fresh session knows where the
project actually stands.)*

- [ ] Phase 1 — Project foundation (Next.js + TS init, git, env, folder structure)
- [ ] Phase 2 — Data modeling (Prisma schema: User, Document, LineItem)
- [ ] Phase 3 — Auth (signup/login, session/JWT, ownership checks)
- [ ] Phase 4 — Calculation engine + unit tests (owned by Aniket, do not touch)
- [ ] Phase 5 — Document & line item CRUD API
- [ ] Phase 6 — Lifecycle & validation (finalize, immutability, zod schemas)
- [ ] Phase 7 — Reporting API
- [ ] Phase 8 — Frontend (Claude Code)
- [ ] Phase 9 — Integration pass
- [ ] Phase 10 — Deploy + README