# 04. 시스템 아키텍처

본 서비스의 전체 시스템 구조와 데이터 흐름을 정의합니다.

---

## 🏗️ 전체 아키텍처

```
┌──────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│                                                              │
│   ┌──────────────┐                  ┌──────────────┐         │
│   │  Web Browser │                  │  Mobile App  │         │
│   │   (React)    │                  │  (향후 확장) │         │
│   └──────┬───────┘                  └──────┬───────┘         │
└──────────┼─────────────────────────────────┼─────────────────┘
           │                                 │
           │   HTTPS / REST API              │
           ↓                                 ↓
┌──────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐    │
│   │           Spring Boot Backend                       │    │
│   │                                                     │    │
│   │   - 사용자 인증 (JWT)                                │    │
│   │   - 반려견 프로필 관리                                │    │
│   │   - 산책 기록 관리                                   │    │
│   │   - 커뮤니티 (게시판, 댓글)                          │    │
│   │   - 외부 API 호출 (날씨, 대기오염)                   │    │
│   │   - AI 서버 호출 (위험도 계산)                       │    │
│   └────┬────────────────┬───────────────────────┬───────┘    │
│        │                │                       │            │
└────────┼────────────────┼───────────────────────┼────────────┘
         │                │                       │
         ↓                ↓                       ↓
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   MySQL 8.0     │  │  Python FastAPI  │  │  External APIs   │
│                 │  │   (AI Server)    │  │                  │
│  - User         │  │                  │  │  - 기상청        │
│  - Dog          │  │  - 위험도 계산   │  │  - 에어코리아    │
│  - WalkRecord   │  │  - 룰베이스      │  │                  │
│  - Post         │  │  - 견종 분류(2차)│  │                  │
│  - Comment      │  │                  │  │                  │
└─────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 🔄 주요 데이터 흐름

### 1. 산책 위험도 측정 흐름

```
[사용자]
   │
   │ 1. 위험도 조회 요청 (반려견 ID, 위치)
   ↓
[React Frontend]
   │
   │ 2. GET /api/walk/risk-score?dogId=1&lat=..&lng=..
   ↓
[Spring Boot Backend]
   │
   ├─ 3. 반려견 정보 조회 (MySQL)
   │
   ├─ 4. 위경도 → 기상청 격자좌표 변환
   │
   ├─ 5. 기상청 API 호출 (날씨 조회)
   │    └─ 캐시 확인 후 호출
   │
   ├─ 6. 에어코리아 API 호출 (미세먼지)
   │
   ├─ 7. AI 서버 호출 (위험도 계산)
   │    POST /predict
   │    { dog: {...}, weather: {...} }
   │      ↓
   │  [Python FastAPI]
   │   - 룰베이스 점수 계산
   │   - 위험 사유 추출
   │   - 추천 시간대 계산
   │      ↓
   │   응답: { score, level, reasons, recommendedTime }
   │
   ├─ 8. 결과 통합 후 응답
   ↓
[React Frontend]
   │
   │ 9. UI에 표시
   ↓
[사용자]
```

### 2. 산책 시작/종료 흐름

```
[사용자: 산책 시작]
   ↓
[Frontend]
   ↓ POST /api/walks/start
[Backend]
   ↓ WalkRecord 생성 (start_time 기록)
   ↓ walkId 반환
[Frontend]
   ↓ (산책 진행)
[사용자: 산책 종료 + 피드백 입력]
   ↓
[Frontend]
   ↓ POST /api/walks/{walkId}/end
[Backend]
   ↓ end_time, duration, feedback 업데이트
   ↓ 통계 캐시 무효화
[Frontend]
   ↓ 결과 화면 표시
