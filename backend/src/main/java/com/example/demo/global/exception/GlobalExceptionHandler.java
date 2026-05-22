package com.example.demo.global.exception;

import com.example.demo.global.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. 비즈니스 예외 (권장: 나중에 BusinessException 만들면 사용)
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<?> handleBusinessException(BusinessException e) {

        return ApiResponse.fail(
                e.getMessage(),
                e.getErrorCode().name()
        );
    }

    // 2. 검증 예외 (DTO @Valid)
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<?> handleValidationException(
            org.springframework.web.bind.MethodArgumentNotValidException e
    ) {

        String message = e.getBindingResult()
                .getFieldErrors()
                .get(0)
                .getDefaultMessage();

        return ApiResponse.fail(
                message,
                "VALIDATION_ERROR"
        );
    }

    // 3. 그 외 예상 못한 에러
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<?> handleException(Exception e) {

        return ApiResponse.fail(
                "INTERNAL_SERVER_ERROR",
                "SERVER_ERROR"
        );
    }
}