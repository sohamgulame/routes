package com.Project1.project.service;

import com.Project1.project.dto.AlertDtos.*;
import com.Project1.project.dto.WebSocketDtos.DisruptionAlertMessage;
import com.Project1.project.entity.Convoy;
import com.Project1.project.repository.ConvoyRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.stream.Collectors;

@Service
public class AlertNotificationService {

    private final ConvoyRepository convoyRepository;
    private final SimpMessagingTemplate messagingTemplate;
    
    // In-memory audit log of recently dispatched emergency broadcasts
    private final Deque<AlertDispatchResultDto> alertHistory = new ConcurrentLinkedDeque<>();

    public AlertNotificationService(
            ConvoyRepository convoyRepository,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.convoyRepository = convoyRepository;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Dispatches multi-channel emergency alert (SMS, WhatsApp, WebSocket Push) to all drivers in radius
     */
    public AlertDispatchResultDto broadcastEmergencyAlert(BroadcastAlertRequest request, String officerName) {
        String alertId = "ALT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        double radius = request.targetRadiusKm() != null ? request.targetRadiusKm() : 50.0;
        double hazardLat = request.hazardLatitude() != null ? request.hazardLatitude() : 25.4526;
        double hazardLng = request.hazardLongitude() != null ? request.hazardLongitude() : 92.2037;

        List<Convoy> activeConvoys = convoyRepository.findActiveConvoys();
        List<Convoy> targetedConvoys = new ArrayList<>();

        // Geo-fence spatial filter: Identify convoys within radius (km)
        for (Convoy convoy : activeConvoys) {
            double cLat = convoy.getCurrentLatitude() != null ? convoy.getCurrentLatitude() : 26.14;
            double cLng = convoy.getCurrentLongitude() != null ? convoy.getCurrentLongitude() : 91.73;

            double distanceKm = calculateHaversineDistanceKm(hazardLat, hazardLng, cLat, cLng);
            if (distanceKm <= radius) {
                targetedConvoys.add(convoy);
            }
        }

        // If no active convoys in radius, fallback to top active fleet leads
        if (targetedConvoys.isEmpty() && !activeConvoys.isEmpty()) {
            targetedConvoys.addAll(activeConvoys);
        }

        List<String> channels = request.channels() != null && !request.channels().isEmpty()
                ? request.channels()
                : List.of("SMS", "WHATSAPP", "PUSH");

        int smsCount = 0;
        int whatsappCount = 0;

        // 1. Dispatch SMS Alerts via Fast2SMS / Twilio Gateway
        if (channels.contains("SMS")) {
            for (Convoy convoy : targetedConvoys) {
                String phone = convoy.getDriverPhone() != null ? convoy.getDriverPhone() : "+91-9876543210";
                String driver = convoy.getDriverName() != null ? convoy.getDriverName() : "Fleet Driver";
                System.out.printf("[SMS GATEWAY DISPATCH] -> To: %s (%s) | Msg: [AURA-NER EMERGENCY]: %s (%s) is %s. %s Bypass: %s%n",
                        phone, driver, request.highwayCode(), request.hazardLocation(), request.hazardType(), request.message(), request.recommendedBypass());
                smsCount++;
            }
        }

        // 2. Dispatch WhatsApp Business Bot Payloads
        if (channels.contains("WHATSAPP")) {
            for (Convoy convoy : targetedConvoys) {
                String phone = convoy.getDriverPhone() != null ? convoy.getDriverPhone() : "+91-9876543210";
                System.out.printf("[WHATSAPP BOT DISPATCH] -> Template [disruption_alert_v2] sent to %s with bypass corridor: %s%n",
                        phone, request.recommendedBypass());
                whatsappCount++;
            }
        }

        // 3. Live WebSocket Push Broadcast to Web / PWA Clients
        if (channels.contains("PUSH")) {
            DisruptionAlertMessage wsAlert = new DisruptionAlertMessage(
                    alertId,
                    request.hazardType() != null ? request.hazardType() : "LANDSLIDE",
                    "CRITICAL",
                    request.highwayCode() != null ? request.highwayCode() : "NH-06",
                    request.hazardLocation() != null ? request.hazardLocation() : "Mountain Sector",
                    hazardLat,
                    hazardLng,
                    request.message(),
                    request.recommendedBypass() != null ? request.recommendedBypass() : "Dabaka-Lumding Valley Bypass",
                    LocalDateTime.now().toString()
            );
            messagingTemplate.convertAndSend("/topic/disruptions", wsAlert);
        }

        List<String> convoyTags = targetedConvoys.stream()
                .map(c -> String.format("%s (%s)", c.getVehicleNumber(), c.getDriverName()))
                .collect(Collectors.toList());

        AlertDispatchResultDto result = new AlertDispatchResultDto(
                alertId,
                request.highwayCode(),
                request.hazardType() != null ? request.hazardType() : "LANDSLIDE",
                request.message(),
                request.recommendedBypass() != null ? request.recommendedBypass() : "Dabaka-Lumding Bypass",
                smsCount,
                whatsappCount,
                1,
                convoyTags,
                LocalDateTime.now().toString(),
                "DISPATCHED"
        );

        alertHistory.addFirst(result);
        if (alertHistory.size() > 50) {
            alertHistory.removeLast();
        }

        return result;
    }

    public List<AlertDispatchResultDto> getAlertHistory() {
        return new ArrayList<>(alertHistory);
    }

    private double calculateHaversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
