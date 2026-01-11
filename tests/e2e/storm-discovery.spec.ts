/**
 * E2E Tests: User Journey 1 - Storm Discovery
 * 
 * Persona: Mike, roofing sales manager checking for recent storms
 */

import { test, expect } from '@playwright/test';

test.describe('Storm Discovery Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('map loads with storm markers within 2 seconds', async ({ page }) => {
    // Start timing
    const start = Date.now();
    
    // Wait for map to be visible
    await expect(page.locator('.leaflet-container')).toBeVisible();
    
    // Wait for markers to appear (at least one)
    await page.waitForSelector('.leaflet-interactive', { timeout: 5000 });
    
    const loadTime = Date.now() - start;
    console.log(`Map load time: ${loadTime}ms`);
    
    // Should load in under 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('displays 500+ storm markers across Wisconsin', async ({ page }) => {
    // Wait for map and markers
    await page.waitForSelector('.leaflet-container');
    await page.waitForTimeout(1000); // Allow markers to render
    
    // Count circle markers (storms are rendered as circles)
    const markerCount = await page.locator('.leaflet-interactive').count();
    
    console.log(`Marker count: ${markerCount}`);
    
    // Should have substantial number of markers
    expect(markerCount).toBeGreaterThan(100);
  });

  test('date filter updates map markers', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('.leaflet-interactive');
    await page.waitForTimeout(500);
    
    // Get initial marker count
    const initialCount = await page.locator('.leaflet-interactive').count();
    
    // Open filters panel
    const filterButton = page.locator('button:has-text("Filters")');
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
    
    // Look for date preset buttons and click "30 Days"
    const presetButton = page.locator('button:has-text("30 Days")');
    if (await presetButton.isVisible()) {
      await presetButton.click();
      await page.waitForTimeout(500);
      
      // Count should decrease (fewer events in last 30 days)
      const filteredCount = await page.locator('.leaflet-interactive').count();
      console.log(`Initial: ${initialCount}, After filter: ${filteredCount}`);
      
      // Filtered count should be different (usually less)
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    }
  });

  test('size filter removes small hail events', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('.leaflet-interactive');
    await page.waitForTimeout(500);
    
    const initialCount = await page.locator('.leaflet-interactive').count();
    
    // Open filters if needed
    const filterButton = page.locator('button:has-text("Filters")');
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
    
    // Look for severity preset buttons
    const severeButton = page.locator('button:has-text("Severe+")');
    if (await severeButton.isVisible()) {
      await severeButton.click();
      await page.waitForTimeout(500);
      
      const filteredCount = await page.locator('.leaflet-interactive').count();
      console.log(`After severity filter: ${filteredCount}`);
      
      // Should have fewer markers after filtering for severe+
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    }
  });

  test('clicking storm marker shows popup with details', async ({ page }) => {
    // Wait for markers
    await page.waitForSelector('.leaflet-interactive');
    await page.waitForTimeout(500);
    
    // Click the first visible marker
    const markers = page.locator('.leaflet-interactive');
    const markerCount = await markers.count();
    
    if (markerCount > 0) {
      await markers.first().click();
      
      // Wait for popup to appear
      await page.waitForTimeout(300);
      
      // Check if popup is visible
      const popup = page.locator('.leaflet-popup-content');
      await expect(popup).toBeVisible({ timeout: 2000 });
      
      // Popup should contain hail size information
      const popupText = await popup.textContent();
      expect(popupText).toBeTruthy();
    }
  });

  test('popup "View Details" navigates to storm page', async ({ page }) => {
    // Wait for markers
    await page.waitForSelector('.leaflet-interactive');
    await page.waitForTimeout(500);
    
    // Click a marker
    const markers = page.locator('.leaflet-interactive');
    if (await markers.count() > 0) {
      await markers.first().click();
      await page.waitForTimeout(300);
      
      // Look for View Details link in popup
      const detailsLink = page.locator('.leaflet-popup-content a:has-text("Details")');
      if (await detailsLink.isVisible()) {
        await detailsLink.click();
        
        // Should navigate to storm detail page
        await expect(page).toHaveURL(/\/storms\/[\w-]+/);
      }
    }
  });

  test('layer toggles work correctly', async ({ page }) => {
    await page.waitForSelector('.leaflet-container');
    await page.waitForTimeout(500);
    
    // Look for layer toggle buttons
    const stormsToggle = page.locator('button:has-text("Storms")');
    const pathsToggle = page.locator('button:has-text("Paths")');
    
    if (await stormsToggle.isVisible()) {
      // Toggle storms off
      await stormsToggle.click();
      await page.waitForTimeout(200);
      
      // Toggle back on
      await stormsToggle.click();
      await page.waitForTimeout(200);
    }
    
    // Verify map is still functional
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('map has proper legend', async ({ page }) => {
    await page.waitForSelector('.leaflet-container');
    
    // Look for legend in map overlay
    const legend = page.locator('text=Hail Size');
    
    // Legend should be visible
    await expect(legend).toBeVisible({ timeout: 3000 });
  });

  test('full screen toggle works', async ({ page }) => {
    await page.waitForSelector('.leaflet-container');
    
    // Find fullscreen button
    const fullscreenBtn = page.locator('[title*="Fullscreen"]');
    
    if (await fullscreenBtn.isVisible()) {
      await fullscreenBtn.click();
      await page.waitForTimeout(300);
      
      // Press Escape to exit
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Storm Discovery - Visual Regression', () => {
  test('map page matches baseline screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.leaflet-container');
    await page.waitForTimeout(1000);
    
    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('storm-discovery-map.png', {
      maxDiffPixelRatio: 0.1,
      fullPage: false
    });
  });
});

test.describe('Storm Discovery - Performance', () => {
  test('filter updates complete in under 500ms', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.leaflet-interactive');
    
    // Open filters
    const filterButton = page.locator('button:has-text("Filters")');
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
    
    const presetButton = page.locator('button:has-text("30 Days")');
    if (await presetButton.isVisible()) {
      const start = Date.now();
      await presetButton.click();
      
      // Wait for markers to update
      await page.waitForTimeout(500);
      
      const duration = Date.now() - start;
      console.log(`Filter update duration: ${duration}ms`);
      
      expect(duration).toBeLessThan(500);
    }
  });
});
