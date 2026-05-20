# 06. API 명세서

본 서비스의 REST API 명세입니다.

- **Base URL**: `http://localhost:8081` (개발), `https://api.dogwalk.com` (운영, 예정)
- **인증**: JWT (Access Token은 Authorization 헤더, Refresh Token은 HttpOnly 쿠키)
- **Content-Type**: `application/json`
- **응답 포맷**: 공통 응답 구조 사용 (`{ success, data, message }`)
- **버전**: v3.2 (2026-05-20, 5/22 회의 피드백 + 후속 피드백 2가지 반영)

---

## 🔐 인증 정책

| 항목 | 결정 |
| --- | --- |
| AT (Access Token) 저장 | 프론트 메모리 → `Authorization: Bearer` 헤더로 전송 |
| RT (Refresh Token) 저장 | **HttpOnly + Secure + SameSite=Lax 쿠키** (Path=/api/auth, Max-Age=14d) |
| AT 만료 시 | 첫 로드 시 `POST /api/auth/refresh` 호출하여 복구 (쿠키 자동 전송) |
| 재발급 | `POST /api/auth/refresh` (Request Body 없음, 쿠키 RT를 서버가 읽음) |
| 로그아웃 | DB의 RT 삭제 + 쿠키 만료(Max-Age=0) |
| 서버 저장 | `refresh_tokens` 테이블 (user_id, token_hash, expires_at, created_at) - 단일 세션 |
| 로테이션 | 미적용 (MVP) |
| dev 환경 | Vite `/api` → `:8081` 프록시 + axios `withCredentials: true` |

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

| 코드 | 의미 |
| --- | --- |
| 200 | OK - 성공 |
| 201 | Created - 생성 성공 |
| 204 | No Content - 성공 (응답 본문 없음) |
| 400 | Bad Request - 잘못된 요청 |
| 401 | Unauthorized - 인증 실패 |
| 403 | Forbidden - 권한 없음 |
| 404 | Not Found - 리소스 없음 |
| 409 | Conflict - 중복 등 |
| 500 | Internal Server Error - 서버 오류 |

---

## 📋 API 목록

### 🔐 Auth (인증)

