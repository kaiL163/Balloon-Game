package com.airballoon.domain;

/** Статусы раунда. */
public enum RoundStatus {
    /** Создан, полёт ещё не начался. */
    WAITING,
    /** Шар летит. */
    FLYING,
    /** Игрок сделал кэшаут, шар продолжает лететь до crash. */
    CASHED_OUT,
    /** Crash без кэшаута — ставка потеряна (терминальный статус). */
    CRASHED,
    /** Раунд завершён (был кэшаут, затем crash) (терминальный статус). */
    FINISHED
}