package com.Project1.project.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.LineString;

import java.time.LocalDateTime;

@Entity
@Table(name = "road_segments")
public class RoadSegment {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "highway_code", nullable = false, length = 50)
    private String highwayCode; // NH-06, NH-27, NH-29, NH-10, NW-2

    @Column(name = "segment_name", nullable = false, length = 150)
    private String segmentName;

    @Column(name = "start_hub", nullable = false, length = 100)
    private String startHub;

    @Column(name = "end_hub", nullable = false, length = 100)
    private String endHub;

    @Column(name = "segment_geom", nullable = false, columnDefinition = "geometry(LineString,4326)")
    private LineString segmentGeom;

    @Column(name = "length_km", nullable = false)
    private Double lengthKm;

    @Column(name = "elevation_avg_m")
    private Double elevationAvgM = 500.0;

    @Column(name = "slope_angle_deg")
    private Double slopeAngleDeg = 10.0;

    @Column(name = "historical_landslide_count")
    private Integer historicalLandslideCount = 0;

    @Column(name = "bridge_count")
    private Integer bridgeCount = 0;

    @Column(name = "max_weight_limit_tons")
    private Double maxWeightLimitTons = 40.0;

    @Column(name = "current_status", length = 20)
    private String currentStatus = "OPEN"; // OPEN, CAUTION, BLOCKED, FLOODED

    @Column(name = "current_risk_score")
    private Double currentRiskScore = 0.0; // 0.0 - 1.0 (from AI)

    @Column(name = "disruption_reason", columnDefinition = "TEXT")
    private String disruptionReason;

    @Column(name = "traffic_congestion_index")
    private Double trafficCongestionIndex = 0.0; // 0.0 = free flow, 1.0 = standstill (TomTom/estimated)

    @UpdateTimestamp
    @Column(name = "last_risk_calculated_at")
    private LocalDateTime lastRiskCalculatedAt;

    public RoadSegment() {}

    public RoadSegment(String id, String highwayCode, String segmentName, String startHub, String endHub, LineString segmentGeom, Double lengthKm, Double elevationAvgM, Double slopeAngleDeg, Integer historicalLandslideCount, Integer bridgeCount, Double maxWeightLimitTons, String currentStatus, Double currentRiskScore, String disruptionReason) {
        this.id = id;
        this.highwayCode = highwayCode;
        this.segmentName = segmentName;
        this.startHub = startHub;
        this.endHub = endHub;
        this.segmentGeom = segmentGeom;
        this.lengthKm = lengthKm;
        this.elevationAvgM = elevationAvgM != null ? elevationAvgM : 500.0;
        this.slopeAngleDeg = slopeAngleDeg != null ? slopeAngleDeg : 10.0;
        this.historicalLandslideCount = historicalLandslideCount != null ? historicalLandslideCount : 0;
        this.bridgeCount = bridgeCount != null ? bridgeCount : 0;
        this.maxWeightLimitTons = maxWeightLimitTons != null ? maxWeightLimitTons : 40.0;
        this.currentStatus = currentStatus != null ? currentStatus : "OPEN";
        this.currentRiskScore = currentRiskScore != null ? currentRiskScore : 0.0;
        this.disruptionReason = disruptionReason;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getHighwayCode() { return highwayCode; }
    public void setHighwayCode(String highwayCode) { this.highwayCode = highwayCode; }

    public String getSegmentName() { return segmentName; }
    public void setSegmentName(String segmentName) { this.segmentName = segmentName; }

    public String getStartHub() { return startHub; }
    public void setStartHub(String startHub) { this.startHub = startHub; }

    public String getEndHub() { return endHub; }
    public void setEndHub(String endHub) { this.endHub = endHub; }

    public LineString getSegmentGeom() { return segmentGeom; }
    public void setSegmentGeom(LineString segmentGeom) { this.segmentGeom = segmentGeom; }

    public Double getLengthKm() { return lengthKm; }
    public void setLengthKm(Double lengthKm) { this.lengthKm = lengthKm; }

    public Double getElevationAvgM() { return elevationAvgM; }
    public void setElevationAvgM(Double elevationAvgM) { this.elevationAvgM = elevationAvgM; }

    public Double getSlopeAngleDeg() { return slopeAngleDeg; }
    public void setSlopeAngleDeg(Double slopeAngleDeg) { this.slopeAngleDeg = slopeAngleDeg; }

    public Integer getHistoricalLandslideCount() { return historicalLandslideCount; }
    public void setHistoricalLandslideCount(Integer historicalLandslideCount) { this.historicalLandslideCount = historicalLandslideCount; }

    public Integer getBridgeCount() { return bridgeCount; }
    public void setBridgeCount(Integer bridgeCount) { this.bridgeCount = bridgeCount; }

    public Double getMaxWeightLimitTons() { return maxWeightLimitTons; }
    public void setMaxWeightLimitTons(Double maxWeightLimitTons) { this.maxWeightLimitTons = maxWeightLimitTons; }

    public String getCurrentStatus() { return currentStatus; }
    public void setCurrentStatus(String currentStatus) { this.currentStatus = currentStatus; }

    public Double getCurrentRiskScore() { return currentRiskScore; }
    public void setCurrentRiskScore(Double currentRiskScore) { this.currentRiskScore = currentRiskScore; }

    public String getDisruptionReason() { return disruptionReason; }
    public void setDisruptionReason(String disruptionReason) { this.disruptionReason = disruptionReason; }

    public Double getTrafficCongestionIndex() { return trafficCongestionIndex; }
    public void setTrafficCongestionIndex(Double trafficCongestionIndex) { this.trafficCongestionIndex = trafficCongestionIndex; }

    public LocalDateTime getLastRiskCalculatedAt() { return lastRiskCalculatedAt; }
    public void setLastRiskCalculatedAt(LocalDateTime lastRiskCalculatedAt) { this.lastRiskCalculatedAt = lastRiskCalculatedAt; }
}
