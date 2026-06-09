# 06. API 명세서

본 서비스의 REST API 명세입니다.

- **Base URL**: `http://localhost:8081` (개발), `https://api.dogwalk.com` (운영, 예정)
- **인증**: JWT (Access Token: Authorization 헤더 / Refresh Token: HttpOnly 쿠키)
- **Content-Type**: `application/json`
- **응답 포맷**: 공통 응답 구조 사용
- **버전**: v3.1 (2026-05-20, 59개 엔드포인트, schema v1.4 매핑)

---

## 🔐 인증 정책 (v3.1 확정)

| 항목 | 결정 |
| --- | --- |
| AT (Access Token) 저장 | 프론트 메모리 → `Authorization: Bearer` 헤더로 전송 |
| RT (Refresh Token) 저장 | HttpOnly + Secure + SameSite=Lax 쿠키 (Path=`/api/auth`, Max-Age=14d) |
| AT 만료 시 | 첫 로드 시 `POST /api/auth/refresh` 호출하여 복구 (쿠키 자동 전송) |
| 재발급 | `POST /api/auth/refresh` (Request Body 없음, 쿠키 RT를 서버가 읽음) |
| 로그아웃 | DB의 RT 삭제 + 쿠키 만료(Max-Age=0) |
| 서버 저장 | `refresh_tokens` 테이블 (단일 세션, schema v1.4) |
| 멀티 디바이스 | **단일 세션 정책** — 새 로그인 시 해당 사용자의 기존 RT를 모두 삭제 → 다른 기기는 다음 AT 만료 시점에 자동 로그아웃 (MVP 의도된 동작) |
| 로테이션 | 미적용 (MVP) |
| dev 환경 | Vite `/api` → `:8081` 프록시 + axios `withCredentials: true` |

> 모바일(네이티브 앱)은 쿠키 대신 헤더/바디 토큰 방식 병행 예정 (백엔드 모바일-레디 — 추후 반영)

---

## 📦 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": "요청이 성공했습니다"
}
```

### 실패 응답
```json
{
  "success": false,
  "data": null,
  "message": "에러 메시지",
  "errorCode": "ERROR_CODE"
}
```

### 페이지네이션 응답
```json
{
  "success": true,
  "data": {
    "content": [ ... ],
    "page": 0,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5
  }
}
```

---

## 🔢 공통 상태 코드

| 코드 | 의미 | 사용 시점 |
| --- | --- | --- |
| 200 | OK | 조회·수정 성공 |
| 201 | Created | 생성 성공 (회원가입·반려견 등록·글 작성·좋아요) |
| 204 | No Content | 삭제·로그아웃 (응답 본문 없음) |
| 400 | Bad Request | 잘못된 요청 (유효성 검증 실패) |
| 401 | Unauthorized | 인증 실패 (토큰 없음·만료) |
| 403 | Forbidden | 권한 없음 (남의 리소스 접근) |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 중복·상태 충돌 |
| 429 | Too Many Requests | 호출 한도 초과 (OpenAI 일일 한도 등) |
| 500 | Internal Server Error | 서버 오류 |
| 503 | Service Unavailable | 외부 서비스 일시 중단 |

---

## 📋 API 목록 (총 59개)

| 카테고리 | 개수 | Phase | 관련 테이블 |
| --- | --- | --- | --- |
| 인증 | 4 | MVP | users, refresh_tokens |
| 회원 | 3 | MVP | users |
| 반려견 | 5 | MVP | dogs |
| 견종 | 2 | MVP | dog_breeds |
| 산책 점수 | 2 | MVP(1) + Phase 3(1) | walk_scores, weather_snapshots |
| 산책 기록 | 7 | MVP(6) + Phase 3(1) | walks, walk_locations |
| 산책로 | 5 | Phase 2 | walk_routes, walk_route_reviews |
| 게시판 | 10 | MVP | posts, comments, categories |
| 좋아요 | 2 | MVP | post_likes |
| 동반 산책 | 4 | Phase 2 | walking_companions |
| 배지/업적 | 4 | Phase 2 | badges, achievements |
| 미션 | 3 | Phase 2 | daily_missions, walk_missions |
| 알림 | 3 | MVP | notifications |
| AI Q&A | 2 | Phase 2 | qna_history |
| 견주 유형 | 1 | Phase 2 | user_walk_stats |
| 랭킹 | 2 | Phase 2 | user_walk_stats |
| **합계** | **59** | MVP 36 / Phase 2 21 / Phase 3 2 | - |

---

### 🔐 Auth (인증) - 4개

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | 회원가입 | ❌ |
| POST | `/api/auth/login` | 로그인 (RT는 Set-Cookie) | ❌ |
| POST | `/api/auth/logout` | 로그아웃 (쿠키 만료 + DB RT 삭제) | ✅ |
| POST | `/api/auth/refresh` | 액세스 토큰 갱신 (쿠키 RT 사용) | ❌ (쿠키 필요) |

> 내 정보 조회는 `GET /api/users/me` 사용 (v3.1에서 `/api/auth/me` 삭제, 회원 영역과 통합)

### 👤 User (회원) - 3개

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/users/me` | 내 정보 조회 | ✅ |
| PATCH | `/api/users/me` | 내 정보 수정 | ✅ |
| DELETE | `/api/users/me` | 회원 탈퇴 (soft delete) | ✅ |

