package com.example.demo.notification.controller;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.common.response.ApiResponse;
import com.example.demo.notification.dto.NotificationListResponse;
import com.example.demo.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 알림 API (목록 조회 / 읽음 처리).
 *
 * <p>모두 인증 필수. 알림 수신자(본인)만 자신의 알림을 조회·갱신할 수 있다.
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "Notifications (알림)" 섹션.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** 내 알림 목록 (안 읽은 것 우선). {@code unreadOnly=true} 면 안 읽은 것만. */
    @GetMapping
    public ResponseEntity<ApiResponse<NotificationListResponse>> list(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Long userId = resolveUserId(userDetails);
        NotificationListResponse response =
                notificationService.list(userId, unreadOnly, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /** 단건 읽음 처리. */
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> read(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long notificationId
    ) {
        Long userId = resolveUserId(userDetails);
        notificationService.markRead(userId, notificationId);
        return ResponseEntity.ok(ApiResponse.<Void>success(null, "읽음 처리되었습니다"));
    }

    /** 모든 알림 일괄 읽음 처리. */
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> readAll(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = resolveUserId(userDetails);
        notificationService.markAllRead(userId);
        return ResponseEntity.ok(ApiResponse.<Void>success(null, "모두 읽음 처리되었습니다"));
    }

    private Long resolveUserId(UserDetails userDetails) {
        if (userDetails == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        try {
            return Long.parseLong(userDetails.getUsername());
        } catch (NumberFormatException e) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
    }
}
