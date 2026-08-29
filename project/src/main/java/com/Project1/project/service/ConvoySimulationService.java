package com.Project1.project.service;

import com.Project1.project.dto.WebSocketDtos.LiveConvoyTelemetryMessage;
import com.Project1.project.entity.Convoy;
import com.Project1.project.entity.GpsTelemetryLog;
import com.Project1.project.repository.ConvoyRepository;
import com.Project1.project.repository.GpsTelemetryLogRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class ConvoySimulationService {

    private static final Logger log = LoggerFactory.getLogger(ConvoySimulationService.class);

    private final ConvoyRepository convoyRepository;
    private final GpsTelemetryLogRepository telemetryLogRepository;
    private final TelemetryStreamingService telemetryStreamingService;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    private final Random random = new Random();

    public ConvoySimulationService(
            ConvoyRepository convoyRepository,
            GpsTelemetryLogRepository telemetryLogRepository,
            TelemetryStreamingService telemetryStreamingService
    ) {
        this.convoyRepository = convoyRepository;
        this.telemetryLogRepository = telemetryLogRepository;
        this.telemetryStreamingService = telemetryStreamingService;
    }

    /**
     * Runs every 5 seconds to simulate real-world movement for active freight convoys
     */
    @Scheduled(fixedRate = 5000)
    @Transactional
    public void simulateLiveConvoyMovement() {
        List<Convoy> activeConvoys = convoyRepository.findActiveConvoys();
        if (activeConvoys.isEmpty()) {
            return;
        }

        for (Convoy convoy : activeConvoys) {
            Double currLat = convoy.getCurrentLatitude();
            Double currLng = convoy.getCurrentLongitude();
            Double destLat = convoy.getDestLatitude();
            Double destLng = convoy.getDestLongitude();

            // If coordinates are missing, fallback or skip
            if (currLat == null || currLng == null || destLat == null || destLng == null) {
                continue;
            }

            double dLat = destLat - currLat;
            double dLng = destLng - currLng;
            double distanceDeg = Math.sqrt(dLat * dLat + dLng * dLng);

            // If truck is within ~500m of destination, mark delivered
            if (distanceDeg < 0.005) {
                convoy.setStatus("DELIVERED");
                convoy.setCurrentLatitude(destLat);
                convoy.setCurrentLongitude(destLng);
                Point finalPoint = geometryFactory.createPoint(new Coordinate(destLng, destLat));
                convoy.setCurrentLocation(finalPoint);
                Convoy saved = convoyRepository.save(convoy);

                telemetryStreamingService.broadcastConvoyTelemetry(new LiveConvoyTelemetryMessage(
                        saved.getId(),
                        saved.getVehicleNumber(),
                        saved.getDriverName(),
                        saved.getCommodityType(),
                        saved.getOriginCity(),
                        saved.getDestinationCity(),
                        destLat,
                        destLng,
                        0.0,
                        0.0,
                        saved.getTemperatureCelsius(),
                        saved.getFreshnessDecayIndex(),
                        "DELIVERED",
                        saved.getActiveRouteSummary(),
                        LocalDateTime.now().toString()
                ));
                log.info("Convoy {} reached destination {}. Status marked DELIVERED.", saved.getVehicleNumber(), saved.getDestinationCity());
                continue;
            }

            // Move truck along vector toward destination (approx 45-65 km/h)
            double stepSize = Math.min(0.005, distanceDeg * 0.04);
            double nextLat = currLat + (dLat / distanceDeg) * stepSize;
            double nextLng = currLng + (dLng / distanceDeg) * stepSize;

            // Calculate compass bearing
            double headingDeg = (Math.toDegrees(Math.atan2(dLng, dLat)) + 360) % 360;

            // Simulate realistic vehicle dynamics
            double speedKmh = 45.0 + random.nextDouble() * 18.0;
            double currentTemp = convoy.getTemperatureCelsius() != null ? convoy.getTemperatureCelsius() : 4.0;
            double tempVariance = (random.nextDouble() - 0.5) * 0.2; // +/- 0.1 C
            double updatedTemp = Math.round((currentTemp + tempVariance) * 10.0) / 10.0;

            // Update entity
            convoy.setStatus("IN_TRANSIT");
            convoy.setCurrentLatitude(nextLat);
            convoy.setCurrentLongitude(nextLng);
            Point locationPoint = geometryFactory.createPoint(new Coordinate(nextLng, nextLat));
            convoy.setCurrentLocation(locationPoint);
            convoy.setTemperatureCelsius(updatedTemp);
            Convoy saved = convoyRepository.save(convoy);

            // Record telemetry history log
            GpsTelemetryLog logEntry = new GpsTelemetryLog(
                    null,
                    saved,
                    nextLat,
                    nextLng,
                    speedKmh,
                    headingDeg,
                    520.0 + random.nextDouble() * 50.0,
                    updatedTemp,
                    LocalDateTime.now()
            );
            telemetryLogRepository.save(logEntry);

            // Broadcast live telemetry over WebSocket to all connected GIS clients
            telemetryStreamingService.broadcastConvoyTelemetry(new LiveConvoyTelemetryMessage(
                    saved.getId(),
                    saved.getVehicleNumber(),
                    saved.getDriverName(),
                    saved.getCommodityType(),
                    saved.getOriginCity(),
                    saved.getDestinationCity(),
                    nextLat,
                    nextLng,
                    Math.round(speedKmh * 10.0) / 10.0,
                    Math.round(headingDeg * 10.0) / 10.0,
                    updatedTemp,
                    saved.getFreshnessDecayIndex(),
                    "IN_TRANSIT",
                    saved.getActiveRouteSummary(),
                    LocalDateTime.now().toString()
            ));
        }
    }
}
