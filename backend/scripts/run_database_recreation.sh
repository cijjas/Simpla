#!/bin/bash

# Script to recreate the database with UUID schema
# This will drop all existing tables and recreate them with the new UUID-based schema

echo "🚀 Starting database recreation with UUID schema..."
echo "⚠️  WARNING: This will delete all existing data!"
echo ""

# Check if we're in the right directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
fi

# Run the database recreation script
echo "🗄️  Recreating database tables..."
python scripts/recreate_database.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database recreation completed successfully!"
    echo "🎉 All tables now use UUID primary keys and include soft delete support."
    echo ""
    echo "Next steps:"
    echo "1. Run your FastAPI application: python main.py"
    echo "2. Test the authentication endpoints"
    echo "3. Verify that all features work with the new UUID schema"
else
    echo ""
    echo "❌ Database recreation failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi
