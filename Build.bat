@echo off
echo ===================================================
echo   Library Manager - Professional Build Script
echo ===================================================
echo [!] TIP: Please run this as Administrator if it fails.
echo.

:: Close any running instances of the app to prevent file locking
echo [0/4] Closing running instances...
taskkill /F /IM Library.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

:: Use npm.cmd to avoid PowerShell execution policy issues
echo [1/4] Cleaning old build files...
call npm.cmd run clean

echo [2/4] Building assets and source code...
call npm.cmd run build

echo [3/4] Packaging application into EXE...
:: Note: We package into the 'release' folder
call npx.cmd electron-packager . Library --platform=win32 --arch=x64 --out=release --overwrite --icon=public/Booklogo.ico --asar

if errorlevel 1 (
    echo.
    echo [!] ERROR: Packaging failed. 
    pause
    exit /b 1
)

echo.
echo =================================================
echo   SUCCESS: Build completed! 
echo   The app is ready in the "release" folder.
echo   To share it, just Zip the "release" folder.
echo =================================================
pause
