#!/bin/bash

# ListingDesk Pro - Backend Setup Script
# This script automates the backend setup process

echo "🚀 Starting ListingDesk Pro Backend Setup..."
echo ""

# Check if we're in the server directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the server/ directory."
    exit 1
fi

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Step 2: Check if .env exists
echo "🔧 Step 2: Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and configure your database credentials:"
    echo "   - DATABASE_URL"
    echo "   - REDIS_URL"
    echo "   - JWT_SECRET"
    echo ""
    read -p "Press Enter after you've configured .env..."
else
    echo "✅ .env file exists"
fi
echo ""

# Step 3: Check PostgreSQL
echo "🗄️  Step 3: Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client found"

    # Try to connect
    if psql -U postgres -c "SELECT 1;" &> /dev/null; then
        echo "✅ PostgreSQL is running"

        # Check if database exists
        if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw listingdesk_pro; then
            echo "✅ Database 'listingdesk_pro' exists"
        else
            echo "⚠️  Database 'listingdesk_pro' not found. Creating..."
            psql -U postgres -c "CREATE DATABASE listingdesk_pro;"
            if [ $? -eq 0 ]; then
                echo "✅ Database created"
            else
                echo "❌ Failed to create database. Please create it manually."
            fi
        fi
    else
        echo "❌ PostgreSQL is not running or credentials are wrong"
        echo "   Please start PostgreSQL and configure DATABASE_URL in .env"
    fi
else
    echo "❌ PostgreSQL client not found"
    echo "   Please install PostgreSQL: https://www.postgresql.org/download/"
fi
echo ""

# Step 4: Check Redis
echo "🔴 Step 4: Checking Redis..."
if command -v redis-cli &> /dev/null; then
    echo "✅ Redis client found"

    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running"
    else
        echo "❌ Redis is not running"
        echo "   Please start Redis:"
        echo "   - macOS: brew services start redis"
        echo "   - Linux: sudo systemctl start redis"
        echo "   - Windows: Run redis-server.exe"
    fi
else
    echo "❌ Redis client not found"
    echo "   Please install Redis: https://redis.io/download"
fi
echo ""

# Step 5: Generate Prisma Client
echo "🔷 Step 5: Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma Client"
    echo "   Try: npm install -D prisma@latest"
    exit 1
fi
echo "✅ Prisma Client generated"
echo ""

# Step 6: Push schema to database
echo "📊 Step 6: Creating database tables..."
npx prisma db push
if [ $? -ne 0 ]; then
    echo "⚠️  Failed to push schema. Trying alternative method..."
    npx prisma migrate dev --name init
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create database tables"
        echo "   Please check your DATABASE_URL in .env"
        exit 1
    fi
fi
echo "✅ Database tables created"
echo ""

# Step 7: Start server
echo "🚀 Step 7: Starting server..."
echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Review .env and add marketplace API credentials"
echo "   2. Run: npm run dev"
echo "   3. Test: curl http://localhost:3000/health"
echo "   4. View database: npx prisma studio"
echo ""
echo "🎉 Your backend is ready!"
echo ""

# Ask if user wants to start the server now
read -p "Do you want to start the server now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run dev
fi
