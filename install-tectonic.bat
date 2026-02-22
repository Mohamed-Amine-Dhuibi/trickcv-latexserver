@echo off
echo Installing Tectonic LaTeX Engine (Rust-based, fastest)
echo =====================================================
echo.

echo Method 1: Direct download (recommended)
echo Downloading Tectonic from GitHub releases...
echo.

set TECTONIC_VERSION=0.15.0
set DOWNLOAD_URL=https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic@%TECTONIC_VERSION%/tectonic-%TECTONIC_VERSION%-x86_64-pc-windows-msvc.zip

echo Creating tectonic directory...
if not exist "tectonic" mkdir tectonic
cd tectonic

echo Downloading Tectonic %TECTONIC_VERSION%...
powershell -Command "Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile 'tectonic.zip'"

if exist tectonic.zip (
    echo Extracting...
    powershell -Command "Expand-Archive -Path 'tectonic.zip' -DestinationPath '.' -Force"
    
    echo Cleaning up...
    del tectonic.zip
    
    echo.
    echo ✅ Tectonic installed successfully!
    echo Location: %cd%\tectonic.exe
    echo.
    echo Testing installation...
    tectonic.exe --version
    
    echo.
    echo To use Tectonic globally, add this directory to your PATH:
    echo %cd%
    echo.
    echo Or restart the server - it will auto-detect Tectonic in this folder.
) else (
    echo ❌ Download failed. 
    echo.
    echo Alternative installation methods:
    echo 1. Manual download from: https://github.com/tectonic-typesetting/tectonic/releases
    echo 2. Install Rust and run: cargo install tectonic
    echo 3. Use winget: winget install tectonic
)

cd ..
pause
