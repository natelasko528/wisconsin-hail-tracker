# Wisconsin Hail Tracker - E2E Visual Testing Plan

## Overview

This document outlines the complete End-to-End visual testing plan for the Wisconsin Hail Tracker CRM application. The tests cover 5 primary user journeys with specific visual checkpoints, performance benchmarks, and accessibility requirements.

## Test Environment Setup

### Prerequisites
1. **Database**: Seed with 500+ real NOAA hail events (2020-2024)
2. **Properties**: Discover properties for 10 high-impact storms
3. **Leads**: Create 50 sample leads with varied statuses
4. **Mocks**: TLOxp skip trace responses

### Setup Commands
```bash
# Seed test data
npm run seed:test-data

# Start test servers
npm run dev:test

# Run E2E tests
npm run test:e2e
```

---

## USER JOURNEY 1: Storm Discovery

**Persona**: Mike, roofing sales manager checking for recent storms

### Test Steps

| # | Action | Expected Visual Result | Pass Criteria |
|---|--------|----------------------|---------------|
| 1 | Open `/` | Full-screen map, Wisconsin centered | Load < 2s |
| 2 | Observe markers | Color-coded circles across state | 500+ visible |
| 3 | Drag date slider to "Last 30 Days" | Map updates, fewer markers | < 500ms |
| 4 | Drag size slider to 1.5"+ | Small markers disappear | Instant |
| 5 | Click storm marker | Popup shows hail size, date, location | Instant |
| 6 | Click "View Storm" | Storm detail page loads | < 1s |

### Visual Checkpoints

- [ ] Map fills viewport (no sidebar visible initially)
- [ ] Slider has gradient from yellow to maroon
- [ ] Popup has severity badge color matching marker
- [ ] Loading skeleton appears during data fetch
- [ ] Storm paths visible as colored lines
- [ ] Legend displays all 5 severity levels

### Screenshot Comparisons
- `storm-discovery-map-loaded.png`
- `storm-discovery-filter-applied.png`
- `storm-discovery-popup-open.png`

---

## USER JOURNEY 2: Property Discovery & Leads

**Persona**: Sarah, canvassing coordinator preparing territory

### Test Steps

| # | Action | Expected Visual Result | Pass Criteria |
|---|--------|----------------------|---------------|
| 1 | Toggle "Properties" layer | Property circles appear | Blue circles |
| 2 | Click "Discover Properties" | Loading overlay | API called |
| 3 | Wait for discovery | New markers animate in | Toast: "Found X" |
| 4 | Click property circle | Popup shows address | Has Skip Trace btn |
| 5 | Click "Skip Trace" | Button shows loading | API called |
| 6 | View results | Contact info in popup | Phone/email shown |
| 7 | Click "View Details" | Property page opens | Full info visible |
| 8 | Click "Add to Campaign" | Modal appears | Lead created toast |

### Visual Checkpoints

- [ ] Property circles smaller than storm markers
- [ ] Popup positioned to not clip viewport edge
- [ ] Skip Trace button shows spinner when loading
- [ ] Contact info formatted with call/email links
- [ ] Property detail page has Street View
- [ ] Storm impact history visible

### Screenshot Comparisons
- `property-discovery-layer-toggle.png`
- `property-discovery-popup.png`
- `property-discovery-detail-page.png`

---

## USER JOURNEY 3: Storms Listing & Export

**Persona**: Tom, operations manager generating weekly report

### Test Steps

| # | Action | Expected Visual Result | Pass Criteria |
|---|--------|----------------------|---------------|
| 1 | Navigate `/storms` | Table/card view loads | Data visible |
| 2 | Click "Card View" toggle | Cards grid layout | Responsive grid |
| 3 | Filter by "Dane" county | List filters | Instant update |
| 4 | Sort by size descending | 2.5"+ storms first | Arrow indicator |
| 5 | Select 5 storms (checkbox) | Selection count badge | "5 selected" |
| 6 | Click "Export Selected" | CSV download starts | File has data |
| 7 | Click storm card | Detail opens | All info present |

### Visual Checkpoints

- [ ] Table rows have hover state
- [ ] Card severity badge uses correct color
- [ ] Selection checkbox animates
- [ ] Export button shows progress
- [ ] Empty state displays if no results
- [ ] Pagination or infinite scroll works

### Screenshot Comparisons
- `storms-listing-table.png`
- `storms-listing-cards.png`
- `storms-listing-filtered.png`

---

## USER JOURNEY 4: Field Canvassing (Mobile)

**Persona**: Jake, door knocker in the field

### Test Steps

| # | Action | Expected Visual Result | Pass Criteria |
|---|--------|----------------------|---------------|
| 1 | Open on mobile | Responsive map fills screen | Touch works |
| 2 | Allow GPS | Map centers on location | GPS marker |
| 3 | Tap "Nearby" | List of 10 closest properties | Distance shown |
| 4 | Tap first property | Card expands | Call btn prominent |
| 5 | Tap "Call" | Phone dialer opens | Number filled |
| 6 | Tap "Mark Knocked" | Status updates | Color changes |
| 7 | Tap "Directions" | Maps app opens | Route shown |

### Visual Checkpoints

- [ ] Bottom nav bar visible on mobile
- [ ] Touch targets are 44x44px minimum
- [ ] Property cards stack vertically
- [ ] GPS accuracy indicator shown
- [ ] Status update buttons are color-coded
- [ ] Distance displays in miles/feet

