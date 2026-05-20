# 10. 백엔드 코딩 가이드

Spring Boot 4 + Java 21 + JPA 기준 **Entity / Service / Controller 작성 패턴**입니다.
모든 백엔드 작업은 이 가이드를 따라주세요.

---

## 🏗 레이어드 아키텍처 한눈에 보기

```
HTTP 요청
   ↓
[Controller]  ← REST 엔드포인트, DTO 검증, HTTP 응답 변환
   ↓ DTO
[Service]     ← 비즈니스 로직, 트랜잭션, 권한 체크
   ↓ Entity
[Repository]  ← DB 접근 (JPA)
   ↓
[Entity]      ← DB 테이블 매핑
```

### 의존 방향 (한 방향만!)
```
Controller → Service → Repository → Entity
```
**반대로 의존하면 안 됨.** Entity가 Service를 알면 안 되고, Repository가 Controller를 알면 안 됨.

---

## 📁 권장 패키지 구조

```
backend/src/main/java/com/example/demo/
├── DemoApplication.java
├── common/                     # 공통 유틸·예외
│   ├── exception/
│   │   ├── BusinessException.java
│   │   ├── ErrorCode.java
│   │   └── GlobalExceptionHandler.java
│   └── response/
│       └── ApiResponse.java    # { success, data, message }
├── auth/                       # 도메인별 폴더
│   ├── controller/AuthController.java
│   ├── service/AuthService.java
│   ├── dto/
│   │   ├── SignupRequest.java
│   │   ├── LoginRequest.java
│   │   └── AuthResponse.java
│   └── security/JwtProvider.java
├── user/
│   ├── controller/UserController.java
│   ├── service/UserService.java
│   ├── repository/UserRepository.java
│   ├── entity/User.java
│   └── dto/...
├── dog/
│   └── (동일 구조)
├── walk/
│   └── (동일 구조)
└── post/
    └── (동일 구조)
```

**원칙**: 도메인별 폴더(`auth`, `user`, `dog`...) 안에 layer별 하위 폴더.
→ 한 기능 작업 시 한 폴더 안에서 끝남.

---

## 🧱 1. Entity 작성

### 기본 패턴

```java
package com.example.demo.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 기본 생성자는 JPA용
@SQLRestriction("deleted_at IS NULL")              // 소프트 삭제 필터 자동 적용
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Builder
    private User(String email, String password, String nickname) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
    }

    // 생성 메서드 (정적 팩토리)
    public static User create(String email, String encodedPassword, String nickname) {
        return User.builder()
            .email(email)
            .password(encodedPassword)
            .nickname(nickname)
            .build();
    }

    // 도메인 메서드 (비즈니스 로직은 가능하면 Entity에)
    public void updateProfile(String nickname, String profileImageUrl) {
        this.nickname = nickname;
        this.profileImageUrl = profileImageUrl;
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
```

### ❌ Entity 작성 시 금지 사항

| 금지 | 이유 |
|---|---|
| `@Setter` 전체 사용 | 어디서든 상태 변경 가능 → 추적 불가 |
| `public` 생성자 | 빈 객체 생성 후 setter 호출하는 안티패턴 유발 |
| Entity를 Controller에서 직접 반환 | 보안·결합도 문제 (DTO로 변환할 것) |
| Entity 안에 Service 의존 주입 | 레이어 역행 |

### ✅ 핵심 규칙

- **Lombok**: `@Getter`, `@NoArgsConstructor(access = PROTECTED)`, `@Builder` 만 사용
- **Setter 금지** → 도메인 메서드로 상태 변경 (`updateProfile()`, `delete()`)
- **정적 팩토리 메서드** (`create()`) 권장 → 생성 의도 명확
- **타임스탬프**: `@PrePersist`, `@PreUpdate`로 자동 관리
- **소프트 삭제**: `@SQLRestriction("deleted_at IS NULL")` → 자동 필터

---

## 🗄 2. Repository 작성

```java
package com.example.demo.user.repository;

import com.example.demo.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);
}
```

### 규칙
- **인터페이스만 정의** (JpaRepository가 구현 자동 생성)
- 메서드 이름 규칙으로 쿼리 자동 생성 (`findByEmail`, `existsByX`)
- 복잡한 쿼리는 `@Query` 사용
- **절대 Service 외 다른 곳에서 호출 X**

---

## 📦 3. DTO 패턴

### Request DTO (입력)

```java
package com.example.demo.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
    @NotBlank @Email
    String email,

    @NotBlank @Size(min = 8, max = 100, message = "비밀번호는 8자 이상")
    String password,

    @NotBlank @Size(min = 2, max = 50)
    String nickname
) {}
```

> 💡 **Java 21 `record`** 사용 권장 — 불변·간결.
> Lombok `@Data` 클래스도 가능하지만 record가 더 안전.

### Response DTO (출력)

```java
package com.example.demo.user.dto;

import com.example.demo.user.entity.User;

public record UserResponse(
    Long userId,
    String email,
    String nickname,
    String profileImageUrl
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getNickname(),
            user.getProfileImageUrl()
        );
    }
}
```

