package org.example.b2blogistics.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.b2blogistics.config.FleetProperties;
import org.example.b2blogistics.domain.Alert;
import org.example.b2blogistics.domain.GeofenceZone;
import org.example.b2blogistics.domain.Vehicle;
import org.example.b2blogistics.dto.AlertDto;
import org.example.b2blogistics.exception.ResourceNotFoundException;
import org.example.b2blogistics.mapper.AlertMapper;
import org.example.b2blogistics.repository.AlertRepository;
import org.example.b2blogistics.repository.GeofenceZoneRepository;
import org.example.b2blogistics.repository.VehicleRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final AlertRepository alertRepository;
    private final VehicleRepository vehicleRepository;
    private final GeofenceZoneRepository zoneRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final FleetProperties properties;

    @Transactional
    public AlertDto raise(Alert alert, String plateNumber, String zoneName) {
        Alert persisted = alertRepository.save(alert);
        AlertDto dto = AlertMapper.toDto(persisted, plateNumber, zoneName);
        messagingTemplate.convertAndSend(properties.websocket().topicAlerts(), dto);
        log.info("ALERT [{}] {}", dto.severity(), dto.message());
        return dto;
    }

    @Transactional(readOnly = true)
    public List<AlertDto> recentAlerts(int limit) {
        List<Alert> alerts = alertRepository.findByOrderByCreatedAtDesc(PageRequest.of(0, limit));

        Map<Long, String> platesByVehicleId = vehicleRepository
                .findAllById(alerts.stream().map(Alert::getVehicleId).collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(Vehicle::getId, Vehicle::getPlateNumber));

        Map<Long, String> namesByZoneId = zoneRepository
                .findAllById(alerts.stream().map(Alert::getZoneId).filter(Objects::nonNull).collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(GeofenceZone::getId, GeofenceZone::getName));

        return alerts.stream()
                .map(alert -> AlertMapper.toDto(
                        alert,
                        platesByVehicleId.get(alert.getVehicleId()),
                        alert.getZoneId() != null ? namesByZoneId.get(alert.getZoneId()) : null))
                .toList();
    }

    @Transactional
    public void acknowledge(long alertId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", alertId));
        alert.setAcknowledged(true);
    }

    @Transactional(readOnly = true)
    public long unacknowledgedCount() {
        return alertRepository.countByAcknowledgedFalse();
    }
}
