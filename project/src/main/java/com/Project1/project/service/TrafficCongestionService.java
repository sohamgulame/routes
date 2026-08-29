package com.Project1.project.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

/**
 * TomTom Traffic Flow API Integration (Free Tier: 2,500 requests/day)
 * Fetches real-time traffic congestion data for NER highway corridors.
 * Falls back to time-of-day + road-type estimation for remote mountain segments where no provider has coverage.
 */
@Service
public class TrafficCongestionService {

    private final WebClient webClient;
    private final String apiKey;

    public record TrafficFlowResult(
            Double currentSpeedKmh,
            Double freeFlowSpeedKmh,
            Double congestionIndex,   // 0.0 = free flow, 1.0 = standstill
            String congestionLevel,   // FREE_FLOW, LIGHT, MODERATE, HEAVY, STANDSTILL
            Boolean isRealData        // true = from TomTom, false = estimated
    ) {}

    public record TomTomIncidentResult(
            String id,
            String category,
            String description,
            Integer delaySeconds,
            Double lengthMeters
    ) {}

    public TrafficCongestionService(
            @Value("${app.tomtom.api-key:#{null}}") String apiKey
    ) {
        this.apiKey = apiKey;
        this.webClient = WebClient.builder().build();
    }

    /**
     * Fetch real-time traffic flow for a road segment midpoint
     */
    public TrafficFlowResult getTrafficFlow(double latitude, double longitude, String highwayCode) {
        // Try TomTom real data if API key is configured
        if (apiKey != null && !apiKey.isEmpty()) {
            try {
                String pointStr = String.format(java.util.Locale.US, "%.5f,%.5f", latitude, longitude);
                String flowUrl = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=" + apiKey + "&point=" + pointStr + "&unit=kmph";
                Map response = webClient.get()
                        .uri(flowUrl)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .block();

                if (response != null && response.containsKey("flowSegmentData")) {
                    Map<String, Object> flow = (Map<String, Object>) response.get("flowSegmentData");
                    double currentSpeed = ((Number) flow.get("currentSpeed")).doubleValue();
                    double freeFlowSpeed = ((Number) flow.get("freeFlowSpeed")).doubleValue();

                    double congestion = freeFlowSpeed > 0
                            ? Math.max(0.0, 1.0 - (currentSpeed / freeFlowSpeed))
                            : 0.0;
                    congestion = Math.round(congestion * 100.0) / 100.0;

                    return new TrafficFlowResult(
                            currentSpeed,
                            freeFlowSpeed,
                            congestion,
                            classifyCongestion(congestion),
                            true
                    );
                }
            } catch (Exception e) {
                // Smooth fallback for remote mountain coordinates where TomTom has no physical sensor coverage
            }
        }

        // Intelligent estimation fallback for remote NER mountain segments
        return estimateTrafficFlow(latitude, longitude, highwayCode);
    }

    /**
     * Fetch live satellite & probe vehicle traffic incidents (jams, accidents, closures) from TomTom
     */
    public List<TomTomIncidentResult> getLiveTrafficIncidents(double minLat, double minLng, double maxLat, double maxLng) {
        if (apiKey == null || apiKey.isEmpty()) {
            return List.of();
        }

        try {
            String bbox = minLng + "," + minLat + "," + maxLng + "," + maxLat;
            String url = "https://api.tomtom.com/traffic/services/5/incidentDetails?key=" + apiKey +
                         "&bbox=" + bbox + "&fields={incidents{id,geometry{type,coordinates},properties{iconCategory,events{description},delay,length}}}";

            Map response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("incidents")) {
                List<Map<String, Object>> incidents = (List<Map<String, Object>>) response.get("incidents");
                return incidents.stream().map(inc -> {
                    Map<String, Object> props = (Map<String, Object>) inc.get("properties");
                    String id = String.valueOf(inc.get("id"));
                    String cat = String.valueOf(props.getOrDefault("iconCategory", "GENERAL"));
                    Number delay = (Number) props.getOrDefault("delay", 0);
                    Number len = (Number) props.getOrDefault("length", 0.0);
                    String desc = "Traffic Delay Reported";
                    if (props.containsKey("events")) {
                        List<Map<String, Object>> events = (List<Map<String, Object>>) props.get("events");
                        if (!events.isEmpty() && events.get(0).containsKey("description")) {
                            desc = String.valueOf(events.get(0).get("description"));
                        }
                    }
                    return new TomTomIncidentResult(id, cat, desc, delay.intValue(), len.doubleValue());
                }).toList();
            }
        } catch (Exception e) {
            System.err.println("TomTom Incident Details API error: " + e.getMessage());
        }

        return List.of();
    }

    /**
     * Hybrid estimation for remote NER corridors where TomTom has no data
     * Uses: time-of-day patterns, road type speed profiles, and seasonal NER monsoon adjustments
     */
    private TrafficFlowResult estimateTrafficFlow(double latitude, double longitude, String highwayCode) {
        int hour = java.time.LocalTime.now().getHour();
        int month = java.time.LocalDate.now().getMonthValue();

        // Base free-flow speed by road type
        double freeFlowSpeed;
        if (highwayCode != null && (highwayCode.contains("NH-06") || highwayCode.contains("NH-29"))) {
            freeFlowSpeed = 50.0; // Mountain national highway
        } else if (highwayCode != null && highwayCode.contains("NW-2")) {
            freeFlowSpeed = 18.0; // River waterway
        } else {
            freeFlowSpeed = 60.0; // Plains highway
        }

        // Time-of-day traffic pattern for NER
        double timeMultiplier;
        if (hour >= 7 && hour <= 9) {
            timeMultiplier = 0.75; // Morning market & supply truck rush
        } else if (hour >= 16 && hour <= 19) {
            timeMultiplier = 0.70; // Evening return congestion
        } else if (hour >= 22 || hour <= 5) {
            timeMultiplier = 0.98; // Night - nearly empty roads
        } else {
            timeMultiplier = 0.85; // Normal daytime flow
        }

        // Monsoon season penalty (June-September)
        if (month >= 6 && month <= 9) {
            timeMultiplier *= 0.85; // 15% speed reduction during monsoon
        }

        double currentSpeed = Math.round(freeFlowSpeed * timeMultiplier * 10.0) / 10.0;
        double congestion = Math.round((1.0 - timeMultiplier) * 100.0) / 100.0;

        return new TrafficFlowResult(
                currentSpeed,
                freeFlowSpeed,
                congestion,
                classifyCongestion(congestion),
                false
        );
    }

    private String classifyCongestion(double congestion) {
        if (congestion < 0.10) return "FREE_FLOW";
        if (congestion < 0.25) return "LIGHT";
        if (congestion < 0.50) return "MODERATE";
        if (congestion < 0.75) return "HEAVY";
        return "STANDSTILL";
    }
}
