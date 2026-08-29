package com.Project1.project.service;

import com.Project1.project.dto.RoadSegmentDto;
import com.Project1.project.entity.RoadSegment;
import com.Project1.project.repository.RoadSegmentRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoadSegmentService {

    private final RoadSegmentRepository roadSegmentRepository;
    private final WeatherIntegrationService weatherService;
    private final AiServiceClient aiServiceClient;
    private final TrafficCongestionService trafficService;

    public RoadSegmentService(
            RoadSegmentRepository roadSegmentRepository,
            WeatherIntegrationService weatherService,
            AiServiceClient aiServiceClient,
            TrafficCongestionService trafficService
    ) {
        this.roadSegmentRepository = roadSegmentRepository;
        this.weatherService = weatherService;
        this.aiServiceClient = aiServiceClient;
        this.trafficService = trafficService;
    }

    public List<RoadSegmentDto> getAllSegments() {
        return roadSegmentRepository.findAllOrderedByRisk()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<RoadSegmentDto> getHighRiskSegments(Double threshold) {
        return roadSegmentRepository.findHighRiskSegments(threshold != null ? threshold : 0.5)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public RoadSegmentDto getSegmentById(String id) {
        RoadSegment segment = roadSegmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Road segment not found: " + id));
        return mapToDto(segment);
    }

    /**
     * Periodic live AI recalculation: Evaluates all NER corridors against live Open-Meteo weather + TomTom Traffic
     */
    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void evaluateLiveCorridorRisks() {
        List<RoadSegment> segments = roadSegmentRepository.findAll();
        for (RoadSegment segment : segments) {
            try {
                // Approximate midpoint coordinates based on highway hubs
                double lat = 25.5 + (Math.random() * 1.0);
                double lng = 91.8 + (Math.random() * 1.5);
                if (segment.getHighwayCode().contains("06")) {
                    lat = 25.4526;
                    lng = 92.2037;
                } else if (segment.getHighwayCode().contains("29")) {
                    lat = 25.7500;
                    lng = 93.8000;
                }

                // Fetch live weather from Open-Meteo satellite
                var weather = weatherService.fetchLiveWeather(lat, lng);

                // Fetch live traffic flow from TomTom (or smart estimation fallback)
                var traffic = trafficService.getTrafficFlow(lat, lng, segment.getHighwayCode());
                segment.setTrafficCongestionIndex(traffic.congestionIndex());

                // AI risk prediction incorporating weather + terrain features
                var aiResult = aiServiceClient.predictRisk(
                        segment.getId(),
                        weather.rainfallPast24hMm(),
                        weather.rainfallPast48hMm(),
                        segment.getSlopeAngleDeg() != null ? segment.getSlopeAngleDeg() : 15.0,
                        weather.soilMoistureIndex(),
                        segment.getElevationAvgM() != null ? segment.getElevationAvgM() : 600.0,
                        segment.getHistoricalLandslideCount() != null ? segment.getHistoricalLandslideCount() : 0,
                        segment.getBridgeCount() != null ? segment.getBridgeCount() : 1
                );

                // Blend AI terrain risk with traffic congestion (weighted composite)
                double terrainRisk = aiResult.riskProbability();
                double trafficFactor = traffic.congestionIndex() * 0.15; // Traffic contributes 15% to overall risk
                double compositeRisk = Math.min(1.0, terrainRisk * 0.85 + trafficFactor);

                segment.setCurrentRiskScore(Math.round(compositeRisk * 100.0) / 100.0);

                String reason = aiResult.plainLanguageJustification();
                if (traffic.congestionIndex() > 0.3) {
                    reason += " | Traffic: " + traffic.congestionLevel()
                            + " (" + traffic.currentSpeedKmh() + " km/h vs " + traffic.freeFlowSpeedKmh() + " km/h free-flow)"
                            + (traffic.isRealData() ? " [TomTom Live]" : " [NER Estimation]");
                }
                segment.setDisruptionReason(reason);

                if (!aiResult.isPassable()) {
                    segment.setCurrentStatus("BLOCKED");
                } else if (compositeRisk > 0.5) {
                    segment.setCurrentStatus("CAUTION");
                } else {
                    segment.setCurrentStatus("OPEN");
                }
                segment.setLastRiskCalculatedAt(LocalDateTime.now());
                roadSegmentRepository.save(segment);
            } catch (Exception e) {
                System.err.println("Error calculating live risk for segment " + segment.getId() + ": " + e.getMessage());
            }
        }
    }

    public List<RoadSegmentDto> recalculateAllCorridorsLive() {
        evaluateLiveCorridorRisks();
        return getAllSegments();
    }

    public RoadSegmentDto updateSegmentStatus(String id, String status, Double riskScore, String reason) {
        RoadSegment segment = roadSegmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Road segment not found: " + id));

        if (status != null) segment.setCurrentStatus(status);
        if (riskScore != null) segment.setCurrentRiskScore(riskScore);
        if (reason != null) segment.setDisruptionReason(reason);

        RoadSegment saved = roadSegmentRepository.save(segment);
        return mapToDto(saved);
    }

    public RoadSegmentDto mapToDto(RoadSegment entity) {
        return new RoadSegmentDto(
                entity.getId(),
                entity.getHighwayCode(),
                entity.getSegmentName(),
                entity.getStartHub(),
                entity.getEndHub(),
                entity.getLengthKm(),
                entity.getElevationAvgM(),
                entity.getSlopeAngleDeg(),
                entity.getHistoricalLandslideCount(),
                entity.getBridgeCount(),
                entity.getMaxWeightLimitTons(),
                entity.getCurrentStatus(),
                entity.getCurrentRiskScore(),
                entity.getDisruptionReason(),
                entity.getTrafficCongestionIndex(),
                entity.getSegmentGeom() != null ? entity.getSegmentGeom().toText() : null,
                entity.getLastRiskCalculatedAt() != null ? entity.getLastRiskCalculatedAt().toString() : null
        );
    }
}
