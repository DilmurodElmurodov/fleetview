package org.example.b2blogistics.repository;

import org.example.b2blogistics.domain.Alert;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByOrderByCreatedAtDesc(Pageable pageable);

    long countByAcknowledgedFalse();
}
