package org.example.b2blogistics.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.example.b2blogistics.dto.ApiResponse;
import org.example.b2blogistics.dto.TelemetrySnapshot;
import org.example.b2blogistics.service.TelemetryQueryService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/telemetry")
@RequiredArgsConstructor
@Validated
public class TelemetryController {

    private final TelemetryQueryService telemetryQueryService;

    @GetMapping("/live")
    public ApiResponse<List<TelemetrySnapshot>> liveFleetSnapshot() {
        return ApiResponse.ok(telemetryQueryService.liveFleetSnapshot());
    }

    @GetMapping("/history/{vehicleId}")
    public ApiResponse<List<TelemetrySnapshot>> vehicleRouteHistory(
            @PathVariable long vehicleId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "2000") @Min(1) @Max(10_000) int limit) {
        return ApiResponse.ok(telemetryQueryService.vehicleRouteHistory(vehicleId, from, to, limit));
    }
}
