package com.Project1.project.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;

@Entity
@Table(name = "convoys")
public class Convoy {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "vehicle_number", unique = true, nullable = false, length = 30)
    private String vehicleNumber;

    @Column(name = "driver_name", nullable = false, length = 100)
    private String driverName;

    @Column(name = "driver_phone", nullable = false, length = 20)
    private String driverPhone;

    @Column(name = "transporter_company", length = 100)
    private String transporterCompany;

    @Column(name = "commodity_type", nullable = false, length = 50)
    private String commodityType; // MEDICINES, FOOD_GRAINS, FUEL, PERISHABLE_AGRI, RELIEF_MATERIAL

    @Column(name = "origin_city", nullable = false, length = 100)
    private String originCity;

    @Column(name = "destination_city", nullable = false, length = 100)
    private String destinationCity;

    @Column(length = 30)
    private String status = "IN_TRANSIT"; // PLANNED, IN_TRANSIT, DELAYED, REROUTED, DELIVERED

    @Column(name = "current_latitude")
    private Double currentLatitude;

    @Column(name = "current_longitude")
    private Double currentLongitude;

    @Column(name = "current_location", columnDefinition = "geometry(Point,4326)")
    private Point currentLocation;

    @Column(name = "temperature_celsius")
    private Double temperatureCelsius = 4.0; // Cold-chain metric

    @Column(name = "freshness_decay_index")
    private Double freshnessDecayIndex = 1.0; // 1.0 = 100% fresh

    @Column(name = "active_route_summary", columnDefinition = "TEXT")
    private String activeRouteSummary;

    @Column(name = "origin_latitude")
    private Double originLatitude;

    @Column(name = "origin_longitude")
    private Double originLongitude;

    @Column(name = "dest_latitude")
    private Double destLatitude;

    @Column(name = "dest_longitude")
    private Double destLongitude;

    @Column(name = "estimated_arrival_time")
    private LocalDateTime estimatedArrivalTime;

    @Column(name = "eta_exceeded_alert_sent")
    private Boolean etaExceededAlertSent = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Convoy() {}

    public Convoy(String id, String vehicleNumber, String driverName, String driverPhone, String transporterCompany, String commodityType, String originCity, String destinationCity, String status, Double currentLatitude, Double currentLongitude, Point currentLocation, Double temperatureCelsius, Double freshnessDecayIndex, String activeRouteSummary) {
        this.id = id;
        this.vehicleNumber = vehicleNumber;
        this.driverName = driverName;
        this.driverPhone = driverPhone;
        this.transporterCompany = transporterCompany;
        this.commodityType = commodityType;
        this.originCity = originCity;
        this.destinationCity = destinationCity;
        this.status = status != null ? status : "IN_TRANSIT";
        this.currentLatitude = currentLatitude;
        this.currentLongitude = currentLongitude;
        this.currentLocation = currentLocation;
        this.temperatureCelsius = temperatureCelsius != null ? temperatureCelsius : 4.0;
        this.freshnessDecayIndex = freshnessDecayIndex != null ? freshnessDecayIndex : 1.0;
        this.activeRouteSummary = activeRouteSummary;
    }

    public static ConvoyBuilder builder() {
        return new ConvoyBuilder();
    }

    public static class ConvoyBuilder {
        private String id;
        private String vehicleNumber;
        private String driverName;
        private String driverPhone;
        private String transporterCompany;
        private String commodityType;
        private String originCity;
        private String destinationCity;
        private String status = "IN_TRANSIT";
        private Double currentLatitude;
        private Double currentLongitude;
        private Double originLatitude;
        private Double originLongitude;
        private Double destLatitude;
        private Double destLongitude;
        private Point currentLocation;
        private Double temperatureCelsius = 4.0;
        private Double freshnessDecayIndex = 1.0;
        private String activeRouteSummary;

        public ConvoyBuilder id(String id) { this.id = id; return this; }
        public ConvoyBuilder vehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; return this; }
        public ConvoyBuilder driverName(String driverName) { this.driverName = driverName; return this; }
        public ConvoyBuilder driverPhone(String driverPhone) { this.driverPhone = driverPhone; return this; }
        public ConvoyBuilder transporterCompany(String transporterCompany) { this.transporterCompany = transporterCompany; return this; }
        public ConvoyBuilder commodityType(String commodityType) { this.commodityType = commodityType; return this; }
        public ConvoyBuilder originCity(String originCity) { this.originCity = originCity; return this; }
        public ConvoyBuilder destinationCity(String destinationCity) { this.destinationCity = destinationCity; return this; }
        public ConvoyBuilder status(String status) { this.status = status; return this; }
        public ConvoyBuilder currentLatitude(Double currentLatitude) { this.currentLatitude = currentLatitude; return this; }
        public ConvoyBuilder currentLongitude(Double currentLongitude) { this.currentLongitude = currentLongitude; return this; }
        public ConvoyBuilder originLatitude(Double originLatitude) { this.originLatitude = originLatitude; return this; }
        public ConvoyBuilder originLongitude(Double originLongitude) { this.originLongitude = originLongitude; return this; }
        public ConvoyBuilder destLatitude(Double destLatitude) { this.destLatitude = destLatitude; return this; }
        public ConvoyBuilder destLongitude(Double destLongitude) { this.destLongitude = destLongitude; return this; }
        public ConvoyBuilder currentLocation(Point currentLocation) { this.currentLocation = currentLocation; return this; }
        public ConvoyBuilder temperatureCelsius(Double temperatureCelsius) { this.temperatureCelsius = temperatureCelsius; return this; }
        public ConvoyBuilder freshnessDecayIndex(Double freshnessDecayIndex) { this.freshnessDecayIndex = freshnessDecayIndex; return this; }
        public ConvoyBuilder activeRouteSummary(String activeRouteSummary) { this.activeRouteSummary = activeRouteSummary; return this; }

        public Convoy build() {
            Convoy c = new Convoy(id, vehicleNumber, driverName, driverPhone, transporterCompany, commodityType, originCity, destinationCity, status, currentLatitude, currentLongitude, currentLocation, temperatureCelsius, freshnessDecayIndex, activeRouteSummary);
            c.setOriginLatitude(originLatitude);
            c.setOriginLongitude(originLongitude);
            c.setDestLatitude(destLatitude);
            c.setDestLongitude(destLongitude);
            return c;
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public String getDriverPhone() { return driverPhone; }
    public void setDriverPhone(String driverPhone) { this.driverPhone = driverPhone; }

    public String getTransporterCompany() { return transporterCompany; }
    public void setTransporterCompany(String transporterCompany) { this.transporterCompany = transporterCompany; }

    public String getCommodityType() { return commodityType; }
    public void setCommodityType(String commodityType) { this.commodityType = commodityType; }

    public String getOriginCity() { return originCity; }
    public void setOriginCity(String originCity) { this.originCity = originCity; }

    public String getDestinationCity() { return destinationCity; }
    public void setDestinationCity(String destinationCity) { this.destinationCity = destinationCity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getCurrentLatitude() { return currentLatitude; }
    public void setCurrentLatitude(Double currentLatitude) { this.currentLatitude = currentLatitude; }

    public Double getCurrentLongitude() { return currentLongitude; }
    public void setCurrentLongitude(Double currentLongitude) { this.currentLongitude = currentLongitude; }

    public Double getOriginLatitude() { return originLatitude; }
    public void setOriginLatitude(Double originLatitude) { this.originLatitude = originLatitude; }

    public Double getOriginLongitude() { return originLongitude; }
    public void setOriginLongitude(Double originLongitude) { this.originLongitude = originLongitude; }

    public Double getDestLatitude() { return destLatitude; }
    public void setDestLatitude(Double destLatitude) { this.destLatitude = destLatitude; }

    public Double getDestLongitude() { return destLongitude; }
    public void setDestLongitude(Double destLongitude) { this.destLongitude = destLongitude; }

    public Point getCurrentLocation() { return currentLocation; }
    public void setCurrentLocation(Point currentLocation) { this.currentLocation = currentLocation; }

    public Double getTemperatureCelsius() { return temperatureCelsius; }
    public void setTemperatureCelsius(Double temperatureCelsius) { this.temperatureCelsius = temperatureCelsius; }

    public Double getFreshnessDecayIndex() { return freshnessDecayIndex; }
    public void setFreshnessDecayIndex(Double freshnessDecayIndex) { this.freshnessDecayIndex = freshnessDecayIndex; }

    public String getActiveRouteSummary() { return activeRouteSummary; }
    public void setActiveRouteSummary(String activeRouteSummary) { this.activeRouteSummary = activeRouteSummary; }

    public LocalDateTime getEstimatedArrivalTime() { return estimatedArrivalTime; }
    public void setEstimatedArrivalTime(LocalDateTime estimatedArrivalTime) { this.estimatedArrivalTime = estimatedArrivalTime; }

    public Boolean getEtaExceededAlertSent() { return etaExceededAlertSent; }
    public void setEtaExceededAlertSent(Boolean etaExceededAlertSent) { this.etaExceededAlertSent = etaExceededAlertSent; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
