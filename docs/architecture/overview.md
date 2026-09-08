# VELOOP Rewards - Giveaway System Architecture Overview

## 1. System Vision
VELOOP Rewards Giveaway System is a high-trust, scalable gamification platform enabling users to participate in curated prize pools (physical hardware, digital gift cards, token rewards) using their earned reward balances (`VEs`, `SVEs`, and `Tokens`).

## 2. High-Level Architecture

```
[ Frontend: React + Vite ]
         │
         ▼
[ Service Layer & Adapters ] (Mock Adapter in Phase 0 -> Axios API Adapter in Phase 1)
         │
         ▼ (REST API)
[ API Gateway & Security Middleware ] (Express, Helmet, Rate Limiter, CORS)
         │
         ▼
[ Modular Controllers & Request Validators ]
         │
         ▼
[ Giveaway Engine & Transaction Layer ] (Idempotency, Balance Locks, State Machines)
         │
         ▼
[ Mongoose ODM & MongoDB Database ]
```

## 3. Core Domain Entities & Relationships

```
┌─────────────┐       1:1       ┌─────────────┐
│   Prize     │ ◄────────────── │  Giveaway   │
└─────────────┘                 └─────────────┘
                                       │ 1:N
                                       ├───────────────────────────┐
                                       ▼                           ▼
                        ┌────────────────────────┐   ┌───────────────────────────┐
                        │ GiveawayParticipation  │   │          Winner           │
                        └────────────────────────┘   └───────────────────────────┘
                                       │ 1:1                       │ 1:1
                                       ▼                           ▼
                        ┌────────────────────────┐   ┌───────────────────────────┐
                        │    EntryTransaction    │   │           Claim           │
                        └────────────────────────┘   └───────────────────────────┘
```

## 4. Giveaway Lifecycle States

| State | Description | User Actions Permitted |
|---|---|---|
| `DRAFT` | Created by admin, hidden from public view | Admin edit only |
| `UPCOMING` | Publicly visible with countdown timer | View details, set reminder |
| `ACTIVE` | Open for user participation | Join giveaway with currency balance |
| `ENDED` | Participation closed; winner selection queued | View entry confirmation, view countdown to draw |
| `COMPLETED` | Winners drawn and published | Winners submit claims; participants view results |
| `CANCELLED` | Aborted due to operational / administrative reason | Balance refunds processed |

## 5. Security & Integrity Principles

### 5.1 Production Database Architecture & Multi-Document Consistency
- **Production Requirement: MongoDB Replica-Set or Sharded Cluster**:
  A **Replica-Set or Sharded MongoDB cluster is strictly required in production** for all giveaway financial and participation operations. Multi-document ACID transactions (`session.startTransaction()`) are mandatory to guarantee crash-consistent atomicity across:
  1. Wallet balance deduction (`UserAccount.balances`)
  2. Participation record creation (`GiveawayParticipation`)
  3. Financial entry transaction ledger creation (`EntryTransaction`)
  4. Participant count increments and immutable audit logging (`AuditLog`)
- **Local Development Support (Standalone Fallback)**:
  Standalone MongoDB instances are supported **exclusively for local development and offline testing** using conditional atomic single-document updates (`$inc` guarded by `$gte` balance filters).
- **Explicit Crash-Safety Notice**:
  The standalone development fallback does **NOT** provide equivalent multi-document ACID crash safety. In standalone mode, if a server crash, process termination, or unhandled infrastructure disruption occurs after the balance deduction but prior to participation record insertion, a balance deduction can persist without creating the corresponding entry and audit records. True multi-document transactional crash safety requires a replica set in production.

### 5.2 Idempotency & Concurrency Protections
- **Idempotency**: UUID-based idempotency keys on join requests to eliminate double-spend and duplicate participation on network retries.
- **Audit Logging**: Immutable audit logs capturing every balance transition, winner draw seed, and claim resolution.
- **Fraud Engine**: Real-time anomaly detection flagging bot patterns, multi-accounting, and anomalous entry velocities.

## 6. Winner Finalization & Prize Claim Architecture (Phase 3)

### 6.1 Backend Authority & Winner Verification
- Winner finalization is triggered exclusively by authenticated administrators via `POST /api/admin/giveaways/:id/select-winners` utilizing Node.js CSPRNG (`crypto.randomInt`, Fisher-Yates shuffle tagged as `CRYPTO_RANDOM`).
- Prize claim submission (`POST /api/giveaways/:id/claim`) and status lookup (`GET /api/giveaways/:id/my-claim`) derive identity strictly from the authenticated JWT session (`req.user.userId`). Client-supplied `userId`, `winnerId`, `claimId`, `prizeId`, `claimType`, or deadline overrides are stripped.

### 6.2 Claim Types & Schema Validation
- **Physical Delivery (`PHYSICAL_DELIVERY`)**: Requires structured shipping destination (`fullName`, `phone`, `addressLine1`, `city`, `state`, `postalCode`).
- **Gift Card Voucher (`GIFT_CARD_CODE` / `DIGITAL_CREDIT`)**: Requires validated delivery `email`.

### 6.3 Claim Status Separation & User-Facing Mapping
- `Winner.claimStatus`: Represents winner claim lifecycle (`UNCLAIMED`, `CLAIMED`, `FULFILLED`, `EXPIRED`).
- `Claim.status`: Represents operational fulfillment lifecycle (`PENDING_REVIEW`, `PROCESSING`, `DISPATCHED`, `DELIVERED`, `REJECTED`).
- **User-Facing Mapping**:
  - `UNCLAIMED` (no claim) → `NOT_SUBMITTED`
  - `EXPIRED` → `EXPIRED`
  - `PENDING_REVIEW` → `SUBMITTED`
  - `PROCESSING` → `PROCESSING`
  - `DISPATCHED` → `DISPATCHED`
  - `DELIVERED` / `FULFILLED` → `COMPLETED`
  - `REJECTED` → `REJECTED`

### 6.4 Configurable Claim Window
- Prize claim eligibility is governed by a configurable deadline: `drawnAt + CLAIM_WINDOW_DAYS` (default: 14 days; configurable via `process.env.CLAIM_WINDOW_DAYS` as development/demo setting).
- Claims submitted past the authoritative deadline transition the winner record to `EXPIRED` and reject submission with HTTP 400 `CLAIM_EXPIRED`.

### 6.5 Concurrency & Duplicate Protection
- Compound unique index on `Claim` (`{ giveawayId: 1, userId: 1 }` and `{ winnerId: 1 }`) prevents duplicate claims and race conditions. Repeated requests return the existing claim idempotently.
- In production Replica Sets, multi-document ACID transactions guarantee all-or-nothing consistency across `Claim`, `Winner`, and `AuditLog`. Standalone development environments use atomic persistence with rollback and unique index guards.

### 6.6 Privacy & PII Boundaries
- Raw PII (`phone`, `addressLine1`, `email`) is strictly omitted from `AuditLog` metadata, `FraudEvent` records, and public winner endpoints. Public endpoints expose only privacy-masked identifiers (`su***@gmail.com`).
