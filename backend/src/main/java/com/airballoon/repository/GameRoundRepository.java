package com.airballoon.repository;

import com.airballoon.domain.GameRound;
import com.airballoon.domain.RoundStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface GameRoundRepository extends JpaRepository<GameRound, Long> {

    List<GameRound> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<GameRound> findFirstByUserIdAndStatusInOrderByCreatedAtDesc(Long userId, Collection<RoundStatus> statuses);

    boolean existsByUserIdAndStatusIn(Long userId, Collection<RoundStatus> statuses);

    /** Id раундов, которые сейчас в полёте. */
    @Query("select r.id from GameRound r where r.status in :statuses")
    List<Long> findIdsByStatus(@Param("statuses") Collection<RoundStatus> statuses);
}
