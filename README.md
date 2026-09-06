# VELOOP Rewards – Giveaway System

A scalable, production-quality Giveaway System built for VELOOP Rewards. The platform empowers users to enter high-value prize draws (physical hardware, retail vouchers, and digital rewards) using their accrued VELOOP balances (`VEs`, `SVEs`, and `Tokens`).

---

## Current Development Status

> [!IMPORTANT]
> **PHASE 0 FOUNDATION ACTIVE**
>
> This repository currently contains the **Phase 0 architectural foundation**.
> - **Frontend**: Clean project skeleton using Vite + React 18, React Router, CSS Modules, Bootstrap baseline, decoupled service adapter architecture, pure utilities, and placeholder pages.
> - **Data Layer**: Mock/demo giveaway data is utilized for frontend interface prototyping and is isolated behind a dedicated `giveawayService` adapter.
> - **Backend**: Modular Express foundation with non-blocking Mongoose connectivity, resilient `/api/health` monitoring, full Mongoose schema models, and 501-stubbed controller endpoints for upcoming features.
> - **No live business logic** (wallet deduction, winner selection, claim processing) is implemented in this phase.

---

## Goals
- Provide a seamless, gamified giveaway experience aligned with VELOOP's premium reward ecosystem.
- Build an enterprise-grade backend resilient to race conditions, double-spend, and traffic spikes.
- Maintain high security, fraud resistance, and immutable auditability for every entry, winner draw, and prize claim.
- Support diverse prize categories: Physical Goods, Gift Cards, and Digital Rewards.

---

## Planned Features (Upcoming Phases)
- **Giveaway Discovery & Landing**: Real-time live, upcoming, and past giveaway carousels with dynamic countdowns.
- **Detailed Giveaway Showcase**: Comprehensive rule breakdown, prize specs, entry fee calculations, and live participant counters.
- **Multi-Currency Entry Flow**: Seamless participation modal validating balances across `VEs`, `SVEs`, and `Tokens`.
- **Fair & Auditable Winner Selection**: Cryptographically verifiable random draw engine with seed generation and audit records.
- **Two-Tier Prize Claim Portal**:
  - **Physical Items**: Multi-step delivery address collection, PIN code validation, and fulfillment tracking.
  - **Amazon / Retail Vouchers**: Instant digital claim codes, OTP verification, and resend workflows.
- **Fraud Mitigation**: Velocity limiters, device fingerprinting, and risk scoring.

---

## Technology Stack

### Frontend
- **Framework & Core**: React 18 (JavaScript/JSX), Vite
- **Routing**: React Router DOM (v6)
- **Styling**: Vanilla CSS Modules with VELOOP Custom Property Design System, Bootstrap 5 baseline
- **Icons**: Lucide React
- **HTTP Client**: Axios (configured via API adapter)
- **Linting**: ESLint (Flat Config)

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database & ODM**: MongoDB with Mongoose (8.x)
- **Security & Headers**: Helmet, CORS, Express rate-limiting foundation
- **Logging**: Morgan
- **Linting**: ESLint

---

## Project Structure

```
veloop-giveaway/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/             # Header, Footer, navigation
│   │   │   └── giveaway/           # Giveaway domain cards & widgets (upcoming)
│   │   ├── data/
│   │   │   ├── constants.js        # Enums: PRIZE_TYPES, USER_STATES, CURRENCIES
│   │   │   └── giveawayData.js     # Structured mock data (isolated)
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── pages/
│   │   │   ├── Giveaway/           # Landing page placeholder
│   │   │   ├── GiveawayDetails/    # Details page placeholder
│   │   │   └── NotFound/           # 404 page
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx       # Route registry
│   │   ├── services/
│   │   │   ├── adapters/           # mockGiveawayAdapter & apiGiveawayAdapter
│   │   │   ├── apiClient.js        # Axios instance
│   │   │   └── giveawayService.js  # Decoupled consumer service
│   │   ├── styles/
│   │   │   ├── variables.css       # Design tokens & color palettes
│   │   │   ├── global.css          # Resets, Inter font, baseline typography
│   │   │   └── App.module.css
│   │   ├── utils/
│   │   │   ├── currencyFormatter.js
│   │   │   ├── countdown.js
│   │   │   ├── userMasker.js
│   │   │   ├── validators.js
│   │   │   └── statusHelpers.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── config/                 # db.js, env.js
│   │   ├── controllers/            # healthController, giveawayController (501 stubs)
│   │   ├── middleware/             # errorHandler, rateLimiter
│   │   ├── models/                 # All 8 Mongoose Schema Skeletons
│   │   ├── routes/                 # healthRoutes, giveawayRoutes, index.js
│   │   ├── services/               # giveawayEngine (stub)
│   │   ├── utils/                  # responseHelper.js
│   │   ├── validators/             # giveawayValidator.js (stub)
│   │   ├── app.js                  # Express app initialization
│   │   └── server.js               # Server bootstrap & graceful shutdown
│   ├── eslint.config.js
│   ├── package.json
│   └── .env.example
│
├── docs/
│   ├── architecture/
│   │   └── overview.md
│   ├── api/
│   │   └── endpoints.md
│   └── screenshots/
│       └── .gitkeep
│
├── .gitignore
├── .env.example
├── README.md
└── package.json
```

---

## Frontend Architecture

The frontend follows a strictly decoupled service-adapter pattern:

