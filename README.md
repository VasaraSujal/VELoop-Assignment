# VELOOP Rewards – Giveaway System

A scalable, production-grade Giveaway Platform built for VELOOP Rewards. The platform empowers users to enter high-value prize draws (physical hardware, retail gift cards, and digital vouchers) using their accrued VELOOP balances (`VEs`, `SVEs`, and `Tokens`).

---

## System Overview & Production Architecture

The system is structured into a modular, decoupled architecture:
- **Frontend**: High-performance React 18 + Vite application featuring custom CSS Modules design tokens, accessible dialog modals, live countdown timers, public winner showcases, authenticated claim lifecycle tracking, and responsive layouts across mobile, tablet, and desktop.
- **Backend**: Express.js REST API with Mongoose 8.x ODM, JWT authentication, role-based authorization (`USER` vs `ADMIN`), rate limiting, Helmet security headers, and structured validation.
- **Participation & Ledger**: Authoritative balance deduction, UUID idempotency protection against double-spend, and financial ledger transaction tracking.
- **Winner Finalization**: Administrative CSPRNG winner drawing engine (`crypto.randomInt` / Fisher-Yates shuffle tagged as `CRYPTO_RANDOM`), self-healing crash consistency, and immutable audit logs.
- **Prize Claim Foundation**: Authenticated winner claim submission for physical goods (`PHYSICAL_DELIVERY`) and digital vouchers (`GIFT_CARD_CODE`), status synchronization (`Winner.claimStatus` vs `Claim.status`), configurable 14-day claim windows, and strict PII privacy boundaries.

---

## Technology Stack

### Frontend
- **Framework & Core**: React 18 (JavaScript/JSX), Vite
- **Routing**: React Router DOM (v6)
- **Styling**: Vanilla CSS Modules with VELOOP Design System tokens (`--color-surface`, `--color-primary`, `--radius-*`, `--space-*`), Bootstrap 5 baseline
- **Icons**: Lucide React
- **HTTP Client**: Axios with authenticated JWT request interceptor and centralized error normalizer
- **Linting**: ESLint (Flat Config)

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database & ODM**: MongoDB with Mongoose (8.x)
- **Security & Headers**: Helmet, CORS, Express rate-limiting, CSPRNG randomness (`crypto.randomInt`)
- **Logging**: Morgan, structured AuditLog and FraudEvent models
- **Testing**: Node.js native test runner (`node --test`)
- **Linting**: ESLint

---

## Project Structure

```
veloop-giveaway/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/                 # Official VELOOP prize assets & logos
│   │   ├── components/
│   │   │   ├── common/             # Header, Footer, VeloopLoader
│   │   │   └── giveaway/           # GiveawayCard, JoinModal, PrizeClaimModal, WinnerTabs
│   │   ├── context/                # AuthContext (JWT session & profile state)
│   │   ├── data/                   # Constants, enums, isolated mock fallback
│   │   ├── pages/
│   │   │   ├── Giveaway/           # Landing page with active pools & winner sliders
│   │   │   ├── GiveawayDetails/    # Showcase, winner celebration, claim tracker, specs
│   │   │   └── NotFound/           # 404 page
│   │   ├── routes/                 # AppRoutes registry
│   │   ├── services/
│   │   │   ├── adapters/           # apiGiveawayAdapter & mockGiveawayAdapter
│   │   │   ├── apiClient.js        # Axios instance with Bearer interceptor
│   │   │   └── giveawayService.js  # Unified service interface
│   │   ├── styles/                 # Design tokens & global CSS
│   │   └── utils/                  # Currency formatting, user identity masking
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── config/                 # db.js, env.js
│   │   ├── controllers/            # adminController, authController, giveawayController
│   │   ├── middleware/             # authMiddleware, errorHandler, rateLimiter
│   │   ├── models/                 # UserAccount, Giveaway, Prize, Participation, Winner, Claim, AuditLog, FraudEvent
│   │   ├── routes/                 # adminRoutes, authRoutes, giveawayRoutes, index.js
│   │   ├── scripts/                # seed.js (Demo personas & test giveaways)
│   │   ├── services/               # authService, claimService, fraudService, giveawayEngine, walletService, winnerService
│   │   ├── utils/                  # responseHelper.js
│   │   ├── validators/             # giveawayValidator.js
│   │   ├── app.js                  # Express application setup
│   │   └── server.js               # HTTP bootstrap & graceful shutdown
│   ├── tests/
│   │   └── integration.test.js     # 68 comprehensive backend integration tests
│   ├── package.json
│   └── .env.example
│
├── docs/
│   ├── architecture/
│   │   └── overview.md             # Complete architecture, state machines, and invariants
│   ├── api/
│   │   └── endpoints.md            # REST API reference and request/response schemas
│   └── screenshots/
│
├── README.md
└── package.json
```

