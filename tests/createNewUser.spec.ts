import { test, expect, Browser, BrowserContext, Page, chromium, firefox, webkit } from '@playwright/test';
import { appendFile } from 'fs/promises';
import { resolve } from 'path';
// import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
// import { WebActions } from '../lib/webActions';
// import { generateRandomEmail } from '../lib/dataHelper';
import { ImAamFunctionLibrary } from '../lib/ImAamFunctionLibrary';
import { CommonFunctionLibrary } from '../lib/CommonFunctionLibrary';

test.describe.configure({ mode: 'serial' }); // Run tests in this block sequentially

let browser: Browser;
let context: BrowserContext;
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

async function appendUserNameToTextFile(name: string) {
  let notepadFilePath;
  console.log('URL from Excel(in append username function):', (iafl.url));
  // if ((iafl.url.toString()).toLowerCase().includes("staging")) {
  if ((iafl.url).includes("staging")) {
    notepadFilePath = resolve(__dirname, '..', 'StagingUsers.txt');
  } else {
    notepadFilePath = resolve(__dirname, '..', 'LiveUsers.txt');
  }
  await appendFile(notepadFilePath, `\n${name}`, 'utf8');
}



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
  // test('has title', async ({ page }) => {
  // await page.goto('https://staging.im-aam.com/');

  // Expect a title "to contain" a substring.
  // await expect(page).toHaveTitle(/Im-Aam/);
  await page.waitForLoadState('load');
  // await expect(page).toHaveTitle(/AI Picks/);
  await page.waitForFunction(() => document.title.includes('AI Stock Picks'));
});