| 메서드 | URL | 설명 | Phase | 인증 |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/signup` | 회원가입 | MVP | ❌ |
| POST | `/api/auth/login` | 로그인 (RT는 Set-Cookie로 전달) | MVP | ❌ |
| POST | `/api/auth/logout` | 로그아웃 (쿠키 만료 + DB RT 삭제) | MVP | ✅ |
| POST | `/api/auth/refresh` | 액세스 토큰 갱신 (쿠키 RT 사용, 바디 없음) | MVP | ❌ (쿠키 필요) |

### 👤 User (회원)

| 메서드 | URL | 설명 | Phase | 인증 |
| --- | --- | --- | --- | --- |
| GET | `/api/users/me` | 내 정보 조회 | MVP | ✅ |
| PATCH | `/api/users/me` | 내 정보 수정 | MVP | ✅ |
| DELETE | `/api/users/me` | 회원 탈퇴 (soft delete) | MVP | ✅ |

### 🐕 Dog (반려견)

| 메서드 | URL | 설명 | Phase | 인증 |
| --- | --- | --- | --- | --- |
| POST | `/api/dogs` | 반려견 등록 | MVP | ✅ |
| GET | `/api/dogs` | 내 반려견 목록 | MVP | ✅ |
| GET | `/api/dogs/{dogId}` | 반려견 상세 | MVP | ✅ |
| PATCH | `/api/dogs/{dogId}` | 반려견 수정 | MVP | ✅ |
| DELETE | `/api/dogs/{dogId}` | 반려견 삭제 | MVP | ✅ |

### 🌤️ Walk Risk (산책 위험도)

| 메서드 | URL | 설명 | Phase | 인증 |
| --- | --- | --- | --- | --- |
| GET | `/api/walk/risk-score` | 산책 위험도 조회 | MVP | ✅ |

### 🚶 Walk (산책 기록)

| 메서드 | URL | 설명 | Phase | 인증 |
| --- | --- | --- | --- | --- |
| POST | `/api/walks/start` | 산책 시작 | MVP | ✅ |
| POST | `/api/walks/{walkId}/end` | 산책 종료 + 피드백 | MVP | ✅ |
| GET | `/api/walks` | 산책 기록 목록 | MVP | ✅ |
| GET | `/api/walks/stats` | 산책 통계 | MVP | ✅ |

### 💬 Community (커뮤니티)

| 메서드 | URL | 설명 | Phase | 인증 |
| --- | --- | --- | --- | --- |
| GET | `/api/categories` | 카테고리 + 서브태그 목록 | MVP | ❌ |
| POST | `/api/posts` | 글 작성 | MVP | ✅ |
| GET | `/api/posts` | 글 목록 (카테고리·서브태그 필터) | MVP | ❌ |
| GET | `/api/posts/{postId}` | 글 상세 | MVP | ❌ |
| PATCH | `/api/posts/{postId}` | 글 수정 | MVP | ✅ |
| DELETE | `/api/posts/{postId}` | 글 삭제 | MVP | ✅ |
| POST | `/api/posts/{postId}/likes` | 좋아요 토글 | MVP | ✅ |
| POST | `/api/posts/{postId}/comments` | 댓글 작성 | MVP | ✅ |
| GET | `/api/posts/{postId}/comments` | 댓글 목록 | MVP | ❌ |

> 💡 동반산책·미션·배지·랭킹·AI Q&A·견주유형·산책로 5개 등 Phase 2 기능, GPS 좌표 기록·optimal-time 등 Phase 3 기능은 본 명세서 범위 밖이며, MVP 완료 후 별도 명세서로 정의됩니다.

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
- 400: 유효성 검증 실패
- 409: 이메일 중복 (`EMAIL_DUPLICATED`)

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

응답 헤더:
```
Set-Cookie: refreshToken=eyJhbGc...; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=1209600
```

응답 바디 (refreshToken 필드 없음 — 쿠키로 전달됨):
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

**Error**
- 401: 이메일 또는 비밀번호 불일치 (`INVALID_CREDENTIALS`)

**서버 동작**
1. 사용자 검증 (이메일 + BCrypt 비밀번호 확인)
2. Access Token 생성 (1시간 만료)
3. Refresh Token 생성 (14일 만료) + `refresh_tokens` 테이블에 token_hash 저장
4. Set-Cookie 헤더로 Refresh Token 전달 (HttpOnly = JS 접근 불가, XSS 방어)
5. 응답 바디로 Access Token + 사용자 정보 반환

---

### 🔐 토큰 재발급

```
POST /api/auth/refresh
```

**Request Headers**
```
Cookie: refreshToken=eyJhbGc... (브라우저가 자동 전송)
```

**Request Body**: 없음

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

**Error**
- 401: 쿠키에 RT 없음 또는 만료 (`EXPIRED_TOKEN`)
- 401: DB의 refresh_tokens에 일치하는 토큰 없음 (`INVALID_TOKEN`)

**서버 동작**
1. 쿠키에서 Refresh Token 읽기
2. JWT 서명 검증 + 만료 확인
3. DB `refresh_tokens` 테이블에서 token_hash 일치 확인
4. 새 Access Token 발급 (1시간 만료)
5. (로테이션 미적용 - MVP) Refresh Token은 갱신하지 않음

---

### 🔐 로그아웃

```
POST /api/auth/logout
Authorization: Bearer {accessToken}
Cookie: refreshToken=...
```

**Request Body**: 없음

**Response 200**

응답 헤더:
```
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=0
```

응답 바디:
```json
{
  "success": true,
  "data": null,
  "message": "로그아웃되었습니다"
}
```

**서버 동작**
1. 쿠키의 Refresh Token으로 `refresh_tokens` 테이블에서 해당 row 삭제
2. Set-Cookie로 쿠키 만료 (Max-Age=0)

---

### 👤 회원 탈퇴 ⭐ v3.2에서 신규 명세 (DELETE /api/users/me로 통일)

```
DELETE /api/users/me
Authorization: Bearer {accessToken}
```

**Request Body**: 없음

**Response 204** (No Content)

**서버 동작**
1. soft delete: `users.deleted_at`에 현재 시각 기록 (30일 후 완전 삭제 배치)
2. 연쇄 처리:
   - `dogs`, `walks`: ON DELETE CASCADE (반려견·산책 기록 함께 정리)
   - `posts`, `comments`: ON DELETE SET NULL (작성자만 익명화, 글/댓글은 보존)
3. `refresh_tokens` 테이블의 해당 user_id row 삭제
4. Set-Cookie로 쿠키 만료 (Max-Age=0)

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
  "breed": "포메라니안",
  "birthDate": "2022-03-15",
  "weight": 3.2,
  "coatType": "LONG",
  "activityLevel": "중",
  "healthNote": "슬개골 탈구 1기",
  "preferredWalkTime": "EVENING"
}
```

