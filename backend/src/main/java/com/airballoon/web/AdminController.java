package com.airballoon.web;

import com.airballoon.auth.AuthService;
import com.airballoon.game.GameSettingsService;
import com.airballoon.web.dto.AdminSettingsRequest;
import com.airballoon.web.dto.AdminSettingsResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthService authService;
    private final GameSettingsService settingsService;

    public AdminController(AuthService authService, GameSettingsService settingsService) {
        this.authService = authService;
        this.settingsService = settingsService;
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
        authService.requireAdmin(authorization);
        return settingsService.update(request);
    }
}
