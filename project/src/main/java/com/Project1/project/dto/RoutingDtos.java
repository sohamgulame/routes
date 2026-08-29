package com.Project1.project.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class RoutingDtos {

    public record RouteCalculationRequest(
            @NotBlank String originCity,
            @NotBlank String destinationCity,
            String commodityType,
            Boolean allowWaterways,
            Double vehicleWeightTons
    ) {}

    public record RouteStepDto(
            String segmentId,
            String highwayCode,
            String fromHub,
            String toHub,
            Double distanceKm,
            Double riskScore,
            String status,
            String transportMode // ROAD, RIVER_BARGE, RAIL
    ) {}

    public record XaiDecisionDto(
            String primaryReason,
            Double netTimeSavedHours,
            Double costSavingsInr,
            List<String> riskFactorsAvoided,
            String naturalLanguageSummary
    ) {}

    public record RouteOptionDto(
            String routeId,
            String routeName,
            String strategyType,
            Double totalDistanceKm,
            Double estimatedHours,
            Double overallRiskScore,
            String riskTier,
            Boolean isRecommended,
            List<RouteStepDto> steps,
            XaiDecisionDto explainability
    ) {}

    public record RouteCalculationResponse(
            String originCity,
            String destinationCity,
            String commodityType,
            List<RouteOptionDto> options,
            String calculatedAt
    ) {}
}
