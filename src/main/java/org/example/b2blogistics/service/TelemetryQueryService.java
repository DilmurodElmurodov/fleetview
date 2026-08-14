package org.example.b2blogistics.service;

import lombok.RequiredArgsConstructor;
import org.example.b2blogistics.dto.TelemetrySnapshot;
import org.example.b2blogistics.exception.ResourceNotFoundException;
import org.example.b2blogistics.mapper.TelemetryMapper;
import org.example.b2blogistics.repository.TelemetryRepository;
import org.example.b2blogistics.repository.VehicleRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TelemetryQueryService {

    private static final int MAX_HISTORY_POINTS = 10_000;
    private static final int DEFAULT_HISTORY_WINDOW_HOURS = 1;

    private final TelemetryRepository telemetryRepository;
    private final VehicleRepository vehicleRepository;
    private final LiveTelemetryCache liveTelemetryCache;

    public List<TelemetrySnapshot> liveFleetSnapshot() {
        return liveTelemetryCache.snapshotAll();
    }

    @Transactional(readOnly = true)
    public List<TelemetrySnapshot> vehicleRouteHistory(long vehicleId, Instant from, Instant to, int limit) {
        String plateNumber = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId))
                .getPlateNumber();

        Instant effectiveTo = to != null ? to : Instant.now();
        Instant effectiveFrom = from != null
                ? from
                : effectiveTo.minus(DEFAULT_HISTORY_WINDOW_HOURS, ChronoUnit.HOURS);
        int effectiveLimit = Math.min(limit, MAX_HISTORY_POINTS);

        return telemetryRepository
                .findHistory(vehicleId, effectiveFrom, effectiveTo, PageRequest.of(0, effectiveLimit))
                .stream()
                .map(telemetry -> TelemetryMapper.toSnapshot(telemetry, plateNumber))
                .toList();
    }
}
