package org.example.b2blogistics.dto;

import java.time.Instant;

public record TelemetrySnapshot(
        long vehicleId,
        String plateNumber,
        double lat,
        double lon,
        double speedKph,
        double bearingDeg,
        double fuelLevelPct,
        Instant recordedAt
) {
}