test('Verify add user functionality is working fine', async ({ }, testInfo) => {
  let phoneNumber: string;

  userID = 'test'+cfl.getTimestampManual();
  emailAddress = userID + '@yopmail.com';
  password = "Test@123";
  let randomNineDigitNumber = Math.floor(100000000 + Math.random() * 900000000).toString();
  phoneNumber = '9' + randomNineDigitNumber;

  console.log('Generated User ID:', userID);
  console.log('Generated Email Address:', emailAddress);
  console.log('Generated Phone Number:', phoneNumber);

  // await page.goto('https://staging.im-aam.com/');
  await page.click("button:has-text('Register')");
  await page.waitForLoadState('load');
  // await expect(page).toHaveTitle('Register: Start Investing with AI');
  await page.waitForFunction(() => document.title.includes('Register: Start Investing with AI'));
  await page.fill("input[placeholder='Full Name']", "TestUser " + userID);
  await page.fill("input[placeholder='User Name']", userID);
  await page.fill("input[placeholder='Email']", emailAddress);
  await page.fill("//input[@type='tel']", "+91" + phoneNumber);
  await page.fill("input[placeholder='Password']", password);
  await page.fill("input[placeholder='Confirm Password']", password);

  await page.locator("//input[@type='checkbox']").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000); // Wait for 1 second to ensure the checkbox state is updated
  await page.locator("//input[@type='checkbox']").check();
  await page.waitForLoadState('load');
  
  await page.locator("//button[contains(text(),'Register')]").scrollIntoViewIfNeeded();
  await page.click("//button[contains(text(),'Register')]");
  await page.waitForLoadState('load');

  msgText = await page.locator("div[class*='auth_localPadding']").innerText() || '';
  console.log('Message Text:', msgText);

  try {
    if (await page.locator("text=✅ Registration successful! Please check your email to verify your account.").isVisible()) {
      console.log('Successful registration message is visible.');
      userName = userID;
      console.log('Username of created user:', userName);
      await appendUserNameToTextFile(userName);
      await page.getByText('Back').click();
    } else
      console.log('Successful registration message is NOT visible.');
  } catch (error) {
    console.log('Successful registration message is NOT found.');
    if (error instanceof Error) {
      console.log("Error: " + error.message);
    }
    console.error('Error while checking registration success message:', error);
  }

  iafl.logIn(userID, "TotallyWrongPassword");
  msgText = await page.locator("span[class*='auth_formError']").innerText() || '';
  console.log('Error message text for wrong password before activation: ', msgText);
  expect.soft(msgText.trim()).toBe('Account is not verified. Please verify your email first.');

  iafl.logIn(userID, password);
  await page.waitForLoadState('load');
  msgText = await page.locator("span[class*='auth_formError']").innerText() || '';
  console.log('Error message text for non-active account: ', msgText);
  expect.soft(msgText.trim()).toBe('Account is not verified. Please verify your email first.');

  // await page.goto('https://www.yopmail.com/');
  // await page.locator("#login").fill(emailAddress);
  // await page.locator("#login").press('Enter');
  // await page.waitForLoadState('load');
  // await page.frameLocator("#ifinbox").locator("div:has-text('Im-Aam')").first().click();
  // await page.waitForLoadState('load');

  // for (let i = 0; i < 10; i++) {
  //   try {
  //     if (await page.locator("//div[contains(text(),'This inbox is empty')]").count() > 0) {
  //       console.log('Inbox is empty, need to refresh... Attempt #' + (i + 1));
  //       await page.locator("#refresh").click();
  //       await page.waitForLoadState('load');
  //       await page.waitForTimeout(2000);
  //     } else {
  //       break;
  //     }
  //   } catch (error) {
  //     console.error('There is exception while checking inbox status:', error);
  //     page.reload();
  //     await page.waitForLoadState('load');
  //     await page.waitForTimeout(2000);
  //   }
  // }

  // await page.frameLocator("iframe[name='ifinbox']").locator(".lm").click();

  // const [newPageInNewTab] = await Promise.all([
  //   page.waitForEvent('popup'),
  //   page.frameLocator("iframe[name='ifmail']").getByText("Activate Account").click(),
  // ]);

  // iafl2 = new ImAamFunctionLibrary(newPageInNewTab);

  // let msgTextAfterAccountActivation: string = await newPageInNewTab.locator("div[class^='auth_formContainer']").innerText();
  // console.log('Message text after clicking on account activation link:', msgTextAfterAccountActivation);

  // if (msgTextAfterAccountActivation === 'Verifying your email...') {
  //   console.log('Account verification successful message is visible after clicking activation link.');
  // }

  // expect.soft(msgTextAfterAccountActivation.trim()).toBe('Verifying your email...');

  // await newPageInNewTab.waitForLoadState('load');
  // await newPageInNewTab.waitForTimeout(8000);

  // msgTextAfterAccountActivation = await newPageInNewTab.locator("div[class*='auth_localPadding']").innerText() || '';
  // console.log('Message text after few seconds of clicking on account activation link:', msgTextAfterAccountActivation);

  // expect.soft(msgTextAfterAccountActivation.trim()).toBe('Email verified successfully! Login');

  // newPageInNewTab.locator("a:has-text('Login')").click();

  // newPageInNewTab.getByPlaceholder("Enter your username or email").fill(userID);
  // newPageInNewTab.getByPlaceholder("Enter Password").fill("TotallyWrongPassword");
  // newPageInNewTab.locator("button:has-text('Login')").click();

  if (testInfo.errors.length > 0) {
    console.error('Test failed with errors:', testInfo.errors);
  } else {
    console.log('Test passed without errors.');
  }

  // await expect(msgText.trim()).toBe('Account created successfully. Please check your email for login details.');

});

