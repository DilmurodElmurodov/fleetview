package org.example.b2blogistics.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.b2blogistics.domain.ZoneType;
import org.example.b2blogistics.event.GeofenceZonesChangedEvent;
import org.example.b2blogistics.repository.GeofenceZoneRepository;
import org.locationtech.jts.geom.prep.PreparedGeometry;
import org.locationtech.jts.geom.prep.PreparedGeometryFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class GeofenceZoneCache {

    public record CachedZone(long id, String name, ZoneType type, PreparedGeometry geometry) {
    }

    private final GeofenceZoneRepository zoneRepository;

    private volatile List<CachedZone> activeZones = List.of();

    public List<CachedZone> activeZones() {
        return activeZones;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional(readOnly = true)
    public void loadOnStartup() {
        reload();
    }

    @TransactionalEventListener(GeofenceZonesChangedEvent.class)
    @Transactional(readOnly = true, propagation = Propagation.REQUIRES_NEW)
    public void reloadAfterZoneMutation() {
        reload();
    }

    private void reload() {
        activeZones = zoneRepository.findByActiveTrue().stream()
                .map(zone -> new CachedZone(
                        zone.getId(),
                        zone.getName(),
                        zone.getZoneType(),
                        PreparedGeometryFactory.prepare(zone.getArea())))
                .toList();
        log.info("Geofence zone cache reloaded: {} active zones", activeZones.size());
    }
}
