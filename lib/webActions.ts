
import { Page, expect } from '@playwright/test';

/**
 * Custom library for common UI patterns
 */
export const WebActions = {
  
  // A function to handle logins
  async login(page: Page, user: string, pass: string) {
    await page.goto('/login');
    await page.fill('#username', user);
    await page.fill('#password', pass);
    await page.click('#login-button');
  },

  // A function with a built-in soft assertion and logging
  async safeClick(page: Page, selector: string, testInfo: any) {
    const element = page.locator(selector);
    await expect.soft(element).toBeVisible();
    
    if (testInfo.errors.length === 0) {
      await element.click();
      console.log(`Clicked on ${selector}`);
    } else {
      console.log(`Skipped click: ${selector} not visible`);
    }
  }
};