package com.airballoon.game;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.airballoon.config.GameProperties;
import com.airballoon.config.RewardProperties;
import com.airballoon.domain.GameRound;
import com.airballoon.domain.RoundStatus;
import com.airballoon.domain.Theme;
import com.airballoon.domain.User;
import com.airballoon.domain.UserReward;
import com.airballoon.exception.ApiException;
import com.airballoon.repository.GameRoundRepository;
import com.airballoon.repository.RewardRepository;
import com.airballoon.repository.UserRepository;
import com.airballoon.repository.UserRewardRepository;
import com.airballoon.util.Sha256;
import com.airballoon.web.dto.CashoutResponse;
import com.airballoon.web.dto.AdminSettingsResponse;
import com.airballoon.web.dto.RoundResponse;
import com.airballoon.web.dto.StartRoundRequest;

/**
 * Транзакционные операции с раундами: создание, кэшаут, продвижение, финиш.
 */
@Service
public class RoundDataService {

    private final GameRoundRepository gameRoundRepository;
    private final UserRepository userRepository;
    private final RewardRepository rewardRepository;
    private final UserRewardRepository userRewardRepository;
    private final CrashGenerator crashGenerator;
    private final GameProperties gameProperties;
    private final GameSettingsService settingsService;
    private final RewardProperties rewardProperties;
    private final GameEventPublisher eventPublisher;

