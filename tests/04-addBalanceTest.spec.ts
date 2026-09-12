import { test, expect, Browser, BrowserContext, Page, chromium, firefox, webkit, type TestInfo } from '@playwright/test';
import { appendFile, mkdir, readFile } from 'fs/promises';
import { resolve } from 'path';
// import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
// import { WebActions } from '../lib/webActions';
// import { generateRandomEmail } from '../lib/dataHelper';
import { ImAamFunctionLibrary } from '../lib/ImAamFunctionLibrary';
import { CommonFunctionLibrary } from '../lib/CommonFunctionLibrary';

test.describe.configure({ mode: 'serial' }); // Run tests in this block sequentially

let browser: Browser;
let context: BrowserContext;
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

// export class HomePageUItest {
// constructor(page: Page) {
//   this.page = page;
// }

// Get browser type from environment or default to chromium
const browserType = process.env.BROWSER_TYPE === 'firefox' ? firefox : process.env.BROWSER_TYPE === 'webkit' ? webkit : chromium;
const appHttpCredentials = {
  username: 'asdf',
  password: 'nownew',
};

test.beforeAll('Launch browser', async () => {
  console.log('Setup: Preparing environment...');

  browser = await browserType.launch({
    headless: false,
    args: ['--start-maximized'],
  });
  context = await browser.newContext({
    viewport: null,
    deviceScaleFactor: undefined,
    isMobile: false,
    httpCredentials: appHttpCredentials,
  });
  page = await context.newPage();

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
  // Perform any necessary setup actions here, such as logging in or preparing test data.
  // await browser.close();  
});

test.afterAll(async () => {
  console.log('Teardown: Cleaning up environment...');
  await page.close();
  await context.close();
  await browser.close();
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

test('Verify that making deposit of $10 by Paypal, increasing balance $60 in first deposit within 5 minutes', async ({ }, testInfo) => {

  // Try to read the last created user's details so we can use the email for login
  try {
    const data = await readFile(resolve(__dirname, '..', 'lastCreatedUser.json'), 'utf8');
    const last = JSON.parse(data);
    if (last?.emailAddress) emailAddress = last.emailAddress;
    if (last?.userID) userID = last.userID;
    if (last?.password) password = last.password;
    console.log('Loaded lastCreatedUser.json:', { userID, emailAddress });
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Could not read lastCreatedUser.json, falling back to generated values:', msg);
  }

  await iafl.logIn(emailAddress, password);

  await page.locator("button[class^='TrialBanner_closeButton']").first().click();

  const claimNowLink = page.locator("a:has-text('Claim Now')");
  await claimNowLink.waitFor({ state: 'visible', timeout: 20000 });
  await claimNowLink.click({ force: true });
  // await claimNowLink.click();
  await page.waitForLoadState('load');

  // await page.locator("div:has-text('PayPal')").click();
  await page.locator("g[clip-path*='paypal_icon']").click();
  await page.waitForLoadState('load');

  await page.fill("div[class^='input_inputContainer']>input", "10");

  await page.locator("button:has-text('Deposit')").scrollIntoViewIfNeeded();
  await page.locator("button:has-text('Deposit')").click();
  await page.waitForLoadState('load');

  await page.locator("button:has-text('Confirm Deposit')").scrollIntoViewIfNeeded();
  await page.locator("button:has-text('Confirm Deposit')").click();
  await page.waitForLoadState('load');

  await page.fill("#email", "bulk-sb-7509c89e59cc4e9f9f079c6ab1@business.example.com");
  await page.locator("#btnNext").click();
  await page.waitForLoadState('load');

  await page.locator("#password").fill("iaam@123");

  await page.locator("#btnLogin").click();
  await page.waitForLoadState('load');

  await page.locator("button:has-text('Complete Purchase')").click();
  await page.waitForLoadState('load');

  try {
    await page.waitForTimeout(6000); // Wait for 6 seconds
  } catch { }
  await page.waitForLoadState('load');

  console.log('Deposit of $10 by Paypal completed. Now verifying the balance increase.');

  const rawBalance = await iafl.getAccountBalance();
  console.log('Balance after deposit: ', rawBalance);

  expect.soft(rawBalance.trim()).toBe('110.00');

  // balanceAmount = rawBalance.includes('$') ? rawBalance.split('$')[1].trim() : rawBalance.trim();
  // console.log('Balance amount after deposit: ', balanceAmount.trim());

  if (testInfo.errors.length > 0) {
    console.error("'Create User' Test failed with errors:", testInfo.errors);
  } else {
    console.log("'Create User' Test passed without errors.");
  }

  // await expect(msgText.trim()).toBe('Account created successfully. Please check your email for login details.');

});


// }
