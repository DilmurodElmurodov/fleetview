package org.example.b2blogistics.dto;

import java.time.Instant;

public record GeofenceZoneDto(
        long id,
        String name,
        String zoneType,
        String color,
        boolean active,
        double[][] coordinates,
        Instant createdAt
) {
}
