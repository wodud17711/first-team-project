package com.example.demo.upload.controller;

import com.example.demo.common.response.ApiResponse;
import com.example.demo.upload.dto.UploadResponse;
import com.example.demo.upload.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 이미지 업로드 API (유저·반려견·게시글 공용).
 *
 * <p>인증 필수(Security 의 {@code anyRequest().authenticated()}). multipart 필드명은 {@code file} 고정.
 * 저장된 파일은 {@code /uploads/**} 로 정적 서빙된다({@code WebConfig}).
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "이미지 업로드" 섹션(v3.7).
 */
@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final FileStorageService fileStorageService;

    @PostMapping
    public ResponseEntity<ApiResponse<UploadResponse>> upload(
            @RequestParam("file") MultipartFile file
    ) {
        String url = fileStorageService.store(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(new UploadResponse(url), "업로드 완료"));
    }
}