**Validation**
- name: 1~30자, 필수
- breed: 필수
- weight: 0.1 ~ 100, 선택
- gender: M / F
- coatType: LONG / SHORT / MEDIUM
- **activityLevel: 저 / 중 / 고** ⭐ v3.2에서 한글로 변경 (스키마 한글 ENUM과 일치)

**Response 201**
```json
{
  "success": true,
  "data": {
    "dogId": 1,
    "name": "초코",
    "breed": "포메라니안",
    "age": 2,
    "weight": 3.2,
    "coatType": "LONG",
    "activityLevel": "중",
    "createdAt": "2026-05-19T15:30:00"
  }
}
```

---

### 🌤️ 산책 위험도 조회 ⭐ 핵심 API

```
GET /api/walk/risk-score?dogId=1&lat=37.5665&lng=126.9780
Authorization: Bearer {token}
```

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| dogId | Long | ✅ | 반려견 ID |
| lat | Double | ✅ | 위도 |
| lng | Double | ✅ | 경도 |

**Response 200**
```json
{
  "success": true,
  "data": {
    "dogId": 1,
    "dogName": "초코",
    "score": 72,
    "level": "CAUTION",
    "levelLabel": "주의",
    "reasons": [
      {
        "code": "HIGH_GROUND_TEMP",
        "message": "지면 온도가 높아 발바닥 화상 위험이 있어요"
      },
      {
        "code": "LONG_COAT_HEAT",
        "message": "장모종에게 다소 더운 날씨예요"
      }
    ],
    "recommendedTime": {
      "start": "18:00",
      "end": "20:00",
      "description": "오늘은 저녁 시간대가 산책하기 좋아요"
    },
    "weather": {
      "temperature": 29.5,
      "humidity": 65,
      "windSpeed": 2.3,
      "condition": "맑음",
      "pm10": 35,
      "pm25": 18
    },
    "supplies": ["물병", "쿨링매트"],
    "measuredAt": "2026-05-19T15:30:00"
  }
}
```

**Error**
- 404: 반려견 없음 (`DOG_NOT_FOUND`)
- 503: 외부 API 호출 실패 (`WEATHER_API_ERROR`)

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
    "startTime": "2026-05-19T18:00:00",
    "weatherSnapshot": {
      "temperature": 25.0,
      "condition": "맑음",
      "riskScore": 85
    }
  }
}
```

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
  "distanceKm": 2.5
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "walkId": 100,
    "startTime": "2026-05-19T18:00:00",
    "endTime": "2026-05-19T18:45:00",
    "durationMinutes": 45,
    "distanceKm": 2.5
  }
}
```

---

### 📊 산책 통계

```
GET /api/walks/stats?dogId=1&period=WEEK
Authorization: Bearer {token}
```

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| dogId | Long | ✅ | 반려견 ID |
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

### 💬 카테고리 목록 조회

```
GET /api/categories
```

