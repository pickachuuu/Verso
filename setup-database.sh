#!/bin/bash

# Database Setup Script for ReviseA
# This script sets up the database schema and RLS policies

echo "🚀 Setting up ReviseA database..."

# Check if environment variables are set
if [ -z "$SUPABASE_HOST" ] || [ -z "$SUPABASE_DB" ] || [ -z "$SUPABASE_USER" ]; then
    echo "❌ Error: Please set the following environment variables:"
    echo "   SUPABASE_HOST - Your Supabase database host"
    echo "   SUPABASE_DB - Your Supabase database name (usually 'postgres')"
    echo "   SUPABASE_USER - Your Supabase database user (usually 'postgres')"
    echo ""
    echo "Example:"
    echo "export SUPABASE_HOST=db.your-project.supabase.co"
    echo "export SUPABASE_DB=postgres"
    echo "export SUPABASE_USER=postgres"
    exit 1
fi

echo "📋 Running database schema..."
psql -h $SUPABASE_HOST -U $SUPABASE_USER -d $SUPABASE_DB -f database_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully!"
else
    echo "❌ Error creating database schema"
    exit 1
fi

echo "🔒 Setting up RLS policies..."
psql -h $SUPABASE_HOST -U $SUPABASE_USER -d $SUPABASE_DB -f rls_policies.sql

if [ $? -eq 0 ]; then
    echo "✅ RLS policies created successfully!"
else
    echo "❌ Error creating RLS policies"
    exit 1
fi

echo "🎉 Database setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Make sure your environment variables are set in .env.local"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Test the flashcard generation feature" 