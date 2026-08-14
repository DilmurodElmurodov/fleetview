package org.example.b2blogistics.service.simulator;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.b2blogistics.config.FleetProperties;
import org.example.b2blogistics.domain.Alert;
import org.example.b2blogistics.domain.AlertSeverity;
import org.example.b2blogistics.domain.AlertType;
import org.example.b2blogistics.domain.Vehicle;
import org.example.b2blogistics.dto.SimulatorStatusDto;
import org.example.b2blogistics.dto.TelemetrySnapshot;
import org.example.b2blogistics.repository.VehicleRepository;
import org.example.b2blogistics.service.AlertService;
import org.example.b2blogistics.service.GeoMath;
import org.example.b2blogistics.service.GeofenceMonitor;
import org.example.b2blogistics.service.TelemetryIngestionService;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class GpsSimulatorService {

    private static final int MIN_SPEED_MULTIPLIER = 1;
    private static final int MAX_SPEED_MULTIPLIER = 5;

    private final VehicleRepository vehicleRepository;
    private final TelemetryIngestionService telemetryIngestionService;
    private final GeofenceMonitor geofenceMonitor;
    private final AlertService alertService;
    private final FleetProperties properties;

    private final CopyOnWriteArrayList<SimulatedTruck> trucks = new CopyOnWriteArrayList<>();
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final AtomicInteger speedMultiplier = new AtomicInteger(MIN_SPEED_MULTIPLIER);
    private final Map<Long, Boolean> speedingAlertLatch = new ConcurrentHashMap<>();
    private final Map<Long, Boolean> lowFuelAlertLatch = new ConcurrentHashMap<>();

    @EventListener(ApplicationReadyEvent.class)
    public void initializeFleet() {
        if (!properties.simulator().enabled()) {
            log.info("GPS simulator disabled by configuration");
            return;
        }
        List<Vehicle> fleet = vehicleRepository.findAll();
        for (int i = 0; i < fleet.size(); i++) {
            Vehicle vehicle = fleet.get(i);
            double staggeredProgress = (i * 0.13) % 0.9;
            trucks.add(new SimulatedTruck(vehicle.getId(), vehicle.getPlateNumber(),
                    RouteCatalog.byIndex(i), staggeredProgress, 1000L + i));
        }
        running.set(properties.simulator().autoStart());
        log.info("GPS simulator initialized with {} trucks (running={})", trucks.size(), running.get());
    }

    @Scheduled(fixedRateString = "${fleet.simulator.tick-millis}")
    public void emitTelemetryTick() {
        if (!running.get() || trucks.isEmpty()) {
            return;
        }
        double elapsedSeconds = properties.simulator().tickMillis() / 1000.0 * speedMultiplier.get();

        List<TelemetrySnapshot> frames = new ArrayList<>(trucks.size());
        for (SimulatedTruck truck : trucks) {
            frames.add(truck.advance(elapsedSeconds));
        }

        telemetryIngestionService.recordTelemetryBatch(frames);
        telemetryIngestionService.broadcastLiveTelemetry(frames);

        for (TelemetrySnapshot frame : frames) {
            geofenceMonitor.evaluateVehiclePosition(frame);
            raiseThresholdAlerts(frame);
        }
    }

    private void raiseThresholdAlerts(TelemetrySnapshot frame) {
        double speedingThreshold = properties.simulator().speedingThresholdKph();
        boolean speeding = frame.speedKph() > speedingThreshold;
        if (speeding && !speedingAlertLatch.getOrDefault(frame.vehicleId(), false)) {
            alertService.raise(Alert.builder()
                            .vehicleId(frame.vehicleId())
                            .alertType(AlertType.SPEEDING)
                            .severity(AlertSeverity.WARNING)
                            .message("Truck %s is speeding: %.0f km/h (limit %.0f)"
                                    .formatted(frame.plateNumber(), frame.speedKph(), speedingThreshold))
                            .position(GeoMath.pointOf(frame.lon(), frame.lat()))
                            .build(),
                    frame.plateNumber(), null);
        }
        speedingAlertLatch.put(frame.vehicleId(), speeding);

        boolean lowFuel = frame.fuelLevelPct() < properties.simulator().lowFuelThresholdPct();
        if (lowFuel && !lowFuelAlertLatch.getOrDefault(frame.vehicleId(), false)) {
            alertService.raise(Alert.builder()
                            .vehicleId(frame.vehicleId())
                            .alertType(AlertType.LOW_FUEL)
                            .severity(AlertSeverity.WARNING)
                            .message("Truck %s low fuel: %.1f%%"
                                    .formatted(frame.plateNumber(), frame.fuelLevelPct()))
                            .position(GeoMath.pointOf(frame.lon(), frame.lat()))
                            .build(),
                    frame.plateNumber(), null);
        }
        lowFuelAlertLatch.put(frame.vehicleId(), lowFuel);
    }

    public SimulatorStatusDto start() {
        running.set(true);
        log.info("Simulator started");
        return status();
    }

    public SimulatorStatusDto stop() {
        running.set(false);
        log.info("Simulator stopped");
        return status();
    }

    public SimulatorStatusDto changeSpeedMultiplier(int multiplier) {
        speedMultiplier.set(Math.max(MIN_SPEED_MULTIPLIER, Math.min(MAX_SPEED_MULTIPLIER, multiplier)));
        log.info("Simulator speed multiplier set to {}x", speedMultiplier.get());
        return status();
    }

    public SimulatorStatusDto status() {
        return new SimulatorStatusDto(
                running.get(),
                speedMultiplier.get(),
                trucks.size(),
                properties.simulator().tickMillis());
    }
}
