package org.example.b2blogistics.service;

import lombok.RequiredArgsConstructor;
import org.example.b2blogistics.dto.VehicleDto;
import org.example.b2blogistics.exception.ResourceNotFoundException;
import org.example.b2blogistics.mapper.VehicleMapper;
import org.example.b2blogistics.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final LiveTelemetryCache liveTelemetryCache;

    @Transactional(readOnly = true)
    public List<VehicleDto> fleetOverview() {
        return vehicleRepository.findAll().stream()
                .map(vehicle -> VehicleMapper.toDto(
                        vehicle, liveTelemetryCache.get(vehicle.getId()).orElse(null)))
                .toList();
    }

    @Transactional(readOnly = true)
    public VehicleDto vehicleById(long vehicleId) {
        return vehicleRepository.findById(vehicleId)
                .map(vehicle -> VehicleMapper.toDto(
                        vehicle, liveTelemetryCache.get(vehicleId).orElse(null)))
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId));
    }
}
