package com.Project1.project.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class AlertDtos {

    public record BroadcastAlertRequest(
            @NotBlank(message = "Highway code is required")
            String highwayCode,
            String hazardLocation,
            String hazardType,
            @NotBlank(message = "Alert message is required")
            String message,
            String recommendedBypass,
            Double targetRadiusKm,
            Double hazardLatitude,
            Double hazardLongitude,
            List<String> channels // e.g. ["SMS", "WHATSAPP", "PUSH"]
    ) {}

    public record AlertDispatchResultDto(
            String alertId,
            String highwayCode,
            String hazardType,
            String message,
            String recommendedBypass,
            int smsDeliveredCount,
            int whatsappDeliveredCount,
            int pushBroadcastCount,
            List<String> targetedConvoys,
            String dispatchedAt,
            String status
    ) {}
}
