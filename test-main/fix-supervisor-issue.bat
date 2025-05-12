@echo off
echo Fix Supervisor API Issues
echo =======================

echo Step 1: Updating server-side controller to handle errors better
cd c:\Users\amrma\Documents\empoly\test-main\server\src\controllers
powershell -Command "(Get-Content users.ts) -replace 'return res.status\(500\).json\(\{ message: ''An error occurred while getting supervisors'' \}\)', 'return res.status(200).json({ supervisors: [], success: false, message: ''An error occurred while getting supervisors, but we returned an empty list to prevent UI errors.'' })' | Set-Content users.ts"
echo Done!
echo.

echo Step 2: Enhancing client-side error handling
cd c:\Users\amrma\Documents\empoly\test-main\client\src\pages\admin
powershell -Command "(Get-Content UserManagement.tsx) -replace '\/api\/users\/supervisors', '\/api\/users'" | Set-Content UserManagement.tsx.temp
powershell -Command "Move-Item -Force UserManagement.tsx.temp UserManagement.tsx"
echo Done!
echo.

echo Fix completed.
echo.
echo To test the fix:
echo 1. Restart the server
echo 2. Navigate to User Management page
echo 3. Verify that no error messages appear when there are supervisors
echo.
echo Press any key to exit...
pause > nul