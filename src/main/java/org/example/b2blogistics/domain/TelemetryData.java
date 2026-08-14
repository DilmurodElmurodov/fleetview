package org.example.b2blogistics.domain;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "telemetry_data")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelemetryData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;

    @Column(nullable = false, columnDefinition = "geometry(Point,4326)")
    private Point position;

    @Column(name = "speed_kph", nullable = false)
    private BigDecimal speedKph;

    @Column(name = "bearing_deg", nullable = false)
    private BigDecimal bearingDeg;

    @Column(name = "fuel_level_pct", nullable = false)
    private BigDecimal fuelLevelPct;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;
}
