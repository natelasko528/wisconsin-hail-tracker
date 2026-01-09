import express from 'express';

const router = express.Router();

// Sample hail data for Wisconsin (2023-2026)
const SAMPLE_HAIL_DATA = [
  { id: 1, date: '2024-06-15T14:30:00Z', location: { lat: 43.0731, lng: -89.4012, city: 'Madison' }, hailSize: 2.5, severity: 'high', county: 'Dane', windSpeed: 60 },
  { id: 2, date: '2024-07-22T16:45:00Z', location: { lat: 44.5233, lng: -87.9105, city: 'Green Bay' }, hailSize: 1.75, severity: 'medium', county: 'Brown', windSpeed: 45 },
  { id: 3, date: '2024-08-03T12:15:00Z', location: { lat: 43.1977, lng: -90.0339, city: 'Reedsburg' }, hailSize: 3.0, severity: 'critical', county: 'Sauk', windSpeed: 70 },
  { id: 4, date: '2024-05-10T18:20:00Z', location: { lat: 44.2619, lng: -88.4154, city: 'Appleton' }, hailSize: 2.0, severity: 'high', county: 'Outagamie', windSpeed: 55 },
  { id: 5, date: '2023-09-18T15:00:00Z', location: { lat: 43.7925, lng: -91.2408, city: 'La Crosse' }, hailSize: 1.5, severity: 'medium', county: 'La Crosse', windSpeed: 40 },
  { id: 6, date: '2025-04-28T13:45:00Z', location: { lat: 46.1306, lng: -89.5364, city: 'Hurley' }, hailSize: 2.25, severity: 'high', county: 'Iron', windSpeed: 50 },
  { id: 7, date: '2025-06-05T17:30:00Z', location: { lat: 42.5326, lng: -87.9145, city: 'Racine' }, hailSize: 1.25, severity: 'medium', county: 'Racine', windSpeed: 35 },
  { id: 8, date: '2025-07-14T19:00:00Z', location: { lat: 45.5071, lng: -87.6164, city: 'Denmark' }, hailSize: 2.75, severity: 'high', county: 'Brown', windSpeed: 65 },
  { id: 9, date: '2023-08-22T16:15:00Z', location: { lat: 43.9169, lng: -89.3875, city: 'Portage' }, hailSize: 1.0, severity: 'low', county: 'Columbia', windSpeed: 30 },
  { id: 10, date: '2024-05-30T14:50:00Z', location: { lat: 44.7842, lng: -90.1928, city: 'Wausau' }, hailSize: 1.5, severity: 'medium', county: 'Marathon', windSpeed: 42 }
];

// GET /api/hail - Fetch hail reports with filters
router.get('/', (req, res) => {
  try {
    const { startDate, endDate, minSize, county, severity } = req.query;
    let filtered = [...SAMPLE_HAIL_DATA];
    
    if (startDate) filtered = filtered.filter(h => new Date(h.date) >= new Date(startDate));
    if (endDate) filtered = filtered.filter(h => new Date(h.date) <= new Date(endDate));
    if (minSize) filtered = filtered.filter(h => h.hailSize >= parseFloat(minSize));
    if (county) filtered = filtered.filter(h => h.county.toLowerCase() === county.toLowerCase());
    if (severity) filtered = filtered.filter(h => h.severity === severity);
    
    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hail/stats
router.get('/stats', (req, res) => {
  const stats = {
    totalReports: SAMPLE_HAIL_DATA.length,
    averageSize: (SAMPLE_HAIL_DATA.reduce((sum, h) => sum + h.hailSize, 0) / SAMPLE_HAIL_DATA.length).toFixed(2),
    severityBreakdown: {
      critical: SAMPLE_HAIL_DATA.filter(h => h.severity === 'critical').length,
      high: SAMPLE_HAIL_DATA.filter(h => h.severity === 'high').length,
      medium: SAMPLE_HAIL_DATA.filter(h => h.severity === 'medium').length,
      low: SAMPLE_HAIL_DATA.filter(h => h.severity === 'low').length
    },
    countyBreakdown: SAMPLE_HAIL_DATA.reduce((acc, h) => {
      acc[h.county] = (acc[h.county] || 0) + 1;
      return acc;
    }, {})
  };
  res.json({ success: true, data: stats });
});

// GET /api/hail/counties
router.get('/counties', (req, res) => {
  const counties = [...new Set(SAMPLE_HAIL_DATA.map(h => h.county))];
  res.json({ success: true, data: counties });
});

// GET /api/hail/:id
router.get('/:id', (req, res) => {
  const report = SAMPLE_HAIL_DATA.find(h => h.id === parseInt(req.params.id));
  if (!report) return res.status(404).json({ error: 'Hail report not found' });
  res.json({ success: true, data: report });
});

export default router;