### 🐕 Dog (반려견) - 5개

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/dogs` | 내 반려견 목록 | ✅ |
| POST | `/api/dogs` | 반려견 등록 | ✅ |
| GET | `/api/dogs/{dogId}` | 반려견 상세 | ✅ |
| PATCH | `/api/dogs/{dogId}` | 반려견 수정 | ✅ |
| DELETE | `/api/dogs/{dogId}` | 반려견 삭제 (soft) | ✅ |

### 🦴 Breed (견종 마스터) - 2개

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/breeds` | 견종 목록/검색 (드롭다운용) | ❌ |
| GET | `/api/breeds/{breedId}` | 견종 상세 (단두종/내한·내열 포함) | ❌ |

### 🌤️ Walk Score (산책 위험도) - 2개 ⭐ 핵심

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/walk/score` | 오늘의 산책 위험도 점수 | ✅ |
| GET | `/api/walk/optimal-time` | 시간대별 산책 적합도 + 최적 시간 추천 (MVP, Week3 잔여) | ✅ |

#### 📌 `GET /api/walk/score` 계약 · 결정 (MVP/데모)

> 외부 API 한도(기상청·에어코리아 **1일 1,000회**)와 데모 범위에 따른 확정 설계.
> 위반 시 한도 폭발·중복 호출 발생. (2026-06 PM 결정, PR #71 정렬 근거)

- **요청 파라미터: `dogId` 만.** `/score` 에 **`lat`/`lon` 추가 금지.**
  - 위치는 **데모 = 부산 고정**. 사용자별 실위치(lat/lon)는 **Phase 3(실시간 GPS)** 에서 도입.
- **날씨·대기질 수집은 `/score` 요청과 분리한다.**
  - 수집은 **`@Scheduled` 집계 잡**이 부산 좌표(고정 상수/설정)로 KMA·AirKorea 를 호출해
    `weather_snapshots` 를 채운다. **`/score` 요청 경로에서 외부 API 직접 호출 금지.**
  - `/score` 는 **최신 캐시 스냅샷 1건을 읽기만** 한다(`findTopByOrderByBaseDateTimeDesc`).
  - `saveIfAbsent` 는 DB 중복만 막을 뿐 외부 호출은 못 막으므로, 호출 자체를 스케줄로 분리.
  - AirKorea 는 **수집당 1회만** 호출(`WeatherClient.fetchCurrent` ↔ collector 중복 호출 금지).
- **응답 필드**: `score`(0~100), `level`('안전'\|'주의'\|'위험'), `reasons`(string[]),
  `topReasons`(string[]). 룰 코드(`reasonCodes`/`topReasonCodes`)는
  `feature/risk-reason-mapping` 에서 추가 — FE 위험사유 카테고리·아이콘 매핑용.
- **컬럼명 정합**: `weather_snapshots` 미세먼지 컬럼은 `schema.sql` 과 JPA `@Column` 명을
  일치시킨다(DB 컬럼 `pm_10`/`pm_25` ↔ 엔티티 필드 `pm10`/`pm25`).

#### 📌 `GET /api/walk/optimal-time` 계약 (MVP, Week3 잔여)

> `/score`(현재 1회)의 **시간축 확장**. 기상청 단기예보(`getVilageFcst`)의 **시간대별 미래 예보**를
> 각각 룰베이스로 스코어링해 "몇 시쯤 산책이 좋은가"를 추천한다. (2026-06 PM 결정)

- **요청 파라미터: `dogId` 만** (위치는 부산 고정, `/score` 와 동일 — lat/lon 금지).
- **데이터 소스 = 단기예보(예보 API)**: 기온·습도·풍속·**강수형태**·하늘이 **시간대별 미래**로 들어온다.
  현재 `WeatherClient.parse` 는 첫 슬롯만 쓰는데, optimal-time 은 **여러 미래 슬롯을 모두 살려** 각 시각을 스코어링.
- **예보 안 되는 입력 처리 (⚠️ 핵심 결정)**: **지면온도(ASOS=관측)·미세먼지(AirKorea=관측)는 미래 예보값이 없다.**
  → **MVP = "현재값 유지"**: 최신 스냅샷의 지면온도·PM 을 모든 미래 슬롯에 동일 적용.
  목적이 "분 단위 정밀 점수"가 아니라 **"시간대 등급 추천"**이라 근사로 충분. (추후 기온 기반 지면온도 추정으로 업그레이드 가능)
- **외부 호출**: 단기예보는 1콜에 여러 슬롯을 주고 캐시 가능(좌표+발표시각 동일=동일). **요청마다 직호출 금지**,
  캐시/스케줄된 예보를 읽는다(1일 1,000회 한도 — `/score` 와 동일 원칙).
- **응답**: 각 슬롯의 `score`/`level`/`topReasonCodes` 정본은 `/score` 와 동일(FastAPI 룰).

```
GET /api/walk/optimal-time?dogId=1

