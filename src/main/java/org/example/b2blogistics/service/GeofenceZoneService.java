package org.example.b2blogistics.service;

import lombok.RequiredArgsConstructor;
import org.example.b2blogistics.domain.GeofenceZone;
import org.example.b2blogistics.domain.ZoneType;
import org.example.b2blogistics.dto.CreateZoneRequest;
import org.example.b2blogistics.dto.GeofenceZoneDto;
import org.example.b2blogistics.event.GeofenceZonesChangedEvent;
import org.example.b2blogistics.exception.InvalidZoneGeometryException;
import org.example.b2blogistics.exception.ResourceNotFoundException;
import org.example.b2blogistics.mapper.GeofenceZoneMapper;
import org.example.b2blogistics.repository.GeofenceZoneRepository;
import org.locationtech.jts.geom.Polygon;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GeofenceZoneService {

    private final GeofenceZoneRepository zoneRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<GeofenceZoneDto> listZones() {
        return zoneRepository.findAll().stream().map(GeofenceZoneMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<GeofenceZoneDto> zonesContainingPosition(double lon, double lat) {
        return zoneRepository.findZonesContaining(lon, lat).stream()
                .map(GeofenceZoneMapper::toDto)
                .toList();
    }

    @Transactional
    public GeofenceZoneDto createZone(CreateZoneRequest request) {
        Polygon area = buildValidatedPolygon(request.coordinates());
        GeofenceZone zone = GeofenceZone.builder()
                .name(request.name())
                .zoneType(request.zoneType())
                .color(request.color() != null ? request.color() : defaultColorFor(request.zoneType()))
                .area(area)
                .active(true)
                .build();
        GeofenceZoneDto dto = GeofenceZoneMapper.toDto(zoneRepository.save(zone));
        eventPublisher.publishEvent(new GeofenceZonesChangedEvent());
        return dto;
    }

    @Transactional
    public GeofenceZoneDto toggleZoneActivation(long zoneId) {
        GeofenceZone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Geofence zone", zoneId));
        zone.setActive(!zone.isActive());
        eventPublisher.publishEvent(new GeofenceZonesChangedEvent());
        return GeofenceZoneMapper.toDto(zone);
    }

    @Transactional
    public void deleteZone(long zoneId) {
        if (!zoneRepository.existsById(zoneId)) {
            throw new ResourceNotFoundException("Geofence zone", zoneId);
        }
        zoneRepository.deleteById(zoneId);
        eventPublisher.publishEvent(new GeofenceZonesChangedEvent());
    }

    private Polygon buildValidatedPolygon(double[][] ring) {
        for (double[] vertex : ring) {
            if (vertex == null || vertex.length != 2) {
                throw new InvalidZoneGeometryException("Each vertex must be a [longitude, latitude] pair");
            }
            if (vertex[0] < -180 || vertex[0] > 180 || vertex[1] < -90 || vertex[1] > 90) {
                throw new InvalidZoneGeometryException(
                        "Vertex out of WGS84 bounds: [%s, %s]".formatted(vertex[0], vertex[1]));
            }
        }
        Polygon polygon;
        try {
            polygon = GeoMath.closedPolygonOf(ring);
        } catch (IllegalArgumentException e) {
            throw new InvalidZoneGeometryException("Coordinates do not form a polygon ring: " + e.getMessage());
        }
        if (!polygon.isValid()) {
            throw new InvalidZoneGeometryException("Polygon ring is degenerate or self-intersecting");
        }
        return polygon;
    }

    private static String defaultColorFor(ZoneType type) {
        return switch (type) {
            case RESTRICTED -> "#ef4444";
            case DELIVERY -> "#22c55e";
            case WAREHOUSE -> "#f59e0b";
        };
    }
}