```

---

## 🧱 백엔드 내부 구조

### 패키지 구조 (Spring Boot)

```
com.dogwalk
├── DogWalkApplication.java
│
├── domain
│   ├── user           # 회원
│   │   ├── controller
│   │   ├── service
│   │   ├── repository
│   │   ├── entity
│   │   └── dto
│   ├── dog            # 반려견
│   ├── walk           # 산책 기록
│   ├── post           # 커뮤니티 글
│   └── comment        # 댓글
│
├── infra              # 외부 연동
│   ├── weather        # 기상청 API
│   ├── airquality     # 에어코리아 API
│   └── ai             # AI 서버 호출
│
├── global             # 공통
│   ├── config         # 설정 (Security, CORS 등)
│   ├── exception      # 예외 처리
│   ├── security       # JWT 등
│   └── util           # 유틸리티
│
└── resources
    ├── application.yml
    └── application-{env}.yml
```

### 계층 구조

```
Controller → Service → Repository → DB
                ↓
            (Infra Layer)
            External API / AI Server
```

---

## 🎨 프론트엔드 내부 구조

```
src/
├── components       # 공통 컴포넌트
│   ├── common
│   ├── layout
│   └── ui
├── pages            # 페이지 (라우트 단위)
│   ├── auth
│   ├── dog
│   ├── walk
│   └── community
├── hooks            # 커스텀 훅
├── api              # API 클라이언트
├── stores           # 전역 상태 (Zustand)
├── types            # TypeScript 타입
├── utils            # 유틸 함수
└── App.tsx
```

---

## 🔐 인증 흐름

```
[로그인 요청]
   ↓
[Backend] 사용자 검증
   ↓
[Backend] JWT Access Token 발급 (1시간)
   ↓
[Frontend] localStorage에 저장
   ↓
[Frontend] 이후 요청 시 Authorization 헤더에 포함
   ↓
[Backend] Spring Security가 JWT 검증
   ↓
[Backend] 사용자 컨텍스트 설정 후 요청 처리
```

> ⚠️ Refresh Token 도입 여부는 추후 결정

---

## 💾 캐싱 전략

### 캐시 대상

| 데이터 | 캐시 키 | TTL | 이유 |
| --- | --- | --- | --- |
| 날씨 (단기예보) | `weather:{nx}:{ny}:{baseTime}` | 1시간 | 발표 주기와 일치 |
| 미세먼지 | `air:{sido}:{station}` | 30분 | 갱신 주기 |
| 위험도 결과 | `risk:{dogId}:{date}:{hour}` | 1시간 | 동일 조건이면 같은 결과 |
| 견종 정보 | `breed:{breedId}` | 24시간 | 거의 변동 없음 |

> 초기에는 Spring `@Cacheable` (in-memory)로 시작, 트래픽 증가 시 Redis 도입

---

## 🔌 외부 API 호출 정책

- **재시도**: 최대 3회, 지수 백오프
- **타임아웃**: 3초
- **실패 시**: 캐시된 마지막 데이터 사용 (없으면 사용자에게 안내)
- **호출 한도 관리**: 일일 호출 수 모니터링

---

## 🛡️ 보안 고려사항

| 영역 | 대응 |
| --- | --- |
| 인증 | JWT 토큰 + HttpOnly Cookie (선택) |
| 비밀번호 | BCrypt 해싱 |
| API 키 | 환경변수 관리, GitHub 노출 금지 |
| CORS | 허용 도메인 명시 |
| SQL Injection | JPA 사용으로 자동 방어 |
| XSS | React 기본 escape + 추가 검증 |
| 민감 정보 로깅 | 비밀번호·토큰 마스킹 |

---

## 📈 확장성 고려

- **수평 확장 가능 구조**: 백엔드는 stateless (JWT 기반)
- **AI 서버 분리**: 모델 교체/스케일링이 백엔드와 독립
- **DB 인덱싱**: 자주 조회되는 컬럼 (user_id, dog_id, created_at 등) 인덱스
- **이미지**: S3 등 외부 스토리지 사용으로 DB 부하 분산

---

## 🔗 관련 문서

- 기술 상세: [03. 기술 스택](./03-tech-stack.md)
- DB 설계: [05. 데이터베이스 설계](./05-database.md)
- API 명세: [06. API 명세서](./06-api-spec.md)
