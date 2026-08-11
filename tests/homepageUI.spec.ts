import { test, expect, Browser, BrowserContext, Page, chromium, firefox, webkit } from '@playwright/test';
// import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { ImAamFunctionLibrary } from '../lib/ImAamFunctionLibrary';
import { CommonFunctionLibrary } from '../lib/CommonFunctionLibrary';

test.describe.configure({ mode: 'serial' }); // Run tests in this block sequentially

let browser: Browser;
let context: BrowserContext;
let page: Page;

let iafl: ImAamFunctionLibrary;
let cfl: CommonFunctionLibrary;


// export class HomePageUItest {
// constructor(page: Page) {
//   this.page = page;
// }

// Get browser type from environment or default to chromium
const browserType = process.env.BROWSER_TYPE === 'firefox' ? firefox : process.env.BROWSER_TYPE === 'webkit' ? webkit : chromium;

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
  // await page.goto('https://staging.im-aam.com/');
  console.log('URL from Excel:', iafl.url);
  // await page.goto(iafl.url);
  await iafl.navigateToBaseUrl();
  await page.waitForLoadState('load'); 
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

test('has title', async () => {
  await page.waitForLoadState('load'); 
  // test('has title', async ({ page }) => {
  // await page.goto('https://staging.im-aam.com/');

  // Expect a title "to contain" a substring.
  // await expect(page).toHaveTitle(/Im-Aam/);
  // await expect(page).toHaveTitle(/AI Picks/);
  // await expect(page).toHaveTitle('Best Stock Analysis App (AI Picks & Market Research)');
  await expect(page).toHaveTitle('Best Stock Analysis App | AI Stock Picks & Real-Time Market Research');
  // await page.waitForFunction(() => document.title.includes('Best Stock Analysis App (AI Picks & Market Research)'));
});

test('Home page has expected UI elements', async ({ }, testInfo) => {
  // test('has expected UI elements', async (testInfo) => {
  // test('has expected UI elements', async ({page},testInfo) => {
  // await page.goto('https://staging.im-aam.com/');

  // Check for the presence of key UI elements.
  await expect.soft(page.locator("img[src='/logo.png']")).toBeVisible();
  await expect.soft(page.locator("h1:has-text('The Investment Manager Powered by an Artificial Machine')")).toBeVisible();
  await expect.soft(page.locator("img[src='/assets/landing/landing.png']")).toBeVisible();
  await expect.soft(page.getByText('Identify the best opportunities in the share market today using AI-powered stock insights')).toBeVisible();
  await expect.soft(page.locator("button:has-text('Login')")).toBeVisible();
  await expect.soft(page.locator("button:has-text('Register')")).toBeVisible();
  await expect.soft(page.locator("p:has-text('Continue As Guest')")).toBeVisible();
  await expect.soft(page.locator("p[class^='page_landingBottom_text']")).toBeVisible();
  await expect.soft(page.locator("img[src='/assets/landing/landing.png']")).toBeVisible();

  // if(testInfo.page.pageErrors.length > 0) {
  //   console.error('Test failed with errors:', testInfo.page.pageErrors);
  // } else {
  //   console.log('Test passed without errors.');
  // }

  if (testInfo.errors.length > 0) {
    console.error('Test failed with errors:', testInfo.errors);
  } else {
    console.log('Test passed without errors.');
  }


});
// }