{
  "success": true,
  "data": {
    "slots": [
      { "time": "2026-06-09T09:00", "score": 82, "level": "안전", "topReasonCodes": [] },
      { "time": "2026-06-09T14:00", "score": 38, "level": "위험",
        "topReasonCodes": ["GROUND_TEMP_HIGH", "FEELS_HOT"] }
    ],
    "best": [
      { "time": "2026-06-09T09:00", "score": 82, "level": "안전" }
    ]
  },
  "message": "..."
}
```

- `slots`: 단기예보 제공 범위(오늘 잔여~수 시간) 각 시각의 적합도. FE 차트가 시간축으로 렌더.
- `best`: `slots` 중 점수 상위(또는 안전 연속 구간) **1~3개 추천**. FE 가 강조 표시.

### 🚶 Walk (산책 기록) - 7개

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/api/walks/start` | 산책 시작 | ✅ |
| POST | `/api/walks/{walkId}/end` | 산책 종료 + 피드백 | ✅ |
| POST | `/api/walks/{walkId}/locations` | 산책 중 GPS 좌표 기록 (Phase 3) | 보류 |
| GET | `/api/walks/history?dogId={id}` | 반려견별 산책 이력 (최신순) | ✅ |
| GET | `/api/walks/{walkId}` | 산책 기록 상세 (GPS 경로 포함) | ✅ |
| GET | `/api/walks/statistics` | 주간/월간 통계 | ✅ |
| GET | `/api/walks/calendar` | 산책 캘린더 (월별) | ✅ |

### 🌳 Routes (산책로) - 5개 (Phase 2)

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/routes/nearby` | 내 주변 산책로 검색 | ❌ |
| GET | `/api/routes/{routeId}` | 산책로 상세 (경로 JSON 포함) | ❌ |
| POST | `/api/routes` | 산책로 등록 | ✅ |
| GET | `/api/routes/{routeId}/reviews` | 산책로 리뷰 목록 | ❌ |
| POST | `/api/routes/{routeId}/reviews` | 산책로 리뷰 작성 | ✅ |

### 💬 Community (게시판) - 10개

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/categories` | 카테고리 + 서브태그 목록 | ❌ |
| GET | `/api/posts` | 게시글 목록 (카테고리/서브태그 필터) | ❌ |
| POST | `/api/posts` | 게시글 작성 (이미지·서브태그 포함) | ✅ |
| GET | `/api/posts/{postId}` | 게시글 상세 | ❌ |
| PATCH | `/api/posts/{postId}` | 게시글 수정 | ✅ |
| DELETE | `/api/posts/{postId}` | 게시글 삭제 | ✅ |
| GET | `/api/posts/{postId}/comments` | 댓글 목록 | ❌ |
| POST | `/api/posts/{postId}/comments` | 댓글 작성 (대댓글 포함) | ✅ |
| PATCH | `/api/comments/{commentId}` | 댓글 수정 | ✅ |
| DELETE | `/api/comments/{commentId}` | 댓글 삭제 | ✅ |

