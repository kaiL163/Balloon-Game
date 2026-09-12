package com.airballoon.repository;

import com.airballoon.domain.GameSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameSettingsRepository extends JpaRepository<GameSettings, Integer> {
}
