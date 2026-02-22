@echo off
echo LaTeX Compiler Server Setup
echo ===========================
echo.

echo Checking for LaTeX installation...
pdflatex --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ LaTeX is already installed!
    echo Starting server with native LaTeX...
    npm start
) else (
    echo ❌ LaTeX not found.
    echo.
    echo Choose an installation option:
    echo.
    echo 1. Use Docker (recommended - no local LaTeX installation needed)
    echo 2. Install MiKTeX manually
    echo 3. Start server anyway (will show installation help)
    echo.
    set /p choice="Enter your choice (1-3): "
    
    if "%choice%"=="1" (
        echo.
        echo Checking for Docker...
        docker --version >nul 2>&1
        if %errorlevel% equ 0 (
            echo ✅ Docker found. Building and starting container...
            docker-compose up --build
        ) else (
            echo ❌ Docker not found. Please install Docker Desktop first.
            echo Download from: https://www.docker.com/products/docker-desktop
            pause
        )
    ) else if "%choice%"=="2" (
        echo.
        echo Opening MiKTeX download page...
        start https://miktex.org/download
        echo.
        echo After installing MiKTeX:
        echo 1. Restart your terminal
        echo 2. Run this script again
        pause
    ) else (
        echo.
        echo Starting server without LaTeX (will show installation help)...
        npm start
    )
)
