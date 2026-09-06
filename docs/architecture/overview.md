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

## 5. Security & Integrity Principles (Planned for Phase 1+)
- **Atomic Entry Processing**: MongoDB ACID multi-document transactions ensuring balance deduction and entry generation execute atomically.
- **Idempotency**: UUID-based idempotency keys on join requests to eliminate double-spend and duplicate participation on network retries.
- **Audit Logging**: Immutable audit logs capturing every balance transition, winner draw seed, and claim resolution.
- **Fraud Engine**: Real-time anomaly detection flagging bot patterns, multi-accounting, and anomalous entry velocities.
