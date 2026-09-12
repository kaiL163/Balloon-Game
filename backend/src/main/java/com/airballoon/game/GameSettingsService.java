package com.airballoon.game;

import com.airballoon.domain.GameSettings;
import com.airballoon.domain.Theme;
import com.airballoon.exception.ApiException;
import com.airballoon.repository.GameSettingsRepository;
import com.airballoon.web.dto.AdminSettingsRequest;
import com.airballoon.web.dto.AdminSettingsResponse;
import com.airballoon.web.dto.GameConfigResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Service
public class GameSettingsService {
    private static final int SETTINGS_ID = 1;
    private final GameSettingsRepository repository;
    private volatile AdminSettingsResponse cached;

    public GameSettingsService(GameSettingsRepository repository) { this.repository = repository; }

    public AdminSettingsResponse get() { return snapshot(); }

    public GameConfigResponse publicConfig() {
        AdminSettingsResponse s = snapshot();
        return new GameConfigResponse(s.gameId(), s.gameName(), s.gameType(), s.active(),
                s.greenMaxMultiplier(), s.redMaxMultiplier(),
                List.of(s.multiplierTier1Value(), s.multiplierTier2Value(),
                        s.multiplierTier3Value(), s.multiplierTier4Value()),
                List.of(s.betTier1Amount(), s.betTier2Amount(),
                        s.betTier3Amount(), s.betTier4Amount()));
    }

    public double maxMultiplier(Theme theme) {
        AdminSettingsResponse s = snapshot();
        return (theme == Theme.RED ? s.redMaxMultiplier() : s.greenMaxMultiplier()).doubleValue();
    }

    public double growthRate() { return snapshot().multiplierGrowthRate().doubleValue(); }
    public int fps() { return snapshot().fps(); }
    public boolean active() { return snapshot().active(); }
    public int pointsPerLine() { return snapshot().pointsPerLine(); }
    public int pointsCashoutBonus() { return snapshot().pointsCashoutBonus(); }
    public int pointsXnBonus() { return snapshot().pointsXnBonus(); }
    public BigDecimal houseEdge() { return snapshot().houseEdge(); }
    public BigDecimal minCrashMultiplier() { return snapshot().minCrashMultiplier(); }

    public BigDecimal boosterValue(int tier) {
        AdminSettingsResponse s = snapshot();
        return switch (tier) {
            case 1 -> s.multiplierTier1Value();
            case 2 -> s.multiplierTier2Value();
            case 3 -> s.multiplierTier3Value();
            case 4 -> s.multiplierTier4Value();
            default -> throw ApiException.badRequest("Неизвестный уровень бустера");
        };
    }

    public List<Double> boosterProbabilities(Theme theme) {
        AdminSettingsResponse s = snapshot();
        List<BigDecimal> values = theme == Theme.RED ? s.redBoosterProbabilities() : s.greenBoosterProbabilities();
        return values.stream().map(BigDecimal::doubleValue).toList();
    }

    @Transactional
    public AdminSettingsResponse update(AdminSettingsRequest r) {
        if (r == null) throw ApiException.badRequest("Передайте настройки");
        String gameId = text(r.gameId(), "game_id", 50);
        String gameName = text(r.gameName(), "Название игры", 100);
        if (!"CRASH".equals(r.gameType())) throw ApiException.badRequest("Тип игры должен быть CRASH");
        if (!"INVERSE_RTP".equals(r.crashDistribution())) throw ApiException.badRequest("Поддерживается распределение INVERSE_RTP");
        BigDecimal edge = decimal(r.houseEdge(), "Преимущество системы", "0", "0.25", 6);
        BigDecimal minCrash = decimal(r.minCrashMultiplier(), "Минимальный crash", "1", "2", 2);
        BigDecimal green = decimal(r.greenMaxMultiplier(), "Максимум зелёного шара", "1.01", "100", 2);
        BigDecimal red = decimal(r.redMaxMultiplier(), "Максимум красного шара", "1.01", "100", 2);
        if (green.compareTo(minCrash) < 0 || red.compareTo(minCrash) < 0) {
            throw ApiException.badRequest("Максимумы тем не могут быть ниже минимального crash");
        }
        BigDecimal growth = decimal(r.multiplierGrowthRate(), "Скорость роста", "0.03", "0.50", 4);
        int fps = integer(r.fps(), "FPS", 1, 60);
        List<BigDecimal> greenProb = probabilities(r.greenBoosterProbabilities(), 9, "зелёной темы");
        List<BigDecimal> redProb = probabilities(r.redBoosterProbabilities(), 12, "красной темы");
        BigDecimal tier1 = decimal(r.multiplierTier1Value(), "Бустер Tier 1", "1", "10", 2);
        BigDecimal tier2 = decimal(r.multiplierTier2Value(), "Бустер Tier 2", "1", "10", 2);
        BigDecimal tier3 = decimal(r.multiplierTier3Value(), "Бустер Tier 3", "1", "10", 2);
        BigDecimal tier4 = decimal(r.multiplierTier4Value(), "Бустер Tier 4", "1", "10", 2);
        BigDecimal bet1 = decimal(r.betTier1Amount(), "Ставка Tier 1", "1", "1000000", 2);
        BigDecimal bet2 = decimal(r.betTier2Amount(), "Ставка Tier 2", "1", "1000000", 2);
        BigDecimal bet3 = decimal(r.betTier3Amount(), "Ставка Tier 3", "1", "1000000", 2);
        BigDecimal bet4 = decimal(r.betTier4Amount(), "Ставка Tier 4", "1", "1000000", 2);
        int pointsLine = integer(r.pointsPerLine(), "Очки за линию", 0, 100000);
        int pointsCashout = integer(r.pointsCashoutBonus(), "Бонус за cashout", 0, 100000);
        int pointsXn = integer(r.pointsXnBonus(), "Бонус xN", 0, 100000);

        GameSettings s = requireSettings();
        s.setGameId(gameId); s.setGameName(gameName); s.setGameType("CRASH"); s.setActive(r.active());
        s.setCrashDistribution("INVERSE_RTP"); s.setHouseEdge(edge); s.setMinCrashMultiplier(minCrash);
        s.setGreenMaxMultiplier(green); s.setRedMaxMultiplier(red); s.setMultiplierGrowthRate(growth); s.setFps(fps);
        s.setGreenBoosterProbabilities(csv(greenProb)); s.setRedBoosterProbabilities(csv(redProb));
        s.setMultiplierTier1Value(tier1); s.setMultiplierTier2Value(tier2);
        s.setMultiplierTier3Value(tier3); s.setMultiplierTier4Value(tier4);
        s.setBetTier1Amount(bet1); s.setBetTier2Amount(bet2);
        s.setBetTier3Amount(bet3); s.setBetTier4Amount(bet4);
        s.setPointsPerLine(pointsLine); s.setPointsCashoutBonus(pointsCashout); s.setPointsXnBonus(pointsXn);
        s.setUpdatedAt(Instant.now());
        AdminSettingsResponse saved = response(repository.saveAndFlush(s));
        cached = saved;
        return saved;
    }

