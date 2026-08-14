package org.example.b2blogistics.dto;

public record VehicleDto(
        long id,
        String plateNumber,
        String model,
        String driverName,
        String status,
        double fuelCapacityL,
        TelemetrySnapshot live
) {
}
