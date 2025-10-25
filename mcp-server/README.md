# Simpla MCP Server

An MCP (Model Context Protocol) server that provides access to Simpla's legal RAG system for Argentine legislation.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   .env file:
   ```
   BACKEND_URL=http://localhost:8000/api
   ```

3. **Run the server:**
   ```bash
   python app.py
   ```

## Authentication

This MCP server uses JWT tokens from your Simpla account. To get your token:

1. Log into the Simpla web application
2. Open browser developer tools (F12)
3. Go to Application/Storage → Local Storage
4. Find your JWT token (usually stored as 'access_token' or similar)
5. Use this token when calling MCP tools

## Available Tools

### `ask_legal_question`
Query Argentine legislation via Simpla's RAG system.

**Parameters:**
- `query` (required): Your legal question
- `token` (required): JWT token from Simpla web app
- `chat_type` (optional): "normativa_nacional" (default) or "constituciones"
- `tone` (optional): "default", "formal", "academico", or "conciso"
- `session_id` (optional): Continue existing conversation

**Example:**
```python
ask_legal_question(
    query="¿Qué dice el artículo 14 de la Constitución?",
    token="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    chat_type="normativa_nacional",
    tone="formal"
)
```

### `get_token_info`
Validate your JWT token and get user information.

**Parameters:**
- `token` (required): JWT token from Simpla web app

## Rate Limiting

Rate limiting is handled by the backend authentication system. Each request requires a valid JWT token associated with your Simpla account.

## Error Handling

The server provides detailed error messages for:
- Invalid or expired tokens
- Network connectivity issues
- Backend API errors
- Invalid parameters

## Security

- No API keys are stored - uses existing Simpla authentication
- All requests require valid JWT tokens
- Token validation happens on each request
- Supports the same security model as the Simpla web app
