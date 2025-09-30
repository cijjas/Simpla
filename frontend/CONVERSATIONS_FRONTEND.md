# Conversations Frontend Implementation

A modern React chat interface for testing the conversations API backend.

## Features

- **Real-time streaming** chat with Server-Sent Events
- **Conversation management** (create, view, delete)
- **Two chat types**: Normativa Nacional and Constituciones
- **Responsive design** with sidebar navigation
- **Message history** with proper formatting
- **Auto-scrolling** to latest messages
- **Error handling** with toast notifications

## Files Created

### 1. `/src/app/(app)/conversaciones/page.tsx`
Main chat interface page with:
- Sidebar with conversation list
- Chat area with message display
- Input area with streaming support
- Conversation management (create/delete)

### 2. `/src/lib/conversations-api.ts`
API client with:
- TypeScript interfaces for all data types
- `ConversationsAPI` class with all CRUD operations
- Streaming message support with callbacks
- Error handling and response parsing
- Utility functions for date/time formatting

### 3. Updated `/src/components/layout/app-sidebar.tsx`
Added "Conversaciones" to main navigation with MessageSquare icon.

## Usage

### 1. Start the Backend
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

### 2. Start the Frontend
```bash
cd frontend
pnpm dev
```

### 3. Access the Chat Interface
Navigate to `http://localhost:3000/conversaciones` or click "Conversaciones" in the sidebar.

## API Configuration

The frontend connects to the backend API. Configure the API URL in:

```typescript
// src/lib/conversations-api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
```

Or set the environment variable:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Chat Interface Features

### Sidebar
- **Conversation List**: Shows all conversations with titles, snippets, and metadata
- **Chat Type Selector**: Choose between "Normativa Nacional" and "Constituciones"
- **New Conversation Button**: Creates a new conversation
- **Delete Conversations**: Click trash icon to delete

### Main Chat Area
- **Message Display**: Shows conversation history with user/assistant messages
- **Streaming Response**: Real-time AI response streaming with typing indicator
- **Auto-scroll**: Automatically scrolls to latest messages
- **Message Timestamps**: Shows time for each message

### Input Area
- **Text Input**: Multi-line textarea with auto-resize
- **Send Button**: Send message (Enter key also works)
- **Streaming Indicator**: Shows when AI is responding

## Message Flow

1. **User types message** and clicks send or presses Enter
2. **User message appears** immediately in chat
3. **AI response streams** in real-time with typing indicator
4. **Conversation updates** with complete message history
5. **Sidebar refreshes** to show updated conversation list

## Error Handling

- **Network errors**: Toast notifications for API failures
- **Streaming errors**: Graceful fallback with error messages
- **Validation errors**: Input validation and user feedback

## Styling

Uses the existing design system:
- **Tailwind CSS** for styling
- **Radix UI** components for consistent design
- **Lucide React** icons
- **Sonner** for toast notifications
- **Dark/light theme** support

## TypeScript Support

Full TypeScript support with:
- **Type-safe API calls** with proper interfaces
- **Component props** with strict typing
- **State management** with typed hooks
- **Error handling** with typed error objects

## Testing the Integration

1. **Create a conversation** by clicking "Nueva"
2. **Send a message** and watch it stream in real-time
3. **Switch chat types** to test different AI prompts
4. **Delete conversations** to test cleanup
5. **Refresh the page** to verify persistence

## Future Enhancements

- **Message search** within conversations
- **Conversation archiving** functionality
- **Message editing/deletion**
- **File attachments** support
- **Voice input** integration
- **Keyboard shortcuts** for power users
- **Conversation sharing** features
- **Export conversations** to PDF/text

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if backend is running on port 8000
   - Verify `NEXT_PUBLIC_API_URL` environment variable
   - Check browser console for CORS errors

2. **Streaming Not Working**
   - Verify `GEMINI_API_KEY` is set in backend
   - Check backend logs for AI service errors
   - Ensure browser supports Server-Sent Events

3. **Messages Not Persisting**
   - Check database connection in backend
   - Verify PostgreSQL is running
   - Check backend logs for database errors

### Debug Mode

Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'conversations:*');
```

## Performance Considerations

- **Message virtualization** for long conversations
- **Lazy loading** of conversation history
- **Debounced API calls** for better UX
- **Memory cleanup** for streaming connections
- **Optimistic updates** for better perceived performance
