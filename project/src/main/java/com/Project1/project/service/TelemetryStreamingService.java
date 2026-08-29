package com.Project1.project.service;

import com.Project1.project.dto.WebSocketDtos.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class TelemetryStreamingService {

    private final SimpMessagingTemplate messagingTemplate;

    public TelemetryStreamingService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastConvoyTelemetry(LiveConvoyTelemetryMessage telemetry) {
        messagingTemplate.convertAndSend("/topic/convoys/live", telemetry);
    }

    public void broadcastDisruptionAlert(DisruptionAlertMessage alert) {
        messagingTemplate.convertAndSend("/topic/alerts/disruptions", alert);
    }

    public void broadcastSimulationEvent(String eventName, Object payload) {
        messagingTemplate.convertAndSend("/topic/simulation/events", payload);
    }
}