    public RoundDataService(GameRoundRepository gameRoundRepository,
                            UserRepository userRepository,
                            RewardRepository rewardRepository,
                            UserRewardRepository userRewardRepository,
                            CrashGenerator crashGenerator,
                            GameProperties gameProperties,
                            GameSettingsService settingsService,
                            RewardProperties rewardProperties,
                            GameEventPublisher eventPublisher) {
        this.gameRoundRepository = gameRoundRepository;
        this.userRepository = userRepository;
        this.rewardRepository = rewardRepository;
        this.userRewardRepository = userRewardRepository;
        this.crashGenerator = crashGenerator;
        this.gameProperties = gameProperties;
        this.settingsService = settingsService;
        this.rewardProperties = rewardProperties;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Создание раунда:
     * 1) проверка баланса; 2) списание ставки; 3) создание GameRound;
     * 4) пре-определение crash; 5) пре-определение booster.
     */
    @Transactional
    public RoundResponse createRound(long userId, StartRoundRequest request) {
        AdminSettingsResponse config = settingsService.get();
        if (!config.active()) {
            throw ApiException.forbidden("Игра временно отключена администратором");
        }
        if (gameRoundRepository.existsByUserIdAndStatusIn(
                userId, List.of(RoundStatus.WAITING, RoundStatus.FLYING, RoundStatus.CASHED_OUT))) {
            throw ApiException.conflict("Сначала завершите текущий раунд");
        }
        Theme theme = parseTheme(request.theme());

        String betKey = request.bet() == null ? null : request.bet().trim();
        int boosterTier = boosterTier(betKey);
        BigDecimal betAmount = switch (boosterTier) {
            case 1 -> config.betTier1Amount();
            case 2 -> config.betTier2Amount();
            case 3 -> config.betTier3Amount();
            case 4 -> config.betTier4Amount();
            default -> throw ApiException.badRequest("Неизвестная ставка");
        };
        BigDecimal boosterMultiplier = switch (boosterTier) {
            case 1 -> config.multiplierTier1Value();
            case 2 -> config.multiplierTier2Value();
            case 3 -> config.multiplierTier3Value();
            case 4 -> config.multiplierTier4Value();
            default -> throw ApiException.badRequest("Неизвестный уровень бустера");
        };
        boolean boosterEnabled = boosterMultiplier.compareTo(BigDecimal.ONE) > 0;

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Пользователь не найден"));
        if (user.getBonusBalance().compareTo(betAmount) < 0) {
            throw ApiException.badRequest("Недостаточно средств на балансе. Баланс: "
                    + user.getBonusBalance() + ", ставка: " + betAmount);
        }
        user.setBonusBalance(user.getBonusBalance().subtract(betAmount));
        userRepository.save(user);

        String serverSeed = Sha256.randomSeed();
        String serverSeedHash = Sha256.hex(serverSeed);

        GameRound round = new GameRound();
        round.setUserId(userId);
        round.setTheme(theme);
        round.setThemeMaxMultiplier(theme == Theme.RED
                ? config.redMaxMultiplier() : config.greenMaxMultiplier());
        round.setBetAmount(betAmount);
        round.setBoosterMultiplier(boosterMultiplier);
        // Temporary values satisfy the database constraints while saveAndFlush
        // obtains the generated round id used by the provably-fair generator.
        // They are replaced below before this transaction is committed.
        round.setCrashLevel(1);
        round.setCrashMultiplier(new BigDecimal("1.00"));
        round.setCurrentLevel(0);
        round.setBaseMultiplier(new BigDecimal("1.00"));
        round.setCurrentMultiplier(new BigDecimal("1.00"));
        round.setPoints(0);
        round.setStatus(RoundStatus.WAITING);
        round.setServerSeed(serverSeed);
        round.setServerSeedHash(serverSeedHash);
        round.setCreatedAt(Instant.now());
        gameRoundRepository.saveAndFlush(round);

        CrashOutcome outcome = crashGenerator.generate(
                round.getId(), serverSeed, theme, round.getThemeMaxMultiplier().doubleValue(),
                config.minCrashMultiplier().doubleValue(), config.houseEdge().doubleValue(),
                (theme == Theme.RED ? config.redBoosterProbabilities() : config.greenBoosterProbabilities())
                        .stream().map(BigDecimal::doubleValue).toList());
        round.setCrashLevel(outcome.crashLevel());
        round.setCrashMultiplier(outcome.crashMultiplier());
        round.setBoosterLevel(boosterEnabled ? outcome.boosterLevel() : null);
        round.setStatus(RoundStatus.FLYING);
        gameRoundRepository.save(round);

        return RoundResponse.from(round);
    }

    /** Кэшаут: win = bet * currentMultiplier. Вызывается под блокировкой (см. GameEngine). */
    @Transactional
    public CashoutResponse cashout(long userId, long roundId) {
        GameRound round = gameRoundRepository.findById(roundId)
                .orElseThrow(() -> ApiException.notFound("Раунд не найден"));
        if (!round.getUserId().equals(userId)) {
            throw ApiException.forbidden("Доступ к чужому раунду запрещён");
        }
        if (round.getStatus() != RoundStatus.FLYING) {
            throw ApiException.badRequest("Cashout недоступен: текущий статус " + round.getStatus());
        }

        BigDecimal multiplier = round.getCurrentMultiplier();
        BigDecimal win = round.getBetAmount().multiply(multiplier).setScale(2, RoundingMode.HALF_UP);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Пользователь не найден"));
        user.setBonusBalance(user.getBonusBalance().add(win));

        int bonus = settingsService.pointsCashoutBonus();
        round.setCashoutMultiplier(multiplier);
        round.setWinAmount(win);
        round.setPoints(round.getPoints() + bonus);
        round.setStatus(RoundStatus.CASHED_OUT);
        round.setCashoutAt(Instant.now());

        userRepository.save(user);
        gameRoundRepository.save(round);

        eventPublisher.publish(roundId, Map.of(
                "type", "CASHOUT",
                "multiplier", multiplier,
                "win", win,
                "pointsAdded", bonus,
                "points", round.getPoints()));

        return new CashoutResponse(round.getId(), multiplier, win, round.getStatus().name(), round.getPoints());
    }

    public List<Long> listActiveRoundIds() {
        return gameRoundRepository.findIdsByStatus(List.of(RoundStatus.FLYING, RoundStatus.CASHED_OUT));
    }

    /** Один тик: коэффициент плавно растёт, а уровни отмечаются на границах. */
    @Transactional
    public boolean advanceRound(long roundId) {
        GameRound round = gameRoundRepository.findById(roundId).orElse(null);
        if (round == null) {
            return false;
        }
        RoundStatus status = round.getStatus();
        if (status != RoundStatus.FLYING && status != RoundStatus.CASHED_OUT) {
            return false;
        }

        int maxLevel = gameProperties.maxLevel(round.getTheme());
        long tickMs = Math.max(16, Math.round(1000.0 / settingsService.fps()));
        double currentBase = round.getBaseMultiplier().doubleValue();
        double growthRate = Math.max(0.01, settingsService.growthRate());
        double tickFactor = Math.exp(growthRate * tickMs / 1000.0);
        BigDecimal base = BigDecimal.valueOf(currentBase * tickFactor)
                .setScale(4, RoundingMode.HALF_UP);

        if (base.compareTo(round.getCrashMultiplier()) >= 0) {
            round.setBaseMultiplier(round.getCrashMultiplier());
            int previousLevel = round.getCurrentLevel();
            int reachedLevels = Math.max(0, round.getCrashLevel() - previousLevel);
            round.setPoints(round.getPoints() + reachedLevels * settingsService.pointsPerLine());
            boolean boosterWasReached = round.getBoosterLevel() != null
                    && round.getCrashLevel() > round.getBoosterLevel();
            boolean boosterReachedNow = boosterWasReached && previousLevel < round.getBoosterLevel();
            if (boosterReachedNow) {
                int boosterBonus = BigDecimal.valueOf(settingsService.pointsXnBonus())
                        .multiply(round.getBoosterMultiplier()).intValue();
                round.setPoints(round.getPoints() + boosterBonus);
            }
            round.setCurrentLevel(round.getCrashLevel());
            BigDecimal crashEffective = boosterWasReached
                    ? round.getCrashMultiplier().multiply(round.getBoosterMultiplier()).setScale(2, RoundingMode.HALF_UP)
                    : round.getCrashMultiplier();
            round.setCurrentMultiplier(crashEffective);
            finishRound(round);
            return true;
        }

        double routeMax = Math.max(1.01, round.getThemeMaxMultiplier().doubleValue());
        int nextLevel = (int) Math.floor(maxLevel * Math.log(base.doubleValue()) / Math.log(routeMax));
        nextLevel = Math.max(0, Math.min(maxLevel, nextLevel));
        int previousLevel = round.getCurrentLevel();
        int reachedLevels = Math.max(0, nextLevel - previousLevel);
        boolean levelReached = reachedLevels > 0;
        boolean boosterActive = round.getBoosterLevel() != null && nextLevel >= round.getBoosterLevel();
        BigDecimal effective = boosterActive
                ? base.multiply(round.getBoosterMultiplier()).setScale(2, RoundingMode.HALF_UP)
                : base;

        round.setBaseMultiplier(base);
        round.setCurrentLevel(nextLevel);
        round.setCurrentMultiplier(effective);

        int pointsAdded = reachedLevels * settingsService.pointsPerLine();
        if (levelReached) round.setPoints(round.getPoints() + pointsAdded);
        boolean boosterActivated = boosterActive && previousLevel < round.getBoosterLevel();
        if (boosterActivated) {
            int boosterBonus = BigDecimal.valueOf(settingsService.pointsXnBonus())
                    .multiply(round.getBoosterMultiplier()).intValue();
            round.setPoints(round.getPoints() + boosterBonus);
        }
        gameRoundRepository.save(round);

        eventPublisher.publish(roundId, Map.of(
                "type", "MULTIPLIER_UPDATE",
                "level", nextLevel,
                "baseMultiplier", base,
                "multiplier", effective,
                "points", round.getPoints()));
        if (levelReached) {
            eventPublisher.publish(roundId, Map.of(
                "type", "LEVEL_REACHED",
                "level", nextLevel,
                "pointsAdded", pointsAdded,
                    "points", round.getPoints()));
        }
        if (boosterActivated) {
            int boosterBonus = BigDecimal.valueOf(settingsService.pointsXnBonus())
                    .multiply(round.getBoosterMultiplier()).intValue();
            eventPublisher.publish(roundId, Map.of(
                    "type", "BOOSTER_ACTIVATED",
                    "level", nextLevel,
                    "multiplier", effective,
                    "pointsAdded", boosterBonus,
                    "points", round.getPoints()));
        }
        return true;
    }
