# Conversations API

A professional FastAPI backend for legal RAG chatbot conversations with session-based context management.

## Features

- **Session-based conversations** with full message history
- **Two chat types**: `normativa_nacional` and `constituciones`
- **AI provider abstraction** with Gemini implementation (extensible to Claude, OpenAI)
- **Real-time streaming** responses using Server-Sent Events
- **Soft deletes** for conversations and messages
- **Token tracking** and cost estimation
- **Automatic snippet/title generation**
- **Pagination** for conversation lists

## API Endpoints

### 1. GET `/api/conversations/`
Get paginated list of conversations.

**Query Parameters:**
- `limit` (int, default: 20, max: 100): Number of conversations to return
- `offset` (int, default: 0): Number of conversations to skip
- `chat_type` (optional): Filter by chat type (`normativa_nacional` or `constituciones`)
- `is_archived` (bool, default: false): Filter by archived status

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Sample conversation",
      "chat_type": "normativa_nacional",
      "snippet": "First message preview...",
      "create_time": "2025-01-30T13:02:15.952405Z",
      "update_time": "2025-01-30T13:02:22.125903Z",
      "is_archived": false,
      "total_tokens": 150
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0,
  "has_more": true
}
```

### 2. POST `/api/conversations/`
Create a new conversation.

**Request Body:**
```json
{
  "title": "Optional title",
  "chat_type": "normativa_nacional",
  "system_prompt": "Optional custom system prompt"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Optional title",
  "chat_type": "normativa_nacional",
  "snippet": null,
  "created_at": "2025-01-30T13:02:15Z",
  "updated_at": "2025-01-30T13:02:15Z",
  "is_archived": false,
  "total_tokens": 0,
  "messages": []
}
```

### 3. GET `/api/conversations/{conversation_id}`
Get conversation with all messages.

**Response:**
```json
{
  "id": "uuid",
  "title": "Sample conversation",
  "chat_type": "normativa_nacional",
  "snippet": "First message preview...",
  "created_at": "2025-01-30T13:02:15Z",
  "updated_at": "2025-01-30T13:05:22Z",
  "is_archived": false,
  "total_tokens": 150,
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "¿Qué dice el artículo 14?",
      "tokens_used": 10,
      "metadata": null,
      "created_at": "2025-01-30T13:02:15Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "El artículo 14 establece...",
      "tokens_used": 45,
      "metadata": {"relevant_docs": []},
      "created_at": "2025-01-30T13:02:20Z"
    }
  ]
}
```

### 4. POST `/api/conversations/message`
Send message and stream AI response.

**Request Body:**
```json
{
  "content": "User message",
  "session_id": "optional-uuid",
  "chat_type": "normativa_nacional"
}
```

**Response:** Server-Sent Events stream
```
data: {"content": "chunk", "session_id": "uuid"}

data: {"content": "another chunk", "session_id": "uuid"}

data: {"content": "", "session_id": "uuid", "done": true}
```

### 5. DELETE `/api/conversations/{conversation_id}`
Soft delete a conversation.

**Response:**
```json
{
  "message": "Conversation deleted successfully"
}
```

### 6. PATCH `/api/conversations/{conversation_id}`
Update conversation metadata.

**Request Body:**
```json
{
  "title": "New title",
  "is_archived": true
}
```

## Architecture

### AI Service Abstraction

The AI service uses an abstract base class pattern for easy provider switching:

```python
class BaseAIService(ABC):
    @abstractmethod
    async def generate_stream(self, messages, system_prompt, **kwargs) -> AsyncGenerator[str, None]:
        pass
    
    @abstractmethod
    def count_tokens(self, text: str) -> int:
        pass
```

**Current Implementation:**
- `GeminiAIService`: Google Gemini 2.0 Flash Experimental / 1.5 Pro
- `ClaudeAIService`: Placeholder for Anthropic Claude
- `OpenAIService`: Placeholder for OpenAI GPT

### Database Models

**Conversation (chat_sessions table):**
- `id`: UUID primary key
- `user_id`: Foreign key to users table
- `title`: Optional conversation title
- `chat_type`: 'normativa_nacional' or 'constituciones'
- `snippet`: First message preview (auto-generated)
- `system_prompt`: AI system prompt
- `total_tokens`: Cumulative token count
- `is_archived`: Archive status
- `created_at`, `updated_at`: Timestamps
- `is_deleted`, `deleted_at`: Soft delete fields

**Message (messages table):**
- `id`: UUID primary key
- `session_id`: Foreign key to chat_sessions
- `role`: 'system', 'user', or 'assistant'
- `content`: Message text
- `tokens_used`: Token count for this message
- `cost_usd`: Cost estimation
- `metadata`: JSONB for additional data (RAG docs, etc.)
- `created_at`, `updated_at`: Timestamps
- `is_deleted`, `deleted_at`: Soft delete fields

## Configuration

### Environment Variables

```bash
# AI Provider
AI_PROVIDER=gemini  # gemini, claude, openai
GEMINI_API_KEY=your_gemini_api_key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/simpla_db

# Future providers
# CLAUDE_API_KEY=your_claude_api_key
# OPENAI_API_KEY=your_openai_api_key
```

### System Prompts

Default system prompts are automatically assigned based on chat type:

- **normativa_nacional**: "Eres un asistente legal especializado en normativa nacional argentina..."
- **constituciones**: "Eres un asistente legal especializado en derecho constitucional..."

## Usage Examples

### JavaScript/TypeScript Frontend

```javascript
// Send message with streaming
async function sendMessage(content, sessionId = null, chatType = 'normativa_nacional') {
  const response = await fetch('/api/conversations/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      session_id: sessionId,
      chat_type: chatType
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.done) return;
        if (data.content) {
          // Append content to UI
          appendToChat(data.content);
        }
      }
    }
  }
}
```

### Python Client

```python
import httpx
import json

async def send_message(content, session_id=None, chat_type="normativa_nacional"):
    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            "http://localhost:8000/api/conversations/message",
            json={
                "content": content,
                "session_id": session_id,
                "chat_type": chat_type
            }
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = json.loads(line[6:])
                    if data.get("done"):
                        break
                    if data.get("content"):
                        print(data["content"], end="", flush=True)
```

## Testing

Run the test script to verify the implementation:

```bash
cd backend
python test_conversations.py
```

## RAG Integration

The system is designed for easy RAG integration. Add your RAG service in the `ConversationService.stream_message_response()` method:

```python
# TODO: Integrate RAG service here
# relevant_docs = await rag_service.search_documents(query, chat_type, top_k=5)
# Add relevant_docs to context before sending to AI
```

## Authentication

Currently uses placeholder authentication. Replace `get_current_user_id()` in `router.py` with your actual authentication dependency:

```python
# Replace this:
def get_current_user_id() -> str:
    return "placeholder-user-id"

# With this:
def get_current_user_id(current_user: User = Depends(get_current_user)) -> str:
    return str(current_user.id)
```

## Error Handling

The API includes comprehensive error handling:
- HTTP 400: Invalid request parameters
- HTTP 404: Resource not found
- HTTP 500: Internal server errors
- Graceful AI service failures with error messages

## Performance Considerations

- **Async/await**: All database operations are asynchronous
- **Connection pooling**: SQLAlchemy connection pooling configured
- **Indexes**: Database indexes on frequently queried fields
- **Pagination**: All list endpoints support pagination
- **Soft deletes**: No data loss, easy recovery
