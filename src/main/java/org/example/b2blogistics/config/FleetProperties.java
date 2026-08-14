package org.example.b2blogistics.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "fleet")
public record FleetProperties(Websocket websocket, Simulator simulator) {

    public record Websocket(
            String endpoint,
            List<String> allowedOrigins,
            String topicTelemetry,
            String topicAlerts
    ) {
    }

    public record Simulator(
            boolean enabled,
            boolean autoStart,
            long tickMillis,
            double speedingThresholdKph,
            double lowFuelThresholdPct
    ) {
    }
}
