# 06. API 명세서

본 서비스의 REST API 명세입니다.

- **Base URL**: `http://localhost:8081` (개발), `https://api.dogwalk.com` (운영, 예정)
- **인증**: JWT (Access Token: Authorization 헤더 / Refresh Token: HttpOnly 쿠키)
- **Content-Type**: `application/json`
- **응답 포맷**: 공통 응답 구조 사용
- **버전**: v3.8 (2026-06-15, 64개 엔드포인트, schema v1.7 매핑)

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
| 201 | Created | 생성 성공 (회원가입·반려견 등록·글 작성) |
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

## 📋 API 목록 (총 64개)

| 카테고리 | 개수 | Phase | 관련 테이블 |
| --- | --- | --- | --- |
| 인증 | 4 | MVP | users, refresh_tokens |
| 회원 | 4 | MVP | users |
| 반려견 | 5 | MVP | dogs |
| 견종 | 2 | MVP | dog_breeds |
| 산책 점수 | 2 | MVP(1) + Phase 3(1) | walk_scores, weather_snapshots |
| 산책 기록 | 7 | MVP(6) + Phase 3(1) | walks, walk_locations |
| 산책로 | 5 | Phase 2 | walk_routes, walk_route_reviews |
| 게시판 | 11 | MVP | posts, comments, categories, post_images |
| 좋아요 | 1 | MVP | post_likes |
| 내 활동 | 3 | MVP | posts, comments, post_likes |
| 동반 산책 | 4 | Phase 2 | walking_companions |
| 배지/업적 | 4 | Phase 2 | badges, achievements |
| 미션 | 3 | Phase 2 | daily_missions, walk_missions |
| 알림 | 3 | MVP | notifications |
| AI Q&A | 2 | Phase 2 | qna_history |
| 견주 유형 | 1 | Phase 2 | user_walk_stats |
| 랭킹 | 2 | Phase 2 | user_walk_stats |
| 업로드 | 1 | MVP | - (로컬 디스크) |
| **합계** | **64** | MVP 41 / Phase 2 21 / Phase 3 2 | - |

---

### 🔐 Auth (인증) - 4개

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | 회원가입 | ❌ |
| POST | `/api/auth/login` | 로그인 (RT는 Set-Cookie) | ❌ |
| POST | `/api/auth/logout` | 로그아웃 (쿠키 만료 + DB RT 삭제) | ✅ |
| POST | `/api/auth/refresh` | 액세스 토큰 갱신 (쿠키 RT 사용) | ❌ (쿠키 필요) |

> 내 정보 조회는 `GET /api/users/me` 사용 (v3.1에서 `/api/auth/me` 삭제, 회원 영역과 통합)

### 👤 User (회원) - 4개

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/users/me` | 내 정보 조회 | ✅ |
| PATCH | `/api/users/me` | 내 정보 수정 | ✅ |
| PATCH | `/api/users/me/password` | 비밀번호 변경 (현재 비번 검증) — v3.6 신규 | ✅ |
| DELETE | `/api/users/me` | 회원 탈퇴 (soft delete, **현재 비번 검증** — v3.6) | ✅ |

> 상세 계약은 아래 [user 보안 2종](#-user-보안-2종--v36-비밀번호-변경--탈퇴-비번-검증) 참고.

### 🗂 My Activity (내 활동) - 3개 (v3.2 신규, 마이페이지용)

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/users/me/posts` | 내가 작성한 게시글 목록 | ✅ |
| GET | `/api/users/me/comments` | 내가 작성한 댓글 목록 | ✅ |
| GET | `/api/users/me/likes` | 내가 좋아요한 게시글 목록 | ✅ |

