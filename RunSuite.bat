@echo off

@REM call npx playwright test tests/01-homepageUI.spec.ts tests/02-guestUserTest.spec.ts tests/03-createNewUser.spec.ts --workers=1
@REM call npx playwright test tests/02-guestUserTest.spec.ts
@REM call npx playwright test tests/03-createNewUser.spec.ts
@REM call npx playwright test tests/04-addBalanceTest.spec.ts

call npx playwright test tests --workers=1
echo Now about to end...
echo HTML report is generated at ....\playwright-report\index.html
pause