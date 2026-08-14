package org.example.b2blogistics.mapper;

import org.example.b2blogistics.domain.TelemetryData;
import org.example.b2blogistics.dto.TelemetrySnapshot;
import org.example.b2blogistics.service.GeoMath;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class TelemetryMapper {

    private TelemetryMapper() {
    }

    public static TelemetrySnapshot toSnapshot(TelemetryData telemetry, String plateNumber) {
        return new TelemetrySnapshot(
                telemetry.getVehicleId(),
                plateNumber,
                telemetry.getPosition().getY(),
                telemetry.getPosition().getX(),
                telemetry.getSpeedKph().doubleValue(),
                telemetry.getBearingDeg().doubleValue(),
                telemetry.getFuelLevelPct().doubleValue(),
                telemetry.getRecordedAt()
        );
    }

    public static TelemetryData toEntity(TelemetrySnapshot snapshot) {
        return TelemetryData.builder()
                .vehicleId(snapshot.vehicleId())
                .position(GeoMath.pointOf(snapshot.lon(), snapshot.lat()))
                .speedKph(toDecimal(snapshot.speedKph(), 1))
                .bearingDeg(toDecimal(snapshot.bearingDeg(), 1))
                .fuelLevelPct(toDecimal(snapshot.fuelLevelPct(), 2))
                .recordedAt(snapshot.recordedAt())
                .build();
    }

    private static BigDecimal toDecimal(double value, int scale) {
        return BigDecimal.valueOf(value).setScale(scale, RoundingMode.HALF_UP);
    }
}
