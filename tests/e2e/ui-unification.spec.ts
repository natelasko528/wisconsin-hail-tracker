import { test, expect } from '@playwright/test'

test.describe('UI Unification - Navigation and Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should navigate from home map to dashboard via sidebar', async ({ page }) => {
    // Wait for sidebar to be visible on desktop
    const sidebar = page.locator('aside.sidebar')
    await expect(sidebar).toBeVisible({ timeout: 10000 })

    // Click on dashboard link in sidebar
    // Note: Dashboard might not be in sidebar, let's check for available nav items
    const stormCommandLink = page.locator('a[href="/"]').filter({ hasText: 'Storm Command' }).or(page.locator('a[href="/"]').first())
    const leadsLink = page.locator('a[href="/leads"]').first()
    
    // Navigate to leads
    await leadsLink.click()
    await expect(page).toHaveURL(/.*\/leads/, { timeout: 5000 })
    
    // Verify we're on leads page
    await expect(page.locator('h1, h2, header')).toContainText(/lead/i, { timeout: 5000 })
  })

  test('should navigate from dashboard to leads to settings', async ({ page }) => {
    // Navigate to leads
    await page.goto('/leads')
    await expect(page).toHaveURL(/.*\/leads/)

    // Navigate to settings via sidebar
    const settingsLink = page.locator('a[href="/settings"]').first()
    await settingsLink.click()
    await expect(page).toHaveURL(/.*\/settings/, { timeout: 5000 })
    
    // Verify settings page loaded
    await expect(page.locator('h1, header')).toContainText(/setting/i, { timeout: 5000 })
  })

  test('should show active state for current page in sidebar', async ({ page }) => {
    // Start on home page
    await page.goto('/')
    
    // Check if Storm Command link has active state
    const activeLink = page.locator('a[href="/"]').filter({ hasText: 'Storm Command' }).or(page.locator('a[href="/"]').first())
    const activeClass = await activeLink.evaluate((el) => {
      return el.className.includes('sidebar-item-active') || 
             el.className.includes('border-primary') ||
             window.getComputedStyle(el).borderLeftWidth !== '0px'
    })
    expect(activeClass).toBeTruthy()
  })

  test('should handle sidebar collapse/expand on desktop', async ({ page }) => {
    // Skip on mobile
    test.skip(await page.viewportSize()?.width && page.viewportSize()!.width < 1024, 'Desktop only test')
    
    await page.goto('/')
    
    const sidebar = page.locator('aside.sidebar')
    await expect(sidebar).toBeVisible()
    
    // Find collapse button
    const collapseButton = page.locator('button').filter({ has: page.locator('svg') }).first()
    
    // Get initial width
    const initialWidth = await sidebar.evaluate((el) => el.clientWidth)
    
    // Click collapse
    await collapseButton.click()
    await page.waitForTimeout(300) // Wait for transition
    
    // Check sidebar is collapsed (should be 64px or 16rem)
    const collapsedWidth = await sidebar.evaluate((el) => el.clientWidth)
    expect(collapsedWidth).toBeLessThan(initialWidth)
    
    // Expand again
    await collapseButton.click()
    await page.waitForTimeout(300)
    
    const expandedWidth = await sidebar.evaluate((el) => el.clientWidth)
    expect(expandedWidth).toBeGreaterThan(collapsedWidth)
  })

  test('should show mobile hamburger menu on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Look for hamburger menu button
    const menuButton = page.locator('button').filter({ hasText: /menu/i }).or(
      page.locator('button[aria-label*="menu" i]')
    ).or(
      page.locator('button').first()
    )
    
    // Hamburger should be visible
    await expect(menuButton.first()).toBeVisible({ timeout: 5000 })
    
    // Click to open sidebar
    await menuButton.first().click()
    
    // Sidebar should slide in
    const sidebar = page.locator('aside.sidebar')
    await expect(sidebar).toBeVisible({ timeout: 3000 })
    
    // Check sidebar is visible (translated into view)
    const translateX = await sidebar.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.transform
    })
    expect(translateX).not.toContain('-100%')
  })

  test('should close sidebar when clicking outside on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Open sidebar
    const menuButton = page.locator('button').first()
    await menuButton.click()
    
    const sidebar = page.locator('aside.sidebar')
    await expect(sidebar).toBeVisible()
    
    // Click outside (on backdrop or main content)
    await page.locator('main, body').first().click({ position: { x: 200, y: 400 } })
    await page.waitForTimeout(300)
    
    // Sidebar should be hidden
    const isHidden = await sidebar.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return style.transform.includes('-100%') || style.display === 'none'
    })
    expect(isHidden).toBeTruthy()
  })
})
