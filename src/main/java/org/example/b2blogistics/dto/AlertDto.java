package org.example.b2blogistics.dto;

import java.time.Instant;

public record AlertDto(
        long id,
        long vehicleId,
        String plateNumber,
        Long zoneId,
        String zoneName,
        String alertType,
        String severity,
        String message,
        Double lat,
        Double lon,
        boolean acknowledged,
        Instant createdAt
) {
}