게시판 카테고리 목록과 카테고리별 선택 가능한 서브태그를 반환합니다.

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "categoryId": 1,
      "name": "사료·간식",
      "subTags": ["사료", "간식"],
      "displayOrder": 1
    },
    {
      "categoryId": 2,
      "name": "병원·영양제",
      "subTags": ["병원", "영양제"],
      "displayOrder": 2
    },
    {
      "categoryId": 3,
      "name": "산책로 추천",
      "subTags": null,
      "displayOrder": 3
    },
    {
      "categoryId": 4,
      "name": "반려견 자랑",
      "subTags": null,
      "displayOrder": 4
    },
    {
      "categoryId": 5,
      "name": "산책 메이트 찾기",
      "subTags": null,
      "displayOrder": 5
    }
  ]
}
```

---

### 💬 글 작성

```
POST /api/posts
Authorization: Bearer {token}
```

**Request Body**
```json
{
  "categoryId": 1,
  "subTag": "사료",
  "title": "포메라니안 사료 추천 좀 해주세요",
  "content": "2살 포메라니안인데 사료 어떤 게 좋을까요?",
  "imageUrls": []
}
```

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| categoryId | Long | ✅ | 카테고리 ID (1~5) |
| subTag | String | 조건부 | 카테고리에 `subTags`가 있을 때 **필수**, 없을 때 NULL/생략 |
| title | String | ✅ | 제목 (최대 200자) |
| content | String | ❌ | 본문 |
| imageUrls | String[] | ❌ | 첨부 이미지 URL 배열 |

**Validation**
- `subTag`가 해당 카테고리의 `subTags` 목록에 포함되지 않으면 400 `INVALID_SUB_TAG`
- `subTags`가 NULL인 카테고리에 `subTag`를 보내도 400 `INVALID_SUB_TAG`

**Response 201**
```json
{
  "success": true,
  "data": {
    "postId": 50,
    "categoryId": 1,
    "subTag": "사료",
    "title": "포메라니안 사료 추천 좀 해주세요",
    "createdAt": "2026-05-19T16:00:00"
  }
}
```

---

### 💬 글 목록 조회

```
GET /api/posts?categoryId=1&subTag=사료&page=0&size=20
```

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| categoryId | Long | ❌ | 카테고리 ID 필터 |
| subTag | String | ❌ | 서브태그 필터 (URL 인코딩 필요. 예: `%EC%82%AC%EB%A3%8C`) |
| page | Integer | ❌ | 페이지 번호 (기본 0) |
| size | Integer | ❌ | 페이지 크기 (기본 20) |
| sort | String | ❌ | `latest`(기본) / `popular`(좋아요순) |

> 💡 `categoryId`만 주면 그 카테고리의 모든 글, `subTag`까지 주면 해당 서브태그만 필터링.

**Response 200**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "postId": 50,
        "categoryId": 1,
        "categoryName": "사료·간식",
        "subTag": "사료",
        "title": "포메라니안 사료 추천 좀 해주세요",
        "displayTitle": "[사료] 포메라니안 사료 추천 좀 해주세요",
        "author": "댕댕이맘",
        "commentCount": 3,
        "likeCount": 5,
        "viewCount": 12,
        "createdAt": "2026-05-19T16:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

> 💡 `displayTitle`은 프론트에서 `subTag`가 있으면 `[서브태그] 제목` 형식으로 표시하기 위한 서버 가공 필드. 프론트에서 직접 조립해도 OK.

---

### 💬 글 상세 조회

```
GET /api/posts/{postId}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "postId": 50,
    "categoryId": 1,
    "categoryName": "사료·간식",
    "subTag": "사료",
    "title": "포메라니안 사료 추천 좀 해주세요",
    "content": "2살 포메라니안인데 사료 어떤 게 좋을까요?",
    "imageUrls": [],
    "author": {
      "userId": 7,
      "nickname": "댕댕이맘",
      "profileImageUrl": null
    },
    "commentCount": 3,
    "likeCount": 5,
    "viewCount": 13,
    "isLikedByMe": false,
    "createdAt": "2026-05-19T16:00:00",
    "updatedAt": "2026-05-19T16:00:00"
  }
}
```

---

## ❌ 에러 코드 정의

| 코드 | HTTP | 설명 |
| --- | --- | --- |
| `INVALID_INPUT` | 400 | 입력값 검증 실패 |
| `INVALID_SUB_TAG` | 400 | 서브태그가 카테고리에 정의되지 않음 |
| `INVALID_CREDENTIALS` | 401 | 로그인 실패 |
| `UNAUTHORIZED` | 401 | 인증 필요 |
| `EXPIRED_TOKEN` | 401 | 토큰 만료 (재발급 필요) |
| `INVALID_TOKEN` | 401 | 유효하지 않은 토큰 (위조·DB 불일치 등) |
| `FORBIDDEN` | 403 | 권한 없음 |
| `USER_NOT_FOUND` | 404 | 사용자 없음 |
| `DOG_NOT_FOUND` | 404 | 반려견 없음 |
| `POST_NOT_FOUND` | 404 | 글 없음 |
| `CATEGORY_NOT_FOUND` | 404 | 카테고리 없음 |
| `EMAIL_DUPLICATED` | 409 | 이메일 중복 |
| `WEATHER_API_ERROR` | 503 | 외부 API 오류 |
| `AI_SERVER_ERROR` | 503 | AI 서버 오류 |

---

## ⚠️ 후속 작업 (스키마 v1.4)

본 API 명세서 v3.2를 지원하기 위해 schema v1.4에서 다음이 필요합니다.

```sql
-- refresh_tokens 테이블 (신규)
CREATE TABLE refresh_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_token (user_id, token_hash),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Refresh Token 관리';

