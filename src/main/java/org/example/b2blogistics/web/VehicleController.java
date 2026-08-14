package org.example.b2blogistics.web;

import lombok.RequiredArgsConstructor;
import org.example.b2blogistics.dto.ApiResponse;
import org.example.b2blogistics.dto.VehicleDto;
import org.example.b2blogistics.service.VehicleService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    public ApiResponse<List<VehicleDto>> fleetOverview() {
        return ApiResponse.ok(vehicleService.fleetOverview());
    }

    @GetMapping("/{vehicleId}")
    public ApiResponse<VehicleDto> vehicleById(@PathVariable long vehicleId) {
        return ApiResponse.ok(vehicleService.vehicleById(vehicleId));
    }
}
