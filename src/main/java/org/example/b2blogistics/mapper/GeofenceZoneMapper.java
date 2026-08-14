package org.example.b2blogistics.mapper;

import org.example.b2blogistics.domain.GeofenceZone;
import org.example.b2blogistics.dto.GeofenceZoneDto;
import org.locationtech.jts.geom.Coordinate;

import java.util.Arrays;

public final class GeofenceZoneMapper {

    private GeofenceZoneMapper() {
    }

    public static GeofenceZoneDto toDto(GeofenceZone zone) {
        Coordinate[] exteriorRing = zone.getArea().getExteriorRing().getCoordinates();
        double[][] coordinates = Arrays.stream(exteriorRing)
                .map(c -> new double[]{c.getX(), c.getY()})
                .toArray(double[][]::new);
        return new GeofenceZoneDto(
                zone.getId(),
                zone.getName(),
                zone.getZoneType().name(),
                zone.getColor(),
                zone.isActive(),
                coordinates,
                zone.getCreatedAt()
        );
    }
}
