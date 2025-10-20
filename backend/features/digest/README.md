# Weekly Digest Feature

## Overview

The weekly digest feature automatically generates and distributes personalized summaries of legal norms (normas) published each week. It uses AI to create concise summaries and filters content based on user preferences.

## Architecture

### Components

1. **Models** (`digest_models.py`):
   - `DigestWeekly`: Stores weekly digest reports
   - `DigestUserPreferences`: Stores user filtering preferences

2. **Service** (`digest_service.py`):
   - Fetches normas from the database for a given week
   - Filters irrelevant or empty normas
   - Generates AI summaries for each norma
   - Creates a consolidated weekly article
   - Filters normas per user based on preferences

3. **Email Service** (`digest_email_service.py`):
   - Sends personalized digest emails to users
   - Uses Resend API for email delivery
   - Beautiful HTML email templates

4. **Routes** (`digest_routes.py`):
   - `POST /api/digest/trigger/`: Trigger digest generation
   - `GET /api/digest/preferences/`: Get user preferences
   - `PUT /api/digest/preferences/`: Update user preferences
   - `GET /api/digest/weekly/`: List past digests
   - `GET /api/digest/weekly/{id}/`: Get specific digest
   - `GET /api/digest/weekly/latest/`: Get latest digest

## How It Works

### Weekly Digest Generation Flow

1. **Fetch Normas**: 
   - Retrieves all normas published between Monday and Friday of the target week
   - Uses `publicacion` date for filtering

2. **Filter Relevant Normas**:
   - Removes normas without content (priority: `purified_texto_norma_actualizado` > `purified_texto_norma` > `texto_resumido` > `texto_norma_actualizado` > `texto_norma`)
   - Removes normas without titles (priority: `titulo_resumido` > `titulo_sumario`)
   - Removes normas without publication dates

3. **Generate Summaries**:
   - Each norma is processed through an LLM (Gemini/Claude/OpenAI)
   - Generates a 100-200 word summary highlighting key points
   - Processes in batches of 5 to avoid API rate limits

4. **Create Weekly Article**:
   - Consolidates all summaries into a comprehensive weekly report
   - Groups normas by themes and categories
   - 400-600 word professional article

5. **Store in Database**:
   - Saves the digest to `digest_weekly` table
   - Includes metadata: week dates, total normas, article text, and JSON data

6. **Send Personalized Emails**:
   - Fetches all verified users
   - Filters normas based on each user's preferences
   - Sends customized email with relevant summaries
   - Uses beautiful HTML templates

## API Endpoints

### Trigger Digest Generation

```bash
POST /api/digest/trigger/
```

**Request Body**:
```json
{
  "week_start": "2025-10-13",  // Optional: Monday of the week
  "week_end": "2025-10-17"     // Optional: Friday of the week
}
```

**Response**:
```json
{
  "success": true,
  "message": "Weekly digest generated successfully with 25 normas",
  "digest_id": "123e4567-e89b-12d3-a456-426614174000",
  "emails_sent": 150
}
```

### Get User Preferences

```bash
GET /api/digest/preferences/
Authorization: Bearer <token>
```

**Response**:
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "filter_options": {
    "tipo_norma": ["LEY", "DECRETO"],
    "dependencia": ["MINISTERIO DE SALUD"],
    "titulo_sumario": ["educación", "salud"]
  }
}
```

### Update User Preferences

```bash
PUT /api/digest/preferences/
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "filter_options": {
    "tipo_norma": ["LEY", "DECRETO", "RESOLUCIÓN"],
    "dependencia": ["MINISTERIO DE SALUD", "MINISTERIO DE EDUCACIÓN"],
    "titulo_sumario": ["educación", "salud", "impuestos"]
  }
}
```

### List Weekly Digests

```bash
GET /api/digest/weekly/?limit=10&offset=0
```

**Response**:
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "week_start": "2025-10-13",
    "week_end": "2025-10-17",
    "article_summary": "Resumen de la semana...",
    "total_normas": 25,
    "article_json": {
      "normas": [...]
    },
    "created_at": "2025-10-17T18:00:00Z"
  }
]
```

### Get Latest Digest

```bash
GET /api/digest/weekly/latest/
```

Returns the most recent weekly digest.

## Database Schema

### digest_weekly

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| week_start | DATE | Monday of the week |
| week_end | DATE | Friday of the week |
| created_at | TIMESTAMP | Creation timestamp |
| article_summary | TEXT | Consolidated weekly article |
| total_normas | INTEGER | Number of normas in digest |
| article_json | JSONB | Full norma summaries as JSON |

