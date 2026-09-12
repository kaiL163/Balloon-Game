package com.airballoon.web;

import com.airballoon.domain.Reward;
import com.airballoon.domain.User;
import com.airballoon.auth.AuthService;
import com.airballoon.exception.ApiException;
import com.airballoon.repository.RewardRepository;
import com.airballoon.repository.UserRepository;
import com.airballoon.repository.UserRewardRepository;
import com.airballoon.web.dto.UserDto;
import com.airballoon.web.dto.UserRewardDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Пользователь и его награды.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final UserRewardRepository userRewardRepository;
    private final RewardRepository rewardRepository;
    private final AuthService authService;

    public UserController(UserRepository userRepository,
                          UserRewardRepository userRewardRepository,
                          RewardRepository rewardRepository,
                          AuthService authService) {
        this.userRepository = userRepository;
        this.userRewardRepository = userRewardRepository;
        this.rewardRepository = rewardRepository;
        this.authService = authService;
    }

    @GetMapping("/me")
    public UserDto me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        User user = requireUser(authService.requireUserId(authorization));
        return UserDto.from(user);
    }

    @GetMapping("/me/rewards")
    public List<UserRewardDto> rewards(@RequestHeader(value = "Authorization", required = false) String authorization) {
        Long uid = authService.requireUserId(authorization);
        requireUser(uid);
        return userRewardRepository.findAllByUserIdOrderByAwardedAtDesc(uid).stream()
                .map(userReward -> {
                    Reward reward = rewardRepository.findById(userReward.getRewardId()).orElse(null);
                    return new UserRewardDto(
                            userReward.getId(),
                            userReward.getRewardId(),
                            userReward.getGameRoundId(),
                            reward == null ? "" : reward.getCode(),
                            reward == null ? "" : reward.getName(),
                            reward == null ? "" : reward.getDescription(),
                            userReward.getAwardedAt());
                })
                .toList();
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Пользователь не найден"));
    }
}
