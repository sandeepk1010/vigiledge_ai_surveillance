@echo off
echo ============================================================
echo CONFIGURING WINDOWS FIREWALL FOR ANPR SYSTEM
echo ============================================================
echo.
echo This will allow incoming connections on port 5000 (Backend API)
echo and port 3000 (Frontend Dashboard)
echo.
echo NOTE: Run this as Administrator!
echo.
pause

echo.
echo Adding firewall rule for Backend API (port 5000)...
netsh advfirewall firewall add rule name="ANPR Backend API" dir=in action=allow protocol=TCP localport=5000
if %errorlevel%==0 (
    echo [SUCCESS] Backend API port 5000 opened
) else (
    echo [FAILED] Could not add rule for port 5000
)

echo.
echo Adding firewall rule for Frontend Dashboard (port 3000)...
netsh advfirewall firewall add rule name="ANPR Frontend" dir=in action=allow protocol=TCP localport=3000
if %errorlevel%==0 (
    echo [SUCCESS] Frontend Dashboard port 3000 opened
) else (
    echo [FAILED] Could not add rule for port 3000
)

echo.
echo ============================================================
echo FIREWALL CONFIGURATION COMPLETE
echo ============================================================
echo.
echo Your ANPR camera can now send data to:
echo    http://192.168.1.120:5000/webhook
echo.
pause
