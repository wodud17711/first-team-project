package com.example.demo.user.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.user.dto.UserResponse;
import com.example.demo.user.dto.UserUpdateRequest;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.RefreshTokenRepository;
import com.example.demo.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private UserService userService;

    private User user;

    @Mock
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("encodedPassword")
                .nickname("기존닉네임")
                .profileImageUrl("https://cdn.example.com/old.png")
                .role("USER")
                .build();
    }

    // =========================
    // getMyInfo
    // =========================
    @Test
    @DisplayName("내 정보 조회 성공")
    void getMyInfo_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserResponse response = userService.getMyInfo(1L);

        assertEquals(1L, response.userId());
        assertEquals("test@example.com", response.email());
        assertEquals("기존닉네임", response.nickname());
        assertEquals("USER", response.role());
    }

    @Test
    @DisplayName("내 정보 조회 - 유저 없음 (USER_NOT_FOUND)")
    void getMyInfo_user_not_found() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> userService.getMyInfo(999L)
        );
        assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
    }

    // =========================
    // updateMyInfo
    // =========================
    @Test
    @DisplayName("내 정보 수정 - 닉네임만 변경 성공")
    void updateMyInfo_nickname_only() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.existsByNickname("새닉네임")).thenReturn(false);

        UserResponse response = userService.updateMyInfo(
                1L,
                new UserUpdateRequest("새닉네임", null, null)
        );

        assertEquals("새닉네임", response.nickname());
        assertEquals("https://cdn.example.com/old.png", response.profileImageUrl(), "프로필은 그대로");
        verify(userRepository).existsByNickname("새닉네임");
    }

    @Test
    @DisplayName("내 정보 수정 - 닉네임 동일하면 중복 검사 skip")
    void updateMyInfo_same_nickname_skips_check() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        userService.updateMyInfo(
                1L,
                new UserUpdateRequest("기존닉네임", null, null)
        );

        verify(userRepository, never()).existsByNickname(any());
    }

    @Test
    @DisplayName("내 정보 수정 - 닉네임 중복 (NICKNAME_DUPLICATED)")
    void updateMyInfo_nickname_duplicated() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.existsByNickname("중복닉")).thenReturn(true);

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> userService.updateMyInfo(
                        1L,
                        new UserUpdateRequest("중복닉", null, null)
                )
        );
        assertEquals(ErrorCode.NICKNAME_DUPLICATED, ex.getErrorCode());
    }

    @Test
    @DisplayName("내 정보 수정 - 프로필 이미지만 변경")
    void updateMyInfo_profile_image_only() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserResponse response = userService.updateMyInfo(
                1L,
                new UserUpdateRequest(null, "https://cdn.example.com/new.png", null)
        );

        assertEquals("기존닉네임", response.nickname(), "닉네임은 그대로");
        assertEquals("https://cdn.example.com/new.png", response.profileImageUrl());
        verify(userRepository, never()).existsByNickname(any());
    }

    @Test
    @DisplayName("내 정보 수정 - 모두 null 이면 변경 없음")
    void updateMyInfo_all_null_no_change() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserResponse response = userService.updateMyInfo(
                1L,
                new UserUpdateRequest(null, null, null)
        );

        assertEquals("기존닉네임", response.nickname());
        assertEquals("https://cdn.example.com/old.png", response.profileImageUrl());
        verify(userRepository, never()).existsByNickname(any());
    }

    @Test
    @DisplayName("내 정보 수정 - 유저 없음")
    void updateMyInfo_user_not_found() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> userService.updateMyInfo(
                        999L,
                        new UserUpdateRequest("아무거나", null, null)
                )
        );
        assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
    }

    // =========================
    // withdraw
    // =========================
    @Test
    @DisplayName("회원 탈퇴 - deleted_at 세팅 + RT 삭제")
    void withdraw_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        when(passwordEncoder.matches(
                "password",
                user.getPassword()
        )).thenReturn(true);

        userService.withdraw(
                1L,
                "password"
        );

        assertNotNull(user.getDeletedAt(), "deleted_at 이 세팅됨");
        verify(refreshTokenRepository).deleteByUser_Id(1L);
    }

    @Test
    @DisplayName("회원 탈퇴 - 유저 없음")
    void withdraw_user_not_found() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> userService.withdraw(
                        999L,
                        "password"
                )
        );
        assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
        verify(refreshTokenRepository, never()).deleteByUser_Id(any());
    }
}
