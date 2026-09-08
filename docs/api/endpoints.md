# VELOOP Rewards — Complete API Reference & Specification

## Base URL
- **Local Development**: `http://localhost:5000/api`
- **Production**: `https://api.veloop.io/api`

---

## 1. System & Health Endpoints

### `GET /health`
Returns service uptime, environment, and MongoDB database connection status.
- **Authentication**: None (Public)
- **Response 200 OK**:
```json
{
  "success": true,
  "message": "VELOOP Giveaway API is healthy",
  "data": {
    "uptime": 248.1,
    "timestamp": "2026-09-08T12:00:00.000Z",
    "database": "connected"
  }
}
```

---

## 2. Public Giveaway Endpoints

### `GET /giveaways/current`
Returns active and featured giveaway pools accepting entries.
- **Authentication**: None (Public)
- **Response 200 OK**: Array of sanitized Giveaway objects.

### `GET /giveaways/previous`
Returns concluded and finalized giveaway pools.
- **Authentication**: None (Public)
- **Response 200 OK**: Array of completed Giveaway objects.

### `GET /giveaways/stats`
Returns platform aggregate statistics (active pools, total participants, total winners, total prize value).
- **Authentication**: None (Public)
- **Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "activeGiveawaysCount": 3,
    "totalParticipants": 15420,
    "totalWinners": 24,
    "totalRetailValue": 450000
  }
}
```

### `GET /giveaways/:idOrSlug`
Retrieves detailed metadata, prize specifications, eligibility rules, and countdown timestamps for a specific giveaway pool.
- **Authentication**: None (Public)
- **Parameters**: `idOrSlug` (MongoDB ObjectId or unique string slug)
- **Response 200 OK**: Single populated Giveaway object.

---

## 3. Public Winner Endpoints

### `GET /giveaways/:id/winners`
Returns the finalized, privacy-masked winner roster for a concluded giveaway pool.
- **Authentication**: None (Public)
- **Parameters**: `id` (Giveaway ObjectId or slug)
- **Privacy Guarantee**: Omits all phone numbers, email addresses, shipping addresses, claim data, and fraud/audit records.
- **Response 200 OK**:
```json
{
  "success": true,
  "message": "Giveaway winners retrieved",
  "data": [
    {
      "userId": "user_priya",
      "userHandle": "priya_m",
      "maskedUserId": "pr***@veloop.io",
      "prizeName": "iPhone 15 Pro - Natural Titanium (128GB)",
      "rank": 1,
      "drawnAt": "2026-09-06T10:00:00.000Z",
      "claimStatus": "CLAIMED",
      "statusLabel": "Claim Submitted (Under Review)",
      "entryFeePaid": "250 VEs",
      "txHash": "0x8f2a...9c14"
    }
  ]
}
```

### `GET /giveaways/previous/winners`
Returns recent verified winners across all historical completed pools.
- **Authentication**: None (Public)
- **Query Params**: `?limit=10` (Default: 20)
- **Response 200 OK**: Array of sanitized Winner objects.

---

## 4. Authenticated Participation Endpoints

### `GET /giveaways/:id/my-status`
Returns the authenticated user's participation status and ticket reference for a giveaway.
- **Authentication**: Bearer JWT (Required)
- **Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "userState": "PARTICIPANT",
    "isParticipating": true,
    "entryCount": 1,
    "joinedAt": "2026-09-07T14:30:00.000Z",
    "transactionRef": "TX-A1B2C3D4E5"
  }
}
```

### `POST /giveaways/:id/join`
Enters the authenticated user into an active giveaway pool, deducting the authoritative entry fee from their wallet.
- **Authentication**: Bearer JWT (Required)
- **Headers**: `Idempotency-Key` (Optional, recommended for network retry protection)
- **Body**: `{ "idempotencyKey": "..." }`
- **Security Invariant**: Fee amount and currency are determined solely by the database; client-supplied amounts or currencies are discarded.
- **Response 200 OK**:
```json
{
  "success": true,
  "message": "Successfully joined giveaway pool",
  "data": {
    "giveawayId": "6a9f...",
    "entryAmount": 250,
    "entryCurrency": "VEs",
    "remainingBalance": 1250,
    "transactionRef": "TX-9F8E7D6C5B"
  }
}
```

---

## 5. Authenticated Prize Claim Endpoints

