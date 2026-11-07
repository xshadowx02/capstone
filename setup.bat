@echo off
rem Local Ledge — build the React UI then spin up Docker Compose

echo ============================
echo   Local Ledge  Build  Run
echo ============================

rem Check for .env
if not exist .env (
    echo.
    echo ERROR: .env file not found!
    echo Run: copy .env.example .env
    echo Then set your OPENROUTER_API_KEY inside .env
    exit /b 1
}

rem Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Install from https://nodejs.org
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set nodeVersion=%%i
echo Node.js: %nodeVersion%

rem Build frontend
echo.
echo Building React frontend...
cd ui

if not exist node_modules (
    echo Installing npm dependencies...
    call npm install
)

call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    cd ..
    exit /b 1
)

cd ..
echo Frontend built to api/static/

rem Start Docker Compose
echo.
echo Starting Docker Compose...
echo (Press Ctrl+C to stop)
echo.
echo Once started, open: http://localhost:8000
echo.

docker compose up --build
