package org.example.b2blogistics.service;

import lombok.RequiredArgsConstructor;
import org.example.b2blogistics.config.FleetProperties;
import org.example.b2blogistics.dto.TelemetrySnapshot;
import org.example.b2blogistics.mapper.TelemetryMapper;
import org.example.b2blogistics.repository.TelemetryRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TelemetryIngestionService {

    private final TelemetryRepository telemetryRepository;
    private final LiveTelemetryCache liveTelemetryCache;
    private final SimpMessagingTemplate messagingTemplate;
    private final FleetProperties properties;

    @Transactional
    public void recordTelemetryBatch(List<TelemetrySnapshot> frames) {
        telemetryRepository.saveAll(frames.stream().map(TelemetryMapper::toEntity).toList());
        for (TelemetrySnapshot frame : frames) {
            telemetryRepository.upsertLiveState(
                    frame.vehicleId(), frame.lon(), frame.lat(),
                    frame.speedKph(), frame.bearingDeg(), frame.fuelLevelPct());
            liveTelemetryCache.put(frame);
        }
    }

    public void broadcastLiveTelemetry(List<TelemetrySnapshot> frames) {
        messagingTemplate.convertAndSend(properties.websocket().topicTelemetry(), frames);
    }
}
