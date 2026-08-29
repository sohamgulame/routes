package com.Project1.project.dto;

public class WebSocketDtos {

    public record LiveConvoyTelemetryMessage(
            String convoyId,
            String vehicleNumber,
            String driverName,
            String commodityType,
            String originCity,
            String destinationCity,
            Double latitude,
            Double longitude,
            Double speedKmh,
            Double headingDeg,
            Double temperatureCelsius,
            Double freshnessDecayIndex,
            String status,
            String currentCorridor,
            String timestamp
    ) {}

    public record DisruptionAlertMessage(
            String alertId,
            String alertType,
            String severity,
            String highwayCode,
            String locationName,
            Double latitude,
            Double longitude,
            String description,
            String recommendedBypass,
            String triggeredAt
    ) {}
}