> - **개수 전용 API 없음**: 마이페이지 카운트는 각 목록 응답의 `totalElements` 사용 (`size=1`로 호출해 숫자만 읽기).
> - **구현 선행 조건**: comments·post_likes 엔티티 (댓글·좋아요 BE 후속 PR). 그 PR 머지 후 "내 활동 3종"을 한 PR로 구현 (담당: 윤소윤).
> - 상세 계약은 아래 [내 활동 조회 (마이페이지)](#-내-활동-조회-마이페이지) 참고.

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

### 💬 Community (게시판) - 11개

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
| POST | `/api/posts/{postId}/images` | 게시글 이미지 추가 (작성자 본인, v3.8) | ✅ |

### ❤️ Post Likes (좋아요) - 1개 (v3.5: 단일 POST 토글로 확정)

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/api/posts/{postId}/likes` | 좋아요 토글 (있으면 취소, 없으면 추가) | ✅ |

> v3.5 (#89 구현 확정): DELETE 엔드포인트 폐기 — 서버가 토글 판단. 본인 좋아요 여부는 글 목록·상세 응답의 `liked` 필드로 제공.

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

### 📷 Upload (이미지 업로드) - 1개 (v3.7 신규)

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/api/uploads` | 이미지 업로드 (유저·반려견·게시글 공용) | ✅ |

> 상세 계약은 아래 [이미지 업로드](#-이미지-업로드--v37) 참고.

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
  "nickname": "댕댕이맘",
  "guardianLevel": "JUNIOR"
}
```

**Validation**
- email: 이메일 형식, 필수
- password: 8자 이상, 영문+숫자 포함, 필수
- nickname: 2~20자, 필수
- guardianLevel: **선택** (v3.4) — `BEGINNER`/`JUNIOR`/`SENIOR`/`VETERAN` 중 하나 또는 생략(null). 그 외 값은 400 `INVALID_INPUT`. 아래 [보호자 연차](#-보호자-연차-guardian-level--v34) 참고.

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

### 🎖 보호자 연차 (guardian level) — v3.4

> 커뮤니티 **닉네임 옆 연차 뱃지**용. 고연차 견주가 저연차 글에 맞춤 답변하도록 유도(커뮤니티 질↑).
> **자기신고 선택형** — 가입일 기반 자동계산 금지(베테랑이 오늘 가입할 수 있음. 2026-06-10 PM·FE 협의 결정).
> ⚠️ Phase 2 "견주 유형"의 라이트버전 — **뱃지 하나로 한정**(성격유형·레벨·포인트로 확장 금지).

**등급 밴드** (`users.guardian_level VARCHAR(20)`, schema v1.7)

| 값 | 표시(안) | 기준 (자기신고) |
| --- | --- | --- |
| `BEGINNER` | 입문 견주 | 반려 경험 1년 미만 |
| `JUNIOR` | 주니어 견주 | 1~3년 |
| `SENIOR` | 시니어 견주 | 3~7년 |
| `VETERAN` | 베테랑 견주 | 7년 이상 |
| (null) | 뱃지 미표시 | 미설정 |

**API 반영 (구현 순서대로)**

1. **user BE**: `POST /api/auth/signup` request `guardianLevel`(선택) / `GET·PATCH /api/users/me` 응답·수정에 `guardianLevel` 포함 (PATCH 로 변경 가능 — 마이페이지 셀렉트)
2. **community BE**: 작성자가 노출되는 모든 응답 DTO 에 **`authorLevel`**(string|null) 추가 — `PostSummaryResponse`(목록)·`PostResponse`(상세)·`CommentResponse`(댓글, replies 포함). 값 = 작성자의 `guardian_level` 그대로(BEGINNER 등), null 이면 FE 가 뱃지 생략
3. **FE**: 가입/마이페이지 셀렉트(미선택 허용) + 닉네임 옆 뱃지 렌더 (표시 문구는 FE 재량)

---

### 🔒 user 보안 2종 — v3.6 (비밀번호 변경 + 탈퇴 비번 검증)

> 마이페이지 #91 후속. 두 기능 모두 **"현재 비밀번호 검증"** 동일 로직 사용 → **한 PR 구현 권장** (담당: 윤소윤).
> 불일치 시 공통 에러: **400 `PASSWORD_MISMATCH`** (로그인용 `INVALID_CREDENTIALS` 401과 분리 — 이미 인증된 사용자의 입력 오류).

#### 비밀번호 변경

```
PATCH /api/users/me/password
Authorization: Bearer {token}

{ "currentPassword": "old1234!", "newPassword": "new1234!" }
```

- **Validation**: newPassword 정책 = 가입과 동일(8자 이상, 영문+숫자). currentPassword 불일치 → 400 `PASSWORD_MISMATCH`. newPassword 가 현재와 동일 → 400 `INVALID_INPUT`.
- **Response 200**: `data: null`, message "비밀번호가 변경되었습니다".
- **세션 처리**: 변경 성공 시 **해당 사용자의 RT 삭제**(refresh_tokens). 현재 AT 는 만료까지 유효 → FE 는 변경 직후 그대로 사용 가능, AT 만료 시점에 재로그인.
- ⚠️ FE(#91)가 임시로 `PATCH /users/password` 를 호출 중 → **`/users/me/password` 로 수정 필요** (BE 머지 후 `isApiReady` 활성화와 함께).

#### 회원 탈퇴 — 비번 검증 추가 (기존 API 변경)

```
DELETE /api/users/me
Authorization: Bearer {token}

{ "password": "current1234!" }
```

- **변경점(v3.6)**: body 에 `password` 필수. 불일치 → 400 `PASSWORD_MISMATCH` (탈퇴 안 됨).
- 검증 통과 시 기존과 동일: soft delete + RT 삭제, 204.
- FE 참고: axios 는 `apiClient.delete(url, { data: { password } })` 형태로 body 전송.
- 탈퇴 사유는 **서버 미저장** (2026-06-12 PM 확정 — 데모 프로젝트 스코프, FE 사유 선택 UI 는 UX 시연용으로 유지).

---

### 📷 이미지 업로드 — v3.7

> **배경**: 현재 FE 의 모든 사진(유저·반려견·게시글)이 `URL.createObjectURL`(blob:) — 브라우저 메모리 임시주소라
> 새로고침 시 소멸·타인에게 안 보임. 진짜 저장 = 업로드 엔드포인트 1개 → URL 반환 → DB 엔 URL 저장.
> (2026-06-10 결정, 담당 오연수 / Week 5)

```
POST /api/uploads
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: (binary)
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/2026/06/a1b2c3d4-....jpg"
  },
  "message": "업로드 완료"
}
```

**규칙**
- multipart 필드명 **`file`** 고정. 1회 1파일 (게시글 다중 이미지는 FE 가 반복 호출, 최대 5장은 FE 검증).
- **허용: jpg/jpeg/png, 최대 5MB** — 위반 시 400 `INVALID_FILE`.
- 저장: **로컬 디스크** + Spring 정적 서빙(ResourceHandler) — 저장 경로·파일명 정책(UUID 권장)은 BE 재량.
  운영 전환 시 S3 교체 가능하도록 URL 만 계약으로 고정.
- 반환 `url` 사용처: `users.profile_image_url` / `dogs.profile_image_url` / 게시글 `imageUrls` — **FE 는 blob: 대신 이 URL 을 DB 저장 필드에 사용** (별도 FE 배선 작업).
- 확장자 위장 방지를 위해 content-type 검증 권장(선택).

**Error**
- 400: 파일 형식/크기 위반 (`INVALID_FILE`)
- 401: 인증 필요

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
    ],
    "weather": {
      "temperature": 24.0,
      "groundTemperature": 30.0,
      "humidity": 65.0,
      "feelsLikeTemperature": 25.0,
      "windSpeed": 3.0,
      "uvIndex": 5,
      "pm10": 35,
      "pm25": 18,
      "measuredAt": "2026-06-16T09:00:00"
    }
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
| weather | object | **점수 산출에 실제 사용된 날씨 스냅샷 실측값** (FE 홈 카드 날씨 줄). 폴백 시 baseline 값. 아래 표 참조 |

**`weather` 블록** (숫자 원본 — 등급 라벨 변환은 FE 표현 영역)

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| temperature | number | 기온(℃) |
| groundTemperature | number\|null | 지면온도(℃). KMA 허브 미연동 시 null 가능 |
| humidity | number | 습도(%) |
| feelsLikeTemperature | number | 체감온도(℃) |
| windSpeed | number | 풍속(m/s) — FE: 약함/보통/강함 변환 |
| uvIndex | int\|null | 자외선 지수 — FE: 낮음/보통/높음 변환 |
| pm10 | int\|null | 미세먼지(㎍/㎥) — FE: 좋음/보통/나쁨 변환 |
| pm25 | int\|null | 초미세먼지(㎍/㎥) |
| measuredAt | datetime | 스냅샷 기준 시각(신선도/폴백 판단용) |

> 🌤️ 하늘상태(sky/맑음·흐림·비) 코드는 현재 스냅샷에 없어 `weather` 블록에서 제외. 날씨 아이콘은 FE 기본값 유지(단기예보 SKY/PTY 수집 복구 시 추가 예정).

**Error**
- 404: 반려견 없음 (`DOG_NOT_FOUND`)
- 503: AI(룰베이스) 서버 호출 실패 (`AI_SERVER_ERROR`)

> ⚙️ **날씨 폴백 (데모 보장, 2026-06-16)**: 스냅샷이 없거나(키 없음/수집 실패) 오래돼도 **`WEATHER_API_ERROR(503)` 를 던지지 않는다.** 스냅샷이 0건이면 부산 baseline 폴백을 시드하고, 직전 스냅샷이 있으면 재사용해 **실제 룰로 계산된 점수**를 반환한다. 폴백 여부는 서버 로그(`[WalkScore]` 실데이터/폴백, `[WeatherSnapshot]`/`[WeatherSeed]`)로 구분된다. 구현: `WalkScoreService.resolveWeatherSnapshot()` + `WeatherSnapshotSeeder`(앱 시작 시 보장).

> ✅ **`weather` 상세 블록 · `measuredAt`은 MVP 반영됨 (2026-06-17)** — 위 응답 참조.
> 🔮 **Phase 2/3 확장 (현재 미구현)**: `dogName` · `supplies`(준비물 추천) · 하늘상태(sky) 아이콘은 추후 추가. 최적 산책 시간은 별도 엔드포인트 **`GET /api/walk/optimal-time`(MVP, 위 계약 참조)**로 분리한다.

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
GET /api/walks/statistics?dogId=1&period=WEEK
Authorization: Bearer {token}
```

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| dogId | Long | ✅ | 집계 대상 반려견 (본인 소유) |
| period | String | ✅ | DAY / WEEK / MONTH (대소문자 무시) |

