package com.example.demo.global.config;

import com.example.demo.upload.service.FileStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * 업로드 이미지 정적 서빙.
 *
 * <p>{@code /uploads/**} 요청을 로컬 디스크 저장 루트({@code app.upload.dir})로 매핑한다.
 * 저장 URL prefix 는 {@link FileStorageService#URL_PREFIX} 와 일치시킨다.
 * 인증 없이 접근 가능해야 하므로 {@code SecurityConfig} 에서 {@code GET /uploads/**} 를 permitAll 한다
 * (img 태그는 Authorization 헤더를 싣지 못함).
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String uploadDir;

    public WebConfig(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.uploadDir = uploadDir;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Paths.get(uploadDir).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler(FileStorageService.URL_PREFIX + "/**")
                .addResourceLocations(location);
    }
}
