package com.Project1.project.repository;

import com.Project1.project.entity.GpsTelemetryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GpsTelemetryLogRepository extends JpaRepository<GpsTelemetryLog, Long> {

    List<GpsTelemetryLog> findByConvoy_IdOrderByRecordedAtDesc(String convoyId);

    @Modifying
    @Query("DELETE FROM GpsTelemetryLog g WHERE g.convoy.id = :convoyId")
    void deleteByConvoyId(@Param("convoyId") String convoyId);

    @Query(value = "SELECT * FROM gps_telemetry_logs WHERE convoy_id = :convoyId ORDER BY recorded_at DESC LIMIT :limit", nativeQuery = true)
    List<GpsTelemetryLog> findRecentLogsByConvoy(@Param("convoyId") String convoyId, @Param("limit") int limit);
}
