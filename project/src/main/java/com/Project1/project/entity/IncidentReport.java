package com.Project1.project.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;

@Entity
@Table(name = "incident_reports")
public class IncidentReport {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id")
    private User reporter;

    @Column(name = "reporter_name", length = 100)
    private String reporterName;

    @Column(name = "reporter_role", length = 30)
    private String reporterRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "road_segment_id")
    private RoadSegment roadSegment;

    @Column(name = "incident_type", nullable = false, length = 50)
    private String incidentType; // LANDSLIDE, FLASH_FLOOD, BRIDGE_DAMAGE, ROAD_CAVED_IN, HEAVY_SNOW

    @Column(nullable = false, length = 20)
    private String severity; // LOW, MODERATE, HIGH, CRITICAL

    @Column(name = "location_geom", nullable = false, columnDefinition = "geometry(Point,4326)")
    private Point locationGeom;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "verification_status", length = 20)
    private String verificationStatus = "PENDING"; // PENDING, VERIFIED, REJECTED, RESOLVED

    @Column(name = "verified_by", length = 100)
    private String verifiedBy;

    @Column(name = "synced_from_offline")
    private Boolean syncedFromOffline = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    public IncidentReport() {}

    public IncidentReport(String id, User reporter, String reporterName, String reporterRole, RoadSegment roadSegment, String incidentType, String severity, Point locationGeom, Double latitude, Double longitude, String photoUrl, String description, String verificationStatus, String verifiedBy, Boolean syncedFromOffline, LocalDateTime verifiedAt) {
        this.id = id;
        this.reporter = reporter;
        this.reporterName = reporterName;
        this.reporterRole = reporterRole;
        this.roadSegment = roadSegment;
        this.incidentType = incidentType;
        this.severity = severity;
        this.locationGeom = locationGeom;
        this.latitude = latitude;
        this.longitude = longitude;
        this.photoUrl = photoUrl;
        this.description = description;
        this.verificationStatus = verificationStatus != null ? verificationStatus : "PENDING";
        this.verifiedBy = verifiedBy;
        this.syncedFromOffline = syncedFromOffline != null ? syncedFromOffline : false;
        this.verifiedAt = verifiedAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public User getReporter() { return reporter; }
    public void setReporter(User reporter) { this.reporter = reporter; }

    public String getReporterName() { return reporterName; }
    public void setReporterName(String reporterName) { this.reporterName = reporterName; }

    public String getReporterRole() { return reporterRole; }
    public void setReporterRole(String reporterRole) { this.reporterRole = reporterRole; }

    public RoadSegment getRoadSegment() { return roadSegment; }
    public void setRoadSegment(RoadSegment roadSegment) { this.roadSegment = roadSegment; }

    public String getIncidentType() { return incidentType; }
    public void setIncidentType(String incidentType) { this.incidentType = incidentType; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public Point getLocationGeom() { return locationGeom; }
    public void setLocationGeom(Point locationGeom) { this.locationGeom = locationGeom; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }

    public Boolean getSyncedFromOffline() { return syncedFromOffline; }
    public void setSyncedFromOffline(Boolean syncedFromOffline) { this.syncedFromOffline = syncedFromOffline; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
}
