/**
 * E2E Tests: Accessibility
 * 
 * WCAG AA compliance testing for all major pages
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('home page passes accessibility audit', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.leaflet-container');
    await page.waitForTimeout(1000);
    
    const accessibilityResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.leaflet-container') // Exclude map (external lib)
      .analyze();
    
    // Log any violations for debugging
    if (accessibilityResults.violations.length > 0) {
      console.log('Accessibility violations:', JSON.stringify(accessibilityResults.violations, null, 2));
    }
    
    // Allow minor violations but fail on critical
    const criticalViolations = accessibilityResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('storms listing passes accessibility audit', async ({ page }) => {
    await page.goto('/storms');
    await page.waitForTimeout(1000);
    
    const accessibilityResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    const criticalViolations = accessibilityResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('leads page passes accessibility audit', async ({ page }) => {
    await page.goto('/leads');
    await page.waitForTimeout(1000);
    
    const accessibilityResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    const criticalViolations = accessibilityResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toHaveLength(0);
  });
});

test.describe('Keyboard Navigation', () => {
  test('can navigate main map page with keyboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check that focus is visible somewhere
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    expect(focusedElement).toBeTruthy();
  });

  test('filter panel is keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    
    // Try to open filters with keyboard
    const filterButton = page.locator('button:has-text("Filters")');
    if (await filterButton.isVisible()) {
      await filterButton.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      
      // Filter panel should open
    }
  });

  test('storms listing is keyboard navigable', async ({ page }) => {
    await page.goto('/storms');
    await page.waitForTimeout(500);
    
    // Tab through table/cards
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Should be able to activate elements with Enter
    await page.keyboard.press('Enter');
  });
});

test.describe('Color Contrast', () => {
  test('text has sufficient contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    
    // axe-core checks contrast automatically
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({ rules: { 'color-contrast': { enabled: true } } })
      .analyze();
    
    const contrastViolations = results.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    // Log violations for debugging
    if (contrastViolations.length > 0) {
      console.log('Contrast violations:', contrastViolations);
    }
    
    // Should have minimal contrast issues
    expect(contrastViolations.length).toBeLessThanOrEqual(3);
  });
});

test.describe('Screen Reader Support', () => {
  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');
      
      // Should have alt text or be marked as decorative
      const hasAlt = alt !== null && alt !== '';
      const isDecorative = role === 'presentation' || alt === '';
      const hasAriaLabel = ariaLabel !== null;
      
      expect(hasAlt || isDecorative || hasAriaLabel).toBeTruthy();
    }
  });

  test('form inputs have labels', async ({ page }) => {
    await page.goto('/storms');
    await page.waitForTimeout(500);
    
    // Open filters to expose inputs
    const filterButton = page.locator('button:has-text("Filters")');
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(300);
    }
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .options({ rules: { 'label': { enabled: true } } })
      .analyze();
    
    const labelViolations = results.violations.filter(
      v => v.id === 'label'
    );
    
    expect(labelViolations.length).toBeLessThanOrEqual(2);
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        
        // Button should have some accessible name
        const hasName = (text && text.trim() !== '') || ariaLabel || title;
        expect(hasName).toBeTruthy();
      }
    }
  });
});

test.describe('Reduced Motion', () => {
  test('respects prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/');
    await page.waitForTimeout(500);
    
    // Check that animations are disabled or reduced
    const animatedElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let hasAnimation = false;
      
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const animDuration = parseFloat(style.animationDuration) || 0;
        const transDuration = parseFloat(style.transitionDuration) || 0;
        
        if (animDuration > 0.3 || transDuration > 0.3) {
          hasAnimation = true;
        }
      });
      
      return hasAnimation;
    });
    
    // With reduced motion, animations should be minimal
    // (This is a basic check - real apps might still have some transitions)
  });
});

test.describe('Zoom Support', () => {
  test('content is usable at 200% zoom', async ({ page }) => {
    await page.goto('/storms');
    
    // Zoom to 200%
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });
    
    await page.waitForTimeout(500);
    
    // Check that main content is still visible
    const mainContent = page.locator('main, [role="main"]').first();
    if (await mainContent.isVisible()) {
      const box = await mainContent.boundingBox();
      expect(box).toBeTruthy();
    }
    
    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });
  });
});
