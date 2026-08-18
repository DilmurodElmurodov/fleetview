CREATE INDEX idx_alerts_unacknowledged ON alerts (id) WHERE NOT acknowledged;