### `GET /giveaways/:id/my-claim`
Determines whether the authenticated user is a drawn winner for the specified pool and returns their authoritative claim lifecycle status.
- **Authentication**: Bearer JWT (Required)
- **Response 200 OK (Winner)**:
```json
{
  "success": true,
  "data": {
    "isWinner": true,
    "canClaim": true,
    "giveawayId": "6a9f...",
    "giveawaySlug": "iphone-15-pro-august",
    "giveawayTitle": "Apple iPhone 15 Pro (August Pool)",
    "prizeName": "iPhone 15 Pro - Natural Titanium (128GB)",
    "prizeType": "PHYSICAL",
    "prizeImage": "/assets/prizes/iphone-15-pro.png",
    "claimType": "PHYSICAL_DELIVERY",
    "winnerRank": 1,
    "drawnAt": "2026-09-06T10:00:00.000Z",
    "claimDeadline": "2026-09-20T10:00:00.000Z",
    "isExpired": false,
    "claimStatus": "UNCLAIMED",
    "fulfillmentStatus": "NOT_SUBMITTED",
    "userFacingStatus": "NOT_SUBMITTED",
    "claim": null
  }
}
```
- **Response 200 OK (Non-Winner)**:
```json
{
  "success": true,
  "data": {
    "isWinner": false,
    "canClaim": false,
    "giveawayId": "6a9f...",
    "giveawaySlug": "iphone-15-pro-august",
    "claim": null,
    "message": "No winning record found for the authenticated user."
  }
}
```

### `POST /giveaways/:id/claim`
Submits prize fulfillment information for an authenticated winner.
- **Authentication**: Bearer JWT (Winner Only)
- **Physical Delivery Payload (`PHYSICAL_DELIVERY`)**:
```json
{
  "fullName": "Priya Sharma",
  "phone": "+919876543210",
  "addressLine1": "456 MG Road, Koregaon Park",
  "addressLine2": "Flat 302",
  "city": "Pune",
  "state": "Maharashtra",
  "postalCode": "411001"
}
```
- **Gift Card Payload (`GIFT_CARD_CODE`)**:
```json
{
  "email": "priya@veloop.io"
}
```
- **Security Invariant**: Client-supplied `userId`, `winnerId`, `claimId`, `prizeId`, `claimType`, `deadline`, and `status` are stripped.
- **Response 200 OK**:
```json
{
  "success": true,
  "message": "Prize claim submitted successfully",
  "data": {
    "claimId": "6a9f...",
    "giveawayId": "6a9f...",
    "claimType": "PHYSICAL_DELIVERY",
    "status": "PENDING_REVIEW",
    "userFacingStatus": "SUBMITTED",
    "submittedAt": "2026-09-08T12:30:00.000Z"
  }
}
```

---

## 6. Protected Admin Endpoints

### `POST /admin/giveaways/:id/select-winners`
Executes backend-authoritative CSPRNG winner selection for an ended giveaway pool.
- **Authentication**: Bearer JWT (`role: 'ADMIN'` required)
- **Security Invariants**:
  - Requires status `ENDED` (or `COMPLETED` during crash-recovery).
  - Uses `crypto.randomInt` (CSPRNG) with Fisher-Yates shuffle.
  - Winner count is strictly bounded by `Giveaway.winnerCount`.
  - Client-supplied winner IDs or counts in body/query are completely discarded.
  - Immutable `AuditLog` record created with admin identity and CSPRNG method metadata.
- **Response 200 OK**:
```json
{
  "success": true,
  "message": "Winner selection finalized successfully",
  "data": {
    "giveawayId": "6a9f...",
    "winnerCount": 1,
    "selectionMethod": "CRYPTO_RANDOM",
    "finalizedAt": "2026-09-08T12:00:00.000Z",
    "winners": [
      {
        "userId": "user_priya",
        "userHandle": "priya_m",
        "maskedUserId": "pr***@veloop.io",
        "prizeName": "iPhone 15 Pro",
        "rank": 1,
        "drawnAt": "2026-09-08T12:00:00.000Z",
        "claimStatus": "UNCLAIMED",
        "statusLabel": "Pending Claim"
      }
    ]
  }
}
```

---

## 7. Authentication & Demo Persona Endpoints

### `POST /auth/demo-login`
Issues a signed JWT token for development demo personas.
- **Disabled in production** unless `ENABLE_DEMO_AUTH=true`.
- **Body**: `{ "userId": "user_alex" }`
- **Response 200 OK**: Returns JWT token and user profile.

### `GET /auth/users`
Lists available development test personas (disabled in production).
- **Authentication**: None

### `GET /auth/me`
Retrieves live profile and authoritative wallet balances for the authenticated session.
- **Authentication**: Bearer JWT (Required)