> **집계 기준 (캘린더 정렬, 기준일=오늘)**
> - `DAY` = 오늘 당일 / `WEEK` = 이번 주 월~일(ISO) / `MONTH` = 이번 달 1일~말일
> - `achievementRate` = (산책한 날 수 ÷ 구간 일수) × 100, 반올림. 예: 주간에 5일 산책 → 5/7 = 71%
> - `avgDuration` = totalMinutes ÷ totalWalks, 반올림. 산책 0회면 0
> - `dailyBreakdown` 은 구간의 **모든 날짜**를 담으며 산책 없는 날은 `minutes:0, count:0`
> - 미종료(진행 중) 산책은 시간/거리 0으로 계산
> - `previous` = **직전 동일 구간** 요약 (WEEK→지난주, MONTH→지난달, DAY→어제). FE "지난주 대비 변화" 델타용.
>   현재와 동일 지표(`totalWalks·totalMinutes·totalDistance·avgDuration·achievementRate`)를 담되 **`dailyBreakdown` 은 제외**.
>   기록 없는 직전 구간은 **모든 값 0**으로 안전 응답. (단일 호출로 현재+직전 수신 → FE가 추가 호출 없이 델타 계산)

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
    ],
    "previous": {
      "totalWalks": 3,
      "totalMinutes": 150,
      "totalDistance": 7.2,
      "avgDuration": 50,
      "achievementRate": 43
    }
  }
}
```

**Error**
- 400: `period` 가 DAY/WEEK/MONTH 가 아님 (`INVALID_INPUT`)
- 403: 본인 반려견 아님 (`NOT_YOUR_DOG`)
- 404: 반려견 없음 (`DOG_NOT_FOUND`)

---

### 📅 산책 캘린더 (월별)

```
GET /api/walks/calendar?dogId=1&year=2026&month=6
Authorization: Bearer {token}
```

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| dogId | Long | ✅ | 조회 대상 반려견 (본인 소유) |
| year | Integer | ✅ | 연도 (예: 2026) |
| month | Integer | ✅ | 월 (1~12) |

> `days` 는 해당 월에서 **산책이 1회 이상 있는 날짜만** 담는 희소 배열이다 (FE 히트맵 입력).
> 산책이 없는 날짜는 응답에 없으며 FE 에서 0으로 채운다.

**Response 200**
```json
{
  "success": true,
  "data": {
    "year": 2026,
    "month": 6,
    "days": [
      {"date": "2026-06-03", "count": 2, "minutes": 50},
      {"date": "2026-06-10", "count": 1, "minutes": 60}
    ]
  }
}
```

**Error**
- 400: `year`/`month` 가 유효한 날짜 범위 아님 (`INVALID_INPUT`)
- 403: 본인 반려견 아님 (`NOT_YOUR_DOG`)
- 404: 반려견 없음 (`DOG_NOT_FOUND`)

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
| size | Integer | ❌ | 페이지 크기 (기본 10, #123) |
| sort | String | ❌ | `latest`(기본, 최신순) / `popular`(좋아요순, 동점 시 최신순) |

> **정렬(#123):** `popular` 은 `likeCount DESC` + 동점 시 `createdAt DESC`(2차 키)로 페이지 경계 중복/누락을 방지한다. `sort` 미지정 시 `latest`(하위호환).

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

### 💬 댓글 목록 / 작성 (#84 구현 정본, 1단계 대댓글)

```
GET /api/posts/{postId}/comments        (비인증 허용 — 토큰 있으면 mine 계산)
```

**Response 200** — **트리 구조**(루트 댓글의 `replies[]` 안에 대댓글). 삭제(soft delete)된 댓글은 대댓글까지 함께 제외.
```json
{
  "success": true,
  "data": [
    {
      "commentId": 1,
      "userId": 2,
      "author": "말티즈러버",
      "content": "저희는 연어 사료 먹이는데 잘 맞아요!",
      "mine": false,
      "createdAt": "2026-06-11T12:47:00",
      "replies": [
        {
          "commentId": 2,
          "userId": 1,
          "author": "데모견주",
          "content": "오 감사합니다 :)",
          "mine": true,
          "createdAt": "2026-06-11T12:48:00",
          "replies": []
        }
      ]
    }
  ]
}
```

- `mine`: 로그인 토큰 기준 본인 댓글 여부 (비인증이면 전부 false). ※ FE 내부 표현은 flat+`isMine` → `useCommunity.js` 의 `flattenCommentTree` 가 정규화.

```
POST /api/posts/{postId}/comments
Authorization: Bearer {token}

