package com.airballoon.web;

import com.airballoon.domain.GameRound;
import com.airballoon.domain.RoundStatus;
import com.airballoon.auth.AuthService;
import com.airballoon.game.GameSettingsService;
import com.airballoon.exception.ApiException;
import com.airballoon.game.GameEngine;
import com.airballoon.repository.GameRoundRepository;
import com.airballoon.web.dto.CashoutResponse;
import com.airballoon.web.dto.FairnessResponse;
import com.airballoon.web.dto.GameConfigResponse;
import com.airballoon.web.dto.RoundResponse;
import com.airballoon.web.dto.RoundSummary;
import com.airballoon.web.dto.StartRoundRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Игровой API.
 */
@RestController
@RequestMapping("/api/game")
public class GameController {

    private final GameEngine gameEngine;
    private final GameRoundRepository gameRoundRepository;
    private final AuthService authService;
    private final GameSettingsService settingsService;

    public GameController(GameEngine gameEngine, GameRoundRepository gameRoundRepository,
                          AuthService authService, GameSettingsService settingsService) {
        this.gameEngine = gameEngine;
        this.gameRoundRepository = gameRoundRepository;
        this.authService = authService;
        this.settingsService = settingsService;
    }

    @GetMapping("/config")
    public GameConfigResponse config() {
        return settingsService.publicConfig();
    }

    @PostMapping("/rounds")
    public RoundResponse createRound(@RequestHeader(value = "Authorization", required = false) String authorization,
                                     @RequestBody StartRoundRequest request) {
        return gameEngine.createRound(authService.requireUserId(authorization), request);
    }

    @GetMapping("/rounds/active")
    public RoundResponse activeRound(@RequestHeader(value = "Authorization", required = false) String authorization) {
        long userId = authService.requireUserId(authorization);
        return gameRoundRepository.findFirstByUserIdAndStatusInOrderByCreatedAtDesc(
                        userId, List.of(RoundStatus.WAITING, RoundStatus.FLYING, RoundStatus.CASHED_OUT))
                .map(RoundResponse::from)
                .orElse(null);
    }

    @GetMapping("/rounds/{id}")
    public RoundResponse getRound(@PathVariable long id,
                                  @RequestHeader(value = "Authorization", required = false) String authorization) {
        return RoundResponse.from(requireOwned(id, authService.requireUserId(authorization)));
    }

    @PostMapping("/rounds/{id}/cashout")
    public CashoutResponse cashout(@PathVariable long id,
                                   @RequestHeader(value = "Authorization", required = false) String authorization) {
        return gameEngine.cashout(authService.requireUserId(authorization), id);
    }

    @GetMapping("/history")
    public List<RoundSummary> history(@RequestHeader(value = "Authorization", required = false) String authorization) {
        Long uid = authService.requireUserId(authorization);
        return gameRoundRepository.findAllByUserIdOrderByCreatedAtDesc(uid).stream()
                .map(RoundSummary::from)
                .toList();
    }

    @GetMapping("/rounds/{id}/fairness")
    public FairnessResponse fairness(@PathVariable long id,
                                     @RequestHeader(value = "Authorization", required = false) String authorization) {
        GameRound round = requireOwned(id, authService.requireUserId(authorization));
        if (round.getStatus() == RoundStatus.WAITING
                || round.getStatus() == RoundStatus.FLYING
                || round.getStatus() == RoundStatus.CASHED_OUT) {
            throw ApiException.badRequest("Данные честности доступны после завершения раунда");
        }
        return new FairnessResponse(
                round.getId(),
                round.getTheme() == null ? null : round.getTheme().name(),
                round.getServerSeed(),
                round.getServerSeedHash(),
                round.getCrashLevel(),
                round.getBoosterLevel(),
                round.getCrashMultiplier(),
                round.getBoosterMultiplier());
    }

    private GameRound requireOwned(long id, Long userId) {
        GameRound round = gameRoundRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Раунд не найден"));
        if (!round.getUserId().equals(userId)) {
            throw ApiException.forbidden("Доступ к чужому раунду запрещён");
        }
        return round;
    }

}
