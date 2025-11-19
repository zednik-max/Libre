@echo off
REM LibreChat User Management Script
REM Provides a menu for common user management tasks

:menu
cls
echo ========================================
echo    LibreChat User Management
echo ========================================
echo.
echo 1. Invite User
echo 2. List All Users
echo 3. Delete User
echo 4. Create User Manually
echo 5. View User Stats
echo 6. Exit
echo.
echo ========================================
set /p choice="Select option (1-6): "

if "%choice%"=="1" goto invite
if "%choice%"=="2" goto list
if "%choice%"=="3" goto delete
if "%choice%"=="4" goto create
if "%choice%"=="5" goto stats
if "%choice%"=="6" goto end

echo Invalid choice!
timeout /t 2 >nul
goto menu

:invite
echo.
set /p email="Enter email to invite: "
docker exec -it LibreChat npm run invite-user -- %email%
echo.
pause
goto menu

:list
echo.
echo Listing all users...
echo.
docker exec -it LibreChat npm run list-users
echo.
pause
goto menu

:delete
echo.
set /p email="Enter email to delete: "
echo.
echo WARNING: This will permanently delete the user!
set /p confirm="Are you sure? (yes/no): "
if /i "%confirm%"=="yes" (
    docker exec -it LibreChat npm run delete-user -- %email%
) else (
    echo Cancelled.
)
echo.
pause
goto menu

:create
echo.
echo Creating user manually...
echo.
docker exec -it LibreChat npm run create-user
echo.
pause
goto menu

:stats
echo.
set /p email="Enter email to view stats: "
docker exec -it LibreChat npm run user-stats -- --email %email%
echo.
pause
goto menu

:end
echo.
echo Goodbye!
timeout /t 1 >nul
exit /b 0
