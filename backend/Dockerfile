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
# JVM 메모리 제한: Render 무료 512MB 안에서 돌게 한다. 플래그가 없으면 힙·메타스페이스·
# 스레드스택·네이티브 합이 512MB 를 넘겨 컨테이너가 OOM kill(로그 없이 즉사·재시작 반복)된다.
#   MaxRAMPercentage=50  : 힙 상한 ~256MB (나머지 ~256MB 는 메타스페이스·스레드·네이티브용)
#   UseSerialGC          : 작은 인스턴스에서 G1 보다 메모리 오버헤드 적음
#   MaxMetaspaceSize=128m: 메타스페이스 무한 증가 차단
#   Xss512k              : 스레드 스택 축소(Tomcat 다수 스레드 누적 방지)
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=50.0", "-XX:+UseSerialGC", "-XX:MaxMetaspaceSize=128m", "-Xss512k", "-Duser.timezone=Asia/Seoul", "-jar", "/app/app.jar"]
