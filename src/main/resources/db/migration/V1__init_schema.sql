CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- Fleet master data
-- ============================================================
CREATE TABLE vehicles (
    id            BIGSERIAL PRIMARY KEY,
    plate_number  VARCHAR(20)  NOT NULL UNIQUE,
    model         VARCHAR(80)  NOT NULL,
    driver_name   VARCHAR(120) NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    fuel_capacity_l NUMERIC(6,1) NOT NULL DEFAULT 400.0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ============================================================
-- Append-only telemetry history (route replay source)
-- ============================================================
CREATE TABLE telemetry_data (
    id           BIGSERIAL PRIMARY KEY,
    vehicle_id   BIGINT NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
    position     geometry(Point, 4326) NOT NULL,
    speed_kph    NUMERIC(5,1) NOT NULL,
    bearing_deg  NUMERIC(5,1) NOT NULL,
    fuel_level_pct NUMERIC(5,2) NOT NULL,
    recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telemetry_vehicle_time ON telemetry_data (vehicle_id, recorded_at DESC);
CREATE INDEX idx_telemetry_position     ON telemetry_data USING GIST (position);

-- ============================================================
-- Live state: one row per vehicle, atomically UPSERTed each tick
-- ============================================================
CREATE TABLE vehicle_live_state (
    vehicle_id   BIGINT PRIMARY KEY REFERENCES vehicles (id) ON DELETE CASCADE,
    position     geometry(Point, 4326) NOT NULL,
    speed_kph    NUMERIC(5,1) NOT NULL,
    bearing_deg  NUMERIC(5,1) NOT NULL,
    fuel_level_pct NUMERIC(5,2) NOT NULL,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_live_state_position ON vehicle_live_state USING GIST (position);

-- ============================================================
-- Geofencing
-- ============================================================
CREATE TABLE geofence_zones (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    zone_type   VARCHAR(20)  NOT NULL,               -- RESTRICTED | DELIVERY | WAREHOUSE
    area        geometry(Polygon, 4326) NOT NULL,
    color       VARCHAR(9)   NOT NULL DEFAULT '#ef4444',
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_geofence_area ON geofence_zones USING GIST (area);

-- ============================================================
-- Alerts (audit log of geofence / telemetry events)
-- ============================================================
CREATE TABLE alerts (
    id           BIGSERIAL PRIMARY KEY,
    vehicle_id   BIGINT NOT NULL REFERENCES vehicles (id) ON DELETE CASCADE,
    zone_id      BIGINT REFERENCES geofence_zones (id) ON DELETE SET NULL,
    alert_type   VARCHAR(20) NOT NULL,               -- ZONE_ENTER | ZONE_EXIT | SPEEDING | LOW_FUEL
    severity     VARCHAR(10) NOT NULL,               -- INFO | WARNING | CRITICAL
    message      VARCHAR(300) NOT NULL,
    position     geometry(Point, 4326),
    acknowledged BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_created ON alerts (created_at DESC);
CREATE INDEX idx_alerts_vehicle ON alerts (vehicle_id, created_at DESC);
