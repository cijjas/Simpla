# Database Deployment Guide for Simpla

This guide explains how to recreate your database when deploying the Simpla application.

## Database Schema

Your application uses **PostgreSQL** with the following tables:

### Users Table
- `id` (String, Primary Key) - Unique user identifier
- `email` (String, Unique) - User's email address
- `hashed_password` (String, Nullable) - Hashed password (null for OAuth users)
- `name` (String, Nullable) - User's display name
- `provider` (String) - Authentication provider ("email" or "google")
- `created_at` (DateTime) - Account creation timestamp
- `updated_at` (DateTime) - Last update timestamp
- `email_verified` (Boolean) - Email verification status
- `reset_token` (String, Nullable) - Password reset token
- `reset_token_expires` (DateTime, Nullable) - Reset token expiration

### Refresh Tokens Table
- `id` (String, Primary Key) - Unique token identifier
- `user_id` (String, Foreign Key) - References users.id
- `token` (Text, Unique) - JWT refresh token
- `created_at` (DateTime) - Token creation timestamp
- `revoked` (Boolean) - Token revocation status

## Deployment Options

### Option 1: Simple Python Script (Recommended for most deployments)

```bash
# Set your database URL
export DATABASE_URL="postgresql://username:password@host:port/database_name"

# Run the initialization script
cd backend
python scripts/init-database.py
```

### Option 2: Full Deployment Script

```bash
# Set environment variables
export DATABASE_URL="postgresql://username:password@host:port/database_name"
export DB_PASSWORD="your_secure_password"

# Run the deployment script
cd backend
./scripts/deploy-database.sh
```

### Option 3: Docker Compose (Recommended for containerized deployments)

```bash
# Create a .env file with your configuration
cat > .env << EOF
DB_PASSWORD=your_secure_password
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=your_index_name
PINECONE_HOST=your_pinecone_host
GEMINI_API_KEY=your_gemini_key
HF_API_KEY=your_huggingface_key
RESEND_API_KEY=your_resend_key
JWT_SECRET_KEY=your_jwt_secret
FRONTEND_SITE_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-backend-domain.com
EOF

# Start the services
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Variables Required

Make sure these environment variables are set:

### Required for Database
- `DATABASE_URL` - PostgreSQL connection string

### Required for Application
- `PINECONE_API_KEY` - Pinecone vector database API key
- `PINECONE_INDEX_NAME` - Pinecone index name
- `PINECONE_HOST` - Pinecone host URL
- `GEMINI_API_KEY` - Google Gemini API key
- `HF_API_KEY` - Hugging Face API key
- `RESEND_API_KEY` - Resend email service API key
- `JWT_SECRET_KEY` - Secret key for JWT tokens

### Optional
- `FRONTEND_SITE_URL` - Frontend application URL (default: http://localhost:3000)
- `BACKEND_URL` - Backend API URL (default: http://localhost:8000)
- `LOG_LEVEL` - Logging level (default: INFO)
- `LOG_DATABASE_QUERIES` - Enable database query logging (default: true)
- `LOG_HTTP_REQUESTS` - Enable HTTP request logging (default: true)

## Migration from Existing Data

If you have existing user data to migrate:

1. **Backup your existing database first!**
2. Run the migration script:
   ```bash
   cd backend
   python core/database/migrate_users.py
   ```

## Verification

After deployment, verify your database is working:

1. **Check tables exist:**
   ```sql
   \dt
   ```

2. **Check table structure:**
   ```sql
   \d users
   \d refresh_tokens
   ```

3. **Test the API health endpoint:**
   ```bash
   curl http://localhost:8000/api/health
   ```

## Troubleshooting

### Common Issues

1. **"DATABASE_URL not set"**
   - Ensure the DATABASE_URL environment variable is properly set
   - Format: `postgresql://username:password@host:port/database_name`

2. **"Connection refused"**
   - Check if PostgreSQL is running
   - Verify host, port, and credentials
   - Ensure firewall allows connections

3. **"Table already exists"**
   - This is normal if tables already exist
   - The script will not overwrite existing data

4. **"Permission denied"**
   - Ensure the database user has CREATE TABLE permissions
   - Check database user privileges

### Logs

Check application logs for detailed error information:
```bash
# If using Docker
docker logs simpla-backend

# If running directly
tail -f logs/app.log
```

## Security Considerations

1. **Use strong passwords** for database users
2. **Set secure JWT secrets** (use a random string generator)
3. **Enable SSL** for database connections in production
4. **Restrict database access** to only necessary IPs
5. **Regular backups** of your database

## Backup and Restore

### Create Backup
```bash
# Using the provided script
./scripts/backup-db.sh

# Or manually
pg_dump -h host -U username -d database_name > backup.sql
```

### Restore Backup
```bash
# Using the provided script
./scripts/restore-db.sh backup_file.sql.gz

# Or manually
psql -h host -U username -d database_name < backup.sql
```

## Support

If you encounter issues:
1. Check the logs for error messages
2. Verify all environment variables are set correctly
3. Ensure database connectivity
4. Check the health endpoint: `/api/health`
