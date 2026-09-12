package com.airballoon.repository;

import com.airballoon.domain.UserReward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRewardRepository extends JpaRepository<UserReward, Long> {

    List<UserReward> findAllByUserIdOrderByAwardedAtDesc(Long userId);
}