---

## Production Database Requirements & Transactional Consistency

> [!IMPORTANT]
> **Production Requirement: MongoDB Replica-Set or Sharded Cluster**
>
> A **Replica-Set or Sharded MongoDB cluster is strictly required in production** for all giveaway financial and claim operations. Multi-document ACID transactions (`session.startTransaction()`) are mandatory to guarantee all-or-nothing atomicity across:
> 1. Wallet balance deduction (`UserAccount.balances`)
> 2. Participation record creation (`GiveawayParticipation`)
> 3. Financial entry transaction ledger creation (`EntryTransaction`)
> 4. Participant count increments and immutable audit logging (`AuditLog`)
> 5. Winner finalization and prize claim state updates (`Claim`, `Winner`)
>
> **Standalone MongoDB Support (Local Development & Offline Testing Only)**:
> Standalone MongoDB instances are supported **exclusively for local development and offline testing** using conditional atomic single-document updates and self-healing status reconciliation.
>
> **Explicit Crash-Safety Notice**:
> The standalone development fallback does **NOT** provide equivalent multi-document ACID crash safety. In standalone mode, if an unexpected process termination occurs between write operations, self-healing idempotency logic reconciles the state upon subsequent read/retry, but true atomic crash consistency requires a replica set in production.

---

## Security & Privacy Invariants

1. **Identity Authority**: The backend derives user identity strictly from the verified JWT session (`req.user.userId`). Client-supplied `userId`, `winnerId`, `claimId`, `prizeId`, `claimType`, or fee amounts in request bodies or query parameters are stripped.
2. **Cryptographic Randomness**: Winner selection uses Node.js CSPRNG (`crypto.randomInt`) with Fisher-Yates shuffling, recorded as `CRYPTO_RANDOM`.
3. **Privacy Boundaries**: Public winner endpoints mask identifiers (`pr***@veloop.io`). Raw PII (`phone`, `addressLine1`, `email`) is never exposed in public endpoints, never stored in browser storage, and never logged in `AuditLog` or `FraudEvent` metadata.
4. **Rate Limiting & Anti-Abuse**: Tiered Express rate limiting guards against automated bots, excessive join velocity, and administrative endpoint brute-forcing.

---

## Local Development & Setup

### 1. Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB instance running on `localhost:27017`

### 2. Installation
```bash
# From the repository root
npm run install:all
```

### 3. Environment Configuration
```bash
# Backend configuration
cp backend/.env.example backend/.env

# Frontend configuration
cp frontend/.env.example frontend/.env
```

### 4. Seed Demo Data
```bash
cd backend
node src/scripts/seed.js
```

### 5. Run Development Servers
```bash
# Start Backend (Port 5000)
cd backend
npm start

# Start Frontend (Port 5173 in a separate terminal)
cd frontend
npm run dev
```

### 6. Run Test Suites & Linting
```bash
# Run backend integration tests (68 tests across 12 suites)
cd backend
npm test

# Run backend ESLint
npm run lint

# Run frontend ESLint & Production Build
cd frontend
npm run lint
npm run build
```

---

## License / Notes
Confidential & Proprietary – VELOOP Rewards. Developed for technical assessment and production implementation.
