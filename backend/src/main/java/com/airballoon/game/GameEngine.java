package com.airballoon.game;

import com.airballoon.web.dto.CashoutResponse;
import com.airballoon.web.dto.RoundResponse;
import com.airballoon.web.dto.StartRoundRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Фасад игрового движка. Выполняет бизнес-операции под блокировками,
 * чтобы защитить кэшаут от двойного вызова и от гонок с тиком.
 */
@Service
public class GameEngine {

    private static final Logger log = LoggerFactory.getLogger(GameEngine.class);

    private final RoundDataService roundDataService;
    private final RoundLock roundLock;

    public GameEngine(RoundDataService roundDataService, RoundLock roundLock) {
        this.roundDataService = roundDataService;
        this.roundLock = roundLock;
    }

    public RoundResponse createRound(long userId, StartRoundRequest request) {
        synchronized (roundLock.user(userId)) {
            return roundDataService.createRound(userId, request);
        }
    }

    public CashoutResponse cashout(long userId, long roundId) {
        synchronized (roundLock.user(userId)) {
            synchronized (roundLock.round(roundId)) {
                return roundDataService.cashout(userId, roundId);
            }
        }
    }

    /** Продвинуть все активные раунды на один уровень. */
    public void tick() {
        for (Long roundId : roundDataService.listActiveRoundIds()) {
            synchronized (roundLock.round(roundId)) {
                try {
                    roundDataService.advanceRound(roundId);
                } catch (Exception ex) {
                    log.warn("Не удалось обработать раунд {}: {}", roundId, ex.getMessage());
                }
            }
        }
    }
}