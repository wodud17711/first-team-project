# syntax=docker/dockerfile:1
# 댕기온 백엔드(Spring Boot 4 / Java 21) 배포용 — Render 는 Java native 미지원이라 Docker 사용.
# ===== Build stage: gradle wrapper 로 실행가능 jar(bootJar) 생성 =====
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
# 의존성 캐시 최적화: wrapper/빌드스크립트 먼저 복사
COPY gradlew .
COPY gradle ./gradle
COPY build.gradle settings.gradle ./
COPY src ./src
# gradlew 가 Windows(CRLF)로 커밋됐을 경우 대비해 CRLF 제거 후 실행
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew && ./gradlew bootJar --no-daemon

# ===== Run stage: JRE 만 포함한 경량 이미지 =====
FROM eclipse-temurin:21-jre
WORKDIR /app
# 서버 시간대를 KST 로 고정. Render 는 UTC 기본 → LocalDateTime.now() 가 UTC 가 되어
# 기상청 발표시각(KST) 계산이 9시간 어긋나 날씨가 과거(새벽) 값으로 수집되던 문제 해결.
ENV TZ=Asia/Seoul
COPY --from=build /app/build/libs/*.jar app.jar
# Render 는 PORT 환경변수를 주입 → application-prod 의 server.port=${PORT:8081} 가 읽음
EXPOSE 8081
ENTRYPOINT ["java", "-Duser.timezone=Asia/Seoul", "-jar", "/app/app.jar"]
