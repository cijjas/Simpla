# Simpla Backend

This is the backend for Simpla, built with Spring Boot and PostgreSQL. It provides authentication, legal document search, AI chat, and user directory features.

## Features
- User authentication (JWT)
- Legal document storage and search
- AI chat integration
- User directories
- Scheduled data ingestion from external legal APIs

## Local Development

### Prerequisites
- Docker & Docker Compose
- Java 17+ (for local development outside Docker)

### Running with Docker Compose

```
docker-compose up --build
```

This will start both the backend and a PostgreSQL database.

## Project Structure
- `src/` - Spring Boot source code
- `Dockerfile` - Containerizes the backend
- `docker-compose.yml` - Orchestrates backend and database

## Deployment
- Build and push Docker images to your registry
- Deploy to your preferred cloud provider

---

For more details, see the code and comments in each file. 