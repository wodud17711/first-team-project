package com.example.demo.global.exception;

import com.example.demo.global.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // =========================
    // BusinessException 처리
    // =========================
    @ExceptionHandler(BusinessException.class)
    public ApiResponse<?> handleBusinessException(BusinessException e) {

        return ApiResponse.fail(
                e.getErrorCode().name(),
                e.getMessage()
        );
    }

    // =========================
    // 예상 못한 예외 처리 (fallback)
    // =========================
    @ExceptionHandler(Exception.class)
    public ApiResponse<?> handleException(Exception e) {

        // 로그는 반드시 남기는 게 좋음 (리뷰 포인트)
        e.printStackTrace();

        return ApiResponse.fail(
                "INTERNAL_SERVER_ERROR",
                "서버 내부 오류가 발생했습니다."
        );
    }
}