> 💡 **Entity → DTO 변환은 정적 메서드 `from()`** 으로. MapStruct도 좋지만 처음엔 수동이 명확.

### 🚨 절대 금지
- ❌ Entity를 Controller에서 그대로 반환
- ❌ DTO에 비즈니스 로직 작성
- ❌ Request DTO와 Response DTO를 한 클래스로 합치기

---

## ⚙️ 4. Service 작성

```java
package com.example.demo.auth.service;

import com.example.demo.auth.dto.SignupRequest;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.user.dto.UserResponse;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 클래스 기본을 readOnly로
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional // 쓰기 작업은 명시적으로 readOnly = false
    public UserResponse signup(SignupRequest request) {
        // 1. 비즈니스 검증
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (userRepository.existsByNickname(request.nickname())) {
            throw new BusinessException(ErrorCode.NICKNAME_ALREADY_EXISTS);
        }

        // 2. 비밀번호 인코딩
        String encoded = passwordEncoder.encode(request.password());

        // 3. Entity 생성 및 저장
        User user = User.create(request.email(), encoded, request.nickname());
        User saved = userRepository.save(user);

        // 4. Response DTO 반환
        return UserResponse.from(saved);
    }
}
```

### 핵심 규칙

| 항목 | 규칙 |
|---|---|
| **클래스 어노테이션** | `@Service`, `@RequiredArgsConstructor`, `@Transactional(readOnly = true)` |
| **의존 주입** | `private final` + 생성자 주입 (Lombok `@RequiredArgsConstructor`) |
| **트랜잭션** | 클래스는 readOnly=true, 쓰기 메서드만 `@Transactional` 추가 |
| **예외** | `BusinessException` + `ErrorCode` enum 사용 |
| **반환** | Entity가 아닌 **DTO**로 반환 |
| **검증 순서** | ① 외부 입력 검증 → ② 비즈니스 검증 → ③ 처리 → ④ 반환 |

### ❌ 금지
- `@Autowired` 필드 주입 (생성자 주입만)
- Service에서 다른 Service의 Repository 직접 호출 → 다른 Service를 주입
- Service에서 Entity setter 호출 → Entity의 도메인 메서드 호출

---

## 🎮 5. Controller 작성

```java
package com.example.demo.auth.controller;

import com.example.demo.auth.dto.SignupRequest;
import com.example.demo.auth.service.AuthService;
import com.example.demo.common.response.ApiResponse;
import com.example.demo.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<UserResponse>> signup(
        @Valid @RequestBody SignupRequest request
    ) {
        UserResponse response = authService.signup(request);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success(response));
    }
}
```

### 핵심 규칙

| 항목 | 규칙 |
|---|---|
| **클래스 어노테이션** | `@RestController`, `@RequestMapping("/api/...")`, `@RequiredArgsConstructor` |
| **URL** | `/api/도메인/...` 형식 (예: `/api/auth/signup`, `/api/dogs`) |
| **HTTP 메서드 매핑** | `@GetMapping`, `@PostMapping`, `@PatchMapping`, `@DeleteMapping` |
| **검증** | `@Valid @RequestBody` |
| **응답 형식** | `ResponseEntity<ApiResponse<T>>` 통일 |
| **상태 코드** | POST=201, GET/PATCH/DELETE=200 |
| **비즈니스 로직 금지** | Controller에는 흐름만, 로직은 Service |

---

## 📨 6. 공통 응답 포맷 (ApiResponse)

```java
package com.example.demo.common.response;

public record ApiResponse<T>(
    boolean success,
    T data,
    String message
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, data, message);
    }

    public static ApiResponse<Void> fail(String message) {
        return new ApiResponse<>(false, null, message);
    }
}
```

> 📌 `docs/06-api-spec.md`의 `{ success, data, message }` 형식과 정합

---

## ✅ 7. Validation

### Request DTO에서 검증
```java
public record SignupRequest(
    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    String email,
    
    @NotBlank
    @Size(min = 8, max = 100)
    String password,
    
    @NotBlank
    @Pattern(regexp = "^[가-힣a-zA-Z0-9]{2,20}$")
    String nickname
) {}
```

### Controller에서 활성화
```java
@PostMapping("/signup")
public ResponseEntity<...> signup(@Valid @RequestBody SignupRequest request) {
    ...
}
```

### 자주 쓰는 어노테이션
| 어노테이션 | 용도 |
|---|---|
| `@NotNull` | null 금지 |
| `@NotBlank` | null/빈문자/공백 금지 (String) |
| `@NotEmpty` | null/빈 컬렉션 금지 (List, Set) |
| `@Email` | 이메일 형식 |
| `@Size(min, max)` | 길이 제한 |
| `@Min`, `@Max` | 숫자 범위 |
| `@Pattern(regexp)` | 정규식 |
| `@Past`, `@Future` | 날짜 |

---

## 🚨 8. 예외 처리

### ErrorCode enum

