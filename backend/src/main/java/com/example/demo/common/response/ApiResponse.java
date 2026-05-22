package com.example.demo.common.response;

/**
 * 공통 API 응답 포맷.
 *
 * <p>모든 컨트롤러는 이 클래스로 응답을 래핑한다. 형식은 {@code docs/06-api-spec.md}의
 * 표준 응답 구조 {@code { success, data, message, errorCode }} 와 정합한다.
 *
 * <pre>
 * 성공: { "success": true,  "data": { ... }, "message": "...",       "errorCode": null }
 * 실패: { "success": false, "data": null,    "message": "에러 메시지", "errorCode": "USER_NOT_FOUND" }
 * </pre>
 *
 * @param <T> 응답 데이터 타입
 */
public record ApiResponse<T>(
        boolean success,
        T data,
        String message,
        String errorCode
) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null, null);
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, data, message, null);
    }

    public static ApiResponse<Void> fail(String message, String errorCode) {
        return new ApiResponse<>(false, null, message, errorCode);
    }
}
