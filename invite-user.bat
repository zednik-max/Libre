@echo off
REM LibreChat User Invitation Script
REM Usage: invite-user.bat friend@example.com

echo ========================================
echo    LibreChat User Invitation Tool
echo ========================================
echo.

if "%1"=="" (
    echo ERROR: Email address required!
    echo.
    echo Usage: invite-user.bat friend@example.com
    echo.
    pause
    exit /b 1
)

set EMAIL=%1

echo Inviting user: %EMAIL%
echo.

docker exec -it LibreChat npm run invite-user -- %EMAIL%

echo.
echo ========================================
echo Done!
echo ========================================
pause
