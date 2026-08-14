package org.example.b2blogistics.mapper;

import org.example.b2blogistics.domain.Alert;
import org.example.b2blogistics.dto.AlertDto;

public final class AlertMapper {

    private AlertMapper() {
    }

    public static AlertDto toDto(Alert alert, String plateNumber, String zoneName) {
        return new AlertDto(
                alert.getId(),
                alert.getVehicleId(),
                plateNumber,
                alert.getZoneId(),
                zoneName,
                alert.getAlertType().name(),
                alert.getSeverity().name(),
                alert.getMessage(),
                alert.getPosition() != null ? alert.getPosition().getY() : null,
                alert.getPosition() != null ? alert.getPosition().getX() : null,
                alert.isAcknowledged(),
                alert.getCreatedAt()
        );
    }
}