-- users 테이블에 role 컬럼 추가
ALTER TABLE users 
ADD COLUMN role VARCHAR(20) DEFAULT 'USER' 
COMMENT 'USER / ADMIN';
```

→ **5/22 회의에서 schema v1.4 작업 담당자 결정 필요.**

---

## 🆕 변경 사항 누적 정리

### v3.1 → v3.2 (2026-05-20, 후속 피드백 반영)

1. **회원 영역 경로 통일**: 회원 탈퇴를 `DELETE /api/users/me`로 통일 (GET/PATCH/DELETE 일관성). 본 명세서(MVP 22개)에는 `/api/auth/me`가 없어 중복 정리 영향 없음.
2. **enum 한글 통일**: `activityLevel`을 `LOW/MEDIUM/HIGH` → **`저/중/고`**로 변경 (스키마의 한글 ENUM과 일치).

### v3.0 → v3.1 (5/22 회의 피드백 반영)

1. **인증 토큰 처리 변경 (RT를 HttpOnly 쿠키로)**
   - 로그인 응답 바디에서 `refreshToken` 필드 제거 → Set-Cookie 헤더로 전달
   - `POST /api/auth/refresh` 상세 명세 추가 (Request Body 없음, 쿠키 RT 사용)
   - `POST /api/auth/logout` 상세 명세 추가 (DB RT 삭제 + 쿠키 만료)
   - 서버 저장: `refresh_tokens` 테이블 (단일 세션)
   - 로테이션 미적용 (MVP), CSRF 대응: SameSite=Lax

2. **Phase 컬럼 추가**: 본 명세서의 모든 엔드포인트는 MVP. Phase 2/3 기능은 별도 명세서로 정의 예정.

3. **Base URL 변경**: 8080 → 8081 (학원 환경)

4. **응답 포맷 통일**: 모든 응답을 `{ success, data, message }` 표준으로 통일 유지

5. **에러 코드 추가**: `EXPIRED_TOKEN`, `INVALID_TOKEN`

---

## 🔗 관련 문서

- 시스템 흐름: [04. 시스템 아키텍처](./04-architecture.md)
- 데이터 모델: [05. 데이터베이스 설계](./05-database.md)
