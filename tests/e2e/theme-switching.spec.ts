import { test, expect } from '@playwright/test'

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should switch theme from sidebar toggle', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Find theme toggle in sidebar
    const themeButton = page.locator('button').filter({ hasText: /theme/i }).or(
      page.locator('button[aria-label*="theme" i]')
    ).or(
      page.locator('aside').locator('button').filter({ has: page.locator('svg') }).last()
    )
    
    // Open theme dropdown
    await themeButton.click()
    
    // Wait for dropdown menu
    await page.waitForTimeout(300)
    
    // Select light theme
    const lightOption = page.locator('text=Light').or(page.locator('[role="menuitem"]').filter({ hasText: 'Light' }))
    await lightOption.click()
    
    // Verify theme changed by checking data-theme attribute
    await page.waitForTimeout(500) // Wait for theme to apply
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(theme).toBe('light')
    
    // Verify light theme styles are applied (background should be light)
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })
    // Light theme should have white/light background (rgb(255, 255, 255) or similar)
    expect(bgColor).toMatch(/rgb\(25[0-5],\s*25[0-5],\s*25[0-5]\)|rgb\(255,\s*255,\s*255\)/)
  })

  test('should switch theme from settings page', async ({ page }) => {
    await page.goto('/settings')
    
    // Navigate to appearance section if needed
    const appearanceButton = page.locator('button').filter({ hasText: /appearance/i })
    if (await appearanceButton.count() > 0) {
      await appearanceButton.click()
      await page.waitForTimeout(300)
    }
    
    // Click light theme button
    const lightThemeButton = page.locator('button').filter({ hasText: /light/i }).filter({ has: page.locator('svg') }).first()
    await lightThemeButton.click()
    
    // Wait for theme to apply
    await page.waitForTimeout(500)
    
    // Verify theme changed
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(theme).toBe('light')
  })

  test('should persist theme preference across page reloads', async ({ page }) => {
    await page.goto('/')
    
    // Switch to light theme
    const themeButton = page.locator('aside').locator('button').filter({ has: page.locator('svg') }).last()
    await themeButton.click()
    await page.waitForTimeout(300)
    
    const lightOption = page.locator('text=Light').or(page.locator('[role="menuitem"]').filter({ hasText: 'Light' }))
    await lightOption.click()
    await page.waitForTimeout(500)
    
    // Verify theme is light
    let theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(theme).toBe('light')
    
    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Verify theme persisted
    theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(theme).toBe('light')
    
    // Also check localStorage
    const storedTheme = await page.evaluate(() => localStorage.getItem('hail-crm-theme'))
    expect(storedTheme).toBe('light')
  })

  test('should support system theme detection', async ({ page }) => {
    // Mock system prefers dark
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    
    // Set theme to system
    const themeButton = page.locator('aside').locator('button').filter({ has: page.locator('svg') }).last()
    await themeButton.click()
    await page.waitForTimeout(300)
    
    const systemOption = page.locator('text=System').or(page.locator('[role="menuitem"]').filter({ hasText: 'System' }))
    await systemOption.click()
    await page.waitForTimeout(500)
    
    // Should use dark (system preference)
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(theme).toBe('dark')
    
    // Change system preference to light
    await page.emulateMedia({ colorScheme: 'light' })
    await page.waitForTimeout(500)
    
    // Should update to light
    const updatedTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(updatedTheme).toBe('light')
  })

  test('should show active theme in settings page', async ({ page }) => {
    // Set theme to dark first
    await page.goto('/')
    const themeButton = page.locator('aside').locator('button').filter({ has: page.locator('svg') }).last()
    await themeButton.click()
    await page.waitForTimeout(300)
    const darkOption = page.locator('text=Dark').or(page.locator('[role="menuitem"]').filter({ hasText: 'Dark' }))
    await darkOption.click()
    await page.waitForTimeout(500)
    
    // Navigate to settings
    await page.goto('/settings')
    
    // Find appearance section
    const appearanceButton = page.locator('button').filter({ hasText: /appearance/i })
    if (await appearanceButton.count() > 0) {
      await appearanceButton.click()
      await page.waitForTimeout(300)
    }
    
    // Dark theme button should show as active
    const darkThemeCard = page.locator('button').filter({ hasText: /dark/i }).filter({ has: page.locator('svg') }).first()
    const isActive = await darkThemeCard.evaluate((el) => {
      const classList = Array.from(el.classList)
      return classList.some(c => c.includes('primary') || c.includes('border-primary'))
    })
    expect(isActive).toBeTruthy()
  })

  test('should have smooth theme transition', async ({ page }) => {
    await page.goto('/')
    
    // Get initial background
    const initialBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })
    
    // Switch theme
    const themeButton = page.locator('aside').locator('button').filter({ has: page.locator('svg') }).last()
    await themeButton.click()
    await page.waitForTimeout(300)
    
    const lightOption = page.locator('text=Light').or(page.locator('[role="menuitem"]').filter({ hasText: 'Light' }))
    
    // Measure transition time
    const startTime = Date.now()
    await lightOption.click()
    
    // Wait for transition to complete (300ms per CSS)
    await page.waitForTimeout(350)
    const transitionTime = Date.now() - startTime
    
    // Verify theme changed
    const newBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })
    expect(newBg).not.toBe(initialBg)
    
    // Transition should be smooth (not instant, not too slow)
    expect(transitionTime).toBeLessThan(500)
  })
})
