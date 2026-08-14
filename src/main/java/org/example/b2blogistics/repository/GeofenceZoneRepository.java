package org.example.b2blogistics.repository;

import org.example.b2blogistics.domain.GeofenceZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GeofenceZoneRepository extends JpaRepository<GeofenceZone, Long> {

    List<GeofenceZone> findByActiveTrue();

    @Query(value = """
            SELECT * FROM geofence_zones z
            WHERE z.active = TRUE
              AND ST_Contains(z.area, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))
            """, nativeQuery = true)
    List<GeofenceZone> findZonesContaining(@Param("lon") double lon, @Param("lat") double lat);
}
