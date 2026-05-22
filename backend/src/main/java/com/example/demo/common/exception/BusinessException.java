package com.example.demo.common.exception;

/**
 * 도메인/비즈니스 규칙 위반 시 던지는 런타임 예외.
 *
 * <p>Service 레이어에서 {@code throw new BusinessException(ErrorCode.XXX)} 형태로 사용한다.
 * 처리되지 않으면 {@link GlobalExceptionHandler}가 잡아서
 * {@code ErrorCode}에 정의된 HTTP 상태 + 메시지로 응답한다.
 */
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public BusinessException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
