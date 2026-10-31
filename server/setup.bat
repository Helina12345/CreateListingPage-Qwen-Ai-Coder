@echo off
REM ListingDesk Pro - Backend Setup Script for Windows

echo.
echo ========================================
echo  ListingDesk Pro Backend Setup
echo ========================================
echo.

REM Check if we're in the server directory
if not exist "package.json" (
    echo ERROR: package.json not found.
    echo Please run this script from the server\ directory.
    pause
    exit /b 1
)

REM Step 1: Install dependencies
echo [1/7] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Step 2: Check if .env exists
echo [2/7] Checking environment configuration...
if not exist ".env" (
    echo WARNING: .env file not found. Creating from .env.example...
    copy .env.example .env >nul
    echo [OK] Created .env file
    echo.
    echo ========================================
    echo  IMPORTANT: Edit .env and configure:
    echo  - DATABASE_URL
    echo  - REDIS_URL
    echo  - JWT_SECRET
    echo ========================================
    echo.
    echo Press any key after you've configured .env...
    pause >nul
) else (
    echo [OK] .env file exists
)
echo.

REM Step 3: Check PostgreSQL
echo [3/7] Checking PostgreSQL...
where psql >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL client found

    REM Try to connect
    psql -U postgres -c "SELECT 1;" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] PostgreSQL is running

        REM Check if database exists
        psql -U postgres -lqt | findstr /C:"listingdesk_pro" >nul 2>&1
        if %errorlevel% equ 0 (
            echo [OK] Database 'listingdesk_pro' exists
        ) else (
            echo WARNING: Database 'listingdesk_pro' not found. Creating...
            psql -U postgres -c "CREATE DATABASE listingdesk_pro;" >nul 2>&1
            if %errorlevel% equ 0 (
                echo [OK] Database created
            ) else (
                echo ERROR: Failed to create database. Please create it manually.
            )
        )
    ) else (
        echo ERROR: PostgreSQL is not running or credentials are wrong
        echo Please start PostgreSQL and configure DATABASE_URL in .env
    )
) else (
    echo ERROR: PostgreSQL client not found
    echo Please install PostgreSQL: https://www.postgresql.org/download/windows/
)
echo.

REM Step 4: Check Redis
echo [4/7] Checking Redis...
where redis-cli >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Redis client found

    redis-cli ping >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Redis is running
    ) else (
        echo ERROR: Redis is not running
        echo Please start Redis: redis-server
    )
) else (
    echo ERROR: Redis client not found
    echo Please install Redis: https://github.com/tporadowski/redis/releases
)
echo.

REM Step 5: Generate Prisma Client
echo [5/7] Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma Client
    echo Try: npm install -D prisma@latest
    pause
    exit /b 1
)
echo [OK] Prisma Client generated
echo.

REM Step 6: Push schema to database
echo [6/7] Creating database tables...
call npx prisma db push
if errorlevel 1 (
    echo WARNING: Failed to push schema. Trying alternative method...
    call npx prisma migrate dev --name init
    if errorlevel 1 (
        echo ERROR: Failed to create database tables
        echo Please check your DATABASE_URL in .env
        pause
        exit /b 1
    )
)
echo [OK] Database tables created
echo.

REM Step 7: Success message
echo [7/7] Setup complete!
echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Review .env and add marketplace API credentials
echo   2. Run: npm run dev
echo   3. Test: curl http://localhost:3000/health
echo   4. View database: npx prisma studio
echo.
echo Your backend is ready!
echo.

REM Ask if user wants to start the server now
set /p START_SERVER="Do you want to start the server now? (y/n): "
if /i "%START_SERVER%"=="y" (
    echo.
    echo Starting server...
    echo Press Ctrl+C to stop the server
    echo.
    call npm run dev
)

pause