### ❤️ Post Likes (좋아요) - 2개

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/api/posts/{postId}/likes` | 게시글 좋아요 | ✅ |
| DELETE | `/api/posts/{postId}/likes` | 좋아요 취소 | ✅ |

### 👥 Companions (동반 산책) - 4개 (Phase 2)

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/api/posts/{postId}/companions` | 동반 산책 참여 신청 | ✅ |
| GET | `/api/posts/{postId}/companions` | 신청자 목록 (모집자만) | ✅ |
| PATCH | `/api/companions/{companionId}/accept` | 신청 수락 | ✅ |
| PATCH | `/api/companions/{companionId}/reject` | 신청 거절 | ✅ |

### 🏆 Badges & Achievements (배지/업적) - 4개 (Phase 2)

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/badges` | 전체 배지 목록 + 내 획득 여부 | ✅ |
| GET | `/api/badges/me` | 내가 획득한 배지만 | ✅ |
| GET | `/api/achievements` | 전체 업적 목록 + 내 진행도 | ✅ |
| GET | `/api/achievements/me` | 내 업적 진행도만 | ✅ |

### 🎯 Missions (미션) - 3개 (Phase 2)

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/missions/today` | 오늘 진행 중인 산책의 미션 | ✅ |
| PATCH | `/api/walks/{walkId}/missions/{missionId}/complete` | 미션 완료 표시 | ✅ |
| GET | `/api/walks/{walkId}/missions` | 특정 산책의 미션 목록 | ✅ |

### 🔔 Notifications (알림) - 3개

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/notifications` | 내 알림 목록 (안 읽은 것 우선) | ✅ |
| PATCH | `/api/notifications/{notificationId}/read` | 알림 읽음 처리 | ✅ |
| PATCH | `/api/notifications/read-all` | 모든 알림 일괄 읽음 처리 | ✅ |

### 🤖 AI Q&A (OpenAI) - 2개 (Phase 2)

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/api/qna` | OpenAI에 질문 | ✅ |
| GET | `/api/qna/history` | 내 Q&A 이력 | ✅ |

### 📊 User Stats (견주 유형) - 1개 (Phase 2)

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/users/me/stats` | 내 견주 유형 + 산책 통계 | ✅ |

### 🥇 Ranking (랭킹) - 2개 (Phase 2)

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/ranking/walks` | 산책 횟수 랭킹 (주간/월간) | ✅ |
| GET | `/api/ranking/distance` | 산책 거리 랭킹 (주간/월간) | ✅ |

---

## 📑 핵심 API 상세 명세

### 🔐 회원가입

```
POST /api/auth/signup
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123!",
  "nickname": "댕댕이맘"
}
```

**Validation**
- email: 이메일 형식, 필수
- password: 8자 이상, 영문+숫자 포함, 필수
- nickname: 2~20자, 필수

**Response 201**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "nickname": "댕댕이맘"
  },
  "message": "회원가입이 완료되었습니다"
}
```

**Error**
- 400: 유효성 검증 실패 (`INVALID_INPUT`)
- 409: 이메일 중복 (`EMAIL_DUPLICATED`)
- 409: 닉네임 중복 (`NICKNAME_DUPLICATED`)

---

### 🔐 로그인

```
POST /api/auth/login
```

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123!"
}
```

**Response 200**

응답 헤더 — Refresh Token은 HttpOnly 쿠키로 전달:
```
Set-Cookie: refreshToken=eyJhbGc...; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=1209600
```

