package com.Project1.project.service;

import com.Project1.project.dto.ConvoyDtos.*;
import com.Project1.project.dto.WebSocketDtos.DisruptionAlertMessage;
import com.Project1.project.entity.Convoy;
import com.Project1.project.entity.GpsTelemetryLog;
import com.Project1.project.repository.ConvoyRepository;
import com.Project1.project.repository.GpsTelemetryLogRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ConvoyService {

    private final ConvoyRepository convoyRepository;
    private final GpsTelemetryLogRepository telemetryLogRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public ConvoyService(ConvoyRepository convoyRepository, GpsTelemetryLogRepository telemetryLogRepository, SimpMessagingTemplate messagingTemplate) {
        this.convoyRepository = convoyRepository;
        this.telemetryLogRepository = telemetryLogRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public List<ConvoyDto> getAllConvoys() {
        return convoyRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ConvoyDto> getActiveConvoys() {
        return convoyRepository.findActiveConvoys()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ConvoyDto createConvoy(CreateConvoyRequest request) {
        double defaultLat = 26.1445;
        double defaultLng = 91.7362;

        if (request.originLat() != null && request.originLng() != null) {
            defaultLat = request.originLat();
            defaultLng = request.originLng();
        } else if (request.originCity() != null) {
            String city = request.originCity().toLowerCase();
            if (city.contains("shillong")) { defaultLat = 25.5788; defaultLng = 91.8933; }
            else if (city.contains("silchar")) { defaultLat = 24.8333; defaultLng = 92.7789; }
            else if (city.contains("tawang")) { defaultLat = 27.5860; defaultLng = 91.8670; }
            else if (city.contains("kohima")) { defaultLat = 25.6751; defaultLng = 94.1086; }
            else if (city.contains("imphal")) { defaultLat = 24.8170; defaultLng = 93.9368; }
            else if (city.contains("gangtok")) { defaultLat = 27.3389; defaultLng = 88.6065; }
            else if (city.contains("aizawl")) { defaultLat = 23.7271; defaultLng = 92.7176; }
            else if (city.contains("agartala")) { defaultLat = 23.8315; defaultLng = 91.2868; }
            else if (city.contains("itanagar")) { defaultLat = 27.0844; defaultLng = 93.6053; }
            else if (city.contains("kolkata")) { defaultLat = 22.5726; defaultLng = 88.3639; }
            else if (city.contains("delhi")) { defaultLat = 28.6139; defaultLng = 77.2090; }
            else if (city.contains("patna")) { defaultLat = 25.5941; defaultLng = 85.1376; }
            else if (city.contains("dimapur")) { defaultLat = 25.9095; defaultLng = 93.7266; }
            else if (city.contains("dabaka")) { defaultLat = 25.8833; defaultLng = 92.8667; }
            else if (city.contains("karkamb")) { defaultLat = 17.7700; defaultLng = 75.3300; }
            else if (city.contains("pandharpur")) { defaultLat = 17.6778; defaultLng = 75.3278; }
        }

        Convoy convoy = new Convoy(
                UUID.randomUUID().toString(),
                request.vehicleNumber(),
                request.driverName(),
                request.driverPhone(),
                request.transporterCompany(),
                request.commodityType(),
                request.originCity(),
                request.destinationCity(),
                "PLANNED",
                defaultLat,
                defaultLng,
                geometryFactory.createPoint(new Coordinate(defaultLng, defaultLat)),
                request.temperatureCelsius() != null ? request.temperatureCelsius() : 4.0,
                1.0,
                request.activeRouteSummary() != null && !request.activeRouteSummary().isEmpty() 
                        ? request.activeRouteSummary() 
                        : request.originCity() + " → " + request.destinationCity()
        );

        // Set Origin and Destination Coordinates for GIS Polyline Persistence & Live Simulation
        Double originLat = request.originLat() != null ? request.originLat() : defaultLat;
        Double originLng = request.originLng() != null ? request.originLng() : defaultLng;
        Double destLat = request.destLat();
        Double destLng = request.destLng();

        if ((destLat == null || destLng == null) && request.destinationCity() != null) {
            String destCity = request.destinationCity().toLowerCase();
            if (destCity.contains("shillong")) { destLat = 25.5788; destLng = 91.8933; }
            else if (destCity.contains("silchar")) { destLat = 24.8333; destLng = 92.7789; }
            else if (destCity.contains("tawang")) { destLat = 27.5860; destLng = 91.8670; }
            else if (destCity.contains("kohima")) { destLat = 25.6751; destLng = 94.1086; }
            else if (destCity.contains("imphal")) { destLat = 24.8170; destLng = 93.9368; }
            else if (destCity.contains("gangtok")) { destLat = 27.3389; destLng = 88.6065; }
            else if (destCity.contains("aizawl")) { destLat = 23.7271; destLng = 92.7176; }
            else if (destCity.contains("agartala")) { destLat = 23.8315; destLng = 91.2868; }
            else if (destCity.contains("itanagar")) { destLat = 27.0844; destLng = 93.6053; }
            else if (destCity.contains("kolkata")) { destLat = 22.5726; destLng = 88.3639; }
            else if (destCity.contains("delhi")) { destLat = 28.6139; destLng = 77.2090; }
            else if (destCity.contains("patna")) { destLat = 25.5941; destLng = 85.1376; }
            else if (destCity.contains("dimapur")) { destLat = 25.9095; destLng = 93.7266; }
            else if (destCity.contains("dabaka")) { destLat = 25.8833; destLng = 92.8667; }
            else if (destCity.contains("karkamb")) { destLat = 17.7700; destLng = 75.3300; }
            else if (destCity.contains("pandharpur")) { destLat = 17.6778; destLng = 75.3278; }
        }

        convoy.setOriginLatitude(originLat);
        convoy.setOriginLongitude(originLng);
        convoy.setDestLatitude(destLat);
        convoy.setDestLongitude(destLng);

        // Set ETA from dispatch form (default 12 hours if not provided)
        double etaHours = request.estimatedArrivalHours() != null ? request.estimatedArrivalHours() : 12.0;
        convoy.setEstimatedArrivalTime(LocalDateTime.now().plusMinutes((long) (etaHours * 60)));

        Convoy saved = convoyRepository.save(convoy);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteConvoy(String convoyId) {
        Convoy convoy = convoyRepository.findById(convoyId)
                .orElseThrow(() -> new RuntimeException("Convoy not found: " + convoyId));
        telemetryLogRepository.deleteByConvoyId(convoyId);
        convoyRepository.delete(convoy);
    }

    @Transactional
    public ConvoyDto completeConvoy(String convoyId) {
        Convoy convoy = convoyRepository.findById(convoyId)
                .orElseThrow(() -> new RuntimeException("Convoy not found: " + convoyId));
        convoy.setStatus("DELIVERED");
        Convoy updated = convoyRepository.save(convoy);
        return mapToDto(updated);
    }

    public ConvoyDto updateTelemetry(TelemetryPingRequest ping) {
        Convoy convoy = convoyRepository.findById(ping.convoyId())
                .orElseThrow(() -> new RuntimeException("Convoy not found: " + ping.convoyId()));

        Point locationPoint = geometryFactory.createPoint(new Coordinate(ping.longitude(), ping.latitude()));
        convoy.setCurrentLatitude(ping.latitude());
        convoy.setCurrentLongitude(ping.longitude());
        convoy.setCurrentLocation(locationPoint);

        if (ping.temperatureCelsius() != null) {
            convoy.setTemperatureCelsius(ping.temperatureCelsius());
        }

        Convoy updated = convoyRepository.save(convoy);

        // Save historical log
        GpsTelemetryLog log = new GpsTelemetryLog(
                null,
                updated,
                ping.latitude(),
                ping.longitude(),
                ping.speedKmh() != null ? ping.speedKmh() : 0.0,
                ping.headingDeg() != null ? ping.headingDeg() : 0.0,
                ping.altitudeM() != null ? ping.altitudeM() : 0.0,
                ping.temperatureCelsius(),
                LocalDateTime.now()
        );
        telemetryLogRepository.save(log);

        return mapToDto(updated);
    }

    public ConvoyDto mapToDto(Convoy convoy) {
        return new ConvoyDto(
                convoy.getId(),
                convoy.getVehicleNumber(),
                convoy.getDriverName(),
                convoy.getDriverPhone(),
                convoy.getTransporterCompany(),
                convoy.getCommodityType(),
                convoy.getOriginCity(),
                convoy.getDestinationCity(),
                convoy.getStatus(),
                convoy.getCurrentLatitude(),
                convoy.getCurrentLongitude(),
                convoy.getTemperatureCelsius(),
                convoy.getFreshnessDecayIndex(),
                convoy.getActiveRouteSummary(),
                convoy.getCreatedAt() != null ? convoy.getCreatedAt().toString() : null,
                convoy.getUpdatedAt() != null ? convoy.getUpdatedAt().toString() : null,
                convoy.getOriginLatitude() != null ? convoy.getOriginLatitude() : convoy.getCurrentLatitude(),
                convoy.getOriginLongitude() != null ? convoy.getOriginLongitude() : convoy.getCurrentLongitude(),
                convoy.getDestLatitude(),
                convoy.getDestLongitude()
        );
    }

    /**
     * Scheduled ETA Threshold Monitor — checks every 2 minutes
     * Fires DELIVERY_DELAYED WebSocket alert if convoy exceeds ETA by > 2 hours
     */
    @Scheduled(fixedRate = 120000) // Every 2 minutes
    public void checkConvoyEtaThresholds() {
        List<Convoy> activeConvoys = convoyRepository.findActiveConvoys();
        LocalDateTime now = LocalDateTime.now();

        for (Convoy convoy : activeConvoys) {
            if (convoy.getEstimatedArrivalTime() == null) continue;
            if (Boolean.TRUE.equals(convoy.getEtaExceededAlertSent())) continue;

            Duration overdue = Duration.between(convoy.getEstimatedArrivalTime(), now);
            if (overdue.toHours() >= 2) {
                // Mark alert as sent
                convoy.setEtaExceededAlertSent(true);
                convoy.setStatus("DELAYED");
                convoyRepository.save(convoy);

                // Fire WebSocket DELIVERY_DELAYED alert
                String alertId = "ETA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                double lat = convoy.getCurrentLatitude() != null ? convoy.getCurrentLatitude() : 26.14;
                double lng = convoy.getCurrentLongitude() != null ? convoy.getCurrentLongitude() : 91.73;

                DisruptionAlertMessage alert = new DisruptionAlertMessage(
                        alertId,
                        "DELIVERY_DELAYED",
                        "HIGH",
                        convoy.getActiveRouteSummary() != null ? convoy.getActiveRouteSummary() : "NER Corridor",
                        convoy.getDestinationCity(),
                        lat,
                        lng,
                        "DELIVERY DELAYED: Vehicle " + convoy.getVehicleNumber() + " carrying " + convoy.getCommodityType()
                                + " (" + convoy.getOriginCity() + " → " + convoy.getDestinationCity() + ") has exceeded ETA by "
                                + overdue.toHours() + "h " + (overdue.toMinutesPart()) + "m. Driver: " + convoy.getDriverName()
                                + " (" + convoy.getDriverPhone() + ")",
                        "Contact driver immediately. Consider rerouting or dispatching backup supply vehicle.",
                        now.toString()
                );

                messagingTemplate.convertAndSend("/topic/alerts/disruptions", alert);
                System.out.println("[ETA ALERT] Convoy " + convoy.getVehicleNumber() + " exceeded ETA by " + overdue.toHours() + " hours.");
            }
        }
    }
}
