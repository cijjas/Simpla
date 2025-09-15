# Simpla

![Carta de Presentación](./assets/carta-de-presentacion.png)

## 🚀 Quick Start for Developers

**New to the project?** Follow these guides in order:

1. **📋 [Setup Checklist](./SETUP_CHECKLIST.md)** - Complete this first to verify your setup
2. **⚡ [Quick Start](./QUICK_START.md)** - Fast setup for experienced developers  
3. **📖 [Detailed Setup Guide](./SETUP_GUIDE.md)** - Comprehensive instructions and troubleshooting
4. **🔄 [Workflow Guide](./WORKFLOW.md)** - Visual development workflow and daily tasks

## 🏗️ Project Structure

```
Simpla/
├── backend/           # Spring Boot REST API
├── frontend/          # Next.js web application  
├── scripts/           # Database schema and test scripts
└── docs/              # Setup and workflow guides
```

## ⚡ 30-Second Setup

```bash
cd backend
docker-compose up -d && sleep 10
docker exec -i backend-db-1 psql -U simpla -d simpla < ../scripts/create-schema.sql
mvn spring-boot:run
```

**That's it!** Backend runs on `http://localhost:8080`

## 🧪 Verify Setup

```bash
./scripts/test-api.sh  # Run comprehensive API tests
```

## 🏛️ About Simpla

Simpla is a legal document management and chat system designed for legal professionals. It features:

- **📁 Document Management** - Organize legal documents (normas) in hierarchical directories
- **💬 AI Chat Integration** - Interactive chat sessions for legal research
- **🔐 User Authentication** - Secure JWT-based authentication system
- **🌐 Modern Stack** - Next.js frontend + Spring Boot backend + PostgreSQL database

## 🛠️ Technology Stack

- **Backend**: Spring Boot, Java 17+, Maven, JWT Authentication
- **Database**: PostgreSQL with normalized schema design
- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Infrastructure**: Docker, Docker Compose

---

📚 **For detailed setup instructions, see the guides linked above.**
