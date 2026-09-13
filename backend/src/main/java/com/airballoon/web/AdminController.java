package com.airballoon.web;

import com.airballoon.auth.AuthService;
import com.airballoon.game.GameSettingsService;
import com.airballoon.game.OperationLogService;
import com.airballoon.web.dto.AdminSettingsRequest;
import com.airballoon.web.dto.AdminSettingsResponse;
import com.airballoon.web.dto.OperationLogDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthService authService;
    private final GameSettingsService settingsService;
    private final OperationLogService operationLogService;

    public AdminController(AuthService authService, GameSettingsService settingsService,
                           OperationLogService operationLogService) {
        this.authService = authService;
        this.settingsService = settingsService;
        this.operationLogService = operationLogService;
    }

    @GetMapping("/settings")
    public AdminSettingsResponse settings(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        authService.requireAdmin(authorization);
        return settingsService.get();
    }

    @PutMapping("/settings")
    public AdminSettingsResponse updateSettings(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody AdminSettingsRequest request) {
        long adminId = authService.requireAdmin(authorization);
        AdminSettingsResponse saved = settingsService.update(request);
        java.util.LinkedHashMap<String, Object> details = new java.util.LinkedHashMap<>();
        details.put("gameId", saved.gameId());
        details.put("gameName", saved.gameName());
        details.put("active", saved.active());
        details.put("houseEdge", saved.houseEdge());
        details.put("minCrashMultiplier", saved.minCrashMultiplier());
        details.put("greenMaxMultiplier", saved.greenMaxMultiplier());
        details.put("redMaxMultiplier", saved.redMaxMultiplier());
        details.put("multiplierGrowthRate", saved.multiplierGrowthRate());
        details.put("fps", saved.fps());
        details.put("betTier1Amount", saved.betTier1Amount());
        details.put("betTier2Amount", saved.betTier2Amount());
        details.put("betTier3Amount", saved.betTier3Amount());
        details.put("betTier4Amount", saved.betTier4Amount());
        details.put("pointsPerLine", saved.pointsPerLine());
        details.put("pointsCashoutBonus", saved.pointsCashoutBonus());
        details.put("pointsXnBonus", saved.pointsXnBonus());
        details.put("updatedAt", saved.updatedAt().toString());
        operationLogService.record(adminId, null, OperationLogService.CONFIG_APPLY, details);
        return saved;
    }

    /** Глобальный журнал операций (включая CONFIG_APPLY). */
    @GetMapping("/operations")
    public List<OperationLogDto> operations(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestParam(defaultValue = "100") int limit) {
        authService.requireAdmin(authorization);
        return operationLogService.recent(limit);
    }
}
