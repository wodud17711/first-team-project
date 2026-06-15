package com.example.demo.upload.service;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 이미지 저장/검증 단위 테스트.
 *
 * <p>명세(docs/06-api-spec.md "이미지 업로드" v3.7) 규칙 기준:
 * jpg/jpeg/png·최대 5MB, 반환 URL {@code /uploads/yyyy/MM/{uuid}.{ext}}, 위반 시 INVALID_FILE.
 */
class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileStorageService service;

    @BeforeEach
    void setUp() {
        service = new FileStorageService(tempDir.toString());
    }

    @Test
    void png_저장시_URL반환하고_디스크에_파일이_생긴다() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "profile.png", "image/png", new byte[]{1, 2, 3, 4});

        String url = service.store(file);

        assertThat(url).startsWith("/uploads/");
        assertThat(url).endsWith(".png");
        // 반환 URL → 실제 디스크 경로 매핑 (정적 서빙이 같은 규칙으로 읽음)
        Path saved = tempDir.resolve(url.substring("/uploads/".length()));
        assertThat(Files.exists(saved)).isTrue();
    }

    @Test
    void jpg도_허용된다() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "photo.JPG", "image/jpeg", new byte[]{1, 2, 3});

        String url = service.store(file);

        assertThat(url).endsWith(".jpg"); // 확장자 소문자 정규화
    }

    @Test
    void 빈_파일은_INVALID_FILE() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "empty.png", "image/png", new byte[0]);

        assertThatThrownBy(() -> service.store(file))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_FILE);
    }

    @Test
    void 비허용_확장자는_INVALID_FILE() {
        // content-type 은 이미지지만 확장자가 gif → 거부
        MockMultipartFile file = new MockMultipartFile(
                "file", "anim.gif", "image/gif", new byte[]{1, 2, 3});

        assertThatThrownBy(() -> service.store(file))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_FILE);
    }

    @Test
    void 확장자위장_content_type불일치는_INVALID_FILE() {
        // 이름은 .png 지만 content-type 이 비이미지 → 거부 (위장 방지)
        MockMultipartFile file = new MockMultipartFile(
                "file", "fake.png", "text/plain", new byte[]{1, 2, 3});

        assertThatThrownBy(() -> service.store(file))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_FILE);
    }

    @Test
    void _5MB초과는_INVALID_FILE() {
        byte[] tooBig = new byte[5 * 1024 * 1024 + 1];
        MockMultipartFile file = new MockMultipartFile(
                "file", "big.png", "image/png", tooBig);

        assertThatThrownBy(() -> service.store(file))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_FILE);
    }
}
