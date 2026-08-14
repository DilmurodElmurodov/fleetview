package org.example.b2blogistics.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.RequiredArgsConstructor;
import org.example.b2blogistics.dto.ApiResponse;
import org.example.b2blogistics.dto.CreateZoneRequest;
import org.example.b2blogistics.dto.GeofenceZoneDto;
import org.example.b2blogistics.service.GeofenceZoneService;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/zones")
@RequiredArgsConstructor
@Validated
public class GeofenceController {

    private final GeofenceZoneService geofenceZoneService;

    @GetMapping
    public ApiResponse<List<GeofenceZoneDto>> listZones() {
        return ApiResponse.ok(geofenceZoneService.listZones());
    }

    @GetMapping("/containing")
    public ApiResponse<List<GeofenceZoneDto>> zonesContainingPosition(
            @RequestParam @DecimalMin("-180") @DecimalMax("180") double lon,
            @RequestParam @DecimalMin("-90") @DecimalMax("90") double lat) {
        return ApiResponse.ok(geofenceZoneService.zonesContainingPosition(lon, lat));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<GeofenceZoneDto> createZone(@Valid @RequestBody CreateZoneRequest request) {
        return ApiResponse.ok(geofenceZoneService.createZone(request));
    }

    @PatchMapping("/{zoneId}/toggle")
    public ApiResponse<GeofenceZoneDto> toggleZoneActivation(@PathVariable long zoneId) {
        return ApiResponse.ok(geofenceZoneService.toggleZoneActivation(zoneId));
    }

    @DeleteMapping("/{zoneId}")
    public ApiResponse<Void> deleteZone(@PathVariable long zoneId) {
        geofenceZoneService.deleteZone(zoneId);
        return ApiResponse.ok(null);
    }
}