{ "content": "댓글 내용", "parentCommentId": null }
```

- `parentCommentId`: null/생략 = 일반 댓글, 값 있으면 대댓글.
- **Response 200**: `data` = 생성된 commentId (숫자).
- **Validation**: content 1~1000자 필수. **1단계 제한** — 대댓글에 대댓글 불가(400 `INVALID_INPUT`). **부모는 같은 게시글의 댓글**이어야 함(400 `INVALID_INPUT`). 없는 부모 404 `COMMENT_NOT_FOUND`.
- 수정 `PATCH /api/comments/{commentId}` / 삭제 `DELETE /api/comments/{commentId}` (본인만, 아니면 403). **부모 삭제 시 대댓글도 함께 soft delete** + `commentCount` 정합 차감.

---

### ❤️ 게시글 좋아요 토글 (#89 구현 정본, v3.5)

```
POST /api/posts/{postId}/likes
Authorization: Bearer {token}
```

**단일 토글** — 좋아요가 없으면 추가, 이미 있으면 취소. (DELETE 엔드포인트 없음, v3.5에서 폐기)

**Response 200**
```json
{
  "success": true,
  "data": {
    "postId": 1,
    "likeCount": 24,
    "liked": true
  },
  "message": "좋아요 추가"
}
```

- `liked`: 토글 결과 상태 (true=추가됨, false=취소됨). FE 는 이 값으로 하트·카운트 갱신.
- **본인 좋아요 여부 조회**: 글 목록(`PostSummaryResponse`)·상세(`PostResponse`) 응답의 `liked` 필드 (비인증이면 false).
- 토글 방식이라 `ALREADY_LIKED`(409) 는 발생하지 않음. 동시 클릭 충돌은 서버가 liked=true 로 수렴.

**Error**
- 404: 글 없음 (`POST_NOT_FOUND`)

---

### 📷 게시글 이미지 (#105 구현 정본, v3.8)

게시글에 이미지 URL 을 첨부한다. 실제 파일은 `POST /api/uploads`(v3.7)로 업로드해 받은 URL 을 저장하는 **URL-only** 방식. (반려견 프로필·공통 저장 구조는 추후 저장소 정책 확정 후 공통화)

#### 이미지 추가

```
POST /api/posts/{postId}/images
Authorization: Bearer {token}
```

**Request Body**

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| imageUrl | String | ✅ | 이미지 URL (최대 500자). 보통 `POST /api/uploads` 응답의 `url` |

```json
{ "imageUrl": "/uploads/2026/06/abc.png" }
```

**Response 200** — `data` = 생성된 이미지 id
```json
{
  "success": true,
  "data": 1,
  "message": null
}
```

**Error**
- 400: `imageUrl` 누락·500자 초과 (`INVALID_INPUT`)
- 401: 비인증 (`UNAUTHORIZED`)
- 403: 본인 글 아님 (`FORBIDDEN`)
- 404: 글 없음 (`POST_NOT_FOUND`)

#### 게시글 상세 응답에 이미지 포함

`GET /api/posts/{postId}` 응답(`PostResponse`)에 `images[]` 가 포함된다. 추가된 순서(`createdAt` 오름차순).

```json
"images": [
  { "imageId": 1, "imageUrl": "/uploads/2026/06/a.png" },
  { "imageId": 2, "imageUrl": "/uploads/2026/06/b.png" }
]
```

> 목록 응답(`PostSummaryResponse`)에는 **미포함** — 목록 N+1 회피. 이미지는 상세에서만 로드한다.

---

### 🗂 내 활동 조회 (마이페이지)

> 마이페이지 "내가 쓴 글 / 내가 쓴 댓글 / 좋아요한 글" 카운트 + 목록.
> 카운트는 별도 API 없이 목록 응답의 `totalElements` 를 쓴다 (`size=1` 호출).
> 목록 클릭 시 FE 는 `postId` 로 게시글 상세(`GET /api/posts/{postId}`)로 이동.

#### 내가 작성한 게시글

```
GET /api/users/me/posts?page=0&size=20
Authorization: Bearer {token}
```

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| page | Integer | ❌ | 페이지 번호 (기본 0) |
| size | Integer | ❌ | 페이지 크기 (기본 20) |

**Response 200** — `GET /api/posts` 목록과 **동일 DTO**(PostSummaryResponse) 재사용, 최신순 고정.
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "postId": 50,
        "category": "사료·간식",
        "subTag": "사료",
        "title": "포메라니안 사료 추천 좀 해주세요",
        "author": "댕댕이맘",
        "commentCount": 3,
        "likeCount": 5,
        "viewCount": 12,
        "thumbnailUrl": "https://...",
        "createdAt": "2026-06-11T16:00:00"
      }
    ],
    "totalElements": 7,
    "totalPages": 1
  }
}
```

