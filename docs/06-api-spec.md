# 06. API 명세서

본 서비스의 REST API 명세입니다.

- **Base URL**: `http://localhost:8080` (개발), `https://api.dogwalk.com` (운영, 예정)
- **인증**: JWT (Authorization 헤더)
- **Content-Type**: `application/json`
- **응답 포맷**: 공통 응답 구조 사용
- **버전**: v3.0 (2026-05-20, 60개 엔드포인트, schema v1.3 매핑)

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

## 📋 API 목록 (총 60개)

| 카테고리 | 개수 | 관련 테이블 |
| --- | --- | --- |
| 인증 | 5 | users |
| 회원 | 3 | users |
| 반려견 | 5 | dogs |
| 견종 | 2 | dog_breeds |
| 산책 점수 | 2 | walk_scores, weather_snapshots |
| 산책 기록 | 7 | walks, walk_locations |
| 산책로 | 5 | walk_routes, walk_route_reviews |
| 게시판 | 10 | posts, comments, categories |
| 좋아요 | 2 | post_likes |
| 동반 산책 | 4 | walking_companions |
| 배지/업적 | 4 | badges, achievements |
| 미션 | 3 | daily_missions, walk_missions |
| 알림 | 3 | notifications |
| AI Q&A | 2 | qna_history |
| 견주 유형 | 1 | user_walk_stats |
| 랭킹 | 2 | user_walk_stats |

---

### 🔐 Auth (인증) - 5개

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | 회원가입 | ❌ |
| POST | `/api/auth/login` | 로그인 | ❌ |
| POST | `/api/auth/logout` | 로그아웃 | ✅ |
| POST | `/api/auth/refresh` | 액세스 토큰 갱신 | ❌ |
| GET | `/api/auth/me` | 내 정보 조회 | ✅ |

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
| GET | `/api/walk/score/optimal-time` | 최적 산책 시간 추천 | ✅ |

### 🚶 Walk (산책 기록) - 7개

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/api/walks/start` | 산책 시작 | ✅ |
| POST | `/api/walks/{walkId}/end` | 산책 종료 + 피드백 | ✅ |
| POST | `/api/walks/{walkId}/locations` | 산책 중 GPS 좌표 기록 (러닝 모드) | ✅ |
| GET | `/api/walks` | 산책 기록 목록 | ✅ |
| GET | `/api/walks/{walkId}` | 산책 기록 상세 (GPS 경로 포함) | ✅ |
| GET | `/api/walks/statistics` | 주간/월간 통계 | ✅ |
| GET | `/api/walks/calendar` | 산책 캘린더 (월별) | ✅ |

### 🌳 Routes (산책로) - 5개

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

### 👥 Companions (동반 산책) - 4개

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/api/posts/{postId}/companions` | 동반 산책 참여 신청 | ✅ |
| GET | `/api/posts/{postId}/companions` | 신청자 목록 (모집자만) | ✅ |
| PATCH | `/api/companions/{companionId}/accept` | 신청 수락 | ✅ |
| PATCH | `/api/companions/{companionId}/reject` | 신청 거절 | ✅ |

### 🏆 Badges & Achievements (배지/업적) - 4개

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/badges` | 전체 배지 목록 + 내 획득 여부 | ✅ |
| GET | `/api/badges/me` | 내가 획득한 배지만 | ✅ |
| GET | `/api/achievements` | 전체 업적 목록 + 내 진행도 | ✅ |
| GET | `/api/achievements/me` | 내 업적 진행도만 | ✅ |

### 🎯 Missions (미션) - 3개

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

### 📊 User Stats (견주 유형) - 1개

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/users/me/stats` | 내 견주 유형 + 산책 통계 | ✅ |

### 🥇 Ranking (랭킹) - 2개

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
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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
  "activityLevel": "MEDIUM",
  "healthNotes": "슬개골 탈구 1기",
  "profileImageUrl": "https://..."
}
```

**Validation**
- name: 1~30자, 필수
- breedId: 견종 마스터 ID (Mix는 NULL 허용)
- weight: 0.1 ~ 100
- gender: M / F
- activityLevel: LOW / MEDIUM / HIGH

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
GET /api/walk/score?dogId=1&lat=37.5665&lng=126.9780
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
      "pm25": 18,
      "estimatedGroundTemperature": 50.2
    },
    "supplies": ["물병", "쿨링매트"],
    "measuredAt": "2026-05-20T15:30:00"
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
  "dogId": 1,
  "walkRouteId": 5,
  "startLat": 37.5665,
  "startLng": 126.9780
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "walkId": 100,
    "startTime": "2026-05-20T18:00:00",
    "weatherSnapshot": {
      "temperature": 25.0,
      "condition": "맑음",
      "riskScore": 85
    }
  }
}
```

**Error**
- 409: 진행 중인 산책 있음 (`WALK_ALREADY_IN_PROGRESS`)

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
    "startTime": "2026-05-20T18:00:00",
    "endTime": "2026-05-20T18:45:00",
    "durationMinutes": 45,
    "distanceKm": 2.5,
    "completedMissions": 2
  }
}
```

---

### 📍 산책 중 GPS 좌표 기록 (러닝 모드)

```
POST /api/walks/{walkId}/locations
Authorization: Bearer {token}
```

**Request Body** (배치로 여러 좌표 한 번에 전송)
```json
{
  "locations": [
    {"lat": 37.5665, "lng": 126.9780, "recordedAt": "2026-05-20T18:00:10"},
    {"lat": 37.5666, "lng": 126.9782, "recordedAt": "2026-05-20T18:00:20"},
    {"lat": 37.5668, "lng": 126.9785, "recordedAt": "2026-05-20T18:00:30"}
  ]
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "savedCount": 3
  }
}
```

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
| `EXPIRED_TOKEN` | 401 | 토큰 만료 |
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
