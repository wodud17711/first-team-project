package com.example.demo.common.exception;

import com.example.demo.common.response.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

/**
 * 전역 예외 핸들러.
 *
 * <p>모든 예외를 표준 응답 포맷 {@code { success: false, data: null, message, errorCode }}로 변환한다.
 * Controller·Service에서 발생한 {@link BusinessException}은 정의된 HTTP 상태로,
 * 입력 검증 실패는 400으로, 그 외는 500으로 응답한다.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);


    /** 비즈니스 규칙 위반 (Service에서 의도적으로 던진 예외). */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(
            BusinessException ex
    ) {

        ErrorCode code = ex.getErrorCode();

        log.warn(
                "BusinessException: {} - {}",
                code.name(),
                ex.getMessage()
        );

        return ResponseEntity
                .status(code.getStatus())
                .body(
                        ApiResponse.fail(
                                ex.getMessage(),
                                code.name()
                        )
                );
    }


    /** @Valid @RequestBody 검증 실패. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(
            MethodArgumentNotValidException ex
    ) {

        String message =
                ex.getBindingResult()
                        .getFieldErrors()
                        .stream()
                        .map(err ->
                                err.getField()
                                        + ": "
                                        + err.getDefaultMessage()
                        )
                        .findFirst()
                        .orElse(
                                "입력값 검증에 실패했습니다"
                        );

        log.warn(
                "Validation failed: {}",
                message
        );

        return ResponseEntity
                .badRequest()
                .body(
                        ApiResponse.fail(
                                message,
                                ErrorCode.INVALID_INPUT.name()
                        )
                );
    }


    /**
     * JSON 파싱 실패.
     *
     * <p>예:
     * GuardianLevel enum에 존재하지 않는 값 전달
     * {"guardianLevel":"MASTER"}
     *
     * <p>Jackson 역직렬화 실패는 MethodArgumentNotValidException이 아니라
     * HttpMessageNotReadableException으로 발생하므로 별도 처리한다.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex
    ) {

        log.warn(
                "JSON parse failed: {}",
                ex.getMessage()
        );

        return ResponseEntity
                .badRequest()
                .body(
                        ApiResponse.fail(
                                ErrorCode.INVALID_INPUT.getMessage(),
                                ErrorCode.INVALID_INPUT.name()
                        )
                );
    }


    /**
     * 업로드 파일이 multipart 한도(5MB)를 초과.
     *
     * <p>컨테이너/Spring 이 controller 진입 전에 던지므로 별도 처리해
     * {@code INVALID_FILE}(400) 로 통일한다(서비스 레이어 크기 검증과 동일 코드).
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleMaxUploadSize(
            MaxUploadSizeExceededException ex
    ) {

        log.warn("Upload size exceeded: {}", ex.getMessage());

        return ResponseEntity
                .status(ErrorCode.INVALID_FILE.getStatus())
                .body(
                        ApiResponse.fail(
                                ErrorCode.INVALID_FILE.getMessage(),
                                ErrorCode.INVALID_FILE.name()
                        )
                );
    }


    /** 예상치 못한 모든 예외 → 500. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(
            Exception ex
    ) {

        log.error(
                "Unexpected exception",
                ex
        );

        return ResponseEntity
                .internalServerError()
                .body(
                        ApiResponse.fail(
                                ErrorCode.INTERNAL_ERROR.getMessage(),
                                ErrorCode.INTERNAL_ERROR.name()
                        )
                );
    }
}