package org.example.b2blogistics.service;

import lombok.RequiredArgsConstructor;
import org.example.b2blogistics.domain.Alert;
import org.example.b2blogistics.domain.AlertSeverity;
import org.example.b2blogistics.domain.AlertType;
import org.example.b2blogistics.domain.ZoneType;
import org.example.b2blogistics.dto.TelemetrySnapshot;
import org.example.b2blogistics.service.GeofenceZoneCache.CachedZone;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class GeofenceMonitor {

    private final GeofenceZoneCache zoneCache;
    private final AlertService alertService;

    private final Map<Long, Set<Long>> zonesOccupiedByVehicle = new ConcurrentHashMap<>();

    public void evaluateVehiclePosition(TelemetrySnapshot frame) {
        Point position = GeoMath.pointOf(frame.lon(), frame.lat());
        List<CachedZone> zones = zoneCache.activeZones();

        Set<Long> previouslyInside = zonesOccupiedByVehicle
                .computeIfAbsent(frame.vehicleId(), id -> Set.of());
        Set<Long> currentlyInside = ConcurrentHashMap.newKeySet();
        List<CachedZone> enteredZones = new ArrayList<>();

        for (CachedZone zone : zones) {
            if (zone.geometry().contains(position)) {
                currentlyInside.add(zone.id());
                if (!previouslyInside.contains(zone.id())) {
                    enteredZones.add(zone);
                }
            }
        }

        List<CachedZone> exitedZones = zones.stream()
                .filter(zone -> previouslyInside.contains(zone.id()) && !currentlyInside.contains(zone.id()))
                .toList();

        zonesOccupiedByVehicle.put(frame.vehicleId(), currentlyInside);

        enteredZones.forEach(zone -> raiseTransitionAlert(frame, zone, position, true));
        exitedZones.forEach(zone -> raiseTransitionAlert(frame, zone, position, false));
    }

    private void raiseTransitionAlert(TelemetrySnapshot frame, CachedZone zone, Point position, boolean entered) {
        boolean restrictedBreach = entered && zone.type() == ZoneType.RESTRICTED;
        String message = entered
                ? "Truck %s %s %s!".formatted(
                        frame.plateNumber(), restrictedBreach ? "breached" : "entered", zone.name())
                : "Truck %s left %s".formatted(frame.plateNumber(), zone.name());

        alertService.raise(Alert.builder()
                        .vehicleId(frame.vehicleId())
                        .zoneId(zone.id())
                        .alertType(entered ? AlertType.ZONE_ENTER : AlertType.ZONE_EXIT)
                        .severity(restrictedBreach ? AlertSeverity.CRITICAL : AlertSeverity.INFO)
                        .message(message)
                        .position(position)
                        .build(),
                frame.plateNumber(), zone.name());
    }
}
