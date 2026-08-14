package org.example.b2blogistics.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.example.b2blogistics.domain.ZoneType;

public record CreateZoneRequest(
        @NotBlank @Size(max = 120) String name,
        @NotNull ZoneType zoneType,
        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "must be a hex color like #ef4444") String color,
        @NotNull @Size(min = 3, max = 500) double[][] coordinates
) {
}
