-- Wisconsin Hail Tracker CRM - Seed Data
-- Sample hail events and leads for Wisconsin

-- ============================================
-- SEED HAIL EVENTS
-- ============================================
INSERT INTO hail_events (event_date, city, county, latitude, longitude, hail_size, severity, wind_speed, source) VALUES
  ('2024-06-15T14:30:00Z', 'Madison', 'Dane', 43.0731, -89.4012, 2.50, 'high', 60, 'NOAA'),
  ('2024-07-22T16:45:00Z', 'Green Bay', 'Brown', 44.5233, -87.9105, 1.75, 'medium', 45, 'NOAA'),
  ('2024-08-03T12:15:00Z', 'Reedsburg', 'Sauk', 43.5324, -90.0026, 3.00, 'critical', 70, 'NOAA'),
  ('2024-05-10T18:20:00Z', 'Appleton', 'Outagamie', 44.2619, -88.4154, 2.00, 'high', 55, 'NOAA'),
  ('2023-09-18T15:00:00Z', 'La Crosse', 'La Crosse', 43.7925, -91.2408, 1.50, 'medium', 40, 'NOAA'),
  ('2025-04-28T13:45:00Z', 'Hurley', 'Iron', 46.4500, -90.1833, 2.25, 'high', 50, 'NOAA'),
  ('2025-06-05T17:30:00Z', 'Racine', 'Racine', 42.7261, -87.7829, 1.25, 'medium', 35, 'NOAA'),
  ('2025-07-14T19:00:00Z', 'Denmark', 'Brown', 44.3486, -87.8276, 2.75, 'high', 65, 'NOAA'),
  ('2023-08-22T16:15:00Z', 'Portage', 'Columbia', 43.5394, -89.4626, 1.00, 'low', 30, 'NOAA'),
  ('2024-05-30T14:50:00Z', 'Wausau', 'Marathon', 44.9591, -89.6301, 1.50, 'medium', 42, 'NOAA'),
  ('2025-08-12T11:30:00Z', 'Eau Claire', 'Eau Claire', 44.8113, -91.4985, 2.00, 'high', 52, 'NOAA'),
  ('2025-09-03T14:00:00Z', 'Janesville', 'Rock', 42.6828, -89.0187, 1.75, 'medium', 48, 'NOAA'),
  ('2024-06-28T16:20:00Z', 'Oshkosh', 'Winnebago', 44.0247, -88.5426, 2.25, 'high', 58, 'NOAA'),
  ('2024-07-15T13:45:00Z', 'Sheboygan', 'Sheboygan', 43.7508, -87.7145, 1.50, 'medium', 44, 'NOAA'),
  ('2025-05-20T18:10:00Z', 'Fond du Lac', 'Fond du Lac', 43.7730, -88.4471, 2.75, 'high', 62, 'NOAA')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED LEADS (referencing hail events)
-- ============================================
INSERT INTO leads (name, property_address, email, phone, stage, score, hail_size, property_value, tags, assigned_to) VALUES
  ('John Smith', '123 Main St, Madison, WI 53703', 'john.smith@email.com', '(555) 123-4567', 'new', 85, 2.50, 350000, ARRAY['high-priority', 'verified-owner'], NULL),
  ('Sarah Johnson', '456 Oak Ave, Green Bay, WI 54301', 'sarah.j@email.com', '(555) 987-6543', 'contacted', 72, 1.75, 275000, ARRAY['follow-up'], 'rep-1'),
  ('Robert Davis', '789 Elm Dr, Reedsburg, WI 53959', 'rdavis@email.com', '(555) 456-7890', 'qualified', 91, 3.00, 425000, ARRAY['high-value', 'confirmed-damage'], 'rep-2'),
  ('Emily Wilson', '321 Maple Lane, Appleton, WI 54911', 'ewilson@email.com', '(555) 234-5678', 'proposal', 78, 2.00, 310000, ARRAY['insurance-claim'], 'rep-1'),
  ('Michael Brown', '654 Pine St, La Crosse, WI 54601', 'mbrown@email.com', '(555) 345-6789', 'new', 65, 1.50, 225000, ARRAY['needs-skiptrace'], NULL),
  ('Jennifer Martinez', '987 Cedar Ave, Eau Claire, WI 54701', 'jmartinez@email.com', '(555) 456-7891', 'contacted', 82, 2.00, 340000, ARRAY['commercial-property'], 'rep-2'),
  ('David Anderson', '147 Birch Rd, Janesville, WI 53545', 'danderson@email.com', '(555) 567-8901', 'qualified', 88, 1.75, 380000, ARRAY['high-priority', 'previous-customer'], 'rep-1'),
  ('Lisa Thompson', '258 Spruce Blvd, Oshkosh, WI 54901', 'lthompson@email.com', '(555) 678-9012', 'negotiation', 94, 2.25, 450000, ARRAY['hot-lead', 'verified-damage'], 'rep-2'),
  ('James Garcia', '369 Willow Way, Sheboygan, WI 53081', 'jgarcia@email.com', '(555) 789-0123', 'new', 58, 1.50, 195000, ARRAY['rental-property'], NULL),
  ('Amanda White', '741 Ash Court, Fond du Lac, WI 54935', 'awhite@email.com', '(555) 890-1234', 'proposal', 86, 2.75, 395000, ARRAY['high-value', 'ready-to-close'], 'rep-1'),
  ('Christopher Lee', '852 Hickory Dr, Wausau, WI 54401', 'clee@email.com', '(555) 901-2345', 'contacted', 69, 1.50, 265000, ARRAY['follow-up', 'left-voicemail'], 'rep-2'),
  ('Michelle Harris', '963 Walnut St, Portage, WI 53901', 'mharris@email.com', '(555) 012-3456', 'closed_won', 95, 2.50, 520000, ARRAY['completed', 'referral-source'], 'rep-1'),
  ('Daniel Clark', '159 Chestnut Ave, Hurley, WI 54534', 'dclark@email.com', '(555) 123-4568', 'closed_lost', 45, 2.25, 180000, ARRAY['competitor-won'], 'rep-2'),
  ('Stephanie Lewis', '357 Sycamore Ln, Racine, WI 53403', 'slewis@email.com', '(555) 234-5679', 'new', 75, 1.25, 290000, ARRAY['new-construction'], NULL),
  ('Kevin Robinson', '468 Magnolia Rd, Denmark, WI 54208', 'krobinson@email.com', '(555) 345-6790', 'qualified', 83, 2.75, 365000, ARRAY['verified-owner', 'urgent'], 'rep-1')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED CAMPAIGNS