```java
package com.example.demo.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    // Auth
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 가입된 이메일입니다"),
    NICKNAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 일치하지 않습니다"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다"),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"),

    // Dog
    DOG_NOT_FOUND(HttpStatus.NOT_FOUND, "반려견을 찾을 수 없습니다"),

    // Post
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "글을 찾을 수 없습니다"),
    INVALID_SUB_TAG(HttpStatus.BAD_REQUEST, "이 카테고리에는 사용할 수 없는 서브태그입니다"),
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "카테고리를 찾을 수 없습니다");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
```

### BusinessException

```java
package com.example.demo.common.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {
    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
}
```

### GlobalExceptionHandler

```java
package com.example.demo.common.exception;

import com.example.demo.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException ex) {
        ErrorCode code = ex.getErrorCode();
        return ResponseEntity
            .status(code.getStatus())
            .body(ApiResponse.fail(code.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(err -> err.getField() + ": " + err.getDefaultMessage())
            .findFirst()
            .orElse("입력값 검증 실패");
        return ResponseEntity.badRequest().body(ApiResponse.fail(message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception ex) {
        ex.printStackTrace(); // 실제로는 로거 사용
        return ResponseEntity.internalServerError()
            .body(ApiResponse.fail("서버 오류가 발생했습니다"));
    }
}
```

---

## 🔁 9. 전체 흐름 예시: 회원가입 end-to-end

```
[클라이언트]
POST /api/auth/signup
Body: { email, password, nickname }
   ↓
[AuthController.signup()]
   - @Valid로 DTO 검증
   - authService.signup(request) 호출
   ↓
[AuthService.signup()]
   - userRepository.existsByEmail() → 중복 검사
   - passwordEncoder.encode() → BCrypt 해시
   - User.create() → Entity 생성
   - userRepository.save() → DB 저장
   - UserResponse.from(user) → DTO 변환
   ↓
[UserRepository] → DB INSERT
   ↓
[Controller가 ResponseEntity 반환]
   Status: 201 Created
   Body: { "success": true, "data": { userId, email, nickname, ... } }
```

### 실패 흐름 (중복 이메일)

```
[AuthService] → BusinessException(EMAIL_ALREADY_EXISTS) throw
   ↓
[GlobalExceptionHandler.handleBusiness()]
   Status: 409 Conflict
   Body: { "success": false, "data": null, "message": "이미 가입된 이메일입니다" }
```

---

## 📝 10. 작업 체크리스트 (PR 올리기 전 확인)

새 기능 PR 올리기 전 다음 항목 확인:

- [ ] Entity에 `@Setter` 사용 안 함
- [ ] Entity 도메인 메서드로 상태 변경
- [ ] Repository는 인터페이스만 정의
- [ ] Request/Response DTO는 record로 (또는 Lombok 클래스)
- [ ] Service는 DTO를 받고 DTO를 반환 (Entity 직접 노출 X)
- [ ] Service에 `@Transactional(readOnly = true)` + 쓰기 메서드는 `@Transactional`
- [ ] Controller는 흐름만, 비즈니스 로직 없음
- [ ] URL은 `/api/도메인/...` 형식
- [ ] 응답은 `ResponseEntity<ApiResponse<T>>` 형식
- [ ] Validation 어노테이션 추가
- [ ] 비즈니스 예외는 `BusinessException(ErrorCode.XXX)` 사용
- [ ] 새 ErrorCode는 enum에 추가
- [ ] 테스트 작성 (최소 Service 단위 테스트)

---

## 🧪 11. 테스트 작성 가이드 (간단)

### Service 단위 테스트

```java
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @InjectMocks AuthService authService;

    @Test
    void 회원가입_성공() {
        // given
        SignupRequest req = new SignupRequest("test@example.com", "password123", "닉네임");
        given(userRepository.existsByEmail(req.email())).willReturn(false);
        given(userRepository.existsByNickname(req.nickname())).willReturn(false);
        given(passwordEncoder.encode(any())).willReturn("encoded");
        given(userRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        // when
        UserResponse result = authService.signup(req);

        // then
        assertThat(result.email()).isEqualTo("test@example.com");
        assertThat(result.nickname()).isEqualTo("닉네임");
    }

    @Test
    void 중복_이메일_가입_실패() {
        SignupRequest req = new SignupRequest("dup@example.com", "password123", "닉네임");
        given(userRepository.existsByEmail(req.email())).willReturn(true);

        assertThatThrownBy(() -> authService.signup(req))
            .isInstanceOf(BusinessException.class)
            .extracting("errorCode").isEqualTo(ErrorCode.EMAIL_ALREADY_EXISTS);
    }
}
```

---

## 🔗 관련 문서

- API 명세: [06. API 명세서](./06-api-spec.md)
- DB 스키마: [05. 데이터베이스 설계](./05-database.md)
- 아키텍처 전체: [04. 시스템 아키텍처](./04-architecture.md)

---

## 💡 더 알아보기

| 주제 | 추천 자료 |
|---|---|
| JPA 영속성 컨텍스트 | 김영한 - 자바 ORM 표준 JPA |
| Spring Security + JWT | 백기선 - 스프링 시큐리티 |
| 클린 아키텍처 | 만들면서 배우는 클린 아키텍처 |
| 단위 테스트 | 박재성 - TDD 강의 |
