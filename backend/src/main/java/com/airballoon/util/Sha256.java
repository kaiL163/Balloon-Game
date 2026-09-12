package com.airballoon.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;

/**
 * Хелперы для Provably-Fair системы (SHA-256).
 */
public final class Sha256 {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private Sha256() {
    }

    /** SHA-256 хеш строки в hex. */
    public static String hex(String input) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 недоступен в текущем JVM", e);
        }
    }

    /** Случайный 256-битный seed в hex (64 символа). */
    public static String randomSeed() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}