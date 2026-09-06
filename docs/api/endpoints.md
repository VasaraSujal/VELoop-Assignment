# VELOOP Rewards - API Specification

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://api.veloop.io/api`

## Health & System Status

### GET `/health`
Returns system status, service uptime, and database connection state.

- **Phase 0 Status**: Implemented & Functional
- **Response 200 OK**:
```json
{
  "success": true,
  "message": "VELOOP Giveaway API is healthy",
  "data": {
    "uptime": 124.5,
    "timestamp": "2026-09-06T08:15:00.000Z",
    "database": "not_connected"
  }
}
```

---

## Giveaway Endpoints (Planned Specification)

> [!NOTE]
> All giveaway business endpoints below return HTTP `501 Not Implemented` in Phase 0.

### 1. GET `/giveaways/current`
Retrieve the currently featured / live giveaways.

### 2. GET `/giveaways/:idOrSlug`
Retrieve detailed metadata, rules, prize info, and countdown timestamps for a single giveaway.

### 3. GET `/giveaways/previous`
Retrieve completed past giveaways with published winner summaries.

### 4. GET `/giveaways/:id/my-status`
*Requires Authentication*. Returns the authenticated user's participation status (`visitor`, `logged-in-not-participating`, `participant`, `winner`, `non-winner`).

### 5. POST `/giveaways/:id/join`
*Requires Authentication & Idempotency Header*. Deducts entry currency fee and records participation.

### 6. GET `/giveaways/:id/winners`
Returns the verified winner roster for a completed giveaway with privacy-masked identifiers.

### 7. POST `/giveaways/:id/claim`
*Requires Authentication (Winner only)*. Submits shipping address (physical prizes) or verified email/phone (digital/gift-card prizes).

### 8. GET `/giveaways/:id/my-claim`
*Requires Authentication (Winner only)*. Returns current fulfillment status and tracking details for a submitted claim.