/** Crash: ставка теряется (win=0) либо фиксируется уже сделанный win. */
    private void finishRound(GameRound round) {
        if (round.getWinAmount() == null) {
            round.setWinAmount(new BigDecimal("0.00"));
        }
        RoundStatus finalStatus = round.getStatus() == RoundStatus.CASHED_OUT
                ? RoundStatus.FINISHED
                : RoundStatus.CRASHED;
        round.setStatus(finalStatus);
        round.setFinishedAt(Instant.now());

        userRepository.findById(round.getUserId()).ifPresent(user -> {
            user.setGamePoints(user.getGamePoints() + round.getPoints());
            userRepository.save(user);
        });

        awardReward(round);

        gameRoundRepository.save(round);

        eventPublisher.publish(round.getId(), Map.of(
                "type", "CRASH",
                "crashLevel", round.getCrashLevel(),
                "crashMultiplier", round.getCrashMultiplier(),
                "level", round.getCurrentLevel(),
                "status", finalStatus.name()));
    }

    /** Простая награда за завершённый раунд (по количеству пройденных уровней). */
    private void awardReward(GameRound round) {
        String code;
        int level = round.getCurrentLevel();
        if (level <= rewardProperties.getCommonMaxLevel()) {
            code = "COMMON";
        } else if (level <= rewardProperties.getRareMaxLevel()) {
            code = "RARE";
        } else {
            code = "EPIC";
        }

        rewardRepository.findByCode(code).ifPresent(reward -> {
            UserReward userReward = new UserReward();
            userReward.setUserId(round.getUserId());
            userReward.setRewardId(reward.getId());
            userReward.setGameRoundId(round.getId());
            userReward.setAwardedAt(Instant.now());
            userRewardRepository.save(userReward);
        });
    }

    private int boosterTier(String betKey) {
        if (betKey == null || betKey.isEmpty()) {
            throw ApiException.badRequest("Не указана ставка");
        }
        try {
            int x = Integer.parseInt(betKey.substring(1));
            if (!betKey.startsWith("x") || x < 1 || x > 4) {
                throw ApiException.badRequest("Неизвестная ставка: " + betKey);
            }
            return x;
        } catch (NumberFormatException e) {
            throw ApiException.badRequest("Неизвестная ставка: " + betKey);
        }
    }

    private Theme parseTheme(String raw) {
        if (raw == null) {
            throw ApiException.badRequest("Тема не указана");
        }
        try {
            return Theme.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Неизвестная тема: " + raw);
        }
    }
}
