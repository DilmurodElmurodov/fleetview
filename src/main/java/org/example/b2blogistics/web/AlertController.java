package org.example.b2blogistics.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.example.b2blogistics.dto.AlertDto;
import org.example.b2blogistics.dto.ApiResponse;
import org.example.b2blogistics.service.AlertService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
@Validated
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ApiResponse<List<AlertDto>> recentAlerts(
            @RequestParam(defaultValue = "50") @Min(1) @Max(500) int limit) {
        return ApiResponse.ok(alertService.recentAlerts(limit));
    }

    @GetMapping("/unacknowledged-count")
    public ApiResponse<Long> unacknowledgedCount() {
        return ApiResponse.ok(alertService.unacknowledgedCount());
    }

    @PostMapping("/{alertId}/ack")
    public ApiResponse<Void> acknowledgeAlert(@PathVariable long alertId) {
        alertService.acknowledge(alertId);
        return ApiResponse.ok(null);
    }
}
