package org.example.b2blogistics.repository;

import org.example.b2blogistics.domain.TelemetryData;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface TelemetryRepository extends JpaRepository<TelemetryData, Long> {

    @Query("""
            select t from TelemetryData t
            where t.vehicleId = :vehicleId
              and t.recordedAt between :from and :to
            order by t.recordedAt asc
            """)
    List<TelemetryData> findHistory(@Param("vehicleId") Long vehicleId,
                                    @Param("from") Instant from,
                                    @Param("to") Instant to,
                                    Pageable pageable);

    @Modifying
    @Query(value = """
            INSERT INTO vehicle_live_state (vehicle_id, position, speed_kph, bearing_deg, fuel_level_pct, updated_at)
            VALUES (:vehicleId, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), :speed, :bearing, :fuel, now())
            ON CONFLICT (vehicle_id) DO UPDATE SET
                position       = EXCLUDED.position,
                speed_kph      = EXCLUDED.speed_kph,
                bearing_deg    = EXCLUDED.bearing_deg,
                fuel_level_pct = EXCLUDED.fuel_level_pct,
                updated_at     = now()
            """, nativeQuery = true)
    void upsertLiveState(@Param("vehicleId") Long vehicleId,
                         @Param("lon") double lon,
                         @Param("lat") double lat,
                         @Param("speed") double speed,
                         @Param("bearing") double bearing,
                         @Param("fuel") double fuel);
}
