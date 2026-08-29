package com.Project1.project.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "gps_telemetry_logs")
public class GpsTelemetryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "convoy_id", nullable = false)
    private Convoy convoy;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "speed_kmh")
    private Double speedKmh = 0.0;

    @Column(name = "heading_deg")
    private Double headingDeg = 0.0;

    @Column(name = "altitude_m")
    private Double altitudeM = 0.0;

    @Column(name = "temperature_celsius")
    private Double temperatureCelsius;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    public GpsTelemetryLog() {}

    public GpsTelemetryLog(Long id, Convoy convoy, Double latitude, Double longitude, Double speedKmh, Double headingDeg, Double altitudeM, Double temperatureCelsius, LocalDateTime recordedAt) {
        this.id = id;
        this.convoy = convoy;
        this.latitude = latitude;
        this.longitude = longitude;
        this.speedKmh = speedKmh != null ? speedKmh : 0.0;
        this.headingDeg = headingDeg != null ? headingDeg : 0.0;
        this.altitudeM = altitudeM != null ? altitudeM : 0.0;
        this.temperatureCelsius = temperatureCelsius;
        this.recordedAt = recordedAt;
    }

    public static GpsTelemetryLogBuilder builder() {
        return new GpsTelemetryLogBuilder();
    }

    public static class GpsTelemetryLogBuilder {
        private Long id;
        private Convoy convoy;
        private Double latitude;
        private Double longitude;
        private Double speedKmh = 0.0;
        private Double headingDeg = 0.0;
        private Double altitudeM = 0.0;
        private Double temperatureCelsius;
        private LocalDateTime recordedAt;

        public GpsTelemetryLogBuilder id(Long id) { this.id = id; return this; }
        public GpsTelemetryLogBuilder convoy(Convoy convoy) { this.convoy = convoy; return this; }
        public GpsTelemetryLogBuilder latitude(Double latitude) { this.latitude = latitude; return this; }
        public GpsTelemetryLogBuilder longitude(Double longitude) { this.longitude = longitude; return this; }
        public GpsTelemetryLogBuilder speedKmh(Double speedKmh) { this.speedKmh = speedKmh; return this; }
        public GpsTelemetryLogBuilder headingDeg(Double headingDeg) { this.headingDeg = headingDeg; return this; }
        public GpsTelemetryLogBuilder altitudeM(Double altitudeM) { this.altitudeM = altitudeM; return this; }
        public GpsTelemetryLogBuilder temperatureCelsius(Double temperatureCelsius) { this.temperatureCelsius = temperatureCelsius; return this; }
        public GpsTelemetryLogBuilder recordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; return this; }

        public GpsTelemetryLog build() {
            return new GpsTelemetryLog(id, convoy, latitude, longitude, speedKmh, headingDeg, altitudeM, temperatureCelsius, recordedAt);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Convoy getConvoy() { return convoy; }
    public void setConvoy(Convoy convoy) { this.convoy = convoy; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getSpeedKmh() { return speedKmh; }
    public void setSpeedKmh(Double speedKmh) { this.speedKmh = speedKmh; }

    public Double getHeadingDeg() { return headingDeg; }
    public void setHeadingDeg(Double headingDeg) { this.headingDeg = headingDeg; }

    public Double getAltitudeM() { return altitudeM; }
    public void setAltitudeM(Double altitudeM) { this.altitudeM = altitudeM; }

    public Double getTemperatureCelsius() { return temperatureCelsius; }
    public void setTemperatureCelsius(Double temperatureCelsius) { this.temperatureCelsius = temperatureCelsius; }

    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }
}
