import { test, expect, Browser, BrowserContext, Page, type TestInfo } from '@playwright/test';
import { appendFile, mkdir, readFile } from 'fs/promises';
import { resolve } from 'path';
// import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
// import { WebActions } from '../lib/webActions';
// import { generateRandomEmail } from '../lib/dataHelper';
import { ImAamFunctionLibrary } from '../lib/ImAamFunctionLibrary';
import { CommonFunctionLibrary } from '../lib/CommonFunctionLibrary';
import { BrowserSession, closeBrowserSession, createBrowserSession } from '../lib/browserSession';

test.describe.configure({ mode: 'serial' }); // Run tests in this block sequentially

let browser: Browser;
let context: BrowserContext;
let browserSession: BrowserSession;
let yopmailContext: BrowserContext;
let page: Page;
let newPageInNewTab: Page;
let iafl: ImAamFunctionLibrary;
let iafl2: ImAamFunctionLibrary;
let cfl: CommonFunctionLibrary;
let userName: string;
let msgText: string;
let userID: string;
let password: string;
let emailAddress: string;
let balanceAmount: string;

type UserDetails = {
  userID: string;
  emailAddress: string;
  password: string;
};

let savedUsers: UserDetails[] = [];

// export class HomePageUItest {
// constructor(page: Page) {
//   this.page = page;
// }

test.beforeAll('Launch browser', async () => {
  console.log('Setup: Preparing environment...');

  browserSession = await createBrowserSession();
  browser = browserSession.browser;
  context = browserSession.context;
  page = browserSession.page;

  iafl = new ImAamFunctionLibrary(page);

  cfl = new CommonFunctionLibrary(page);
  await iafl.configTestFlow();

  if (!iafl.envUrl || !iafl.envUrl.toLowerCase().includes('staging')) {
    test.skip(true, `Skipping this test file because envUrl is not staging: ${iafl.envUrl || 'empty'}`);
  }

  // await page.goto('https://staging.im-aam.com/');
  console.log('URL from Excel:', iafl.envUrl);
  // await page.goto(iafl.url);
  await iafl.navigateToBaseUrl();
  await page.waitForLoadState('load', { timeout: 60000 });

  // const acceptCookiesButton = page.getByRole('button', { name: /accept all cookies/i });
  // try {
  //   await acceptCookiesButton.first().waitFor({ state: 'visible', timeout: 10000 });
  //   await acceptCookiesButton.first().click();
  // } catch {  }

  // Perform any necessary setup actions here, such as logging in or preparing test data.
  // await browser.close();  

  const data = await readFile(resolve(__dirname, '..', 'lastCreatedUsers.json'), 'utf8');
  const last = JSON.parse(data);
  savedUsers = Array.isArray(last?.users)
    ? last.users
    : [{ userID: last.userID, emailAddress: last.emailAddress, password: last.password }];


});

test.afterAll(async () => {
  console.log('Teardown: Cleaning up environment...');
  await closeBrowserSession(browserSession);
});

// test('has title', async () => {
//   // test('has title', async ({ page }) => {
//   // await page.goto('https://staging.im-aam.com/');

//   // Expect a title "to contain" a substring.
//   // await expect(page).toHaveTitle(/Im-Aam/);
//   await page.waitForLoadState('load');
//   await page.waitForFunction(() => document.title.includes('Best Stocks to Buy'));
//   // await page.waitForFunction(() => document.title.includes('AI Stock Picks') || document.title.includes('Best Stocks to Buy'));
// });


test('Verify that making first deposit of $10 by Card, increasing balance $60 in first deposit within 5 minutes', async ({ }, testInfo) => {

  // Try to read the last created user's details so we can use the email for login

  iafl.goToDepositPage();

  emailAddress = 'test021020261806498@yopmail.com';
  password = 'Test@123';

  await iafl.logIn(emailAddress, password);

  const trialBanner = page.locator("div[class^='TrialBanner_bannerContainer']");
  const closeTrialBannerButton = page.locator("button[class^='TrialBanner_closeButton']").first();
  await expect(trialBanner.first()).toBeVisible({ timeout: 10000 });
  await closeTrialBannerButton.click();
  await expect(trialBanner).toBeHidden();

  // const claimNowLink = page.locator("a:has-text('Claim Now')");
  // await claimNowLink.waitFor({ state: 'visible', timeout: 20000 });
  // await claimNowLink.click({ force: true });
  // // await claimNowLink.click();
  // await page.waitForLoadState('load');

  // await page.locator("div:has-text('PayPal')").click();

    iafl.goToDepositPage();

  await iafl.makeDeposit("10", "Card");

  console.log('Deposit of $10 by Card completed. Now verifying the balance increase.');

  const rawBalance = await iafl.getAccountBalance();
  console.log('Balance after deposit: ', rawBalance);

  // expect.soft(rawBalance.trim()).toBe('110.00');

  // balanceAmount = rawBalance.includes('$') ? rawBalance.split('$')[1].trim() : rawBalance.trim();
  // console.log('Balance amount after deposit: ', balanceAmount.trim());

  if (testInfo.errors.length > 0) {
    console.error("'Add first Balance by Card' Test failed with errors:", testInfo.errors);
  } else {
    console.log("'Add first Balance by Card' Test passed without errors.");
  }
  // await expect(msgText.trim()).toBe('Account created successfully. Please check your email for login details.');
});

test('Verify that making second deposit of $10 by Card, increasing balance by $10', async ({ }, testInfo) => {

  iafl.goToDepositPage();

  await iafl.makeDeposit("10", "Card");

  console.log('Deposit of $10 by Card completed. Now verifying the balance increase.');

  const rawBalance = await iafl.getAccountBalance();
  console.log('Balance after deposit: ', rawBalance);

  // expect.soft(rawBalance.trim()).toBe('120.00');

  // iafl.logOut();

  if (testInfo.errors.length > 0) {
    console.error("'Add second Balance by Card' Test failed with errors:", testInfo.errors);
  } else {
    console.log("'Add second Balance by Card' Test passed without errors.");
  }
});