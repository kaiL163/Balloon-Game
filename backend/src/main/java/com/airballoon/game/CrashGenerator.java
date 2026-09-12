package com.airballoon.game;

import com.airballoon.config.CrashProperties;
import com.airballoon.config.GameProperties;
import com.airballoon.domain.Theme;
import com.airballoon.util.Sha256;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Random;

/**
 * Детерминированный генератор crash и booster.
 *
 * Вероятностная модель с тяжёлым хвостом:
 *   crashMultiplier = (1 - houseEdge) / (1 - random);
 *   crashLevel      = ceil(maxLevel * log(crashMultiplier) / log(themeMax)),
 *                     ограниченный диапазоном [1, maxLevel темы];
 *   boosterLevel    = взвешенная случайная линия темы; если crash случится
 *                     раньше, бустер будет считаться пропущенным.
 *
 * Все значения генерируются из seed = SHA-256(serverSeed + ":" + roundId),
 * поэтому результат воспроизводим и проверяем через /fairness.
 */
@Component
public class CrashGenerator {

    private final CrashProperties crashProperties;
    private final GameProperties gameProperties;

    public CrashGenerator(CrashProperties crashProperties, GameProperties gameProperties) {
        this.crashProperties = crashProperties;
        this.gameProperties = gameProperties;
    }

    public CrashOutcome generate(Long roundId, String serverSeed, Theme theme, double themeMaxMultiplier,
                                 double minCrashMultiplier, double houseEdge,
                                 List<Double> boosterProbabilities) {
        String hash = Sha256.hex(serverSeed + ":" + roundId);
        long random52Bits = Long.parseLong(hash.substring(0, 13), 16);
        double uniform = random52Bits / (double) (1L << 52);
        long boosterSeed = Long.parseUnsignedLong(hash.substring(16, 32), 16);
        Random random = new Random(boosterSeed);

        int maxLevel = gameProperties.maxLevel(theme);
        double min = minCrashMultiplier;
        double max = Math.min(crashProperties.getMaxMultiplier(), themeMaxMultiplier);
        houseEdge = Math.max(0.0, Math.min(0.25, houseEdge));
        double rawCrash = (1.0 - houseEdge) / Math.max(0.000001, 1.0 - uniform);
        double crashMultiplier = round2(Math.max(min, Math.min(max, rawCrash)));

        int crashLevel = (int) Math.ceil(maxLevel * Math.log(Math.max(1.0, crashMultiplier)) / Math.log(max));
        crashLevel = Math.max(1, Math.min(maxLevel, crashLevel));

        int boosterLevel = weightedBoosterLevel(random, boosterProbabilities);

        return new CrashOutcome(
                crashLevel,
                BigDecimal.valueOf(crashMultiplier).setScale(2, RoundingMode.HALF_UP),
                boosterLevel);
    }

    private double round2(double value) {
        return Math.floor(value * 100.0) / 100.0;
    }

    private int weightedBoosterLevel(Random random, List<Double> probabilities) {
        int eligible = probabilities.size();
        if (eligible == 0) return 1;
        double total = 0;
        for (int index = 0; index < eligible; index++) total += Math.max(0, probabilities.get(index));
        if (total <= 0) return 1;
        double target = random.nextDouble() * total;
        for (int index = 0; index < eligible; index++) {
            target -= Math.max(0, probabilities.get(index));
            if (target <= 0) return index + 1;
        }
        return eligible;
    }
}
