import { test, expect, Browser, BrowserContext, Page, type TestInfo } from '@playwright/test';
import { appendFile, mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';
// import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
// import { WebActions } from '../lib/webActions';
// import { generateRandomEmail } from '../lib/dataHelper';
import { ImAamFunctionLibrary } from '../lib/ImAamFunctionLibrary';
import { CommonFunctionLibrary } from '../lib/CommonFunctionLibrary';
import { BrowserSession, closeBrowserSession, createAuthenticatedContext, createBrowserSession } from '../lib/browserSession';

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
let registeredUsers: UserDetails[] = [];
let counter: number = 0;
let shouldIncludePhoneNumber: boolean = true;

type UserDetails = {
  userID: string;
  emailAddress: string;
  password: string;
};

async function captureAllOpenPagesOnFailure(testInfo: TestInfo, browserInstance: Browser | undefined) {
  if (!browserInstance || testInfo.status !== 'failed') {
    return;
  }

  const screenshotsDir = resolve(__dirname, '..', 'test-results', 'failure-screenshots');
  await mkdir(screenshotsDir, { recursive: true });

  const contexts = browserInstance.contexts();
  for (const [contextIndex, contextInstance] of contexts.entries()) {
    const pages = contextInstance.pages();
    for (const [pageIndex, openPage] of pages.entries()) {
      const pageName = (openPage.url() || 'about:blank')
        .replace(/^https?:\/\//, '')
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'blank';
      const screenshotPath = resolve(screenshotsDir, `page_${contextIndex + 1}_${pageIndex + 1}_${pageName}.png`);

      await openPage.screenshot({ path: screenshotPath, fullPage: true });
      await testInfo.attach(`all-open-pages-${contextIndex + 1}-${pageIndex + 1}`, {
        path: screenshotPath,
        contentType: 'image/png',
      });
    }
  }
}

async function appendUserNameToTextFile(name: string) {
  let notepadFilePath;
  console.log('URL from Excel(in append username function):', (iafl.envUrl));
  // if ((iafl.envUrl.toString()).toLowerCase().includes("staging")) {
  if ((iafl.envUrl).includes("staging")) {
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

async function registerUser(): Promise<UserDetails> {
  const createdUserID = 'test' + cfl.getTimestampManual() + Math.floor(Math.random() * 10);
  const createdEmailAddress = createdUserID + '@yopmail.com';
  const createdPassword = 'Test@123';
  const phoneNumber = '9' + Math.floor(100000000 + Math.random() * 900000000).toString();

  console.log('Generated User ID:', createdUserID);
  console.log('Generated Email Address:', createdEmailAddress);
  console.log('Generated Phone Number:', phoneNumber);

  // await page.click("button:has-text('Register')");
  // await page.click(("a[href='/registration']").nth(0));

  const registrationLink = page.locator("a[href='/registration']:visible").first();
  await expect(registrationLink).toBeVisible({ timeout: 15000 });
  await registrationLink.click();

  await page.waitForLoadState('load');
  await page.waitForFunction(() => document.title.includes('Register: Start Investing with AI'));
  await page.fill("input[placeholder='Full Name']", 'TestUser ' + createdUserID);
  await page.fill("input[placeholder='User Name']", createdUserID);
  await page.fill("input[placeholder='Email']", createdEmailAddress);
  if (shouldIncludePhoneNumber) {
    await page.fill("//input[@type='tel']", '+91' + phoneNumber);
    shouldIncludePhoneNumber = shouldIncludePhoneNumber ? false : true; // Toggle the flag for the next user
  }
  // await page.fill("//input[@type='tel']", '+91' + phoneNumber);
  await page.fill("input[placeholder='Password']", createdPassword);
  await page.fill("input[placeholder='Confirm Password']", createdPassword);

  await page.locator("//input[@type='checkbox']").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.locator("//input[@type='checkbox']").check();
  await page.waitForLoadState('load');
  await page.locator("//button[contains(text(),'Register')]").scrollIntoViewIfNeeded();
  await page.click("//button[contains(text(),'Register')]");
  await page.waitForLoadState('load');

  msgText = await page.locator("div[class*='auth_localPadding']").innerText() || '';
  console.log('Message Text:', msgText);
  await expect(page.locator("text=✅ Registration successful! Please check your email to verify your account.")).toBeVisible();

  await appendUserNameToTextFile(createdUserID);
  await page.getByText('Back').click();

  return {
    userID: createdUserID,
    emailAddress: createdEmailAddress,
    password: createdPassword,
  };
}

test.beforeAll('Launch browser', async () => {
  test.setTimeout(180000);
  console.log('Setup: Preparing environment...');

  browserSession = await createBrowserSession();
  browser = browserSession.browser;
  context = browserSession.context;
  page = browserSession.page;

  iafl = new ImAamFunctionLibrary(page);

  cfl = new CommonFunctionLibrary(page);
  await iafl.configTestFlow();
  // await page.goto('https://staging.im-aam.com/');
  console.log('URL from Excel:', iafl.envUrl);
  // await page.goto(iafl.url);
  await iafl.navigateToBaseUrl();
  await page.waitForLoadState('load', { timeout: 60000 });

  try {
    const acceptButton = page.locator("button:has-text('Accept')");
    if (await acceptButton.count() > 0) {
      await acceptButton.first().click();
      await page.waitForLoadState('load');
    }
  } catch (error) { }

  // const acceptCookiesButton = page.getByRole('button', { name: /accept all cookies/i });
  // try {
  //   await acceptCookiesButton.first().waitFor({ state: 'visible', timeout: 10000 });
  //   await acceptCookiesButton.first().click();
  // } catch {
  //   // The cookie ribbon may not be shown when consent is already stored.
  // }
  // Perform any necessary setup actions here, such as logging in or preparing test data.
  // await browser.close();  
});

test.afterEach(async ({ }, testInfo) => {
  await captureAllOpenPagesOnFailure(testInfo, browser);
});

test.afterAll(async () => {
  console.log('Teardown: Cleaning up environment...');
  await closeBrowserSession(browserSession);
});

test('has title', async () => {
  // test('has title', async ({ page }) => {
  // await page.goto('https://staging.im-aam.com/');

  // Expect a title "to contain" a substring.
  // await expect(page).toHaveTitle(/Im-Aam/);
  await page.waitForLoadState('load');
  await page.waitForFunction(() => document.title.includes('Best Stocks to Buy'));
  // await page.waitForFunction(() => document.title.includes('AI Stock Picks') || document.title.includes('Best Stocks to Buy'));
});

test('Verify add user functionality is working fine', async ({ }, testInfo) => {
  test.setTimeout(180000);
  const users = [await registerUser(), await registerUser()];
  registeredUsers = users;
  [userID, emailAddress, password] = [users[0].userID, users[0].emailAddress, users[0].password];
  userName = userID;

  await writeFile(
    resolve(__dirname, '..', 'lastCreatedUsers.json'),
    JSON.stringify({ users }, null, 2),
    'utf8',
  );
  console.log('Saved lastCreatedUsers.json with two created users.');

  iafl.logIn(userID, "TotallyWrongPassword");
  msgText = await page.locator("span[class*='auth_formError']").innerText() || '';
  console.log('Error message text for wrong password before activation: ', msgText);
  expect.soft(msgText.trim()).toBe('Account is not verified. Please verify your email first.');

  iafl.logIn(userID, password);
  await page.waitForLoadState('load');
  msgText = await page.locator("span[class*='auth_formError']").innerText() || '';
  console.log('Error message text for non-active account: ', msgText);
  expect.soft(msgText.trim()).toBe('Account is not verified. Please verify your email first.');

  if (testInfo.errors.length > 0) {
    console.error("'Create User' Test failed with errors:", testInfo.errors);
  } else {
    console.log("'Create User' Test passed without errors.");
  }

  // await expect(msgText.trim()).toBe('Account created successfully. Please check your email for login details.');

});

async function activateUser(user: UserDetails, testInfo: TestInfo): Promise<Page> {
  userID = user.userID;
  emailAddress = user.emailAddress;
  password = user.password;

  if (!yopmailContext) {
    yopmailContext = await createAuthenticatedContext(browserSession);
  }
  const yopmailPage = await yopmailContext.newPage();

  await yopmailPage.goto('https://www.yopmail.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  try {
    await yopmailPage.waitForLoadState('domcontentloaded', { timeout: 30000 });
  } catch (error) {
    console.warn('Yopmail DOMContentLoaded wait timed out; continuing with the inbox check.', error);
  }
  await yopmailPage.locator('#login').waitFor({ state: 'visible', timeout: 30000 });

  await yopmailPage.locator("#login").clear();
  await yopmailPage.locator("#login").fill(emailAddress);
  await yopmailPage.locator("#login").press('Enter');
  await yopmailPage.waitForLoadState('load');
  // await yopmailPage.frameLocator("#ifinbox").locator("div:has-text('Im-Aam')").first().click();

  for (let i = 0; i < 10; i++) {
    try {
      if (await yopmailPage.locator("//div[contains(text(),'This inbox is empty')]").count() > 0) {
        console.log('Inbox is empty, need to refresh... Attempt #' + (i + 1));
        await yopmailPage.locator("#refresh").click();
        await yopmailPage.waitForLoadState('load');
        await yopmailPage.waitForTimeout(2000);
      } else {
        break;
      }
    } catch (error) {
      console.error('There is exception while checking inbox status:', error);
      yopmailPage.reload();
      await yopmailPage.waitForLoadState('load');
      await yopmailPage.waitForTimeout(2000);
    }
  }

  await yopmailPage.frameLocator("#ifinbox").locator("div:has-text('IM-AAM')").first().click();
  await yopmailPage.waitForLoadState('load');

  await yopmailPage.frameLocator("iframe[name='ifinbox']").locator(".lm").click();

  [newPageInNewTab] = await Promise.all([
    yopmailPage.waitForEvent('popup'),
    yopmailPage.frameLocator("iframe[name='ifmail']").getByText("Activate Account").click(),

  ]);

  iafl2 = new ImAamFunctionLibrary(newPageInNewTab);

  let msgTextAfterAccountActivation: string = await newPageInNewTab.locator("div[class^='auth_formContainer']").innerText();
  console.log('Message text after clicking on account activation link:', msgTextAfterAccountActivation);

  if (msgTextAfterAccountActivation === 'Verifying your email...') {
    console.log('Account verification successful message is visible after clicking activation link.');
  }

  expect.soft(msgTextAfterAccountActivation.trim()).toBe('Verifying your email...');


  if (counter === 0) {
    try {
      await newPageInNewTab.waitForTimeout(10000); // Wait for 10 seconds
    } catch (error) { }
    await newPageInNewTab.waitForLoadState('load');

    try {
      const acceptButton = newPageInNewTab.locator("button:has-text('Accept')");
      if (await acceptButton.count() > 0) {
        await acceptButton.first().click();
        await newPageInNewTab.waitForLoadState('load');
      }
    } catch (error) { }

    try {
      await newPageInNewTab.locator("div[class*='auth_localPadding']").waitFor({ state: 'visible', timeout: 20000 });
    } catch (error) { }
    msgTextAfterAccountActivation = await newPageInNewTab.locator("div[class*='auth_localPadding']").innerText() || '';
    console.log('Message text after few seconds of clicking on account activation link:', msgTextAfterAccountActivation);

    try {
      expect.soft(msgTextAfterAccountActivation.trim()).toBe('Email verified successfully! Login');
    } catch (error) {
      expect.soft(msgTextAfterAccountActivation.trim()).toBe('Email verified successfully! Login');
    }


    newPageInNewTab.locator("a:has-text('Login')").first().click();
    await newPageInNewTab.waitForLoadState('load');
    await newPageInNewTab.getByPlaceholder("Enter your username or email").fill(userID);
    newPageInNewTab.getByPlaceholder("Enter Password").fill("TotallyWrongPassword");
    newPageInNewTab.locator("button:has-text('Login')").click();
    msgText = await newPageInNewTab.locator("span[class^='auth_formError']").innerText();
    console.log('Error message text for wrong password after activation: ', msgText);
    expect.soft(msgText.trim()).toBe('Invalid password.');
    // newPageInNewTab.getByPlaceholder("Enter Password").fill("TotallyWrongPassword");
    // newPageInNewTab.locator("button:has-text('Login')").click();
    // msgText = await newPageInNewTab.locator("span[class^='auth_formError']").innerText();
    // console.log('Error message text for wrong password after activation: ', msgText);
    // expect.soft(msgText.trim()).toBe('Invalid password.');

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

    counter++;
  }
  if (testInfo.errors.length > 0) {
    console.error('Test failed with errors:', testInfo.errors);
  } else {
    console.log('Test passed without errors.');
  }
  return newPageInNewTab;
}

test('Verify user activation functionality is working fine', async ({ }, testInfo) => {
  if (registeredUsers.length !== 2) {
    throw new Error('Expected two registered users for activation.');
  }

  const firstUserPage = await activateUser(registeredUsers[0], testInfo);
  await activateUser(registeredUsers[1], testInfo);

  newPageInNewTab = firstUserPage;
  iafl2 = new ImAamFunctionLibrary(newPageInNewTab);
});

test('Trial pop-up & balance verifications', async ({ }, testInfo) => {
  let balanceText: string;

  // expect.soft(page.locator("div[class^='trialpopup_trialPopupContainer']")).toBeVisible();
  // await expect(newPageInNewTab.locator("div[class^='TrialBanner_bannerContainer']").nth(0)).toBeVisible({ timeout: 10000 });
  await expect(newPageInNewTab.locator(".singleTable div[class^='TrialBanner_bannerContainer']")).toBeVisible({ timeout: 10000 });

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

  expect.soft(balanceText.trim()).toBe('50.00');

  if (testInfo.errors.length > 0) {
    console.error('Test failed with errors:', testInfo.errors);
  } else {
    console.log('Test passed without errors.');
  }

});
// }
