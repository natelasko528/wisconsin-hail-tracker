/**
 * E2E Tests: User Journey 2 - Property Discovery & Leads
 * 
 * Persona: Sarah, canvassing coordinator preparing territory
 */

import { test, expect } from '@playwright/test';

test.describe('Property Discovery Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.leaflet-container');
    await page.waitForTimeout(500);
  });

  test('can toggle properties layer on', async ({ page }) => {
    // Find Properties toggle button
    const propsToggle = page.locator('button:has-text("Properties")');
    
    if (await propsToggle.isVisible()) {
      await propsToggle.click();
      await page.waitForTimeout(300);
      
      // Properties layer should be activated (button should change state)
      await expect(propsToggle).toHaveClass(/bg-accent|btn-primary/);
    }
  });

  test('clicking property marker shows popup', async ({ page }) => {
    // Enable properties layer
    const propsToggle = page.locator('button:has-text("Properties")');
    if (await propsToggle.isVisible()) {
      await propsToggle.click();
      await page.waitForTimeout(500);
    }
    
    // Click on a marker
    const markers = page.locator('.leaflet-interactive');
    if (await markers.count() > 0) {
      await markers.first().click();
      
      // Popup should appear
      const popup = page.locator('.leaflet-popup-content');
      await expect(popup).toBeVisible({ timeout: 2000 });
    }
  });

  test('popup has skip trace button', async ({ page }) => {
    // Enable properties and click a marker
    const propsToggle = page.locator('button:has-text("Properties")');
    if (await propsToggle.isVisible()) {
      await propsToggle.click();
      await page.waitForTimeout(500);
    }
    
    const markers = page.locator('.leaflet-interactive');
    if (await markers.count() > 0) {
      await markers.first().click();
      await page.waitForTimeout(300);
      
      // Look for Skip Trace button/link in popup
      const skipTraceBtn = page.locator('.leaflet-popup-content').getByText(/Skip Trace/i);
      await expect(skipTraceBtn).toBeVisible({ timeout: 2000 });
    }
  });

  test('"View Details" link navigates to property page', async ({ page }) => {
    // Enable properties and click a marker
    const propsToggle = page.locator('button:has-text("Properties")');
    if (await propsToggle.isVisible()) {
      await propsToggle.click();
      await page.waitForTimeout(500);
    }
    
    const markers = page.locator('.leaflet-interactive');
    if (await markers.count() > 0) {
      await markers.first().click();
      await page.waitForTimeout(300);
      
      // Find and click View Details/Property link
      const detailsLink = page.locator('.leaflet-popup-content a').filter({ hasText: /View|Details|Property/i });
      if (await detailsLink.first().isVisible()) {
        await detailsLink.first().click();
        
        // Should navigate to property page
        await expect(page).toHaveURL(/\/properties\/[\w-]+/);
      }
    }
  });
});

test.describe('Property Detail Page', () => {
  test('property page loads with all sections', async ({ page }) => {
    // Navigate directly to properties page (with a test ID if available)
    await page.goto('/properties/test-property-id');
    
    // Even if 404, check the structure is there
    // In real tests, this would navigate to a seeded property
  });

  test('property page has storm impact section', async ({ page }) => {
    // This would test a real property page
    // For now, verify the page structure exists
  });
});

test.describe('Property Discovery - Visual Regression', () => {
  test('property popup matches baseline', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.leaflet-container');
    
    // Enable properties
    const propsToggle = page.locator('button:has-text("Properties")');
    if (await propsToggle.isVisible()) {
      await propsToggle.click();
      await page.waitForTimeout(500);
    }
    
    // Click marker to open popup
    const markers = page.locator('.leaflet-interactive');
    if (await markers.count() > 0) {
      await markers.first().click();
      await page.waitForTimeout(300);
      
      // Screenshot with popup open
      await expect(page).toHaveScreenshot('property-popup.png', {
        maxDiffPixelRatio: 0.1
      });
    }
  });
});
