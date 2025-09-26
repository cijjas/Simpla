# Simpla Backend

A clean, feature-based FastAPI backend for the Simpla legal AI assistant.

## 🏗️ Architecture

The backend is organized using a **feature-based architecture** where each feature is self-contained with its own models, routes, services, and utilities.

```
backend/
├── core/                    # Core functionality shared across features
│   ├── config/             # Configuration management
│   ├── database/           # Database setup and utilities
│   └── utils/              # Core utilities (JWT, etc.)
├── features/               # Feature modules
│   ├── auth/               # Authentication feature
│   │   ├── models/         # User and auth models
│   │   ├── routes/         # Auth endpoints
│   │   ├── services/       # Email service
│   │   └── utils/          # Auth utilities
│   ├── chat/               # Chat/RAG feature
│   │   ├── models/         # Chat models
│   │   ├── routes/         # Chat endpoints
│   │   ├── services/       # RAG, embedding, Pinecone services
│   │   └── utils/          # Chat utilities
│   └── feedback/           # Feedback feature
│       ├── models/         # Feedback models
│       ├── routes/         # Feedback endpoints
│       ├── services/       # Feedback services
│       └── utils/          # Feedback utilities
├── main.py                 # FastAPI application entry point
└── requirements.txt        # Python dependencies
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Setup

Create a `.env` file with the required configuration:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/simpla

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Services
GEMINI_API_KEY=your-gemini-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key
PINECONE_API_KEY=your-pinecone-api-key

# Email
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=no-reply@simplar.com.ar

# URLs
BACKEND_URL=http://localhost:8000
FRONTEND_SITE_URL=http://localhost:3000
```

### 3. Database Setup

```bash
# Create database tables
python -m core.database.init_db

# Migrate existing users (if needed)
python -m core.database.migrate_users
```

### 4. Run the Server

```bash
python main.py
```

The API will be available at `http://localhost:8000` with documentation at `http://localhost:8000/docs`.

## 📚 Features

### 🔐 Authentication (`/api/auth`)
- User registration and login
- Google OAuth integration
- JWT token management
- Password reset functionality
- Email verification

### 💬 Chat (`/api/chat`)
- RAG (Retrieval-Augmented Generation)
- Legal document search
- AI-powered responses
- Province-based filtering

### 📝 Feedback (`/api/feedback`)
- User feedback collection
- Email notifications

## 🛠️ Development

### Adding a New Feature

1. Create a new feature directory:
   ```bash
   mkdir -p features/new_feature/{models,routes,services,utils}
   ```

2. Add `__init__.py` files to make them Python packages

3. Implement your feature components:
   - `models/` - SQLAlchemy models
   - `routes/` - FastAPI routers
   - `services/` - Business logic
   - `utils/` - Feature-specific utilities

4. Register the router in `main.py`:
   ```python
   from features.new_feature.routes.router import router as new_feature_router
   app.include_router(new_feature_router, prefix="/api")
   ```

### Code Organization Principles

- **Separation of Concerns**: Each feature is self-contained
- **Single Responsibility**: Each module has a clear purpose
- **Dependency Injection**: Use FastAPI's dependency system
- **Configuration Management**: All config in `core.config`
- **Database Access**: Centralized in `core.database`

## 🔧 Configuration

All configuration is managed through the `core.config.config` module using environment variables. See the `.env` example above for all available options.

## 📊 Database

The application uses PostgreSQL with SQLAlchemy ORM. Database models are organized by feature in the `features/*/models/` directories.

## 🧪 Testing

```bash
# Run tests (when implemented)
pytest

# Run with coverage
pytest --cov=features
```

## 🚀 Deployment

The application is designed to be deployed as a containerized service. Key considerations:

- Set all required environment variables
- Use a production database
- Configure proper CORS settings
- Use HTTPS in production
- Set secure JWT secrets

## 📝 API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🤝 Contributing

1. Follow the feature-based architecture
2. Keep features self-contained
3. Use type hints and docstrings
4. Write tests for new functionality
5. Update documentation as needed
