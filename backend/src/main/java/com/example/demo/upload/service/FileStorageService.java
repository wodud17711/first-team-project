package com.example.demo.upload.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * 업로드 이미지의 로컬 디스크 저장.
 *
 * <p>저장 경로 {@code {uploadDir}/yyyy/MM/{uuid}.{ext}}, 반환 URL {@code /uploads/yyyy/MM/{uuid}.{ext}}.
 * URL prefix({@value #URL_PREFIX})는 정적 서빙({@code WebConfig})·계약과 일치시킨다.
 * 운영 전환 시 이 클래스만 S3 구현으로 교체하면 URL 계약은 유지된다.
 *
 * <p>허용: jpg/jpeg/png, 최대 5MB. 확장자와 content-type 을 모두 검증한다(위장 방지).
 * 위반 시 {@link ErrorCode#INVALID_FILE}(400).
 *
 * <p>API 명세: {@code docs/06-api-spec.md} - "이미지 업로드" 섹션(v3.7).
 */
@Service
public class FileStorageService {

    /** 정적 서빙·반환 URL 의 공통 prefix. {@code WebConfig} 의 ResourceHandler 패턴과 일치해야 한다. */
    public static final String URL_PREFIX = "/uploads";

    private static final long MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png");
    private static final DateTimeFormatter DATE_PATH = DateTimeFormatter.ofPattern("yyyy/MM");

    /** 저장 루트 디렉터리. 기본값 {@code uploads}(작업 디렉터리 기준 상대경로). */
    private final Path rootDir;

    public FileStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.rootDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    /**
     * 업로드 파일을 검증·저장하고 정적 서빙 URL 을 반환한다.
     *
     * @throws BusinessException {@link ErrorCode#INVALID_FILE}(검증 실패) /
     *                           {@link ErrorCode#INTERNAL_ERROR}(디스크 저장 실패)
     */
    public String store(MultipartFile file) {
        String extension = validate(file);

        String datePath = LocalDate.now().format(DATE_PATH);
        String filename = UUID.randomUUID() + "." + extension;
        Path targetDir = rootDir.resolve(datePath);

        try {
            Files.createDirectories(targetDir);
            Path target = targetDir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR);
        }

        return URL_PREFIX + "/" + datePath + "/" + filename;
    }

    /** 파일 존재·크기·확장자·content-type 검증. 통과 시 정규화된 확장자(소문자) 반환. */
    private String validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_FILE);
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new BusinessException(ErrorCode.INVALID_FILE);
        }

        String contentType = file.getContentType();
        if (contentType == null
                || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BusinessException(ErrorCode.INVALID_FILE);
        }

        String extension = extensionOf(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException(ErrorCode.INVALID_FILE);
        }
        return extension;
    }

    /** 원본 파일명에서 소문자 확장자만 뽑는다. 확장자 없으면 빈 문자열. */
    private String extensionOf(String originalFilename) {
        if (originalFilename == null) {
            return "";
        }
        int dot = originalFilename.lastIndexOf('.');
        if (dot < 0 || dot == originalFilename.length() - 1) {
            return "";
        }
        return originalFilename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
