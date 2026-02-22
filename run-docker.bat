@echo off
echo Building and running LaTeX Compiler Server with Docker...
echo.
echo This will create a container with LaTeX pre-installed.
echo No need to install LaTeX on your local machine!
echo.

docker-compose up --build

echo.
echo Server should be running on http://localhost:3000
pause
