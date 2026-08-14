package org.example.b2blogistics.service.simulator;

import org.example.b2blogistics.dto.TelemetrySnapshot;
import org.example.b2blogistics.service.GeoMath;

import java.time.Instant;
import java.util.Random;

public class SimulatedTruck {

    private static final double MIN_SPEED_KPH = 20;
    private static final double MAX_SPEED_KPH = 105;
    private static final double FUEL_BURN_PCT_PER_100KM = 7.0;
    private static final double REFUEL_BELOW_PCT = 4.0;

    private final long vehicleId;
    private final String plateNumber;
    private final double[][] waypoints;
    private final double[] cumulativeMeters;
    private final double routeLengthMeters;
    private final Random random;

    private double traveledMeters;
    private int direction = 1;
    private double speedKph;
    private double cruiseTargetKph;
    private double fuelLevelPct;

    public SimulatedTruck(long vehicleId, String plateNumber, RouteCatalog.Route route,
                          double initialProgress, long seed) {
        this.vehicleId = vehicleId;
        this.plateNumber = plateNumber;
        this.waypoints = route.waypoints();
        this.random = new Random(seed);

        this.cumulativeMeters = new double[waypoints.length];
        for (int i = 1; i < waypoints.length; i++) {
            cumulativeMeters[i] = cumulativeMeters[i - 1] + GeoMath.distanceMeters(
                    waypoints[i - 1][1], waypoints[i - 1][0],
                    waypoints[i][1], waypoints[i][0]);
        }
        this.routeLengthMeters = cumulativeMeters[waypoints.length - 1];

        this.traveledMeters = Math.max(0, Math.min(1, initialProgress)) * routeLengthMeters;
        this.cruiseTargetKph = 55 + random.nextDouble() * 35;
        this.speedKph = cruiseTargetKph;
        this.fuelLevelPct = 40 + random.nextDouble() * 60;
    }

    public TelemetrySnapshot advance(double elapsedSeconds) {
        if (random.nextDouble() < 0.08) {
            cruiseTargetKph = 45 + random.nextDouble() * 50;
        }
        speedKph += (cruiseTargetKph - speedKph) * 0.3 + (random.nextDouble() - 0.5) * 4.0;
        speedKph = Math.max(MIN_SPEED_KPH, Math.min(MAX_SPEED_KPH, speedKph));

        double advancedMeters = speedKph / 3.6 * elapsedSeconds;
        traveledMeters += advancedMeters * direction;

        if (traveledMeters >= routeLengthMeters) {
            traveledMeters = routeLengthMeters;
            direction = -1;
        } else if (traveledMeters <= 0) {
            traveledMeters = 0;
            direction = 1;
        }

        fuelLevelPct -= advancedMeters / 100_000.0 * FUEL_BURN_PCT_PER_100KM;
        if (fuelLevelPct < REFUEL_BELOW_PCT) {
            fuelLevelPct = 100.0;
        }

        double[] position = positionAt(traveledMeters);
        double bearing = segmentBearing(traveledMeters);

        return new TelemetrySnapshot(vehicleId, plateNumber,
                position[1], position[0], speedKph, bearing, fuelLevelPct, Instant.now());
    }

    private double[] positionAt(double atMeters) {
        int segment = segmentIndex(atMeters);
        double segmentStart = cumulativeMeters[segment];
        double segmentLength = cumulativeMeters[segment + 1] - segmentStart;
        double t = segmentLength == 0 ? 0 : (atMeters - segmentStart) / segmentLength;
        double lon = waypoints[segment][0] + (waypoints[segment + 1][0] - waypoints[segment][0]) * t;
        double lat = waypoints[segment][1] + (waypoints[segment + 1][1] - waypoints[segment][1]) * t;
        return new double[]{lon, lat};
    }

    private double segmentBearing(double atMeters) {
        int segment = segmentIndex(atMeters);
        int from = direction > 0 ? segment : segment + 1;
        int to = direction > 0 ? segment + 1 : segment;
        return GeoMath.initialBearingDegrees(
                waypoints[from][1], waypoints[from][0],
                waypoints[to][1], waypoints[to][0]);
    }

    private int segmentIndex(double atMeters) {
        for (int i = 1; i < cumulativeMeters.length; i++) {
            if (atMeters <= cumulativeMeters[i]) {
                return i - 1;
            }
        }
        return cumulativeMeters.length - 2;
    }
}
