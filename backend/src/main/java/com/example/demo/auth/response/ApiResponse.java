package com.example.demo.auth.response;

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
}