**Unique Constraint**: `(week_start, week_end)`

### digest_user_preferences

| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | Foreign key to users table (primary key) |
| filter_options | JSONB | User's filtering preferences |

## Filter Options

Users can filter digests by:

- **tipo_norma**: Array of norma types (e.g., `["LEY", "DECRETO"]`)
- **dependencia**: Array of dependencies (e.g., `["MINISTERIO DE SALUD", "MINISTERIO DE EDUCACIÓN"]`)
- **titulo_sumario**: Array of keywords to match in the titulo_sumario (e.g., `["educación", "salud", "impuestos"]`)

Empty or missing preferences = receive all normas.

## Scheduling

To run the digest automatically every Friday:

### Option 1: Cron Job

```bash
# Run every Friday at 6 PM
0 18 * * 5 curl -X POST http://localhost:8000/api/digest/trigger/
```

### Option 2: Task Scheduler (e.g., APScheduler)

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import httpx

async def trigger_digest():
    async with httpx.AsyncClient() as client:
        await client.post("http://localhost:8000/api/digest/trigger/")

scheduler = AsyncIOScheduler()
scheduler.add_job(trigger_digest, 'cron', day_of_week='fri', hour=18)
scheduler.start()
```

### Option 3: Cloud Scheduler (GCP, AWS EventBridge, etc.)

Configure your cloud provider's scheduler to call the endpoint every Friday.

## Environment Variables

Required:
- `RESEND_API_KEY`: API key for Resend email service
- `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY`: For AI summarization
- `DATABASE_URL`: PostgreSQL connection string
- `FRONTEND_SITE_URL`: Frontend URL for email links

Optional:
- `EMAIL_FROM`: Sender email address (default: `no-reply@simplar.com.ar`)

## AI Provider Configuration

The digest uses the AI service configured via `AI_PROVIDER` environment variable:

- `gemini` (default): Google Gemini
- `claude`: Anthropic Claude
- `openai`: OpenAI GPT

## Error Handling

- **No normas found**: Creates empty digest with message
- **AI generation fails**: Falls back to `texto_resumido` field
- **Email send fails**: Logs error but continues with other users
- **Duplicate digest**: Returns existing digest for the week

## Performance Considerations

- **Batch Processing**: Summaries generated in batches of 5 to avoid API rate limits
- **Concurrent Generation**: Uses `asyncio.gather()` for parallel processing
- **Content Truncation**: Long normas truncated to 8000 chars to avoid token limits
- **Connection Pooling**: Reuses database connections efficiently

## Monitoring

Key logs to monitor:

```python
logger.info(f"Starting weekly digest generation for {week_start} to {week_end}")
logger.info(f"Found {len(normas)} normas for the week")
logger.info(f"Filtered to {len(filtered)} relevant normas")
logger.info(f"Generated {len(summaries)} summaries")
logger.info(f"Sent {emails_sent} digest emails to users")
```

## Testing

### Manual Trigger

```bash
curl -X POST http://localhost:8000/api/digest/trigger/ \
  -H "Content-Type: application/json" \
  -d '{
    "week_start": "2025-10-13",
    "week_end": "2025-10-17"
  }'
```

### Test User Preferences

```bash
# Get preferences
curl -X GET http://localhost:8000/api/digest/preferences/ \
  -H "Authorization: Bearer <token>"

# Update preferences
curl -X PUT http://localhost:8000/api/digest/preferences/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "filter_options": {
      "tipo_norma": ["LEY"]
    }
  }'
```

## Future Enhancements

Potential improvements:

1. **Email Preferences**: Allow users to opt-out of emails
2. **Frequency Options**: Weekly, bi-weekly, or monthly digests
3. **Custom Schedules**: Let users choose their preferred day/time
4. **Digest Analytics**: Track open rates, click-through rates
5. **Rich Content**: Add charts, graphs, statistics to emails
6. **Push Notifications**: Mobile app notifications for new digests
7. **RSS Feed**: Generate RSS feed from digests
8. **Social Media**: Auto-post digest highlights to social media

## Troubleshooting

### Digests not generating

- Check AI service is configured and API keys are valid
- Verify database connection is working
- Ensure normas exist for the target week

### Emails not sending

- Verify `RESEND_API_KEY` is set
- Check user has `email_verified = true`
- Review Resend dashboard for delivery status

### Poor summary quality

- Adjust prompts in `digest_service.py`
- Try different AI provider
- Increase/decrease summary length constraints

## Support

For issues or questions, contact the development team or refer to the main Simpla documentation.

