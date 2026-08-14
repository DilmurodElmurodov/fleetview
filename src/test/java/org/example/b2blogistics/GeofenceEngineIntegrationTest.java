package org.example.b2blogistics;

import org.example.b2blogistics.domain.Alert;
import org.example.b2blogistics.domain.AlertSeverity;
import org.example.b2blogistics.domain.AlertType;
import org.example.b2blogistics.domain.ZoneType;
import org.example.b2blogistics.dto.CreateZoneRequest;
import org.example.b2blogistics.dto.GeofenceZoneDto;
import org.example.b2blogistics.dto.TelemetrySnapshot;
import org.example.b2blogistics.exception.InvalidZoneGeometryException;
import org.example.b2blogistics.exception.ResourceNotFoundException;
import org.example.b2blogistics.repository.AlertRepository;
import org.example.b2blogistics.service.GeofenceMonitor;
import org.example.b2blogistics.service.GeofenceZoneCache;
import org.example.b2blogistics.service.GeofenceZoneService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GeofenceEngineIntegrationTest extends AbstractIntegrationTest {

    private static final double[][] REMOTE_SQUARE = {{9.9, 9.9}, {10.1, 9.9}, {10.1, 10.1}, {9.9, 10.1}};
    private static final double INSIDE_LON = 10.0;
    private static final double INSIDE_LAT = 10.0;
    private static final double OUTSIDE_LON = 12.0;
    private static final double OUTSIDE_LAT = 12.0;

    @Autowired
    private GeofenceZoneService zoneService;

    @Autowired
    private GeofenceZoneCache zoneCache;

    @Autowired
    private GeofenceMonitor geofenceMonitor;

    @Autowired
    private AlertRepository alertRepository;

    private final List<Long> createdZoneIds = new ArrayList<>();

    @AfterEach
    void cleanUp() {
        createdZoneIds.forEach(zoneService::deleteZone);
        createdZoneIds.clear();
        alertRepository.deleteAll();
    }

    @Test
    void createdZoneBecomesActiveInCacheAfterCommit() {
        GeofenceZoneDto zone = createRemoteZone("Cache Sync Zone", ZoneType.DELIVERY);

        assertThat(zoneCache.activeZones())
                .anyMatch(cached -> cached.id() == zone.id() && cached.name().equals("Cache Sync Zone"));
    }

    @Test
    void enteringRestrictedZoneRaisesCriticalBreachAlertOnce() {
        GeofenceZoneDto zone = createRemoteZone("Border Test Zone", ZoneType.RESTRICTED);

        geofenceMonitor.evaluateVehiclePosition(frame(1L, INSIDE_LON, INSIDE_LAT));
        geofenceMonitor.evaluateVehiclePosition(frame(1L, INSIDE_LON + 0.01, INSIDE_LAT));

        List<Alert> enterAlerts = alertsFor(1L, AlertType.ZONE_ENTER);
        assertThat(enterAlerts).hasSize(1);
        assertThat(enterAlerts.get(0).getSeverity()).isEqualTo(AlertSeverity.CRITICAL);
        assertThat(enterAlerts.get(0).getMessage()).contains("breached", "Border Test Zone");
        assertThat(enterAlerts.get(0).getZoneId()).isEqualTo(zone.id());
    }

    @Test
    void leavingZoneRaisesExitAlert() {
        createRemoteZone("Exit Test Zone", ZoneType.DELIVERY);

        geofenceMonitor.evaluateVehiclePosition(frame(2L, INSIDE_LON, INSIDE_LAT));
        geofenceMonitor.evaluateVehiclePosition(frame(2L, OUTSIDE_LON, OUTSIDE_LAT));

        assertThat(alertsFor(2L, AlertType.ZONE_ENTER)).hasSize(1);
        List<Alert> exitAlerts = alertsFor(2L, AlertType.ZONE_EXIT);
        assertThat(exitAlerts).hasSize(1);
        assertThat(exitAlerts.get(0).getMessage()).contains("left", "Exit Test Zone");
        assertThat(exitAlerts.get(0).getSeverity()).isEqualTo(AlertSeverity.INFO);
    }

    @Test
    void deactivatedZoneStopsTriggeringAlerts() {
        GeofenceZoneDto zone = createRemoteZone("Toggle Test Zone", ZoneType.RESTRICTED);
        zoneService.toggleZoneActivation(zone.id());

        assertThat(zoneCache.activeZones()).noneMatch(cached -> cached.id() == zone.id());

        geofenceMonitor.evaluateVehiclePosition(frame(3L, INSIDE_LON, INSIDE_LAT));
        assertThat(alertsFor(3L, AlertType.ZONE_ENTER)).isEmpty();
    }

    @Test
    void spatialContainsQueryFindsZoneByPosition() {
        GeofenceZoneDto zone = createRemoteZone("ST Contains Zone", ZoneType.WAREHOUSE);

        List<GeofenceZoneDto> containing = zoneService.zonesContainingPosition(INSIDE_LON, INSIDE_LAT);
        assertThat(containing).extracting(GeofenceZoneDto::id).containsExactly(zone.id());

        assertThat(zoneService.zonesContainingPosition(OUTSIDE_LON, OUTSIDE_LAT)).isEmpty();
    }

    @Test
    void openRingIsClosedAutomatically() {
        GeofenceZoneDto zone = createRemoteZone("Ring Closure Zone", ZoneType.DELIVERY);

        assertThat(zone.coordinates()).hasNumberOfRows(REMOTE_SQUARE.length + 1);
        assertThat(zone.coordinates()[0])
                .containsExactly(zone.coordinates()[zone.coordinates().length - 1]);
    }

    @Test
    void invalidGeometryAndMissingZoneAreRejected() {
        assertThatThrownBy(() -> zoneService.createZone(new CreateZoneRequest(
                "Bad Zone", ZoneType.DELIVERY, null,
                new double[][]{{200.0, 95.0}, {10.0, 10.0}, {11.0, 11.0}})))
                .isInstanceOf(InvalidZoneGeometryException.class);

        assertThatThrownBy(() -> zoneService.toggleZoneActivation(999_999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private GeofenceZoneDto createRemoteZone(String name, ZoneType type) {
        GeofenceZoneDto zone = zoneService.createZone(
                new CreateZoneRequest(name, type, null, REMOTE_SQUARE));
        createdZoneIds.add(zone.id());
        return zone;
    }

    private List<Alert> alertsFor(long vehicleId, AlertType type) {
        return alertRepository.findAll().stream()
                .filter(alert -> alert.getVehicleId() == vehicleId && alert.getAlertType() == type)
                .toList();
    }

    private TelemetrySnapshot frame(long vehicleId, double lon, double lat) {
        return new TelemetrySnapshot(vehicleId, "TEST " + vehicleId, lat, lon, 60.0, 90.0, 80.0, Instant.now());
    }
}
