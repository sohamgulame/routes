package com.Project1.project.repository;

import com.Project1.project.entity.District;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DistrictRepository extends JpaRepository<District, String> {
    List<District> findByState(String state);
    List<District> findByConnectivityStatus(String connectivityStatus);
}
