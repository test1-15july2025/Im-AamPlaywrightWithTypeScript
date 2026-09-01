import { test, expect, Browser, BrowserContext, Page, chromium, firefox, webkit } from '@playwright/test';
// import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { ImAamFunctionLibrary } from '../lib/ImAamFunctionLibrary';
import { CommonFunctionLibrary } from '../lib/CommonFunctionLibrary';
import { link } from 'fs';

test.describe.configure({ mode: 'serial' }); // Run tests in this block sequentially
test.setTimeout(180000);

let browser: Browser;
let context: BrowserContext;
let page: Page;

let iafl: ImAamFunctionLibrary;
let cfl: CommonFunctionLibrary;

// Get browser type from environment or default to chromium
const browserType = process.env.BROWSER_TYPE === 'firefox' ? firefox : process.env.BROWSER_TYPE === 'webkit' ? webkit : chromium;

test.beforeAll('Launch browser', async () => {
  console.log('Setup: Preparing environment...');

  browser = await browserType.launch({
    headless: false,
    args: ['--start-maximized'],
    timeout: 120000,
  });
  context = await browser.newContext({
    viewport: null,
    deviceScaleFactor: undefined,
    isMobile: false,
    httpCredentials: {
      // username: 'test',
      // password: 'test',
      username: 'asdf',
      password: 'nownew',
    },
  });
  page = await context.newPage();
  iafl = new ImAamFunctionLibrary(page);
  cfl = new CommonFunctionLibrary(page);
  await iafl.configTestFlow();
  if (!iafl.envUrl) {
    throw new Error('Base URL was not loaded from test data. Check test-data/testData.xlsx and the Environment URL column.');
  }
  console.log('URL from Excel:', iafl.envUrl);
  await iafl.navigateToBaseUrl();
  await page.waitForLoadState('load', { timeout: 60000 });
  // await page.goto('https://staging.im-aam.com/');
  // Perform any necessary setup actions here, such as logging in or preparing test data.
  // await browser.close();  
});

test.afterAll(async () => {
  console.log('Teardown: Cleaning up environment...');
  await page.close();
  await context.close();
  await browser.close();
});

test('Verify that correct free trial pop-up is there for the guest user', async ({ }, testInfo) => {
  // test('has expected UI elements', async (testInfo) => {
  // test('has expected UI elements', async ({page},testInfo) => {
  // await page.goto('https://staging.im-aam.com/');

  // Check for the presence of key UI elements.

  page.click("p:has-text('Continue As Guest')");
  page.waitForLoadState('load', { timeout: 60000 });

  // Check for the presence of the free trial pop-up.
  await expect(page.locator("div[class*='FreeTrialPopUP_trialModal']")).toBeVisible();

  await expect.soft(page.locator("div[class^='FreeTrialPopUP_customCloseBtn']")).toBeVisible();
  await expect.soft(page.locator("img[src='/trial-icon.webp']")).toBeVisible();
  await expect.soft(page.locator("h2:has-text('Start Your Free 7-Day Trial Today!')")).toBeVisible();
  await expect.soft(page.locator("p[class^='FreeTrialPopUP_trialText']")).toContainText('Get instant access to exclusive AI-powered stock recommendations and discover the best stocks to buy now.');
  await expect.soft(page.locator("p>span")).toContainText('just sign up and start exploring!');
  await expect.soft(page.locator("ul[class^='FreeTrialPopUP_trialList']>li").nth(0)).toHaveText('✔ 7 days of free stock picks');
  await expect.soft(page.locator("ul[class^='FreeTrialPopUP_trialList']>li").nth(1)).toHaveText('✔ Real-time stock analysis');
  await expect.soft(page.locator("ul[class^='FreeTrialPopUP_trialList']>li").nth(2)).toHaveText('✔ AI-powered insights');
  await expect.soft(page.locator("p[class^='FreeTrialPopUP_trialNote']>strong")).toHaveText('You must use the $50 only during the free trial period.');
  await expect.soft(page.locator("p[class^='FreeTrialPopUP_trialNote']")).toContainText("Don't miss your chance to stay ahead in the market");
  await expect.soft(page.locator("button[class^='FreeTrialPopUP_btn']").nth(0)).toHaveText('REGISTER');
  await expect.soft(page.locator("button[class^='FreeTrialPopUP_btn']").nth(1)).toHaveText('LOGIN');

  await page.locator("div[class*='FreeTrialPopUP_trialModal']").press('Escape');

  await expect(page.locator("div[class*='FreeTrialPopUP_trialModal']")).toBeHidden();

  if (testInfo.errors.length > 0) {
    console.error('Test failed with errors:', testInfo.errors);
  } else {
    console.log('Test passed without errors.');
  }
});

test("Verify that no table cell contains 'N/A' in position trader table", async ({ }, testInfo) => {
  await expect(page.locator("div[class^='porfolioTable_tableContainer'] td")).not.toContainText('N/A');

  if (testInfo.errors.length > 0) {
    console.error('Test failed with errors:', testInfo.errors);
  } else {
    console.log('Test passed without errors.');
  }
});

test("Verify that no table cell contains 'N/A' in swing trader table", async ({ }, testInfo) => {
  page.click("a:has-text('Swing Trader')");
  page.waitForLoadState('load', { timeout: 60000 });

  await expect(page.locator("div[class^='porfolioTable_tableContainer'] td")).not.toContainText('N/A');

  if (testInfo.errors.length > 0) {
    console.error('Test failed with errors:', testInfo.errors);
  } else {
    console.log('Test passed without errors.');
  }
});

test("Verify that no table cell contains 'N/A' in daily trader table", async ({ }, testInfo) => {
  page.click("a:has-text('Daily Trader')");
  page.waitForLoadState('load', { timeout: 60000 });

  await expect(page.locator("div[class^='porfolioTable_tableContainer'] td")).not.toContainText('N/A');

  if (testInfo.errors.length > 0) {
    console.error('Test failed with errors:', testInfo.errors);
  } else {
    console.log('Test passed without errors.');
  }
});