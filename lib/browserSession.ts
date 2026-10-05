import { Browser, BrowserContext, chromium, firefox, Page, webkit } from '@playwright/test';

export interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  additionalContexts: BrowserContext[];
}

const appHttpCredentials = {
  username: 'asdf',
  password: 'nownew',
};

export async function createBrowserSession(): Promise<BrowserSession> {
  const browserType = process.env.BROWSER_TYPE === 'firefox'
    ? firefox
    : process.env.BROWSER_TYPE === 'webkit'
      ? webkit
      : chromium;
  const browser = await browserType.launch({
    headless: false,
    args: ['--start-maximized'],
    timeout: 120000,
  });

  try {
    const context = await browser.newContext({
      viewport: null,
      deviceScaleFactor: undefined,
      isMobile: false,
      httpCredentials: appHttpCredentials,
    });
    const page = await context.newPage();

    return { browser, context, page, additionalContexts: [] };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

export async function createAuthenticatedContext(session: BrowserSession): Promise<BrowserContext> {
  const context = await session.browser.newContext({
    viewport: null,
    deviceScaleFactor: undefined,
    isMobile: false,
    httpCredentials: appHttpCredentials,
  });
  session.additionalContexts.push(context);
  return context;
}

export async function closeBrowserSession(session: BrowserSession | undefined): Promise<void> {
  if (!session) {
    return;
  }

  try {
    for (const context of session.additionalContexts) {
      await context.close();
    }
    await session.context.close();
  } finally {
    await session.browser.close();
  }
}