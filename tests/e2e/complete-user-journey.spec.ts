import { test, expect } from '@playwright/test'

test.describe('Complete User Journey - Unified UI & Theme System', () => {
  test('full workflow: map → theme switch → navigate → settings', async ({ page }) => {
    // Step 1: Load home page (map)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Verify we're on the map page
    await expect(page).toHaveURL(/.*\/$/)
    
    // Verify map is loaded
    const mapContainer = page.locator('.leaflet-container, canvas, [class*="map"]').first()
    const mapVisible = await mapContainer.isVisible().catch(() => false)
    expect(mapVisible).toBeTruthy()
    
    // Verify sidebar is visible on desktop
    if (page.viewportSize()?.width && page.viewportSize()!.width >= 1024) {
      const sidebar = page.locator('aside.sidebar')
      await expect(sidebar).toBeVisible({ timeout: 5000 })
    }
    
    // Step 2: Switch to light theme
    const themeButton = page.locator('aside').locator('button').filter({ has: page.locator('svg') }).last()
    
    // Click theme toggle
    await themeButton.click()
    await page.waitForTimeout(300)
    
    // Select light theme
    const lightOption = page.locator('text=Light').or(
      page.locator('[role="menuitem"]').filter({ hasText: 'Light' })
    )
    await lightOption.click()
    
    // Wait for theme to apply
    await page.waitForTimeout(500)
    
    // Verify theme changed to light
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(theme).toBe('light')
    
    // Verify light theme styles are applied
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })
    expect(bgColor).toMatch(/rgb\(25[0-5],\s*25[0-5],\s*25[0-5]\)|rgb\(255,\s*255,\s*255\)/)
    
    // Step 3: Navigate to dashboard
    // Note: Dashboard might not be in sidebar, so navigate to leads instead
    const leadsLink = page.locator('a[href="/leads"]').first()
    await leadsLink.click()
    
    await expect(page).toHaveURL(/.*\/leads/, { timeout: 5000 })
    
    // Verify leads page loaded
    await page.waitForLoadState('networkidle')
    const leadsContent = await page.locator('h1, h2, header').filter({ hasText: /lead/i }).count()
    expect(leadsContent).toBeGreaterThan(0)
    
    // Verify theme persisted (still light)
    const themeAfterNav = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(themeAfterNav).toBe('light')
    
    // Step 4: Navigate to settings
    const settingsLink = page.locator('a[href="/settings"]').first()
    await settingsLink.click()
    
    await expect(page).toHaveURL(/.*\/settings/, { timeout: 5000 })
    await page.waitForLoadState('networkidle')
    
    // Verify settings page loaded
    const settingsContent = await page.locator('h1, header').filter({ hasText: /setting/i }).count()
    expect(settingsContent).toBeGreaterThan(0)
    
    // Step 5: Verify theme selector shows light theme as active
    // Navigate to appearance section if needed
    const appearanceButton = page.locator('button').filter({ hasText: /appearance/i })
    if (await appearanceButton.count() > 0) {
      await appearanceButton.click()
      await page.waitForTimeout(300)
    }
    
    // Light theme button should be highlighted
    const lightThemeCard = page.locator('button').filter({ hasText: /light/i }).filter({ has: page.locator('svg') }).first()
    if (await lightThemeCard.count() > 0) {
      const isActive = await lightThemeCard.evaluate((el) => {
        const classList = Array.from(el.classList)
        return classList.some(c => c.includes('primary') || c.includes('border-primary'))
      })
      expect(isActive).toBeTruthy()
    }
    
    // Step 6: Change theme back to dark
    const darkThemeButton = page.locator('button').filter({ hasText: /dark/i }).filter({ has: page.locator('svg') }).first()
    if (await darkThemeButton.count() > 0) {
      await darkThemeButton.click()
      await page.waitForTimeout(500)
      
      // Verify theme changed to dark
      const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
      expect(newTheme).toBe('dark')
    }
    
    // Step 7: Return to map
    const stormCommandLink = page.locator('a[href="/"]').filter({ hasText: 'Storm Command' }).or(
      page.locator('a[href="/"]').first()
    )
    await stormCommandLink.click()
    
    await expect(page).toHaveURL(/.*\/$/, { timeout: 5000 })
    await page.waitForLoadState('networkidle')
    
    // Verify map is still there
    const mapStillVisible = await mapContainer.isVisible().catch(() => false)
    expect(mapStillVisible).toBeTruthy()
    
    // Step 8: Verify theme persisted (should be dark)
    const finalTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(finalTheme).toBe('dark')
    
    // Verify dark theme styles
    const finalBgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })
    // Dark theme should have dark background
    expect(finalBgColor).toMatch(/rgb\([0-2]|rgb\(1[0-5]|rgb\(2[0-9]|rgb\(3[0-1]/)
  })

  test('theme persistence across full navigation flow', async ({ page }) => {
    // Set theme to system
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const themeButton = page.locator('aside').locator('button').filter({ has: page.locator('svg') }).last()
    await themeButton.click()
    await page.waitForTimeout(300)
    
    const systemOption = page.locator('text=System').or(
      page.locator('[role="menuitem"]').filter({ hasText: 'System' })
    )
    await systemOption.click()
    await page.waitForTimeout(500)
    
    // Navigate through multiple pages
    await page.goto('/leads')
    await page.waitForLoadState('networkidle')
    
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Theme should still be system
    const storedTheme = await page.evaluate(() => localStorage.getItem('hail-crm-theme'))
    expect(storedTheme).toBe('system')
    
    // Active theme should match system preference
    const activeTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(['light', 'dark']).toContain(activeTheme)
  })

  test('sidebar navigation maintains active state', async ({ page }) => {
    // Start on map
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check active state for home link
    const homeLink = page.locator('a[href="/"]').filter({ hasText: 'Storm Command' }).or(
      page.locator('a[href="/"]').first()
    )
    
    const homeIsActive = await homeLink.evaluate((el) => {
      const classList = Array.from(el.classList)
      const style = window.getComputedStyle(el)
      return classList.some(c => c.includes('active') || c.includes('primary')) ||
             style.borderLeftWidth !== '0px' && style.borderLeftWidth !== ''
    })
    expect(homeIsActive).toBeTruthy()
    
    // Navigate to leads
    const leadsLink = page.locator('a[href="/leads"]').first()
    await leadsLink.click()
    await page.waitForLoadState('networkidle')
    
    // Leads link should now be active
    const leadsIsActive = await leadsLink.evaluate((el) => {
      const classList = Array.from(el.classList)
      const style = window.getComputedStyle(el)
      return classList.some(c => c.includes('active') || c.includes('primary')) ||
             style.borderLeftWidth !== '0px' && style.borderLeftWidth !== ''
    })
    expect(leadsIsActive).toBeTruthy()
    
    // Home should no longer be active
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const homeActiveAfter = await homeLink.evaluate((el) => {
      const classList = Array.from(el.classList)
      const style = window.getComputedStyle(el)
      return classList.some(c => c.includes('active') || c.includes('primary')) ||
             style.borderLeftWidth !== '0px' && style.borderLeftWidth !== ''
    })
    expect(homeActiveAfter).toBeTruthy()
  })
})
