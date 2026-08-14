package org.example.b2blogistics.dto;

public record SimulatorStatusDto(
        boolean running,
        int speedMultiplier,
        int truckCount,
        long tickMillis
) {
}
