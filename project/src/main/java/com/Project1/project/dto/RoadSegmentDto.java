package com.Project1.project.dto;

public record RoadSegmentDto(
        String id,
        String highwayCode,
        String segmentName,
        String startHub,
        String endHub,
        Double lengthKm,
        Double elevationAvgM,
        Double slopeAngleDeg,
        Integer historicalLandslideCount,
        Integer bridgeCount,
        Double maxWeightLimitTons,
        String currentStatus,
        Double currentRiskScore,
        String disruptionReason,
        Double trafficCongestionIndex,
        String geoJsonGeometry,
        String lastRiskCalculatedAt
) {}
