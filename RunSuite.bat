@echo off
call npx playwright test tests/03-createNewUser.spec.ts
@REM call npx playwright test tests --workers=1
echo Now about to end...
echo HTML report is generated at ....\playwright-report\index.html
pause