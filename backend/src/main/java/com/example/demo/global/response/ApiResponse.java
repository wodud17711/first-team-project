package com.example.demo.global.response;

public record ApiResponse<T>(
        boolean success,
        T data,
        String message,
        String errorCode
) {

    public static <T> ApiResponse<T> success(
            T data,
            String message
    ) {
        return new ApiResponse<>(
                true,
                data,
                message,
                null
        );
    }

    // 기존 fail 유지 (팀 스타일 선택 가능)
    public static <T> ApiResponse<T> fail(
            String message,
            String errorCode
    ) {
        return new ApiResponse<>(
                false,
                null,
                message,
                errorCode
        );
    }

    // ⭐ 추가: GlobalExceptionHandler 호환용
    public static <T> ApiResponse<T> error(
            String message,
            String errorCode
    ) {
        return fail(message, errorCode);
    }

    // ⭐ 추가: 단순 메시지 에러용 (지금 RuntimeException 대응)
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(
                false,
                null,
                message,
                null
        );
    }
}