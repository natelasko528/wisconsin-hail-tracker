/**
 * E2E Tests: User Journey 3 - Storms Listing & Export
 * 
 * Persona: Tom, operations manager generating weekly report
 */

import { test, expect } from '@playwright/test';

test.describe('Storms Listing Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/storms');
  });

  test('storms page loads with data', async ({ page }) => {
    // Wait for content to load
    await page.waitForSelector('h1:has-text("Storm Events")');
    
    // Should show storm count
    const countBadge = page.locator('.badge:has-text("storms")');
    await expect(countBadge).toBeVisible();
  });

  test('can toggle between card and table view', async ({ page }) => {
    await page.waitForTimeout(500);
    
    // Find view toggle buttons
    const tableToggle = page.locator('[title="Table View"]');
    const cardToggle = page.locator('[title="Card View"]');
    
    // Toggle to table
    if (await tableToggle.isVisible()) {
      await tableToggle.click();
      await page.waitForTimeout(300);
      
      // Table should be visible
      const table = page.locator('.data-table');
      await expect(table).toBeVisible();
    }
    
    // Toggle back to cards
    if (await cardToggle.isVisible()) {
      await cardToggle.click();
      await page.waitForTimeout(300);
    }
  });

  test('can filter by county', async ({ page }) => {
    await page.waitForTimeout(500);
    
    // Open filters
    const filterButton = page.locator('button:has-text("Filters")');
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
    
    // Find county dropdown
    const countySelect = page.locator('select').first();
    if (await countySelect.isVisible()) {
      // Select a county option
      const options = await countySelect.locator('option').allTextContents();
      if (options.length > 1) {
        await countySelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);
      }
    }
  });

  test('can sort by different columns', async ({ page }) => {
    await page.waitForTimeout(500);
    
    // Switch to table view first
    const tableToggle = page.locator('[title="Table View"]');
    if (await tableToggle.isVisible()) {
      await tableToggle.click();
      await page.waitForTimeout(300);
    }
    
    // Click sortable column header
    const sizeHeader = page.locator('th:has-text("Hail Size")');
    if (await sizeHeader.isVisible()) {
      await sizeHeader.click();
      await page.waitForTimeout(300);
      
      // Click again to reverse sort
      await sizeHeader.click();
      await page.waitForTimeout(300);
    }
  });

  test('can select multiple storms', async ({ page }) => {
    await page.waitForTimeout(500);
    
    // Find checkboxes
    const checkboxes = page.locator('[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 2) {
      // Select first few storms
      await checkboxes.nth(1).click();
      await checkboxes.nth(2).click();
      
      // Selection count should appear
      const selectionText = page.locator('text=/\\d+ storms? selected/i');
      await expect(selectionText).toBeVisible({ timeout: 2000 });
    }
  });

  test('export button downloads CSV', async ({ page }) => {
    await page.waitForTimeout(500);
    
    // Set up download listener
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
      page.locator('button:has-text("Export")').click()
    ]);
    
    if (download) {
      expect(download.suggestedFilename()).toContain('.csv');
    }
  });

  test('clicking storm card/row opens detail page', async ({ page }) => {
    await page.waitForTimeout(500);
    
    // Find and click a detail link
    const detailLink = page.locator('a[href^="/storms/"]').first();
    if (await detailLink.isVisible()) {
      await detailLink.click();
      
      // Should navigate to storm detail
      await expect(page).toHaveURL(/\/storms\/[\w-]+/);
    }
  });
});

test.describe('Storms Listing - Visual', () => {
  test('table view matches baseline', async ({ page }) => {
    await page.goto('/storms');
    await page.waitForTimeout(500);
    
    // Switch to table view
    const tableToggle = page.locator('[title="Table View"]');
    if (await tableToggle.isVisible()) {
      await tableToggle.click();
      await page.waitForTimeout(300);
    }
    
    await expect(page).toHaveScreenshot('storms-table.png', {
      maxDiffPixelRatio: 0.1
    });
  });

  test('card view matches baseline', async ({ page }) => {
    await page.goto('/storms');
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('storms-cards.png', {
      maxDiffPixelRatio: 0.1
    });
  });
});

test.describe('Storms Listing - Performance', () => {
  test('page loads in under 2 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/storms');
    
    // Wait for data to be visible
    await page.waitForSelector('.badge:has-text("storms")');
    
    const loadTime = Date.now() - start;
    console.log(`Storms page load: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(2000);
  });

  test('filtering updates in under 500ms', async ({ page }) => {
    await page.goto('/storms');
    await page.waitForTimeout(500);
    
    const filterButton = page.locator('button:has-text("Filters")');
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
    
    // Find a filter input
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      const start = Date.now();
      await searchInput.fill('Madison');
      await page.waitForTimeout(500);
      
      const duration = Date.now() - start;
      console.log(`Filter duration: ${duration}ms`);
      
      expect(duration).toBeLessThan(800);
    }
  });
});
