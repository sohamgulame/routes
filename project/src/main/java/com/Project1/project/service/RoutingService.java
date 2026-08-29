package com.Project1.project.service;

import com.Project1.project.dto.RoutingDtos.*;
import com.Project1.project.entity.RoadSegment;
import com.Project1.project.repository.RoadSegmentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class RoutingService {

    private final RoadSegmentRepository roadSegmentRepository;
    private final WeatherIntegrationService weatherService;
    private final AiServiceClient aiServiceClient;

    public RoutingService(
            RoadSegmentRepository roadSegmentRepository,
            WeatherIntegrationService weatherService,
            AiServiceClient aiServiceClient
    ) {
        this.roadSegmentRepository = roadSegmentRepository;
        this.weatherService = weatherService;
        this.aiServiceClient = aiServiceClient;
    }

    public RouteCalculationResponse calculateOptimalRoutes(RouteCalculationRequest req) {
        String origin = req.originCity() != null ? req.originCity() : "Guwahati";
        String destination = req.destinationCity() != null ? req.destinationCity() : "Silchar";
        String commodity = req.commodityType() != null ? req.commodityType() : "MEDICINES";

        List<RouteOptionDto> options = new ArrayList<>();
        List<RoadSegment> allSegments = roadSegmentRepository.findAll();

        // 1. LIVE METEOROLOGICAL & AI INFERENCE ON-THE-FLY
        // Evaluate live corridor midpoint (e.g. Jowai/Shillong mountain pass)
        double evalLat = 25.4526;
        double evalLng = 92.2037;

        var weather = weatherService.fetchLiveWeather(evalLat, evalLng);

        // Execute real-time XGBoost hazard prediction via Python AI microservice
        var aiResult = aiServiceClient.predictRisk(
                "seg-nh06-3",
                weather.rainfallPast24hMm(),
                weather.rainfallPast48hMm(),
                32.5, // 32.5° mountain slope
                weather.soilMoistureIndex(),
                1250.0, // Jowai pass elevation
                3, // Historical failures
                2  // Bridge count
        );

        double liveRisk = aiResult.riskProbability();
        boolean isHighHighwayRisk = liveRisk > 0.45;
        String liveRiskLevel = aiResult.riskLevel();

        // Extract real SHAP factors for XAI explanation
        List<String> shapDescriptions = new ArrayList<>();
        if (aiResult.topRiskFactors() != null && !aiResult.topRiskFactors().isEmpty()) {
            for (var factor : aiResult.topRiskFactors()) {
                if (factor.get("description") != null) {
                    shapDescriptions.add(factor.get("factor") + ": " + factor.get("description"));
                }
            }
        }
        if (shapDescriptions.isEmpty()) {
            shapDescriptions = List.of(
                    "48h Rainfall: " + weather.rainfallPast48hMm() + " mm",
                    "Soil Saturation: " + (int)(weather.soilMoistureIndex() * 100) + "%",
                    "Slope Angle: 32.5° mountain gradient"
            );
        }

        // -------------------------------------------------------------
        // Strategy 1: Option A - Direct NH-06 Highway
        // -------------------------------------------------------------
        List<RouteStepDto> stepsOptionA = List.of(
                new RouteStepDto("seg-nh06-1", "NH-06", origin, "Nongpoh", 48.5, 0.15, "OPEN", "ROAD"),
                new RouteStepDto("seg-nh06-2", "NH-06", "Nongpoh", "Shillong", 51.0, 0.25, "OPEN", "ROAD"),
                new RouteStepDto("seg-nh06-3", "NH-06", "Shillong", "Jowai Pass", 64.0, liveRisk, isHighHighwayRisk ? "CAUTION" : "OPEN", "ROAD"),
                new RouteStepDto("seg-nh06-4", "NH-06", "Jowai Pass", destination, 135.0, 0.35, "OPEN", "ROAD")
        );

        double totalDistA = stepsOptionA.stream().mapToDouble(RouteStepDto::distanceKm).sum();
        double estHoursA = 7.5;
        if (isHighHighwayRisk) {
            estHoursA += Math.round((liveRisk * 16.0) * 10.0) / 10.0;
        }

        XaiDecisionDto xaiA = new XaiDecisionDto(
                "Direct highway corridor traversal via NH-06 with live Open-Meteo satellite feed.",
                isHighHighwayRisk ? -Math.round((liveRisk * 14.0) * 10.0) / 10.0 : 2.5,
                2100.0,
                shapDescriptions,
                aiResult.plainLanguageJustification()
        );

        options.add(new RouteOptionDto(
                "ROUTE_OPT_A_HIGHWAY",
                "Direct NH-06 Highway Corridor (Live Satellite AI)",
                "FASTEST",
                totalDistA,
                estHoursA,
                liveRisk,
                liveRiskLevel,
                !isHighHighwayRisk,
                stepsOptionA,
                xaiA
        ));

        // -------------------------------------------------------------
        // Strategy 2: Option B - Multi-Modal Rail-Road Bypass (Lumding Corridor)
        // -------------------------------------------------------------
        List<RouteStepDto> stepsOptionB = List.of(
                new RouteStepDto("seg-nh29-1", "NH-29", origin, "Dabaka", 92.0, 0.10, "OPEN", "ROAD"),
                new RouteStepDto("seg-rail-1", "Lumding-Badarpur Rail Line", "Dabaka/Lumding", destination + " Rail Yard", 173.0, 0.08, "OPEN", "RAIL")
        );

        double totalDistB = 265.0;
        double estHoursB = 8.2;

        XaiDecisionDto xaiB = new XaiDecisionDto(
                "Bypasses high-risk mountain terrain using the Lumding-Badarpur rail corridor.",
                isHighHighwayRisk ? 13.8 : -0.7,
                4500.0,
                List.of(
                        "Live satellite precipitation (" + weather.rainfallPast48hMm() + "mm) bypassed",
                        "32.5° unstable Jowai slope avoided",
                        "Zero landslide exposure via electrified broad-gauge rail"
                ),
                "Option B ensures continuous transit for " + commodity + ", eliminating bottleneck delays and protecting perishables."
        );

        options.add(new RouteOptionDto(
                "ROUTE_OPT_B_RESILIENT",
                "Resilient Multi-Modal Rail-Road Bypass",
                "RESILIENT_BYPASS",
                totalDistB,
                estHoursB,
                0.08,
                "LOW",
                isHighHighwayRisk,
                stepsOptionB,
                xaiB
        ));

        // -------------------------------------------------------------
        // Strategy 3: Option C - Brahmaputra National Waterway-2 (Inland Waterways)
        // -------------------------------------------------------------
        if (Boolean.TRUE.equals(req.allowWaterways())) {
            List<RouteStepDto> stepsOptionC = List.of(
                    new RouteStepDto("seg-nw2-1", "NW-2 Brahmaputra River", "Pandu Port (Guwahati)", "Dhubri River Terminal", 260.0, 0.05, "OPEN", "RIVER_BARGE"),
                    new RouteStepDto("seg-road-link", "NH-17 Link", "Dhubri Terminal", destination, 85.0, 0.12, "OPEN", "ROAD")
            );

            XaiDecisionDto xaiC = new XaiDecisionDto(
                    "Low-cost, zero-landslide bulk transit via National Waterway-2 river barges.",
                    -6.0,
                    12500.0,
                    List.of("All hill landslides and mountain road cavities bypassed"),
                    "Waterway NW-2 offers 55% lower cost per ton-km for bulk non-perishables and disaster relief supplies with 100% weather resilience."
            );

            options.add(new RouteOptionDto(
                "ROUTE_OPT_C_WATERWAY",
                "National Waterway-2 River Barge Corridor",
                "WATERWAY_NW2",
                345.0,
                18.0,
                0.05,
                "LOW",
                false,
                stepsOptionC,
                xaiC
            ));
        }

        return new RouteCalculationResponse(
                origin,
                destination,
                commodity,
                options,
                LocalDateTime.now().toString()
        );
    }
}
