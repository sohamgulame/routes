package com.Project1.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class IncidentDtos {

    public record CreateIncidentRequest(
            String roadSegmentId,
            @NotBlank String incidentType,
            @NotBlank String severity,
            @NotNull Double latitude,
            @NotNull Double longitude,
            String photoUrl,
            String description,
            Boolean syncedFromOffline
    ) {}

    public record IncidentReportDto(
            String id,
            String reporterId,
            String reporterName,
            String reporterRole,
            String roadSegmentId,
            String roadSegmentName,
            String incidentType,
            String severity,
            Double latitude,
            Double longitude,
            String photoUrl,
            String description,
            String verificationStatus,
            String verifiedBy,
            Boolean syncedFromOffline,
            String createdAt,
            String verifiedAt
    ) {}

    public record BatchSyncRequest(
            List<CreateIncidentRequest> incidents
    ) {}

    public record VerifyIncidentRequest(
            @NotBlank String verificationStatus,
            String resolutionNotes
    ) {}
}
