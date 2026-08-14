package org.example.b2blogistics;

import org.example.b2blogistics.dto.TelemetrySnapshot;
import org.example.b2blogistics.service.LiveTelemetryCache;
import org.example.b2blogistics.service.TelemetryIngestionService;
import org.example.b2blogistics.service.TelemetryQueryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class TelemetryIngestionIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private TelemetryIngestionService ingestionService;

    @Autowired
    private TelemetryQueryService queryService;

    @Autowired
    private LiveTelemetryCache liveTelemetryCache;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void liveStateIsUpsertedInPlaceWhileHistoryAppends() {
        long vehicleId = 10L;
        Instant firstAt = Instant.parse("2026-08-15T10:00:00Z");

        ingestionService.recordTelemetryBatch(List.of(
                frame(vehicleId, 69.20, 41.30, 55.0, firstAt)));
        ingestionService.recordTelemetryBatch(List.of(
                frame(vehicleId, 69.25, 41.28, 72.0, firstAt.plusSeconds(2))));

        assertThat(liveStateRowCount(vehicleId)).isEqualTo(1);

        Map<String, Object> liveState = jdbcTemplate.queryForMap(
                "SELECT speed_kph, ST_X(position) AS lon, ST_Y(position) AS lat "
                        + "FROM vehicle_live_state WHERE vehicle_id = ?", vehicleId);
        assertThat(((Number) liveState.get("speed_kph")).doubleValue()).isEqualTo(72.0);
        assertThat(((Number) liveState.get("lon")).doubleValue()).isEqualTo(69.25);
        assertThat(((Number) liveState.get("lat")).doubleValue()).isEqualTo(41.28);

        Integer historyCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM telemetry_data WHERE vehicle_id = ?", Integer.class, vehicleId);
        assertThat(historyCount).isEqualTo(2);

        assertThat(liveTelemetryCache.get(vehicleId))
                .hasValueSatisfying(cached -> assertThat(cached.speedKph()).isEqualTo(72.0));
    }

    @Test
    void routeHistoryReturnsChronologicalFramesWithinWindow() {
        long vehicleId = 11L;
        Instant base = Instant.parse("2026-08-15T11:00:00Z");

        ingestionService.recordTelemetryBatch(List.of(
                frame(vehicleId, 69.10, 41.10, 40.0, base.plusSeconds(4)),
                frame(vehicleId, 69.00, 41.00, 50.0, base),
                frame(vehicleId, 69.05, 41.05, 45.0, base.plusSeconds(2))));

        List<TelemetrySnapshot> history =
                queryService.vehicleRouteHistory(vehicleId, base, base.plusSeconds(10), 100);

        assertThat(history).hasSize(3);
        assertThat(history).extracting(TelemetrySnapshot::recordedAt).isSorted();
        assertThat(history.get(0).speedKph()).isEqualTo(50.0);
        assertThat(history).allSatisfy(snapshot ->
                assertThat(snapshot.plateNumber()).isNotBlank());
    }

    @Test
    void concurrentUpsertsForSameVehicleKeepExactlyOneLiveStateRow() throws InterruptedException {
        long vehicleId = 12L;
        int threads = 8;
        int iterationsPerThread = 25;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);
        AtomicInteger failures = new AtomicInteger();

        for (int t = 0; t < threads; t++) {
            final int threadIndex = t;
            pool.submit(() -> {
                try {
                    startGate.await();
                    for (int i = 0; i < iterationsPerThread; i++) {
                        ingestionService.recordTelemetryBatch(List.of(frame(
                                vehicleId,
                                69.0 + threadIndex * 0.01 + i * 0.0001,
                                41.0 + threadIndex * 0.01,
                                30.0 + threadIndex,
                                Instant.now())));
                    }
                } catch (Exception e) {
                    failures.incrementAndGet();
                } finally {
                    done.countDown();
                }
            });
        }

        startGate.countDown();
        assertThat(done.await(120, TimeUnit.SECONDS)).isTrue();
        pool.shutdown();

        assertThat(failures.get()).isZero();
        assertThat(liveStateRowCount(vehicleId)).isEqualTo(1);

        Integer historyCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM telemetry_data WHERE vehicle_id = ?", Integer.class, vehicleId);
        assertThat(historyCount).isEqualTo(threads * iterationsPerThread);
    }

    private int liveStateRowCount(long vehicleId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM vehicle_live_state WHERE vehicle_id = ?", Integer.class, vehicleId);
        return count != null ? count : 0;
    }

    private TelemetrySnapshot frame(long vehicleId, double lon, double lat, double speedKph, Instant at) {
        return new TelemetrySnapshot(vehicleId, "TEST " + vehicleId, lat, lon, speedKph, 45.0, 77.5, at);
    }
}
