package com.example.demo.common.exception;

import org.springframework.http.HttpStatus;

/**
 * 비즈니스 에러 코드 + HTTP 상태 + 사용자 노출 메시지를 한 곳에 정의한다.
 *
 * <p>새 비즈니스 예외가 필요하면 이 enum에 항목을 추가하고
 * {@link BusinessException}으로 던진다. 코드 값은 {@code docs/06-api-spec.md}의
 * {@code errorCode} 컬럼과 일치시켜야 한다.
 */
public enum ErrorCode {

    // ===== 공통 =====
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다"),
    INVALID_FILE(HttpStatus.BAD_REQUEST, "허용되지 않는 파일입니다 (jpg·png, 최대 5MB)"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다"),

    // ===== Auth =====
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 일치하지 않습니다"),
    PASSWORD_MISMATCH(HttpStatus.BAD_REQUEST, "현재 비밀번호가 일치하지 않습니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "토큰이 만료되었습니다"),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다"),
    EXPIRED_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "Refresh Token이 만료되었습니다. 다시 로그인해 주세요"),
    EMAIL_DUPLICATED(HttpStatus.CONFLICT, "이미 가입된 이메일입니다"),
    NICKNAME_DUPLICATED(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다"),
    EMAIL_NOT_VERIFIED(HttpStatus.BAD_REQUEST, "이메일 인증이 필요합니다"),
    VERIFICATION_CODE_INVALID(HttpStatus.BAD_REQUEST, "인증 코드가 일치하지 않습니다"),
    VERIFICATION_CODE_EXPIRED(HttpStatus.BAD_REQUEST, "인증 코드가 만료되었습니다. 다시 발송해주세요"),
    VERIFICATION_COOLDOWN(HttpStatus.TOO_MANY_REQUESTS, "인증 메일을 방금 보냈어요. 잠시 후 다시 시도해주세요"),
    MAIL_SEND_ERROR(HttpStatus.SERVICE_UNAVAILABLE, "인증 메일 발송에 실패했습니다"),

    // ===== User =====
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"),

    // ===== Dog =====
    DOG_NOT_FOUND(HttpStatus.NOT_FOUND, "반려견을 찾을 수 없습니다"),
    NOT_YOUR_DOG(HttpStatus.FORBIDDEN, "본인의 반려견이 아닙니다"),
    BREED_NOT_FOUND(HttpStatus.NOT_FOUND, "견종을 찾을 수 없습니다"),

    // ===== Walk =====
    WALK_NOT_FOUND(HttpStatus.NOT_FOUND, "산책 기록을 찾을 수 없습니다"),
    WALK_ALREADY_IN_PROGRESS(HttpStatus.CONFLICT, "이미 진행 중인 산책이 있습니다"),
    WALK_ALREADY_ENDED(HttpStatus.CONFLICT, "이미 종료된 산책입니다"),

    // ===== Community =====
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "글을 찾을 수 없습니다"),
    NOT_YOUR_POST(HttpStatus.FORBIDDEN, "본인의 글이 아닙니다"),
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다"),
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "카테고리를 찾을 수 없습니다"),
    INVALID_SUB_TAG(HttpStatus.BAD_REQUEST, "이 카테고리에는 사용할 수 없는 서브태그입니다"),
    ALREADY_LIKED(HttpStatus.CONFLICT, "이미 좋아요를 누른 글입니다"),

    // ===== Notification =====
    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "알림을 찾을 수 없습니다"),

    // ===== External API =====
    WEATHER_API_ERROR(HttpStatus.SERVICE_UNAVAILABLE, "기상청 API 호출에 실패했습니다"),
    AIRQUALITY_API_ERROR(HttpStatus.SERVICE_UNAVAILABLE, "에어코리아 API 호출에 실패했습니다"),
    AI_SERVER_ERROR(HttpStatus.SERVICE_UNAVAILABLE, "AI 서버 호출에 실패했습니다"),

    // ===== OAuth =====
    OAUTH_ERROR(HttpStatus.UNAUTHORIZED, "소셜 로그인에 실패했습니다");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}
