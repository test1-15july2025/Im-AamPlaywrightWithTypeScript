import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
// import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { ImAamFunctionLibrary } from '../lib/ImAamFunctionLibrary';
import { CommonFunctionLibrary } from '../lib/CommonFunctionLibrary';
import { BrowserSession, closeBrowserSession, createBrowserSession } from '../lib/browserSession';
import { link } from 'fs';

test.describe.configure({ mode: 'serial' }); // Run tests in this block sequentially
test.setTimeout(180000);

let browser: Browser;
let context: BrowserContext;
let page: Page;
let browserSession: BrowserSession;

let iafl: ImAamFunctionLibrary;
let cfl: CommonFunctionLibrary;

test.beforeAll('Launch browser', async () => {
  console.log('Setup: Preparing environment...');

  browserSession = await createBrowserSession();
  browser = browserSession.browser;
  context = browserSession.context;
  page = browserSession.page;
  iafl = new ImAamFunctionLibrary(page);
  cfl = new CommonFunctionLibrary(page);
  await iafl.configTestFlow();
  if (!iafl.envUrl) {
    throw new Error('Base URL was not loaded from test data. Check test-data/testData.xlsx and the Environment URL column.');
  }
  console.log('URL from Excel:', iafl.envUrl);
  await iafl.navigateToBaseUrl();
  await page.waitForLoadState('load', { timeout: 60000 });

  // const acceptCookiesButton = page.getByRole('button', { name: /accept all cookies/i });
  // try {
  //   await acceptCookiesButton.first().waitFor({ state: 'visible', timeout: 10000 });
  //   await acceptCookiesButton.first().click();
  // } catch {
  //   // The cookie ribbon may not be shown when consent is already stored.
  // }
  // await page.goto('https://staging.im-aam.com/');
  // Perform any necessary setup actions here, such as logging in or preparing test data.
  // await browser.close();  
});

test.afterAll(async () => {
  console.log('Teardown: Cleaning up environment...');
  await closeBrowserSession(browserSession);
});

test('Verify that correct free trial pop-up is there for the guest user', async ({ }, testInfo) => {
  // test('has expected UI elements', async (testInfo) => {
  // test('has expected UI elements', async ({page},testInfo) => {
  // await page.goto('https://staging.im-aam.com/');

  // Check for the presence of key UI elements.

  // await page.click("p:has-text('Continue As Guest')");
  await page.click("a:has-text('Continue as Guest →')");
  await page.waitForLoadState('load', { timeout: 60000 });

  // Check for the presence of the free trial pop-up.
  await expect(page.locator("div[class*='FreeTrialPopUP_trialModal']")).toBeVisible({ timeout: 20000 });

  await expect.soft(page.locator("button[class^='FreeTrialPopUP_customCloseBtn']")).toBeVisible();
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

  // await page.locator("svg[class^='header_alignLeft']").click();

  if (testInfo.errors.length > 0) {
    console.error('Test failed with errors:', testInfo.errors);
  } else {
    console.log('Test passed without errors.');
  }
});

test("Verify that no table cell contains 'N/A' in position trader table", async ({ }, testInfo) => {
  await cfl.waitForSeconds(5);
  if(await page.locator("div[class^='porfolioTable_tableContainer'] td").count() === 0){
    console.warn('No table cells found in Position Trader table. Skipping N/A check.');
    return;
  }else{
    const cells = page.locator("div[class^='porfolioTable_tableContainer'] td");
    const count = await cells.count();    
    for (let i = 0; i < count; i++) {
      await expect(cells.nth(i)).not.toContainText('N/A', { timeout: 5000 });
    }
  }

  if (testInfo.errors.length > 0) {
    console.error('Test failed with errors:', testInfo.errors);
  } else {
    console.log('Test passed without errors.');
  }
});

test("Verify that no table cell contains 'N/A' in swing trader table", async ({ }, testInfo) => {
  await page.click("a:has-text('Swing Trader')");
  await page.waitForLoadState('load', { timeout: 60000 });
  await cfl.waitForSeconds(5);
  
  if(await page.locator("div[class^='porfolioTable_tableContainer'] td").count() === 0){
    console.warn('No table cells found in Swing Trader table. Skipping N/A check.');
    return;
  }else{
    const cells = page.locator("div[class^='porfolioTable_tableContainer'] td");
    const count = await cells.count();

    if(await page.locator("div[class^='porfolioTable_tableContainer'] td").count() > 0){
      for (let i = 0; i < count; i++) {
        await expect(cells.nth(i)).not.toContainText('N/A', { timeout: 5000 });
      }
    }  
  }

  if (testInfo.errors.length > 0) {
    console.error('Test failed with errors:', testInfo.errors);
  } else {
    console.log('Test passed without errors.');
  }
});

test("Verify that no table cell contains 'N/A' in daily trader table", async ({ }, testInfo) => {
  await page.click("a:has-text('Daily Trader')");
  await page.waitForLoadState('load', { timeout: 60000 });
  await cfl.waitForSeconds(5);
  if(await page.locator("div[class^='porfolioTable_tableContainer'] td").count() > 0){
    const cells = page.locator("div[class^='porfolioTable_tableContainer'] td");
    const count = await cells.count();
    
    for (let i = 0; i < count; i++) {
      await expect(cells.nth(i)).not.toContainText('N/A', { timeout: 5000 });
    }
  }else{
    console.warn('No table cells found in Daily Trader table. Skipping N/A check.');
    return;
  }


  if (testInfo.errors.length > 0) {
    console.error('Test failed with errors:', testInfo.errors);
  } else {
    console.log('Test passed without errors.');
  }
});