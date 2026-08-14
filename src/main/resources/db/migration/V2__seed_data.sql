-- ============================================================
-- Fleet: 22 heavy trucks
-- ============================================================
INSERT INTO vehicles (plate_number, model, driver_name, status, fuel_capacity_l) VALUES
    ('01 A 101 AA', 'Volvo FH16 750',        'Aziz Karimov',        'ACTIVE', 600),
    ('01 A 102 BB', 'Scania R730 V8',        'Bekzod Tashkentov',   'ACTIVE', 550),
    ('01 A 103 CC', 'MAN TGX 41.640',        'Davron Yusupov',      'ACTIVE', 500),
    ('01 A 104 DD', 'Mercedes Actros 1863',  'Eldor Rashidov',      'ACTIVE', 520),
    ('01 A 105 EE', 'DAF XF 530',            'Farrukh Nazarov',     'ACTIVE', 490),
    ('01 A 106 FF', 'Volvo FH 540',          'Gayrat Olimov',       'ACTIVE', 560),
    ('01 A 107 GG', 'Scania S650',           'Hasan Ibragimov',     'ACTIVE', 540),
    ('01 A 108 HH', 'Kamaz 54901',           'Islom Saidov',        'ACTIVE', 450),
    ('01 A 109 JJ', 'MAN TGS 33.480',        'Jasur Toshpulatov',   'ACTIVE', 480),
    ('01 A 110 KK', 'Iveco S-Way 570',       'Kamol Ergashev',      'ACTIVE', 510),
    ('30 B 201 AA', 'Volvo FH16 650',        'Laziz Abdullayev',    'ACTIVE', 600),
    ('30 B 202 BB', 'Mercedes Actros 1851',  'Murod Khamidov',      'ACTIVE', 520),
    ('30 B 203 CC', 'Scania R500',           'Nodir Mirzaev',       'ACTIVE', 500),
    ('30 B 204 DD', 'DAF XG+ 480',           'Otabek Ruziev',       'ACTIVE', 490),
    ('30 B 205 EE', 'Kamaz 5490 Neo',        'Pulat Sobirov',       'ACTIVE', 450),
    ('80 C 301 AA', 'MAN TGX 18.510',        'Qodir Umarov',        'ACTIVE', 480),
    ('80 C 302 BB', 'Volvo FMX 500',         'Rustam Valiyev',      'ACTIVE', 530),
    ('80 C 303 CC', 'Scania G450',           'Sardor Xolmatov',     'ACTIVE', 470),
    ('80 C 304 DD', 'Mercedes Arocs 3345',   'Timur Yuldashev',     'ACTIVE', 500),
    ('25 D 401 AA', 'Iveco Trakker 450',     'Ulugbek Ziyaev',      'ACTIVE', 460),
    ('25 D 402 BB', 'DAF CF 450',            'Vohid Akbarov',       'ACTIVE', 440),
    ('25 D 403 CC', 'Volvo FH 460',          'Xurshid Bekmurodov',  'ACTIVE', 550);

-- ============================================================
-- Geofence zones (WGS84 lon lat)
-- ============================================================
INSERT INTO geofence_zones (name, zone_type, area, color, active) VALUES
(
    'Tashkent City Delivery Zone', 'DELIVERY',
    ST_GeomFromText('POLYGON((69.15 41.20, 69.40 41.20, 69.40 41.38, 69.15 41.38, 69.15 41.20))', 4326),
    '#22c55e', TRUE
),
(
    'Tashkent Border Restricted Zone', 'RESTRICTED',
    ST_GeomFromText('POLYGON((69.45 41.05, 69.75 41.05, 69.75 41.25, 69.45 41.25, 69.45 41.05))', 4326),
    '#ef4444', TRUE
),
(
    'Samarkand Logistics Hub', 'WAREHOUSE',
    ST_GeomFromText('POLYGON((66.85 39.60, 67.05 39.60, 67.05 39.72, 66.85 39.72, 66.85 39.60))', 4326),
    '#f59e0b', TRUE
);
