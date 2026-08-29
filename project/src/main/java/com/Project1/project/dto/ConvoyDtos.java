package com.Project1.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ConvoyDtos {

    public record CreateConvoyRequest(
            @NotBlank String vehicleNumber,
            @NotBlank String driverName,
            @NotBlank String driverPhone,
            String transporterCompany,
            @NotBlank String commodityType,
            @NotBlank String originCity,
            @NotBlank String destinationCity,
            Double temperatureCelsius,
            Double estimatedArrivalHours,
            String activeRouteSummary,
            Double originLat,
            Double originLng,
            Double destLat,
            Double destLng
    ) {}

    public record ConvoyDto(
            String id,
            String vehicleNumber,
            String driverName,
            String driverPhone,
            String transporterCompany,
            String commodityType,
            String originCity,
            String destinationCity,
            String status,
            Double currentLatitude,
            Double currentLongitude,
            Double temperatureCelsius,
            Double freshnessDecayIndex,
            String activeRouteSummary,
            String createdAt,
            String updatedAt,
            Double originLat,
            Double originLng,
            Double destLat,
            Double destLng
    ) {}

    public record TelemetryPingRequest(
            @NotBlank String convoyId,
            @NotNull Double latitude,
            @NotNull Double longitude,
            Double speedKmh,
            Double headingDeg,
            Double altitudeM,
            Double temperatureCelsius
    ) {}
}
