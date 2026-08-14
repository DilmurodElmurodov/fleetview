package org.example.b2blogistics.mapper;

import org.example.b2blogistics.domain.Vehicle;
import org.example.b2blogistics.dto.TelemetrySnapshot;
import org.example.b2blogistics.dto.VehicleDto;

public final class VehicleMapper {

    private VehicleMapper() {
    }

    public static VehicleDto toDto(Vehicle vehicle, TelemetrySnapshot liveSnapshot) {
        return new VehicleDto(
                vehicle.getId(),
                vehicle.getPlateNumber(),
                vehicle.getModel(),
                vehicle.getDriverName(),
                vehicle.getStatus().name(),
                vehicle.getFuelCapacityL().doubleValue(),
                liveSnapshot
        );
    }
}
