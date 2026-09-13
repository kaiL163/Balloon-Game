package com.airballoon.repository;

import com.airballoon.domain.OperationLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OperationLogRepository extends JpaRepository<OperationLog, Long> {

    List<OperationLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<OperationLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<OperationLog> findByRoundIdOrderByCreatedAtAsc(Long roundId);
}
