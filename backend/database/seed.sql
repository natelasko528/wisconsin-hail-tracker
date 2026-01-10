-- Seed data for development
-- Password for all demo users: "password123"
-- Hashed with bcrypt

-- Insert demo users
INSERT INTO users (email, password_hash, first_name, last_name, role, phone) VALUES
('admin@example.com', '$2a$10$rR8LVZq8YjLYaKPYKZVz0eFpXCNHqJZp7zTvKjHfY7mQp8nVaZqXK', 'Admin', 'User', 'admin', '555-0001'),
('manager@example.com', '$2a$10$rR8LVZq8YjLYaKPYKZVz0eFpXCNHqJZp7zTvKjHfY7mQp8nVaZqXK', 'Manager', 'User', 'manager', '555-0002'),
('sales@example.com', '$2a$10$rR8LVZq8YjLYaKPYKZVz0eFpXCNHqJZp7zTvKjHfY7mQp8nVaZqXK', 'Sales', 'Rep', 'sales_rep', '555-0003')
ON CONFLICT (email) DO NOTHING;

-- Insert Wisconsin hail events (2023-2026)
INSERT INTO hail_events (event_date, county, location, lat, lng, hail_size, wind_speed, severity, damages_reported, injuries) VALUES
('2023-06-15', 'Dane', 'Madison', 43.0731, -89.4012, 1.75, 65, 'severe', true, 2),
('2023-07-22', 'Brown', 'Green Bay', 44.5133, -88.0133, 2.25, 70, 'extreme', true, 5),
('2024-05-08', 'Sauk', 'Baraboo', 43.4711, -89.7445, 1.50, 55, 'moderate', true, 0),
('2024-06-30', 'Outagamie', 'Appleton', 44.2619, -88.4154, 2.00, 68, 'severe', true, 1),
('2024-08-12', 'La Crosse', 'La Crosse', 43.8014, -91.2396, 1.25, 50, 'moderate', false, 0),
('2025-05-15', 'Iron', 'Hurley', 46.4497, -90.1843, 1.00, 45, 'minor', false, 0),
('2025-06-20', 'Racine', 'Racine', 42.7261, -87.7829, 1.75, 60, 'severe', true, 0),
('2025-07-04', 'Columbia', 'Portage', 43.5391, -89.4626, 2.50, 75, 'extreme', true, 3),
('2026-05-10', 'Marathon', 'Wausau', 44.9591, -89.6301, 1.50, 58, 'moderate', true, 0),
('2026-06-01', 'Dane', 'Sun Prairie', 43.1836, -89.2137, 2.00, 65, 'severe', true, 1)
ON CONFLICT (noaa_event_id) DO NOTHING;

-- Get user and hail event IDs for foreign key references
DO $$
DECLARE
    admin_id UUID;
    sales_id UUID;
    hail_event_1 UUID;
    hail_event_2 UUID;
    hail_event_3 UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO admin_id FROM users WHERE email = 'admin@example.com';
    SELECT id INTO sales_id FROM users WHERE email = 'sales@example.com';

    -- Get hail event IDs
    SELECT id INTO hail_event_1 FROM hail_events WHERE event_date = '2023-06-15' AND county = 'Dane';
    SELECT id INTO hail_event_2 FROM hail_events WHERE event_date = '2023-07-22' AND county = 'Brown';
    SELECT id INTO hail_event_3 FROM hail_events WHERE event_date = '2024-06-30' AND county = 'Outagamie';

    -- Insert demo leads
    INSERT INTO leads (name, email, phone, property_address, property_city, property_county, property_zip, property_value, hail_event_id, stage, score, tags, assigned_to) VALUES
    ('John Smith', 'john.smith@example.com', '608-555-0101', '123 Main St', 'Madison', 'Dane', '53703', 285000, hail_event_1, 'qualified', 85, ARRAY['hot-lead', 'homeowner'], sales_id),
    ('Sarah Johnson', 'sarah.j@example.com', '920-555-0202', '456 Oak Ave', 'Green Bay', 'Brown', '54301', 320000, hail_event_2, 'proposal', 92, ARRAY['hot-lead', 'insurance-approved'], sales_id),
    ('Mike Williams', 'mike.w@example.com', '920-555-0303', '789 Elm Street', 'Appleton', 'Outagamie', '54911', 195000, hail_event_3, 'new', 72, ARRAY['homeowner'], admin_id)
    ON CONFLICT DO NOTHING;

END $$;
