package org.example.b2blogistics.service;

import org.example.b2blogistics.dto.TelemetrySnapshot;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LiveTelemetryCache {

    private final ConcurrentHashMap<Long, TelemetrySnapshot> latestByVehicleId = new ConcurrentHashMap<>();

    public void put(TelemetrySnapshot snapshot) {
        latestByVehicleId.put(snapshot.vehicleId(), snapshot);
    }

    public Optional<TelemetrySnapshot> get(long vehicleId) {
        return Optional.ofNullable(latestByVehicleId.get(vehicleId));
    }

    public List<TelemetrySnapshot> snapshotAll() {
        return latestByVehicleId.values().stream()
                .sorted(Comparator.comparingLong(TelemetrySnapshot::vehicleId))
                .toList();
    }
}