    private AdminSettingsResponse response(GameSettings s) {
        int fps = s.getFps();
        return new AdminSettingsResponse(
                s.getGameId(), s.getGameName(), s.getGameType(), s.isActive(), s.getCrashDistribution(),
                s.getHouseEdge(), s.getMinCrashMultiplier(), s.getGreenMaxMultiplier(), s.getRedMaxMultiplier(),
                s.getMultiplierGrowthRate(), fps, BigDecimal.ONE.divide(BigDecimal.valueOf(fps), 4, RoundingMode.HALF_UP),
                parseProbabilities(s.getGreenBoosterProbabilities()), parseProbabilities(s.getRedBoosterProbabilities()),
                s.getMultiplierTier1Value(), s.getMultiplierTier2Value(), s.getMultiplierTier3Value(), s.getMultiplierTier4Value(),
                s.getBetTier1Amount(), s.getBetTier2Amount(), s.getBetTier3Amount(), s.getBetTier4Amount(),
                s.getPointsPerLine(), s.getPointsCashoutBonus(), s.getPointsXnBonus(), s.getUpdatedAt());
    }

    private List<BigDecimal> probabilities(List<BigDecimal> values, int expected, String theme) {
        if (values == null || values.size() != expected) throw ApiException.badRequest("Нужно указать " + expected + " вероятностей для " + theme);
        List<BigDecimal> result = values.stream().map(v -> decimal(v, "Вероятность бустера", "0", "1", 4)).toList();
        if (result.stream().allMatch(v -> v.signum() == 0)) throw ApiException.badRequest("Хотя бы одна вероятность бустера должна быть больше нуля");
        return result;
    }

    private List<BigDecimal> parseProbabilities(String csv) { return Arrays.stream(csv.split(",")).map(BigDecimal::new).toList(); }
    private String csv(List<BigDecimal> values) { return values.stream().map(BigDecimal::toPlainString).reduce((a, b) -> a + "," + b).orElse(""); }

    private BigDecimal decimal(BigDecimal value, String field, String min, String max, int scale) {
        BigDecimal low = new BigDecimal(min), high = new BigDecimal(max);
        if (value == null || value.compareTo(low) < 0 || value.compareTo(high) > 0) throw ApiException.badRequest(field + " должен быть от " + min + " до " + max);
        return value.setScale(scale, RoundingMode.HALF_UP);
    }

    private int integer(Integer value, String field, int min, int max) {
        if (value == null || value < min || value > max) throw ApiException.badRequest(field + " должен быть от " + min + " до " + max);
        return value;
    }

    private String text(String value, String field, int maxLength) {
        String result = value == null ? "" : value.trim();
        if (result.isEmpty() || result.length() > maxLength) throw ApiException.badRequest(field + " обязателен и должен быть короче " + (maxLength + 1) + " символов");
        return result;
    }

    private GameSettings requireSettings() {
        return repository.findById(SETTINGS_ID).orElseThrow(() -> new IllegalStateException("Игровые настройки не созданы"));
    }

    private AdminSettingsResponse snapshot() {
        AdminSettingsResponse result = cached;
        if (result != null) return result;
        synchronized (this) {
            if (cached == null) cached = response(requireSettings());
            return cached;
        }
    }
}
