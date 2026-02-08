@echo off
echo ===================================================
echo   Library Manager - Final Build Script
echo ===================================================
echo [!] TIP: Please run this as Administrator if it fails.
echo.

cd /d "%~dp0\Dev"

:: Close any running instances of the app to prevent file locking
echo [0/3] Closing running instances...
taskkill /F /IM Library.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

:: Use npm.cmd to avoid PowerShell execution policy issues
echo [1/3] Cleaning old build files...
call npm.cmd run clean

echo [2/3] Building assets and source code...
call npm.cmd run build

echo [3/3] Packaging application into EXE...
call npx.cmd electron-packager . Library --platform=win32 --arch=x64 --out=release --overwrite --icon=public/Booklogo.ico --asar

if errorlevel 1 (
    echo.
    echo [!] ERROR: Packaging failed. 
    pause
    exit /b 1
)

:: Move build results to root
echo [4/4] Exporting application to root...
if exist "release\Library-win32-x64" (
    :: Delete old files in root except Dev folder and .git
    for /d %%i in ("..\*") do (
        if /i not "%%~nxi"=="Dev" if /i not "%%~nxi"==".git" rd /s /q "%%i"
    )
    for %%i in ("..\*") do (
        if /i not "%%~nxi"=="Build.bat" if /i not "%%~nxi"=="run.live.bat" del /q "%%i"
    )
    
    :: Export files to root using robust copy (robocopy)
    robocopy "release\Library-win32-x64" ".." /E /IS /IT /R:0 /W:0
    rd /s /q "release"
)

echo.
echo =================================================
echo   SUCCESS: Build completed! 
echo   The EXE and files are now in the root folder.
echo =================================================
pause