test('Verify user activation functionality is working fine', async ({ }, testInfo) => {
  await page.goto('https://www.yopmail.com/');
  await page.locator("#login").fill(emailAddress);
  await page.locator("#login").press('Enter');
  await page.waitForLoadState('load');
  // await page.frameLocator("#ifinbox").locator("div:has-text('Im-Aam')").first().click();
  
  for (let i = 0; i < 10; i++) {
    try {
      if (await page.locator("//div[contains(text(),'This inbox is empty')]").count() > 0) {
        console.log('Inbox is empty, need to refresh... Attempt #' + (i + 1));
        await page.locator("#refresh").click();
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
      } else {
        break;
      }
    } catch (error) {
      console.error('There is exception while checking inbox status:', error);
      page.reload();
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);
    }
  }

  await page.frameLocator("#ifinbox").locator("div:has-text('IM-AAM')").first().click();
  await page.waitForLoadState('load');

  await page.frameLocator("iframe[name='ifinbox']").locator(".lm").click();

  [newPageInNewTab] = await Promise.all([
    page.waitForEvent('popup'),
    page.frameLocator("iframe[name='ifmail']").getByText("Activate Account").click(),
  ]);

  iafl2 = new ImAamFunctionLibrary(newPageInNewTab);

  let msgTextAfterAccountActivation: string = await newPageInNewTab.locator("div[class^='auth_formContainer']").innerText();
  console.log('Message text after clicking on account activation link:', msgTextAfterAccountActivation);

  if (msgTextAfterAccountActivation === 'Verifying your email...') {
    console.log('Account verification successful message is visible after clicking activation link.');
  }

  expect.soft(msgTextAfterAccountActivation.trim()).toBe('Verifying your email...');

  await newPageInNewTab.waitForLoadState('load');
  await newPageInNewTab.waitForTimeout(8000);

  msgTextAfterAccountActivation = await newPageInNewTab.locator("div[class*='auth_localPadding']").innerText() || '';
  console.log('Message text after few seconds of clicking on account activation link:', msgTextAfterAccountActivation);

  expect.soft(msgTextAfterAccountActivation.trim()).toBe('Email verified successfully! Login');

  newPageInNewTab.locator("a:has-text('Login')").click();
  await newPageInNewTab.waitForLoadState('load');
  // await newPageInNewTab.waitForTimeout(2000);
  // newPageInNewTab.getByPlaceholder("Enter your username or email").click();
  await newPageInNewTab.getByPlaceholder("Enter your username or email").fill(userID);
  newPageInNewTab.getByPlaceholder("Enter Password").fill("TotallyWrongPassword");
  newPageInNewTab.locator("button:has-text('Login')").click();
  msgText = await newPageInNewTab.locator("span[class^='auth_formError']").innerText();
  console.log('Error message text for wrong password after activation: ', msgText);
  expect.soft(msgText.trim()).toBe('Invalid password.');

  newPageInNewTab.locator("input[type='password']").clear();
  newPageInNewTab.locator("input[type='password']").fill(password);
  newPageInNewTab.locator("button:has-text('Login')").click();

  await newPageInNewTab.waitForLoadState('load');
  await newPageInNewTab.waitForSelector("div[class^='layout_appContainer']", { state: 'attached' });
  await newPageInNewTab.waitForTimeout(2000);

  if (await newPageInNewTab.locator("div[class^='layout_appContainer']").count() > 0) {
    console.log('User is able to login successfully after account activation.');
  } else {
    console.log('User is NOT able to login successfully after account activation.');
  }
  expect.soft(newPageInNewTab.locator("div[class^='layout_appContainer']")).toBeVisible();

  if (testInfo.errors.length > 0) {
    console.error('Test failed with errors:', testInfo.errors);
  } else {
    console.log('Test passed without errors.');
  }

});

test('Trial pop-up & balance verifications', async ({ }, testInfo) => {
  let balanceText: string;

  // expect.soft(page.locator("div[class^='trialpopup_trialPopupContainer']")).toBeVisible();
  await expect(newPageInNewTab.locator("div[class^='TrialBanner_bannerContainer']").nth(0)).toBeVisible({ timeout: 10000 });

  if ((await newPageInNewTab.locator("button[class^='TrialBanner_closeButton']").nth(0).isVisible()) &&
    (await newPageInNewTab.locator("div[class^='TrialBanner_infoIcon']").nth(0).isVisible()) &&
    (await newPageInNewTab.locator("h3:has-text('How Your Free Trial Works')").first().isVisible()) &&
    // (await newPageInNewTab.locator("text=Your free trial ends in 6 days").first().isVisible()) &&
    (await newPageInNewTab.locator("button:has-text('Start Your Free Trial Now')").first().isVisible())) {
    console.log("All elements are present in trial pop-up.");
    expect.soft(true).toBeTruthy();
  } else {
    console.log("All elements are NOT present in trial pop-up.");
    expect.soft(false).toBeTruthy();
  }

  await newPageInNewTab.locator("button[class^='TrialBanner_closeButton']").first().click();

  balanceText = await iafl2.getAccountBalance();
  console.log('Account balance before Top-up: ', balanceText);

  if (testInfo.errors.length > 0) {
    console.error('Test failed with errors:', testInfo.errors);
  } else {
    console.log('Test passed without errors.');
  }

});


test.skip('has expected UI elements', async ({ }, testInfo) => {
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