```
[ UI Components (GiveawayPage, DetailsPage) ]
                       │
                       ▼
            [ giveawayService.js ]
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
[ mockGiveawayAdapter ]     [ apiGiveawayAdapter ] (Axios)
         │                           │
         ▼                           ▼
  giveawayData.js              Backend REST API
```

- Components **never** import raw `giveawayData.js` directly.
- As the project advances to Phase 1, switching to live backend endpoints requires updating the adapter configuration without refactoring UI components.
- Component styling utilizes isolated CSS Modules (`*.module.css`) to prevent style leaks.

---

## Backend Architecture

The backend implements a modular, layered Node.js/Express architecture:

1. **Config Layer**: Validates environment variables (`env.js`) and manages non-blocking Mongoose connection state (`db.js`).
2. **Middleware Pipeline**: Security headers (`helmet`), cross-origin policies (`cors`), request logging (`morgan`), and global error handling (`errorHandler.js`).
3. **Route Registry**: Versioned `/api` router dispatching to dedicated sub-routers.
4. **Controller Stubs**: In Phase 0, all planned business endpoints return HTTP `501 Not Implemented` with standardized JSON error envelopes.
5. **Data Models**: Clean Mongoose schema foundations ready for complex transactions in later phases.

---

## Giveaway Data Model

Each giveaway item contains lifecycle-ready fields:

```javascript
{
  id: "giveaway-iphone-15-pro",
  slug: "iphone-15-pro",
  title: "Apple iPhone 15 Pro (128GB)",
  description: "Experience titanium design, A17 Pro chip, and pro-grade camera system.",
  prize: "iPhone 15 Pro - Natural Titanium",
  prizeType: "PHYSICAL", // PHYSICAL | GIFT_CARD | DIGITAL
  prizeImage: "/assets/prizes/iphone-15-pro.png",
  entry: {
    currency: "VEs",    // VEs | SVEs | Tokens
    amount: 250
  },
  status: "ACTIVE",     // DRAFT | UPCOMING | ACTIVE | ENDED | COMPLETED
  startsAt: "2026-09-01T00:00:00.000Z",
  endsAt: "2026-09-30T23:59:59.000Z",
  participantCount: 1420,
  winnerCount: 1,
  eligibility: "Verified VELOOP tier 1+ users",
  terms: "One entry per user. KYC verification required for physical delivery.",
  claimType: "PHYSICAL_DELIVERY"
}
```

---

## User States

The system establishes a normalized user state enum:
- `VISITOR`: Unauthenticated user exploring giveaways.
- `LOGGED_IN_NOT_PARTICIPATING`: Authenticated user with eligible balance who has not entered yet.
- `PARTICIPANT`: Authenticated user who has successfully joined the active giveaway.
- `WINNER`: Verified winner with pending or fulfilled prize claim.
- `NON_WINNER`: Participant whose entry was not drawn after giveaway completion.
- `ENDED`: Giveaway concluded.
- `UPCOMING`: Giveaway scheduled for future entry.

---

## Local Development

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (optional for Phase 0; backend runs gracefully in offline mode)

### 1. Install Dependencies
```bash
# Install root, frontend, and backend dependencies
npm run install:all
```

### 2. Configure Environment Files
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Run Development Servers
```bash
# Run Frontend (Vite on http://localhost:5173)
npm run client

# Run Backend (Express on http://localhost:5000)
npm run server
```

### 4. Run Linting
```bash
# Run ESLint across frontend and backend
npm run lint
```

---

## Environment Variables

### Root / Backend (`backend/.env`)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Express server port |
| `NODE_ENV` | `development` | Runtime environment |
| `MONGO_URI` | `mongodb://localhost:27017/veloop_giveaway` | MongoDB connection string |
| `JWT_SECRET` | - | Authentication token secret |
| `REFRESH_SECRET` | - | Refresh token secret |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Target backend API base URL |

---

## Future API Integration

The frontend service layer is pre-structured to consume the following REST endpoints in upcoming phases:
- `GET /api/giveaways/current`
- `GET /api/giveaways/:idOrSlug`
- `GET /api/giveaways/previous`
- `GET /api/giveaways/:id/my-status`
- `POST /api/giveaways/:id/join`
- `GET /api/giveaways/:id/winners`
- `POST /api/giveaways/:id/claim`
- `GET /api/giveaways/:id/my-claim`

---

## Security Principles (Planned for Backend Phase)
- **ACID Transactions**: Atomic wallet deduction and entry insertion via MongoDB sessions.
- **Idempotency Keys**: Request deduplication on all balance-affecting operations.
- **Privacy Masking**: Public winner endpoints mask identifiers (`su***@gmail.com`, `98****1234`).
- **Rate Limiting**: Tiered endpoint throttling against automated bot entries.

---

## Responsive Design
- Mobile-first breakpoints using CSS custom properties.
- Touch-friendly action surfaces and accessible contrast ratios (WCAG 2.1 AA compliant).

---

## Testing
- **Lint Checks**: ESLint configured for React Hooks, JSX, and ES modules (`npm run lint`).
- **Health Verification**: `/api/health` validation under both connected and disconnected database states.

---

## Deployment
- Deployment-ready directory segregation for containerized deployment (Docker / Cloud Run / Vercel / Railway).

---

## Screenshots
*(Screenshots will be added during Phase 1 UI implementation in `docs/screenshots/`)*

---

## License / Project Notes
Confidential & Proprietary – VELOOP Rewards. For internal development and evaluation only.
