package com.Project1.project.service;

import com.Project1.project.dto.AlertDtos.*;
import com.Project1.project.dto.WebSocketDtos.DisruptionAlertMessage;
import com.Project1.project.entity.Convoy;
import com.Project1.project.repository.ConvoyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.stream.Collectors;

@Service
public class AlertNotificationService {

    private static final Logger log = LoggerFactory.getLogger(AlertNotificationService.class);

    private final ConvoyRepository convoyRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final WebClient webClient;

    @Value("${app.sms.gateway.provider:FAST2SMS}")
    private String gatewayProvider;

    @Value("${app.sms.gateway.api-key:}")
    private String fast2SmsApiKey;

    @Value("${app.sms.twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${app.sms.twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${app.sms.twilio.from-number:}")
    private String twilioFromNumber;
    
    // In-memory audit log of recently dispatched emergency broadcasts
    private final Deque<AlertDispatchResultDto> alertHistory = new ConcurrentLinkedDeque<>();

    public AlertNotificationService(
            ConvoyRepository convoyRepository,
            SimpMessagingTemplate messagingTemplate,
            WebClient.Builder webClientBuilder
    ) {
        this.convoyRepository = convoyRepository;
        this.messagingTemplate = messagingTemplate;
        this.webClient = webClientBuilder.build();
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

        String messageBody = String.format("[AURA-NER EMERGENCY BROADCAST]: %s corridor (%s) is %s. %s Recommended Safety Bypass: %s",
                request.highwayCode() != null ? request.highwayCode() : "Transit Corridor",
                request.hazardLocation() != null ? request.hazardLocation() : "Active Sector",
                request.hazardType() != null ? request.hazardType() : "DISRUPTED",
                request.message() != null ? request.message() : "Exercise extreme caution.",
                request.recommendedBypass() != null ? request.recommendedBypass() : "Follow state command guidance.");

        // 1. Dispatch SMS Alerts via Fast2SMS / Twilio Gateway
        if (channels.contains("SMS")) {
            for (Convoy convoy : targetedConvoys) {
                String rawPhone = convoy.getDriverPhone() != null ? convoy.getDriverPhone() : "+91-9876543210";
                String cleanPhone = rawPhone.replaceAll("[^0-9]", "");
                if (cleanPhone.length() > 10) {
                    cleanPhone = cleanPhone.substring(cleanPhone.length() - 10);
                }

                sendRealSms(cleanPhone, messageBody);
                smsCount++;
            }
        }

        // 2. Dispatch WhatsApp Business Bot Payloads
        if (channels.contains("WHATSAPP")) {
            for (Convoy convoy : targetedConvoys) {
                String phone = convoy.getDriverPhone() != null ? convoy.getDriverPhone() : "+91-9876543210";
                sendRealWhatsApp(phone, messageBody);
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
            messagingTemplate.convertAndSend("/topic/alerts/disruptions", wsAlert);
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

    /**
     * Sends real SMS via Fast2SMS / Twilio API or logs structured telemetry
     */
    private void sendRealSms(String phone10Digits, String message) {
        if ("FAST2SMS".equalsIgnoreCase(gatewayProvider) && fast2SmsApiKey != null && !fast2SmsApiKey.isBlank()) {
            try {
                Map<String, Object> body = Map.of(
                        "route", "q",
                        "message", message,
                        "language", "english",
                        "flash", 0,
                        "numbers", phone10Digits
                );

                webClient.post()
                        .uri("https://www.fast2sms.com/dev/bulkV2")
                        .header("authorization", fast2SmsApiKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(body)
                        .retrieve()
                        .bodyToMono(String.class)
                        .subscribe(
                                res -> log.info("[FAST2SMS LIVE DISPATCH SUCCESS] Sent to {}: {}", phone10Digits, res),
                                err -> log.warn("[FAST2SMS DISPATCH FAILED] {}: {}", phone10Digits, err.getMessage())
                        );
                return;
            } catch (Exception e) {
                log.warn("[FAST2SMS ERROR] Exception sending to {}: {}", phone10Digits, e.getMessage());
            }
        } else if ("TWILIO".equalsIgnoreCase(gatewayProvider) && twilioAccountSid != null && !twilioAccountSid.isBlank()) {
            try {
                String url = String.format("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", twilioAccountSid);
                webClient.post()
                        .uri(url)
                        .headers(h -> h.setBasicAuth(twilioAccountSid, twilioAuthToken))
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body(BodyInserters.fromFormData("To", "+91" + phone10Digits)
                                .with("From", twilioFromNumber)
                                .with("Body", message))
                        .retrieve()
                        .bodyToMono(String.class)
                        .subscribe(
                                res -> log.info("[TWILIO SMS DISPATCH SUCCESS] Sent to +91{}: {}", phone10Digits, res),
                                err -> log.warn("[TWILIO SMS DISPATCH FAILED] +91{}: {}", phone10Digits, err.getMessage())
                        );
                return;
            } catch (Exception e) {
                log.warn("[TWILIO ERROR] Exception sending to +91{}: {}", phone10Digits, e.getMessage());
            }
        }

        // Live Simulated Gateway Telemetry Log
        log.info("[EMERGENCY SMS GATEWAY DISPATCH] -> To: +91-{} | Text: {}", phone10Digits, message);
    }

    /**
     * Sends WhatsApp message via Twilio WhatsApp API or logs structured telemetry
     */
    private void sendRealWhatsApp(String phone, String message) {
        String clean = phone != null ? phone.replaceAll("[^0-9]", "") : "919876543210";
        if (clean.length() == 10) {
            clean = "91" + clean;
        }
        final String targetPhone = clean;

        if (twilioAccountSid != null && !twilioAccountSid.isBlank() && twilioAuthToken != null && !twilioAuthToken.isBlank()) {
            try {
                String url = String.format("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", twilioAccountSid);
                webClient.post()
                        .uri(url)
                        .headers(h -> h.setBasicAuth(twilioAccountSid, twilioAuthToken))
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body(BodyInserters.fromFormData("To", "whatsapp:+" + targetPhone)
                                .with("From", "whatsapp:" + twilioFromNumber)
                                .with("Body", message))
                        .retrieve()
                        .bodyToMono(String.class)
                        .subscribe(
                                res -> log.info("[TWILIO WHATSAPP DISPATCH SUCCESS] Sent to whatsapp:+{}: {}", targetPhone, res),
                                err -> log.warn("[TWILIO WHATSAPP DISPATCH FAILED] whatsapp:+{}: {}", targetPhone, err.getMessage())
                        );
                return;
            } catch (Exception e) {
                log.warn("[WHATSAPP GATEWAY ERROR] {}", e.getMessage());
            }
        }

        // Simulated WhatsApp Bot payload
        log.info("[WHATSAPP BUSINESS BOT DISPATCH] -> To: {} | Template: [disruption_alert_v2] | Text: {}", phone, message);
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
