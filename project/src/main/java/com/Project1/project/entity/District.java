package com.Project1.project.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.MultiPolygon;

import java.time.LocalDateTime;

@Entity
@Table(name = "districts")
public class District {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String state;

    @Column(name = "hq_latitude", nullable = false)
    private Double hqLatitude;

    @Column(name = "hq_longitude", nullable = false)
    private Double hqLongitude;

    @Column(name = "boundary_geom", columnDefinition = "geometry(MultiPolygon,4326)")
    private MultiPolygon boundaryGeom;

    @Column(name = "connectivity_status", length = 20)
    private String connectivityStatus = "NORMAL"; // NORMAL, RESTRICTED, SEVERED

    @Column(name = "criticality_score")
    private Double criticalityScore = 0.0;

    @Column(name = "active_incidents_count")
    private Integer activeIncidentsCount = 0;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public District() {}

    public District(String id, String name, String state, Double hqLatitude, Double hqLongitude, MultiPolygon boundaryGeom, String connectivityStatus, Double criticalityScore, Integer activeIncidentsCount) {
        this.id = id;
        this.name = name;
        this.state = state;
        this.hqLatitude = hqLatitude;
        this.hqLongitude = hqLongitude;
        this.boundaryGeom = boundaryGeom;
        this.connectivityStatus = connectivityStatus != null ? connectivityStatus : "NORMAL";
        this.criticalityScore = criticalityScore != null ? criticalityScore : 0.0;
        this.activeIncidentsCount = activeIncidentsCount != null ? activeIncidentsCount : 0;
    }

    public static DistrictBuilder builder() {
        return new DistrictBuilder();
    }

    public static class DistrictBuilder {
        private String id;
        private String name;
        private String state;
        private Double hqLatitude;
        private Double hqLongitude;
        private MultiPolygon boundaryGeom;
        private String connectivityStatus = "NORMAL";
        private Double criticalityScore = 0.0;
        private Integer activeIncidentsCount = 0;

        public DistrictBuilder id(String id) { this.id = id; return this; }
        public DistrictBuilder name(String name) { this.name = name; return this; }
        public DistrictBuilder state(String state) { this.state = state; return this; }
        public DistrictBuilder hqLatitude(Double hqLatitude) { this.hqLatitude = hqLatitude; return this; }
        public DistrictBuilder hqLongitude(Double hqLongitude) { this.hqLongitude = hqLongitude; return this; }
        public DistrictBuilder boundaryGeom(MultiPolygon boundaryGeom) { this.boundaryGeom = boundaryGeom; return this; }
        public DistrictBuilder connectivityStatus(String connectivityStatus) { this.connectivityStatus = connectivityStatus; return this; }
        public DistrictBuilder criticalityScore(Double criticalityScore) { this.criticalityScore = criticalityScore; return this; }
        public DistrictBuilder activeIncidentsCount(Integer activeIncidentsCount) { this.activeIncidentsCount = activeIncidentsCount; return this; }

        public District build() {
            return new District(id, name, state, hqLatitude, hqLongitude, boundaryGeom, connectivityStatus, criticalityScore, activeIncidentsCount);
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public Double getHqLatitude() { return hqLatitude; }
    public void setHqLatitude(Double hqLatitude) { this.hqLatitude = hqLatitude; }

    public Double getHqLongitude() { return hqLongitude; }
    public void setHqLongitude(Double hqLongitude) { this.hqLongitude = hqLongitude; }

    public MultiPolygon getBoundaryGeom() { return boundaryGeom; }
    public void setBoundaryGeom(MultiPolygon boundaryGeom) { this.boundaryGeom = boundaryGeom; }

    public String getConnectivityStatus() { return connectivityStatus; }
    public void setConnectivityStatus(String connectivityStatus) { this.connectivityStatus = connectivityStatus; }

    public Double getCriticalityScore() { return criticalityScore; }
    public void setCriticalityScore(Double criticalityScore) { this.criticalityScore = criticalityScore; }

    public Integer getActiveIncidentsCount() { return activeIncidentsCount; }
    public void setActiveIncidentsCount(Integer activeIncidentsCount) { this.activeIncidentsCount = activeIncidentsCount; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
