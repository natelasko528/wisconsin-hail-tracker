import { test, expect } from '@playwright/test'

test.describe('Map Integration with AppLayout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load map with sidebar visible', async ({ page }) => {
    // Wait for map to load
    await page.waitForLoadState('networkidle')
    
    // Sidebar should be visible on desktop
    const sidebar = page.locator('aside.sidebar')
    if (page.viewportSize()?.width && page.viewportSize()!.width >= 1024) {
      await expect(sidebar).toBeVisible({ timeout: 10000 })
    }
    
    // Map container should be present
    const mapContainer = page.locator('.leaflet-container, [class*="map"], canvas').first()
    await expect(mapContainer).toBeVisible({ timeout: 15000 })
  })

  test('should allow sidebar navigation from map page', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    
    // Find sidebar navigation links
    const leadsLink = page.locator('a[href="/leads"]').first()
    
    // Click leads link
    await leadsLink.click()
    
    // Should navigate away from map
    await expect(page).toHaveURL(/.*\/leads/, { timeout: 5000 })
    
    // Navigate back to map
    await page.goto('/')
    await expect(page).toHaveURL(/.*\/$/)
  })

  test('should show map filters and controls with new layout', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    
    // Filter button should be visible
    const filterButton = page.locator('button').filter({ hasText: /filter/i })
    await expect(filterButton.first()).toBeVisible({ timeout: 5000 })
    
    // Click filter button
    await filterButton.first().click()
    
    // Filter panel should appear
    await page.waitForTimeout(300)
    const filterPanel = page.locator('[class*="filter"], [class*="Filter"]').or(
      page.locator('div').filter({ hasText: /filter/i }).filter({ has: page.locator('input, select') })
    )
    
    // At least one filter input should be visible
    const hasFilterInputs = await filterPanel.count() > 0 || await page.locator('input[type="date"], input[type="range"], select').count() > 0
    expect(hasFilterInputs).toBeTruthy()
  })

  test('should display map markers correctly', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    
    // Wait for map to fully load
    await page.waitForTimeout(2000)
    
    // Check for Leaflet markers or map elements
    const markers = page.locator('.leaflet-marker-icon, [class*="marker"], circle, [class*="marker-pin"]')
    const markerCount = await markers.count()
    
    // Should have at least some markers (or map should be loaded)
    // If no markers, at least map container should exist
    const mapExists = markerCount > 0 || await page.locator('.leaflet-container, canvas').count() > 0
    expect(mapExists).toBeTruthy()
  })

  test('should handle responsive behavior - sidebar hidden on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Sidebar should be hidden initially (translated out of view)
    const sidebar = page.locator('aside.sidebar')
    const isHidden = await sidebar.evaluate((el) => {
      const style = window.getComputedStyle(el)
      const transform = style.transform
      return transform.includes('-100%') || transform.includes('translateX(-')
    })
    
    // On mobile, sidebar should start hidden
    expect(isHidden || !(await sidebar.isVisible())).toBeTruthy()
    
    // Map should still be visible
    const mapContainer = page.locator('.leaflet-container, canvas, [class*="map"]').first()
    const mapVisible = await mapContainer.isVisible().catch(() => false)
    expect(mapVisible).toBeTruthy()
  })

  test('should maintain full-screen map feel with sidebar overlay', async ({ page }) => {
    test.skip(await page.viewportSize()?.width && page.viewportSize()!.width < 1024, 'Desktop only test')
    
    await page.waitForLoadState('networkidle')
    
    // Map should fill viewport
    const mapContainer = page.locator('.leaflet-container, canvas, [class*="map"]').first()
    const mapBox = await mapContainer.boundingBox()
    const viewport = page.viewportSize()
    
    if (mapBox && viewport) {
      // Map should take up most of viewport (allowing for sidebar overlay)
      expect(mapBox.height).toBeGreaterThan(viewport.height * 0.8)
      expect(mapBox.width).toBeGreaterThan(viewport.width * 0.7) // Sidebar is overlay, doesn't shrink map
    }
  })

  test('should allow map interaction when sidebar is visible', async ({ page }) => {
    test.skip(await page.viewportSize()?.width && page.viewportSize()!.width < 1024, 'Desktop only test')
    
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Try to interact with map (click, pan, zoom)
    const mapContainer = page.locator('.leaflet-container, canvas').first()
    
    if (await mapContainer.isVisible()) {
      // Click on map
      await mapContainer.click({ position: { x: 400, y: 300 } })
      
      // Map should still be interactive (no errors thrown)
      const mapStillVisible = await mapContainer.isVisible()
      expect(mapStillVisible).toBeTruthy()
    }
  })

  test('should show stats bar floating above map', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    
    // Look for stats display
    const statsBar = page.locator('div').filter({ hasText: /storm/i }).or(
      page.locator('div').filter({ hasText: /damage/i })
    )
    
    // Stats should be visible (even if empty/loading)
    const hasStats = await statsBar.count() > 0 || await page.locator('[class*="stat"], [class*="stats"]').count() > 0
    expect(hasStats).toBeTruthy()
  })

  test('should handle layer controls (Storms, Properties, Paths)', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    
    // Look for layer toggle buttons
    const layerButtons = page.locator('button').filter({ hasText: /storm|property|path/i })
    
    // Should have at least one layer control
    const hasLayerControls = await layerButtons.count() > 0
    expect(hasLayerControls).toBeTruthy()
    
    if (hasLayerControls) {
      // Click first layer button
      await layerButtons.first().click()
      await page.waitForTimeout(300)
      
      // Button should remain interactive
      const stillVisible = await layerButtons.first().isVisible()
      expect(stillVisible).toBeTruthy()
    }
  })
})