### Screenshot Comparisons (Mobile 375x667)
- `canvassing-mobile-list.png`
- `canvassing-mobile-expanded.png`
- `canvassing-mobile-stats.png`

---

## USER JOURNEY 5: Lead Management

**Persona**: Lisa, inside sales rep following up

### Test Steps

| # | Action | Expected Visual Result | Pass Criteria |
|---|--------|----------------------|---------------|
| 1 | Open `/leads` | Kanban/list loads | Leads grouped |
| 2 | Click high-priority lead | Detail page opens | All info visible |
| 3 | View storm impact | Storm section shows | Hail size, date |
| 4 | Click "Generate Script" | AI modal appears | Personalized |
| 5 | Click "Call" | Dialer opens, logged | Activity shown |
| 6 | Drag to "Contacted" | Status updates | Card moves |
| 7 | Add note | Note saves | Timestamp shown |

### Visual Checkpoints

- [ ] Kanban columns have status colors
- [ ] Lead card shows priority score
- [ ] AI script has copy button
- [ ] Note has avatar and time
- [ ] Activity timeline is chronological
- [ ] Drag-and-drop is smooth

### Screenshot Comparisons
- `leads-kanban.png`
- `leads-detail.png`
- `leads-ai-script.png`

---

## VISUAL REGRESSION TESTS

| Component | Test | Method |
|-----------|------|--------|
| Storm markers | All 5 severity colors | Screenshot diff |
| Property popup | Layout matches spec | Pixel comparison |
| Filter panel | Sliders styled correctly | Component snapshot |
| Mobile nav | Bottom bar present | Responsive check |
| Loading states | Skeletons match shapes | Animation check |
| Error states | Messages styled | Empty state visible |
| Toast notifications | Position and animation | Timing check |

### Tools
- **Playwright** for E2E automation
- **Percy** or **Chromatic** for visual regression
- **Lighthouse** for performance metrics

---

## PERFORMANCE BENCHMARKS

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Initial load (FCP) | < 2s | Lighthouse |
| 1000 markers render | < 500ms | Performance.mark |
| Filter update | < 300ms | User timing |
| Popup open | < 100ms | Animation timing |
| Page navigation | < 1s | Next.js metrics |
| Mobile touch | < 150ms | Touch latency |
| API response | < 500ms | Network timing |

### Performance Test Script
```javascript
// tests/e2e/performance.spec.ts
test('map loads 1000 markers in under 500ms', async ({ page }) => {
  await page.goto('/');
  const start = performance.now();
  await page.waitForSelector('.leaflet-marker-icon');
  const markerCount = await page.locator('.leaflet-marker-icon').count();
  const duration = performance.now() - start;
  
  expect(markerCount).toBeGreaterThan(500);
  expect(duration).toBeLessThan(500);
});
```

---

## ACCESSIBILITY TESTS

| Test | Method | Pass Criteria |
|------|--------|---------------|
| Keyboard navigation | Tab through all | Focus visible, logical order |
| Screen reader | NVDA/VoiceOver | All elements announced |
| Color contrast | axe-core | WCAG AA 4.5:1 |
| Touch targets | Manual measure | 44x44px minimum |
| Zoom 200% | Browser zoom | No content loss |
| Reduced motion | prefers-reduced-motion | Animations disabled |

### Accessibility Test Script
```javascript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home page passes accessibility audit', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  
  expect(accessibilityResults.violations).toEqual([]);
});
```

---

## ERROR SCENARIO TESTS

| Scenario | Trigger | Expected Behavior |
|----------|---------|-------------------|
| API timeout | Slow network | Retry button shown |
| No results | Empty filter | Empty state + suggestions |
| Auth expired | Session timeout | Redirect to login |
| Offline | Network drop | Cached data + sync queue |
| Invalid input | Bad address | Validation message |
| Server error | 500 response | Friendly error + report |

---

## TEST DATA REQUIREMENTS

### Storm Events (Seeded)
- **Quantity**: 500+ events
- **Date Range**: 2020-2024
- **Severity Distribution**: 20% each severity level
- **With Paths**: 30% have different begin/end coordinates
- **With Damage**: 40% have damage reported

### Properties (Generated)
- **Quantity**: 200+ properties
- **Distribution**: Clustered around high-impact storms
- **Skip Trace Data**: 50% have phone/email

### Leads (Generated)
- **Quantity**: 50 leads
- **Status Distribution**: All pipeline stages represented
- **Priority Scores**: Range from 0-100

---

## RUNNING TESTS

```bash
# Full E2E suite
npm run test:e2e

# Specific journey
npm run test:e2e -- --grep "Storm Discovery"

# Visual regression
npm run test:visual

# Accessibility
npm run test:a11y

# Performance
npm run test:performance

# Mobile only
npm run test:e2e -- --project=mobile
```

---

## CI/CD INTEGRATION

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run seed:test-data
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: test-results/
```

---

## SUCCESS CRITERIA

All tests must pass before release:

- [ ] Map loads < 2s with 1000+ markers
- [ ] Storm paths render as colored polygons
- [ ] Property popup appears < 100ms
- [ ] Skip trace returns < 5s
- [ ] Storms page filters < 300ms
- [ ] Mobile feels native (60fps scrolling)
- [ ] All 5 E2E journeys pass
- [ ] Zero critical accessibility violations
- [ ] Full workflow < 5 minutes for real roofer