응답 바디 (refreshToken 필드 없음 — 쿠키로 전달):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "user": {
      "userId": 1,
      "nickname": "댕댕이맘"
    }
  }
}
```

**서버 동작**
1. 이메일 + BCrypt 비밀번호 검증
2. **해당 사용자의 기존 `refresh_tokens` row 전체 삭제** (단일 세션 정책 — 다른 기기는 다음 AT 만료 시점에 자동 로그아웃)
3. Access Token 생성 (1시간 만료)
4. Refresh Token 생성 (14일) + `refresh_tokens` 테이블에 `token_hash` 저장
5. Set-Cookie 헤더로 Refresh Token 전달 (HttpOnly → JS 접근 불가, XSS 방어)
6. 응답 바디로 Access Token + 사용자 정보 반환

**Error**
- 401: 이메일 또는 비밀번호 불일치 (`INVALID_CREDENTIALS`)

---

### 🔐 토큰 재발급

```
POST /api/auth/refresh
Cookie: refreshToken=...   (브라우저 자동 전송, Request Body 없음)
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600
  }
}
```

**서버 동작**
1. 쿠키에서 Refresh Token 읽기
2. JWT 서명 검증 + 만료 확인
3. DB `refresh_tokens`에서 `token_hash` 일치 확인
4. 새 Access Token 발급 (로테이션 미적용 — RT는 갱신 안 함)

**Error**
- 401: 쿠키에 RT 없음 또는 만료 (`EXPIRED_TOKEN`)
- 401: DB에 일치하는 토큰 없음 (`INVALID_TOKEN`)

---

### 🔐 로그아웃

```
POST /api/auth/logout
Authorization: Bearer {accessToken}
Cookie: refreshToken=...
```

**Response 200** — 쿠키 만료 처리:
```
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=0
```
```json
{
  "success": true,
  "data": null,
  "message": "로그아웃되었습니다"
}
```

**서버 동작**
1. 쿠키의 Refresh Token으로 `refresh_tokens`에서 해당 row 삭제
2. Set-Cookie로 쿠키 만료 (Max-Age=0)

---

### 🐕 반려견 등록

```
POST /api/dogs
Authorization: Bearer {token}
```

**Request Body**
```json
{
  "name": "초코",
  "breedId": 12,
  "birthDate": "2022-03-15",
  "weight": 3.2,
  "gender": "F",
  "isNeutered": true,
  "activityLevel": "중",
  "healthNotes": "슬개골 탈구 1기",
  "profileImageUrl": "https://...",
  "favorWalkTime": [1, 3, 16],
  "isMain": true
}
```

**Validation**
- name: 1~30자, 필수
- breedId: 견종 마스터 ID (Mix는 NULL 허용)
- weight: 0.1 ~ 100
- gender: M / F
- activityLevel: 저 / 중 / 고 (스키마 한글 ENUM과 일치)
- favorWalkTime: 선호 산책 시간대 정수 배열, 각 원소 0~23 (없으면 생략/`[]`). DB엔 CSV로 저장(중복 제거·오름차순)
- isMain: 대표 강아지 여부. **유저당 1마리 강제** — 첫 등록견은 자동 대표, 이후 `true`로 등록/수정 시 기존 대표 자동 해제. PATCH에서 `isMain:false` 직접 해제는 무시(무대표 방지)

**Response 201**
```json
{
  "success": true,
  "data": {
    "dogId": 1,
    "name": "초코",
    "breed": {
      "breedId": 12,
      "nameKr": "포메라니안",
      "isBrachycephalic": false,
      "heatTolerance": 2,
      "coldTolerance": 4
    },
    "age": 4,
    "weight": 3.2,
    "gender": "F",
    "favorWalkTime": [1, 3, 16],
    "isMain": true,
    "createdAt": "2026-05-20T15:30:00"
  }
}
```

**Error**
- 400: 유효성 검증 실패
- 404: 견종 없음 (`BREED_NOT_FOUND`)

---

### 🌤️ 산책 위험도 조회 ⭐ 핵심 API

```
GET /api/walk/score?dogId=1
Authorization: Bearer {token}
```

> **응답 정본 = FastAPI 룰베이스(`ai/`).** Spring(`/api/walk/score`)은 dogId로 견종형질·나이·날씨를 채워 FastAPI `POST /score`를 호출하고 결과를 그대로 전달한다. 룰·필드 정본은 `ai/README.md` 참조.

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| dogId | Long | ✅ | 반려견 ID (본인 소유 강아지만 조회 가능) |

> 좌표별(lat/lng) 날씨는 **Phase 2**. MVP는 최신 날씨 스냅샷을 사용한다.

**Response 200**
```json
{
  "success": true,
  "data": {
    "score": 30,
    "level": "위험",
    "reasons": [
      "지면이 매우 뜨거워 발바닥 화상 위험이 큽니다",
      "체감온도가 35℃로 높습니다",
      "말티즈는 더위에 취약한 견종입니다"
    ],
    "topReasons": [
      "지면이 매우 뜨거워 발바닥 화상 위험이 큽니다",
      "체감온도가 35℃로 높습니다",
      "말티즈는 더위에 취약한 견종입니다"
    ]
  },
  "message": null,
  "errorCode": null
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| score | int | 0~100 (100에서 위험 요인마다 감점) |
| level | string | `안전`(70~100) / `주의`(40~69) / `위험`(0~39) |
| reasons | string[] | 매칭된 모든 룰 사유. 모두 통과(100점) 시 `["산책하기 좋은 날씨예요!"]` |
| topReasons | string[] | 감점 큰 순 상위 3개 (FE 카드용). 100점이면 `[]` |

**Error**
- 404: 반려견 없음 (`DOG_NOT_FOUND`)
- 503: AI(룰베이스) 서버 호출 실패 (`AI_SERVER_ERROR`)
- 503: 날씨 데이터 없음/조회 실패 (`WEATHER_API_ERROR`)

> 🔮 **Phase 2/3 확장 (현재 미구현)**: `dogName` · `weather` 상세 블록 · `supplies`(준비물 추천) · `measuredAt`(측정 시각)은 추후 추가. 최적 산책 시간은 별도 엔드포인트 **`GET /api/walk/optimal-time`(MVP, 위 계약 참조)**로 분리한다.

---

### 🚶 산책 시작

```
POST /api/walks/start
Authorization: Bearer {token}
```

**Request Body**
```json
{
  "dogId": 1
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "walkId": 100,
    "dogId": 1,
    "startTime": "2026-05-20T18:00:00",
    "endTime": null,
    "durationMinutes": null,
    "distanceKm": null,
    "memo": null,
    "userFeedback": null,
    "inProgress": true
  },
  "message": null,
  "errorCode": null
}
```

**Error**
- 403: 본인 반려견 아님 (`NOT_YOUR_DOG`)
- 409: 진행 중인 산책 있음 (`WALK_ALREADY_IN_PROGRESS`)

> **위험도 점수 귀속(A-2)**: 산책 시작 시, 해당 반려견의 **직전 위험도 점수**(아직 산책에 연결되지 않은 `walk_scores.walk_id = NULL`) 중 **최근 30분 이내**에 측정된 가장 최신 1건을 이 산책에 자동 연결한다(`walk_scores.walk_id` 채움). "산책 시작 = 그 시점 점수 스냅샷" 정책. 30분 내 점수가 없으면 연결하지 않는다(점수는 조회용으로 NULL 유지). 재계산이나 외부 API 호출은 하지 않는다.

---

### 🚶 산책 종료

```
POST /api/walks/{walkId}/end
Authorization: Bearer {token}
```

**Request Body**
```json
{
  "userFeedback": "오늘 너무 즐거웠어요!",
  "distanceKm": 2.5,
  "memo": "한강 산책"
}
```

> 모든 필드는 선택값이다. `distanceKm`는 실시간 GPS 트래킹 전까지 수동 입력/생략한다.

**Response 200**
```json
{
  "success": true,
  "data": {
    "walkId": 100,
    "dogId": 1,
    "startTime": "2026-05-20T18:00:00",
    "endTime": "2026-05-20T18:45:00",
    "durationMinutes": 45,
    "distanceKm": 2.5,
    "memo": "한강 산책",
    "userFeedback": "오늘 너무 즐거웠어요!",
    "inProgress": false
  },
  "message": null,
  "errorCode": null
}
```

**Error**
- 403: 본인 산책 기록 아님 (`FORBIDDEN`)
- 404: 산책 기록 없음 (`WALK_NOT_FOUND`)
- 409: 이미 종료된 산책 (`WALK_ALREADY_ENDED`)

---

### 🚶 반려견별 산책 이력

```
GET /api/walks/history?dogId=1
Authorization: Bearer {token}
```

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| dogId | Long | ✅ | 반려견 ID (본인 소유 강아지만 조회 가능) |

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "walkId": 100,
      "dogId": 1,
      "startTime": "2026-05-20T18:00:00",
      "endTime": "2026-05-20T18:45:00",
      "durationMinutes": 45,
      "distanceKm": 2.5,
      "memo": "한강 산책",
      "userFeedback": "오늘 너무 즐거웠어요!",
      "inProgress": false
    }
  ],
  "message": null,
  "errorCode": null
}
```

**Error**
- 403: 본인 반려견 아님 (`NOT_YOUR_DOG`)
- 404: 반려견 없음 (`DOG_NOT_FOUND`)

> 실시간 GPS 트래킹과 `walk_locations` 기록은 Phase 3 범위로 분리한다. MVP에서는 `POST /api/walks/{walkId}/locations`를 구현하지 않는다.

---

### 📊 산책 통계

```
GET /api/walks/statistics?period=WEEK
Authorization: Bearer {token}
```

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| period | String | ✅ | DAY / WEEK / MONTH |

**Response 200**
```json
{
  "success": true,
  "data": {
    "period": "WEEK",
    "totalWalks": 5,
    "totalMinutes": 220,
    "totalDistance": 12.3,
    "avgDuration": 44,
    "achievementRate": 71,
    "dailyBreakdown": [
      {"date": "2026-05-13", "minutes": 45, "count": 1},
      {"date": "2026-05-14", "minutes": 0, "count": 0},
      {"date": "2026-05-15", "minutes": 50, "count": 1}
    ]
  }
}
```

---

### 💬 게시글 작성 (서브태그 포함)

```
POST /api/posts
Authorization: Bearer {token}
```

**Request Body**
```json
{
  "categoryId": 1,
  "subTag": "건사료",
  "title": "포메라니안 사료 추천 좀 해주세요",
  "content": "4살 포메라니안인데 사료 어떤 게 좋을까요?",
  "imageUrls": [
    "https://...",
    "https://..."
  ]
}
```

**Validation**
- categoryId: 카테고리 ID, 필수
- subTag: 해당 카테고리의 sub_tags에 포함되어야 함
- title: 1~200자, 필수
- content: 필수
- imageUrls: 최대 5개

**Response 201**
```json
{
  "success": true,
  "data": {
    "postId": 50,
    "category": {
      "categoryId": 1,
      "name": "사료/간식"
    },
    "subTag": "건사료",
    "title": "포메라니안 사료 추천 좀 해주세요",
    "createdAt": "2026-05-20T16:00:00"
  }
}
```

**Error**
- 400: 서브태그가 카테고리에 없음 (`INVALID_SUB_TAG`)
- 404: 카테고리 없음 (`CATEGORY_NOT_FOUND`)

---

### 💬 게시글 목록 조회 (서브태그 필터)

```
GET /api/posts?categoryId=1&subTag=건사료&page=0&size=20
```

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| categoryId | Long | ❌ | 카테고리 필터 |
| subTag | String | ❌ | 서브태그 필터 |
| page | Integer | ❌ | 페이지 번호 (기본 0) |
| size | Integer | ❌ | 페이지 크기 (기본 20) |
| sort | String | ❌ | latest / popular |

**Response 200**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "postId": 50,
        "category": "사료/간식",
        "subTag": "건사료",
        "title": "포메라니안 사료 추천 좀 해주세요",
        "author": "댕댕이맘",
        "commentCount": 3,
        "likeCount": 5,
        "viewCount": 12,
        "thumbnailUrl": "https://...",
        "createdAt": "2026-05-20T16:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

---

### ❤️ 게시글 좋아요

```
POST /api/posts/{postId}/likes
Authorization: Bearer {token}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "liked": true,
    "likeCount": 24
  }
}
```

**Error**
- 409: 이미 좋아요 누름 (`ALREADY_LIKED`)

---

### 🔔 알림 목록

```
GET /api/notifications?unreadOnly=true&page=0&size=20
Authorization: Bearer {token}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "notificationId": 1,
        "type": "BADGE_EARNED",
        "title": "새 배지 획득!",
        "content": "산책 마스터 배지를 획득했습니다",
        "linkUrl": "/badges",
        "isRead": false,
        "createdAt": "2026-05-20T18:30:00"
      }
    ],
    "unreadCount": 5
  }
}
```

---

### 📊 내 견주 유형 + 통계

```
GET /api/users/me/stats
Authorization: Bearer {token}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "userType": "저녁형",
    "userTypeDescription": "주로 18-21시에 산책하시는 저녁형 견주시네요!",
    "totalWalks": 142,
    "totalDistanceKm": 285.5,
    "totalDurationMinutes": 4250,
    "avgWalksPerWeek": 4.5,
    "favoriteTimeSlot": "18-20시",
    "lastCalculatedAt": "2026-05-20T03:00:00"
  }
}
```

---

## ❌ 에러 코드 정의

| 코드 | HTTP | 설명 |
| --- | --- | --- |
| `INVALID_INPUT` | 400 | 입력값 검증 실패 |
| `INVALID_SUB_TAG` | 400 | 카테고리에 없는 서브태그 |
| `INVALID_CREDENTIALS` | 401 | 로그인 실패 |
| `UNAUTHORIZED` | 401 | 인증 필요 |
| `EXPIRED_TOKEN` | 401 | Access Token 만료 |
| `INVALID_TOKEN` | 401 | 유효하지 않은 토큰 |
| `EXPIRED_REFRESH_TOKEN` | 401 | Refresh Token 만료 (재로그인 필요) |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_YOUR_DOG` | 403 | 본인 반려견 아님 |
| `NOT_YOUR_POST` | 403 | 본인 글 아님 |
| `USER_NOT_FOUND` | 404 | 사용자 없음 |
| `DOG_NOT_FOUND` | 404 | 반려견 없음 |
| `BREED_NOT_FOUND` | 404 | 견종 없음 |
| `POST_NOT_FOUND` | 404 | 글 없음 |
| `COMMENT_NOT_FOUND` | 404 | 댓글 없음 |
| `ROUTE_NOT_FOUND` | 404 | 산책로 없음 |
| `WALK_NOT_FOUND` | 404 | 산책 기록 없음 |
| `CATEGORY_NOT_FOUND` | 404 | 카테고리 없음 |
| `MISSION_NOT_FOUND` | 404 | 미션 없음 |
| `EMAIL_DUPLICATED` | 409 | 이메일 중복 |
| `NICKNAME_DUPLICATED` | 409 | 닉네임 중복 |
| `ALREADY_LIKED` | 409 | 이미 좋아요 누름 |
| `ALREADY_APPLIED` | 409 | 이미 동반산책 신청함 |
| `REVIEW_ALREADY_EXISTS` | 409 | 이미 산책로 리뷰 작성함 |
| `WALK_ALREADY_IN_PROGRESS` | 409 | 진행 중인 산책 있음 |
| `DAILY_QUOTA_EXCEEDED` | 429 | OpenAI 일일 한도 초과 |
| `WEATHER_API_ERROR` | 503 | 기상청 API 오류 |
| `AIRQUALITY_API_ERROR` | 503 | 에어코리아 API 오류 |
| `AI_SERVER_ERROR` | 503 | AI 서버 오류 |
| `OPENAI_API_ERROR` | 503 | OpenAI API 오류 |

