@echo off
echo Installing MiKTeX manually...
echo.
echo Please follow these steps:
echo.
echo 1. Go to https://miktex.org/download
echo 2. Download "Basic MiKTeX Installer" for Windows
echo 3. Run the installer as Administrator
echo 4. During installation, choose "Install missing packages on-the-fly: Yes"
echo 5. After installation, restart your terminal
echo 6. Test with: pdflatex --version
echo.
echo Alternatively, you can use the Docker version (see docker-latex.bat)
pause
