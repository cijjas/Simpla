# Subscription & Rate Limiting System

This module implements a comprehensive subscription tier system with rate limiting for the Simpla backend API.

## Overview

The system consists of three main components:

1. **Subscription Tiers** - Defines available plans (Free, Pro, Enterprise)
2. **User Subscriptions** - Links users to their current subscription tier
3. **Usage Tracking** - Records and enforces rate limits per user

## Database Schema

### Tables Created

#### `subscription_tiers`
- Defines available subscription plans
- Contains rate limits and feature flags
- Fields: `name`, `display_name`, `price_usd`, `max_tokens_per_day`, etc.

#### `user_subscriptions`
- Links each user to their current subscription tier
- Supports custom limits for enterprise customers
- Fields: `user_id`, `tier_id`, `expires_at`, `custom_limits`

#### `user_usage`
- Tracks real-time usage per user per time period
- Used for rate limiting enforcement
- Fields: `user_id`, `period_type`, `tokens_used`, `messages_sent`

## Key Features

### Rate Limiting
- **Daily Token Limits** - Maximum tokens per day
- **Hourly Message Limits** - Maximum messages per hour
- **Daily Message Limits** - Maximum messages per day
- **Monthly Token Limits** - Maximum tokens per month

### Subscription Tiers

#### Free Plan
- 1,000 tokens per day
- 10 messages per day
- 5 messages per hour
- Basic features only

#### Pro Plan ($29/month)
- 10,000 tokens per day
- 100 messages per day
- 20 messages per hour
- Advanced features included

#### Enterprise Plan ($99/month)
- Unlimited tokens and messages
- Custom limits support
- API access
- Dedicated support

## API Endpoints

### `/api/subscription/status`
Get current user's subscription status and usage.

**Response:**
```json
{
  "tier": {
    "name": "free",
    "display_name": "Free Plan",
    "max_tokens_per_day": 1000,
    "max_messages_per_day": 10
  },
  "current_usage": {
    "tokens_today": 150,
    "messages_today": 2
  },
  "limits": {
    "tokens_per_day": 1000,
    "messages_per_day": 10
  }
}
```

### `/api/subscription/upgrade`
Upgrade user to a new subscription tier.

**Request:**
```json
{
  "tier_name": "pro"
}
```

### `/api/subscription/tiers`
Get all available subscription tiers.

## Rate Limiting Integration

The system automatically enforces rate limits on chat endpoints:

1. **Pre-request Check** - Validates limits before processing
2. **Usage Recording** - Tracks actual usage after successful requests
3. **Error Responses** - Returns 429 status with helpful error messages

### Rate Limit Error Response
```json
{
  "error": "Rate limit exceeded",
  "message": "Daily token limit of 1000 exceeded",
  "current_usage": 1000,
  "limit": 1000,
  "reset_at": "2024-01-02T00:00:00Z",
  "upgrade_url": "/pricing"
}
```

## Usage Examples

### Check Rate Limit
```python
from features.subscription.rate_limit_service import RateLimitService

rate_service = RateLimitService(db)
check = await rate_service.check_rate_limit(user_id, estimated_tokens)

if not check.allowed:
    raise HTTPException(429, detail=check.message)
```

### Record Usage
```python
await rate_service.record_usage(user_id, actual_tokens)
```

## Database Migration

Run the migration script to create tables and default tiers:

```bash
cd backend
python scripts/init-subscription-tables.py
```

This will:
1. Create the three subscription tables
2. Insert default subscription tiers
3. Set up proper relationships

## Configuration

### Environment Variables
No additional environment variables are required. The system uses the existing database connection.

### Default Tiers
The system creates three default tiers on initialization:
- Free (0 tokens, basic features)
- Pro (10,000 tokens/day, $29/month)
- Enterprise (unlimited, $99/month)

## Integration Points

### User Registration
- Automatically assigns free tier to new users
- Works for both email and Google OAuth registration

### Chat Endpoints
- Rate limiting integrated into `/api/chat/` endpoint
- Checks limits before processing requests
- Records usage after successful responses

### Authentication
- Requires authenticated users for all subscription endpoints
- Uses existing JWT authentication system

## Monitoring & Analytics

The system tracks:
- Token usage per user per time period
- Message count per user per time period
- Rate limit violations
- Subscription upgrades/downgrades

## Security Considerations

- Rate limits are enforced server-side
- Usage tracking is atomic and consistent
- Custom limits require proper authorization
- All subscription changes are logged

## Future Enhancements

Potential improvements:
- Real-time usage notifications
- Usage analytics dashboard
- Dynamic pricing based on usage
- Billing integration
- Usage prediction and recommendations

