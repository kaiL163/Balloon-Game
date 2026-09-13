package com.airballoon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Запись журнала серверных операций (старт, cashout, начисления, конфигурация).
 */
@Entity
@Table(name = "operation_log")
public class OperationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "round_id")
    private Long roundId;

    @Column(nullable = false, length = 40)
    private String operation;

    @Column(nullable = false, length = 4000)
    private String details;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getRoundId() {
        return roundId;
    }

    public void setRoundId(Long roundId) {
        this.roundId = roundId;
    }

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
