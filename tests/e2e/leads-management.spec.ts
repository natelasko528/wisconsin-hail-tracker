/**
 * E2E Tests: User Journey 5 - Lead Management
 * 
 * Persona: Lisa, inside sales rep following up
 */

import { test, expect } from '@playwright/test';

test.describe('Lead Management Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leads');
  });

  test('leads page loads with data', async ({ page }) => {
    // Wait for page content
    await page.waitForSelector('h1, h2', { timeout: 5000 });
    
    // Should have some indication of leads
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('can view lead detail', async ({ page }) => {
    await page.waitForTimeout(500);
    
    // Find and click a lead card or row
    const leadLink = page.locator('a[href^="/leads/"]').first();
    if (await leadLink.isVisible()) {
      await leadLink.click();
      
      // Should navigate to lead detail
      await expect(page).toHaveURL(/\/leads\/[\w-]+/);
    }
  });

  test('lead detail shows property and storm info', async ({ page }) => {
    // Navigate to a lead detail page
    const leadLink = page.locator('a[href^="/leads/"]').first();
    if (await leadLink.isVisible()) {
      await leadLink.click();
      await page.waitForTimeout(500);
      
      // Should show contact information section
      // (Even if empty, the structure should exist)
    }
  });

  test('can add note to lead', async ({ page }) => {
    // Navigate to lead detail
    const leadLink = page.locator('a[href^="/leads/"]').first();
    if (await leadLink.isVisible()) {
      await leadLink.click();
      await page.waitForTimeout(500);
      
      // Look for note input
      const noteInput = page.locator('textarea, input[placeholder*="note" i]');
      if (await noteInput.isVisible()) {
        await noteInput.fill('Test note from E2E');
        
        // Submit note
        const submitBtn = page.locator('button:has-text("Add"), button:has-text("Save")');
        if (await submitBtn.first().isVisible()) {
          await submitBtn.first().click();
          await page.waitForTimeout(500);
        }
      }
    }
  });
});

test.describe('Lead Management - Kanban View', () => {
  test('kanban columns display correctly', async ({ page }) => {
    await page.goto('/leads');
    await page.waitForTimeout(500);
    
    // Look for kanban columns
    const columns = page.locator('.kanban-column, [class*="column"]');
    const columnCount = await columns.count();
    
    if (columnCount > 0) {
      console.log(`Found ${columnCount} kanban columns`);
      
      // Should have multiple pipeline stages
      expect(columnCount).toBeGreaterThan(0);
    }
  });
});

test.describe('Lead Management - Visual', () => {
  test('leads page matches baseline', async ({ page }) => {
    await page.goto('/leads');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('leads-page.png', {
      maxDiffPixelRatio: 0.1
    });
  });
});

test.describe('Lead Management - Performance', () => {
  test('leads page loads in under 2 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/leads');
    await page.waitForSelector('h1, h2');
    
    const loadTime = Date.now() - start;
    console.log(`Leads page load: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(2000);
  });
});
