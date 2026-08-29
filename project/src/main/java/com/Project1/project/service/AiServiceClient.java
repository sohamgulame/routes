package com.Project1.project.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class AiServiceClient {

    private final WebClient webClient;

    public record AiRiskPrediction(
            String segmentId,
            Double riskProbability,
            String riskLevel,
            Boolean isPassable,
            String recommendedAction,
            List<Map<String, Object>> topRiskFactors,
            String plainLanguageJustification
    ) {}

    public AiServiceClient(
            @Value("${app.ai-service.url:http://localhost:8000}") String aiServiceUrl
    ) {
        this.webClient = WebClient.builder()
                .baseUrl(aiServiceUrl)
                .build();
    }

    /**
     * Calls real Python AI FastAPI microservice for XGBoost hazard inference and SHAP explainability
     */
    public AiRiskPrediction predictRisk(
            String segmentId,
            double rainfall24h,
            double rainfall48h,
            double slopeAngleDeg,
            double soilMoistureIndex,
            double elevationAvgM,
            int historicalLandslides,
            int bridgeCount
    ) {
        try {
            Map requestBody = Map.of(
                    "segmentId", segmentId,
                    "rainfall24h", rainfall24h,
                    "rainfall48h", rainfall48h,
                    "slopeAngleDeg", slopeAngleDeg,
                    "soilMoistureIndex", soilMoistureIndex,
                    "elevationAvgM", elevationAvgM,
                    "historicalLandslides", historicalLandslides,
                    "bridgeCount", bridgeCount
            );

            Map response = webClient.post()
                    .uri("/api/predict-risk")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null) {
                return new AiRiskPrediction(
                        (String) response.get("segmentId"),
                        ((Number) response.get("riskProbability")).doubleValue(),
                        (String) response.get("riskLevel"),
                        (Boolean) response.get("isPassable"),
                        (String) response.get("recommendedAction"),
                        (List<Map<String, Object>>) response.get("topRiskFactors"),
                        (String) response.get("plainLanguageJustification")
                );
            }
        } catch (Exception e) {
            System.err.println("FastAPI AI Service Call: " + e.getMessage());
        }

        // Analytical fallback if AI service is offline
        double fallbackRisk = Math.min(0.95, (rainfall48h / 200.0) * 0.5 + (slopeAngleDeg / 40.0) * 0.5);
        return new AiRiskPrediction(
                segmentId,
                Math.round(fallbackRisk * 100.0) / 100.0,
                fallbackRisk > 0.5 ? "HIGH" : "LOW",
                fallbackRisk <= 0.75,
                fallbackRisk > 0.5 ? "CAUTION_HEAVY_RESTRICTION" : "PROCEED_NORMAL",
                List.of(),
                "Physics terrain analysis: 48h rainfall and slope gradient evaluated."
        );
    }
}
