package com.example.demo.global.exception;

import com.example.demo.global.response.ApiResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ApiResponse<?> handleBusinessException(BusinessException e) {
        return ApiResponse.fail(
                e.getMessage(),
                e.getErrorCode().name()
        );
    }

    @ExceptionHandler(Exception.class)
    public ApiResponse<?> handleException(Exception e) {
        return ApiResponse.fail(
                "INTERNAL_SERVER_ERROR",
                "SERVER_ERROR"
        );
    }
}