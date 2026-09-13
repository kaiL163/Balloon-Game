package com.airballoon.game;

import com.airballoon.domain.OperationLog;
import com.airballoon.repository.OperationLogRepository;
import com.airballoon.web.dto.OperationLogDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Журнал серверных операций: старт раунда, cashout, начисления, применение конфигурации.
 */
@Service
public class OperationLogService {

    public static final String ROUND_START = "ROUND_START";
    public static final String CASHOUT = "CASHOUT";
    public static final String ACCRUAL = "ACCRUAL";
    public static final String ROUND_FINISH = "ROUND_FINISH";
    public static final String CONFIG_APPLY = "CONFIG_APPLY";

    private static final Logger log = LoggerFactory.getLogger(OperationLogService.class);

    private final OperationLogRepository repository;
    private final ObjectMapper objectMapper;

    public OperationLogService(OperationLogRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void record(Long userId, Long roundId, String operation, Map<String, ?> details) {
        try {
            OperationLog entry = new OperationLog();
            entry.setUserId(userId);
            entry.setRoundId(roundId);
            entry.setOperation(operation);
            entry.setDetails(objectMapper.writeValueAsString(new LinkedHashMap<>(details)));
            entry.setCreatedAt(Instant.now());
            repository.save(entry);
        } catch (Exception ex) {
            log.warn("Не удалось записать операцию {}: {}", operation, ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<OperationLogDto> forUser(long userId, int limit) {
        int size = Math.max(1, Math.min(limit, 200));
        return repository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, size)).stream()
                .map(OperationLogDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OperationLogDto> forRound(long roundId) {
        return repository.findByRoundIdOrderByCreatedAtAsc(roundId).stream()
                .map(OperationLogDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OperationLogDto> recent(int limit) {
        int size = Math.max(1, Math.min(limit, 200));
        return repository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, size)).stream()
                .map(OperationLogDto::from)
                .toList();
    }
}