#### 내가 작성한 댓글

```
GET /api/users/me/comments?page=0&size=20
Authorization: Bearer {token}
```

**Response 200** — 어떤 글의 댓글인지 이동할 수 있도록 `postId`·`postTitle` 포함, 최신순 고정.
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "commentId": 12,
        "postId": 50,
        "postTitle": "포메라니안 사료 추천 좀 해주세요",
        "content": "저희 집은 ○○ 사료 먹여요!",
        "createdAt": "2026-06-11T17:00:00"
      }
    ],
    "totalElements": 3,
    "totalPages": 1
  }
}
```

- 원글이 삭제된 댓글은 목록에서 **제외** (FE 에서 죽은 링크 방지).

#### 내가 좋아요한 게시글

```
GET /api/users/me/likes?page=0&size=20
Authorization: Bearer {token}
```

**Response 200** — `/api/users/me/posts` 와 동일 DTO(PostSummaryResponse), **좋아요 누른 시각 최신순**.

- 좋아요 이후 원글이 삭제되면 목록에서 제외.

#### 공통

- 3개 모두 **인증 필수** (`UNAUTHORIZED` 401). 본인 데이터만 조회되므로 별도 권한 에러 없음.
- **구현 선행 조건**: comments·post_likes 엔티티(댓글·좋아요 BE 후속 PR). `me/posts` 는 Post 만으로 가능하지만, 후속 PR 머지 뒤 **3종을 한 PR**로 묶어 구현한다 (담당: 윤소윤, 2026-06-11 PM 결정).
- FE(정선혜)는 BE 전까지 mock 으로 UI 선행 가능 (커뮤니티 실연동과 동일한 플래그 전환 패턴).

---

### 🔔 알림 목록

```
GET /api/notifications?type=LIKE&unreadOnly=true&page=0&size=20
Authorization: Bearer {token}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "notificationId": 12,
        "type": "COMMENT",
        "title": "새 댓글",
        "content": "댓글러님이 회원님의 글에 댓글을 남겼습니다.",
        "linkUrl": "/posts/5",
        "isRead": false,
        "createdAt": "2026-06-17T18:30:00",
        "actor": { "id": 3, "nickname": "댓글러", "profileImageUrl": "https://.../u3.jpg" },
        "post": { "id": 5, "title": "해운대 야간 산책 코스 공유" },
        "comment": { "id": 9, "content": "좋은 글이네요" },
        "actorCount": 1
      },
      {
        "notificationId": 11,
        "type": "LIKE",
        "title": "새 좋아요",
        "content": "박지민님이 회원님의 글을 좋아합니다.",
        "linkUrl": "/posts/5",
        "isRead": false,
        "createdAt": "2026-06-17T18:25:00",
        "actor": { "id": 7, "nickname": "박지민", "profileImageUrl": "https://.../u7.jpg" },
        "post": { "id": 5, "title": "해운대 야간 산책 코스 공유" },
        "comment": null,
        "actorCount": 3
      }
    ],
    "unreadCount": 5
  }
}
```

> **MVP 구현 범위 (Week5, v3.8 컨텍스트 보강)**
> - `type`: `COMMENT`(내 글에 댓글) / `LIKE`(내 글에 좋아요). 그 외(BADGE_EARNED·COMPANION_REQUEST)는 Phase 2.
> - **생성 트리거**: 댓글 작성·좋아요 등록 시 글 작성자에게 1건 생성. **자기 글에 자기가 단 댓글/좋아요는 생성 안 함.** 같은 트랜잭션이라 원 행위 롤백 시 알림도 롤백.
> - `linkUrl` = `/posts/{postId}` (FE 가 클릭 시 이동).
> - **컨텍스트(조회 시 조인)**: `actor`(반응한 사용자 — `id`·`nickname`·`profileImageUrl`) / `post`(게시글 — `id`·현재 `title`) / `comment`(댓글 — `id`·`content`, COMMENT 타입만, 그 외 `null`). 모두 조회 시점 최신값이며, 원본이 삭제됐으면 해당 객체는 `null`.
> - **좋아요 집계**: 같은 게시글의 LIKE 알림은 **게시글 기준으로 묶여 대표 1건**만 내려간다. `actor` = 가장 최근 반응자, `actorCount` = 그 글에 좋아요를 누른 총 인원. FE 표기 예: `"{actor.nickname}님 외 {actorCount-1}명"`. COMMENT·단건은 `actorCount=1`. (묶음은 한 페이지 안에서 적용 — `unreadCount` 벨 뱃지는 묶음과 무관한 안 읽은 행 수.)
> - **정렬**: 안 읽은 것 우선 → 최신순. `unreadOnly=true` 면 안 읽은 것만.
> - **카테고리 탭 필터**: `type=LIKE`/`type=COMMENT` 면 해당 타입만. `type` 생략·빈값·`type=ALL` 은 전체. 필터링은 **서버에서** 처리하므로 페이지네이션도 타입별로 적용된다(프론트에서 전체를 받아 거르지 않아도 됨). 잘못된 값은 400 `INVALID_INPUT`.
> - **읽음 처리**: `PATCH /api/notifications/{id}/read`(단건) / `PATCH /api/notifications/read-all`(전체). 본인 알림 아니면 404 `NOTIFICATION_NOT_FOUND`.
> - 쿼리 파라미터: `type`(기본 전체)·`unreadOnly`(기본 false)·`page`(기본 0)·`size`(기본 20).
> - `unreadCount` 는 `type`·`unreadOnly` 와 무관하게 **전체** 안 읽은 알림 수(벨 뱃지용)다.

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
| `NOTIFICATION_NOT_FOUND` | 404 | 알림 없음 (또는 본인 알림 아님) |
| `PASSWORD_MISMATCH` | 400 | 현재 비밀번호 불일치 (비번 변경·탈퇴, v3.6) |
| `INVALID_FILE` | 400 | 업로드 파일 형식/크기 위반 (jpg·png, 5MB — v3.7) |
| `EMAIL_DUPLICATED` | 409 | 이메일 중복 |
| `NICKNAME_DUPLICATED` | 409 | 닉네임 중복 |
| `ALREADY_LIKED` | 409 | (v3.5 미사용 — 좋아요가 토글 방식으로 변경됨) |
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
| v3.2 | 2026-06-11 | 내 활동 3개 추가(`/users/me/posts`·`/comments`·`/likes`, 62개) — 마이페이지 카운트·목록. 카운트=totalElements, 댓글·좋아요 BE 후속 PR 뒤 한 PR 구현 | 재영 |
| v3.3 | 2026-06-11 | 댓글 응답 정본 등재(#84 구현 반영) — 트리 구조(`replies[]`)+`mine`, 1단계 제한·같은 글 부모 검증·부모 삭제 cascade | 재영 |
| v3.4 | 2026-06-11 | 보호자 연차(guardian level) 추가 — signup `guardianLevel`(선택)·`users/me` 노출/수정·커뮤니티 작성자 `authorLevel`(후속) / 등급 BEGINNER·JUNIOR·SENIOR·VETERAN, 자기신고(자동계산 금지) (schema v1.7) | 재영 |
| v3.5 | 2026-06-11 | 좋아요 = 단일 POST 토글 확정(#89 구현 반영, DELETE 폐기, 62→61개) — 응답 `LikeResponse{postId,likeCount,liked}`, 목록·상세에 `liked` 필드, ALREADY_LIKED 미사용 | 재영 |
| v3.6 | 2026-06-12 | user 보안 2종(#91 후속, 61→62개) — `PATCH /users/me/password`(현재 비번 검증, RT 삭제) 신규 + `DELETE /users/me` body `password` 필수화 / 에러 `PASSWORD_MISMATCH`(400) / 탈퇴 사유 서버 미저장 확정 | 재영 |
| v3.7 | 2026-06-12 | 이미지 업로드 `POST /api/uploads` 신규(62→63개) — multipart 1파일, jpg·png 5MB, 로컬디스크+정적서빙, URL 반환(blob: 비영속 문제 해결) / 에러 `INVALID_FILE`(400) | 재영 |
| v3.8 | 2026-06-15 | 게시글 이미지 `POST /api/posts/{postId}/images` 신규(63→64개) — URL-only(업로드 URL 저장), 작성자 본인만(403), 상세 응답 `images[]` 포함(목록 미포함=N+1 회피), `post_images` 엔티티 (#105 구현 정본) | 재영 |
