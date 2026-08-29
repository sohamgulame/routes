package com.Project1.project.repository;

import com.Project1.project.entity.Convoy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConvoyRepository extends JpaRepository<Convoy, String> {

    Optional<Convoy> findByVehicleNumber(String vehicleNumber);

    List<Convoy> findByStatus(String status);

    List<Convoy> findByCommodityType(String commodityType);

    @Query(value = "SELECT * FROM convoys WHERE status IN ('PLANNED', 'IN_TRANSIT', 'DELAYED', 'REROUTED')", nativeQuery = true)
    List<Convoy> findActiveConvoys();
}
