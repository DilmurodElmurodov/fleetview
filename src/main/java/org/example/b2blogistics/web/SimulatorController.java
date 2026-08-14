package org.example.b2blogistics.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.example.b2blogistics.dto.ApiResponse;
import org.example.b2blogistics.dto.SimulatorStatusDto;
import org.example.b2blogistics.service.simulator.GpsSimulatorService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/simulator")
@RequiredArgsConstructor
@Validated
public class SimulatorController {

    private final GpsSimulatorService gpsSimulatorService;

    @GetMapping("/status")
    public ApiResponse<SimulatorStatusDto> status() {
        return ApiResponse.ok(gpsSimulatorService.status());
    }

    @PostMapping("/start")
    public ApiResponse<SimulatorStatusDto> start() {
        return ApiResponse.ok(gpsSimulatorService.start());
    }

    @PostMapping("/stop")
    public ApiResponse<SimulatorStatusDto> stop() {
        return ApiResponse.ok(gpsSimulatorService.stop());
    }

    @PostMapping("/speed/{multiplier}")
    public ApiResponse<SimulatorStatusDto> changeSpeedMultiplier(
            @PathVariable @Min(1) @Max(5) int multiplier) {
        return ApiResponse.ok(gpsSimulatorService.changeSpeedMultiplier(multiplier));
    }
}