---

## 🆕 v2.0 → v3.0 변경 사항

### 신규 추가 (38개 엔드포인트)
- 인증 2개 추가: `/refresh`, `/me`
- 회원 1개 추가: `DELETE /me` (탈퇴)
- 견종 마스터 2개 신규
- 산책 점수 2개 (기존 1개 → 2개)
- 산책 기록 3개 추가: 상세, GPS 좌표 기록, 캘린더
- 산책로 3개 추가: 등록, 리뷰 목록, 리뷰 작성
- 게시판 3개 추가: 댓글 수정/삭제, 카테고리 + 서브태그
- 좋아요 2개 신규
- 동반 산책 4개 신규
- 배지/업적 4개 신규
- 미션 3개 신규
- 알림 3개 신규
- AI Q&A 2개 신규 (Phase 2)
- 견주 유형 1개 신규
- 랭킹 2개 신규

### 응답 포맷 통일
- 모든 응답을 `{ success, data, message }` 표준으로 통일
- 에러 응답도 `{ success: false, data: null, message, errorCode }` 표준

### 서브태그 시스템 추가 (schema v1.3)
- `GET /api/categories` 응답에 sub_tags 포함
- `POST /api/posts` Request에 subTag 필드 추가
- `GET /api/posts` Query에 subTag 필터 추가
- `INVALID_SUB_TAG` 에러 코드 추가

---

## 🔗 관련 문서

- 시스템 흐름: [04. 시스템 아키텍처](./04-architecture.md)
- 데이터 모델: [05. 데이터베이스 설계](./05-database.md)
- 위험도 룰: [08. 산책 위험도 룰베이스](./08-risk-rules.md)
- 외부 API: [09. 외부 API 사용 가이드](./09-external-apis.md)
- 코딩 가이드: [10. 백엔드 코딩 가이드](./10-backend-coding-guide.md)

---

## 📌 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
| --- | --- | --- | --- |
| v1.0 | 2026-05-19 | 초안 (22개 엔드포인트, MVP 중심) | 팀 공통 |
| v2.0 | 2026-05-19 | 60개로 확장, 전체 기능 매핑 (노션 산출물) | 연수 |
| v3.0 | 2026-05-20 | docs/06 공식 통합 (60개 + 표준 응답 포맷 + 서브태그 시스템) | 연수 |
| v3.1 | 2026-05-20 | RT를 HttpOnly 쿠키로 / Phase 컬럼 / `/api/auth/me` 삭제(→`/users/me`, 59개) / activityLevel 한글 ENUM / refresh_tokens·role (schema v1.4) | 연수 |