-- ============================================
INSERT INTO campaigns (name, type, status, leads_count, template, stats, scheduled_for) VALUES
  (
    'June Hail Storm - Madison Area',
    'email',
    'active',
    45,
    '{"subject": "Free Roof Inspection After Recent Hail Storm", "body": "Dear {{name}},\n\nWe detected significant hail activity in your area on June 15th. Our team offers free, no-obligation roof inspections.\n\nCall us today: (555) 555-1234\n\nBest regards,\nWisconsin Hail Tracker Team"}',
    '{"sent": 45, "delivered": 43, "opened": 28, "clicked": 12, "bounced": 2, "failed": 0}',
    NULL
  ),
  (
    'Green Bay Follow-up SMS',
    'sms',
    'scheduled',
    32,
    '{"message": "Hi {{name}}, following up on our recent email about your roof inspection. Reply YES for a free assessment or call (555) 555-1234."}',
    '{"sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "bounced": 0, "failed": 0}',
    '2025-01-15T09:00:00Z'
  ),
  (
    'Critical Damage - Reedsburg',
    'email',
    'completed',
    28,
    '{"subject": "URGENT: Severe Hail Damage Detected in Your Area", "body": "Dear {{name}},\n\n3-inch hail was reported in Reedsburg. This level of damage requires immediate attention to prevent further issues.\n\nSchedule your free inspection: (555) 555-1234"}',
    '{"sent": 28, "delivered": 27, "opened": 22, "clicked": 15, "bounced": 1, "failed": 0}',
    NULL
  ),
  (
    'Direct Mail - High Value Properties',
    'direct_mail',
    'draft',
    15,
    '{"headline": "Protect Your Investment", "body": "Professional roof assessment for properties valued over $350,000", "call_to_action": "Schedule Your Free Inspection Today"}',
    '{"sent": 0, "delivered": 0, "opened": 0, "clicked": 0, "bounced": 0, "failed": 0}',
    NULL
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED ACTIVITY LOG
-- ============================================
INSERT INTO activity_log (entity_type, action, description, metadata) VALUES
  ('lead', 'lead_created', 'New lead added from Madison hail event', '{"source": "hail_map", "city": "Madison"}'),
  ('campaign', 'campaign_launched', 'June Hail Storm email campaign started', '{"campaign_name": "June Hail Storm - Madison Area", "leads_count": 45}'),
  ('skiptrace', 'batch_completed', 'Batch skiptrace completed: 45 leads processed', '{"batch_id": "batch-001", "success_rate": 94}'),
  ('lead', 'stage_updated', 'Lead moved to qualified stage', '{"lead_name": "Robert Davis", "from_stage": "contacted", "to_stage": "qualified"}'),
  ('ghl', 'sync_completed', 'GoHighLevel sync completed for 12 contacts', '{"synced_count": 12, "failed_count": 0}')
ON CONFLICT DO NOTHING;
