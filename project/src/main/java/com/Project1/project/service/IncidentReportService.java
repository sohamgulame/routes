package com.Project1.project.service;

import com.Project1.project.dto.IncidentDtos.*;
import com.Project1.project.entity.IncidentReport;
import com.Project1.project.entity.RoadSegment;
import com.Project1.project.entity.User;
import com.Project1.project.repository.IncidentReportRepository;
import com.Project1.project.repository.RoadSegmentRepository;
import com.Project1.project.repository.UserRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class IncidentReportService {

    private final IncidentReportRepository incidentReportRepository;
    private final RoadSegmentRepository roadSegmentRepository;
    private final UserRepository userRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public IncidentReportService(IncidentReportRepository incidentReportRepository, RoadSegmentRepository roadSegmentRepository, UserRepository userRepository) {
        this.incidentReportRepository = incidentReportRepository;
        this.roadSegmentRepository = roadSegmentRepository;
        this.userRepository = userRepository;
    }

    public List<IncidentReportDto> getRecentIncidents() {
        return incidentReportRepository.findRecentIncidents()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<IncidentReportDto> getPendingQueue() {
        return incidentReportRepository.findPendingVerificationQueue()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public IncidentReportDto createIncident(CreateIncidentRequest req, String username) {
        User reporter = null;
        if (username != null) {
            reporter = userRepository.findByUsername(username).orElse(null);
        }

        RoadSegment segment = null;
        if (req.roadSegmentId() != null && !req.roadSegmentId().isBlank()) {
            segment = roadSegmentRepository.findById(req.roadSegmentId()).orElse(null);
        }
        if (segment == null && req.latitude() != null && req.longitude() != null) {
            try {
                segment = roadSegmentRepository.findNearestSegment(req.latitude(), req.longitude());
            } catch (Exception e) {
                // Ignore fallback error
            }
        }

        Point geom = geometryFactory.createPoint(new Coordinate(req.longitude(), req.latitude()));

        boolean isOfficial = reporter != null && (
                "ROLE_FIELD_ENGINEER".equals(reporter.getRole()) ||
                "ROLE_DISASTER_OFFICER".equals(reporter.getRole()) ||
                "ROLE_ADMIN".equals(reporter.getRole())
        );
        String verificationStatus = isOfficial ? "VERIFIED" : "PENDING";

        IncidentReport incident = new IncidentReport(
                UUID.randomUUID().toString(),
                reporter,
                reporter != null ? reporter.getFullName() : "Anonymous Citizen",
                reporter != null ? reporter.getRole() : "CITIZEN",
                segment,
                req.incidentType(),
                req.severity(),
                geom,
                req.latitude(),
                req.longitude(),
                req.photoUrl(),
                req.description(),
                verificationStatus,
                isOfficial ? reporter.getFullName() : null,
                req.syncedFromOffline() != null ? req.syncedFromOffline() : false,
                isOfficial ? LocalDateTime.now() : null
        );

        IncidentReport saved = incidentReportRepository.save(incident);

        if (isOfficial && segment != null && "CRITICAL".equalsIgnoreCase(req.severity())) {
            segment.setCurrentStatus("BLOCKED");
            segment.setDisruptionReason("Active " + req.incidentType() + " reported: " + req.description());
            segment.setCurrentRiskScore(0.95);
            roadSegmentRepository.save(segment);
        }

        return mapToDto(saved);
    }

    @Transactional
    public List<IncidentReportDto> batchSyncOffline(BatchSyncRequest batchReq, String username) {
        List<IncidentReportDto> results = new ArrayList<>();
        if (batchReq.incidents() != null) {
            for (CreateIncidentRequest req : batchReq.incidents()) {
                results.add(createIncident(req, username));
            }
        }
        return results;
    }

    @Transactional
    public IncidentReportDto verifyIncident(String incidentId, VerifyIncidentRequest verifyReq, String officerName) {
        IncidentReport incident = incidentReportRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident not found: " + incidentId));

        incident.setVerificationStatus(verifyReq.verificationStatus());
        incident.setVerifiedBy(officerName);
        incident.setVerifiedAt(LocalDateTime.now());

        IncidentReport saved = incidentReportRepository.save(incident);

        if ("VERIFIED".equals(verifyReq.verificationStatus()) && incident.getRoadSegment() != null) {
            RoadSegment segment = incident.getRoadSegment();
            if ("CRITICAL".equals(incident.getSeverity()) || "HIGH".equals(incident.getSeverity())) {
                segment.setCurrentStatus("BLOCKED");
                segment.setCurrentRiskScore(0.95);
                segment.setDisruptionReason("Verified " + incident.getIncidentType() + ": " + incident.getDescription());
            }
            roadSegmentRepository.save(segment);
        } else if (("RESOLVED".equals(verifyReq.verificationStatus()) || "REJECTED".equals(verifyReq.verificationStatus())) && incident.getRoadSegment() != null) {
            RoadSegment segment = incident.getRoadSegment();
            segment.setCurrentStatus("OPEN");
            segment.setCurrentRiskScore(0.12);
            segment.setDisruptionReason("Corridor cleared by disaster response teams.");
            roadSegmentRepository.save(segment);
        }

        return mapToDto(saved);
    }

    private IncidentReportDto mapToDto(IncidentReport report) {
        return new IncidentReportDto(
                report.getId(),
                report.getReporter() != null ? report.getReporter().getId() : null,
                report.getReporterName(),
                report.getReporterRole(),
                report.getRoadSegment() != null ? report.getRoadSegment().getId() : null,
                report.getRoadSegment() != null ? report.getRoadSegment().getSegmentName() : null,
                report.getIncidentType(),
                report.getSeverity(),
                report.getLatitude(),
                report.getLongitude(),
                report.getPhotoUrl(),
                report.getDescription(),
                report.getVerificationStatus(),
                report.getVerifiedBy(),
                report.getSyncedFromOffline(),
                report.getCreatedAt() != null ? report.getCreatedAt().toString() : null,
                report.getVerifiedAt() != null ? report.getVerifiedAt().toString() : null
        );
    }
}
