# Backend — 댕기온

Spring Boot 4.0.6 + Java 21 + MySQL 8. 포트 **8081**.

---

## 사전 요구사항
- JDK 21
- MySQL 8.x (로컬 설치, 운영도 동일 버전)
- Git Bash 또는 PowerShell

> Python(`ai/`)·Node(`frontend/`)는 각 폴더 README 참고.

---

## 처음 한 번만 하는 셋업

### 1. MySQL 에 `daengion` 데이터베이스 생성
```
mysql -u root -p -e "CREATE DATABASE daengion DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```
`Enter password:` 뜨면 본인 MySQL root 비밀번호 입력.

### 2. `application-local.properties` 만들기
```
cp src/main/resources/application-local.properties.example src/main/resources/application-local.properties
```
(PowerShell 은 `copy`)

만들어진 `application-local.properties` 열어서 2곳 채움:
- `spring.datasource.password=changeme` → 본인 MySQL root 비밀번호
- `jwt.secret=PASTE_DEV_JWT_SECRET_HERE` → dev 키 (팀 리더에게 문의)

`application-local.properties` 는 `.gitignore` 되어 커밋되지 않음 (비밀번호 보호).

### 3. 부팅 확인
```
./gradlew bootRun
```
콘솔 끝에 `Started DemoApplication in N seconds` 떴고 `Tomcat started on port 8081` 보이면 성공.

---

## 동작 체크 (서버 떠 있는 상태에서)
```bash
# 존재하지 않는 계정 로그인 → INVALID_CREDENTIALS 401 가 떨어지면 DB·JPA·Security 다 정상
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nobody@example.com","password":"anything1234"}'
```

기대 응답:
```json
{"success":false,"data":null,"message":"이메일 또는 비밀번호가 일치하지 않습니다","errorCode":"INVALID_CREDENTIALS"}
```

> 💡 보안: 이메일 존재 여부를 응답으로 구분하지 않습니다 (OWASP Account Enumeration 차단).

---

## 자주 만나는 에러

| 증상 | 원인 / 해결 |
| --- | --- |
| `Could not resolve placeholder 'JWT_SECRET'` | `application-local.properties` 에 `jwt.secret=...` 값을 placeholder 그대로(`${JWT_SECRET}`) 두었거나 비어있음. 실제 dev 키 문자열로 교체. |
| `Access denied for user 'root'@'localhost'` | `spring.datasource.password` 가 본인 MySQL root 비밀번호와 다름. |
| `Unknown database 'daengion'` | 위 1단계의 `CREATE DATABASE` 가 안 됨. 다시 실행. |
| 첫 부팅 시 `ALTER TABLE ... DROP FOREIGN KEY ... Table doesn't exist` 가 WARN 으로 뜸 | 정상. `ddl-auto=create` 가 우선 drop 시도하는데 첫 부팅이라 테이블이 없어서 그럼. 두 번째 부팅부터 사라짐. |

---

## 폴더 구조 (com.example.demo)
```
auth/         # 로그인·JWT (controller / service / security / dto)
common/       # ApiResponse, ErrorCode, BusinessException, GlobalExceptionHandler
dog/          # 반려견·견종 도메인 (controller / service / repository / entity / dto)
global/       # CorsConfig, SecurityConfig
user/         # User·RefreshToken entity / repository
```

표준 응답 포맷·예외 처리 정책은 `docs/06-api-spec.md` 참고.

---

## DB 정책 (dev / 운영)

| 환경 | profile | ddl-auto | schema 출처 |
| --- | --- | --- | --- |
| **dev (로컬)** | `local` (기본) | `create` — 매 부팅 테이블 재생성 | Entity 자동 생성 + `db/seed/dog_breeds_seed.sql` 자동 INSERT |
| **운영 (예정)** | `prod` (`SPRING_PROFILES_ACTIVE=prod`) | `none` | `backend/schema.sql` 을 Flyway 등으로 마이그레이션 (Week 6) |

> dev 는 매 부팅마다 데이터가 깨끗이 초기화됩니다. 보존이 필요해지면 `ddl-auto=update` + 시드 `INSERT IGNORE` 로 전환.
