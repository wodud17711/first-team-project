# 06. API 명세서

본 서비스의 REST API 명세입니다.

- **Base URL**: `http://localhost:8081` (개발), `https://api.dogwalk.com` (운영, 예정)
- **인증**: JWT (Authorization 헤더)
- **Content-Type**: `application/json`
- **응답 포맷**: 공통 응답 구조 사용

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
| 400 | Bad Request - 잘못된 요청 |
| 401 | Unauthorized - 인증 실패 |
| 403 | Forbidden - 권한 없음 |
| 404 | Not Found - 리소스 없음 |
| 409 | Conflict - 중복 등 |
| 500 | Internal Server Error - 서버 오류 |

---

## 📋 API 목록

### 🔐 Auth (인증)

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | 회원가입 | ❌ |
| POST | `/api/auth/login` | 로그인 | ❌ |
| POST | `/api/auth/logout` | 로그아웃 | ✅ |

### 👤 User (회원)

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/users/me` | 내 정보 조회 | ✅ |
| PATCH | `/api/users/me` | 내 정보 수정 | ✅ |

### 🐕 Dog (반려견)

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/api/dogs` | 반려견 등록 | ✅ |
| GET | `/api/dogs` | 내 반려견 목록 | ✅ |
| GET | `/api/dogs/{dogId}` | 반려견 상세 | ✅ |
| PATCH | `/api/dogs/{dogId}` | 반려견 수정 | ✅ |
| DELETE | `/api/dogs/{dogId}` | 반려견 삭제 | ✅ |

### 🌤️ Walk Risk (산책 위험도)

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/walk/risk-score` | 산책 위험도 조회 | ✅ |

### 🚶 Walk (산책 기록)

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| POST | `/api/walks/start` | 산책 시작 | ✅ |
| POST | `/api/walks/{walkId}/end` | 산책 종료 + 피드백 | ✅ |
| GET | `/api/walks` | 산책 기록 목록 | ✅ |
| GET | `/api/walks/stats` | 산책 통계 | ✅ |

### 💬 Community (커뮤니티)

| 메서드 | URL | 설명 | 인증 |
| --- | --- | --- | --- |
| GET | `/api/categories` | 카테고리 + 서브태그 목록 | ❌ |
| POST | `/api/posts` | 글 작성 | ✅ |
| GET | `/api/posts` | 글 목록 (카테고리·서브태그 필터) | ❌ |
| GET | `/api/posts/{postId}` | 글 상세 | ❌ |
| PATCH | `/api/posts/{postId}` | 글 수정 | ✅ |
| DELETE | `/api/posts/{postId}` | 글 삭제 | ✅ |
| POST | `/api/posts/{postId}/likes` | 좋아요 토글 | ✅ |
| POST | `/api/posts/{postId}/comments` | 댓글 작성 | ✅ |
| GET | `/api/posts/{postId}/comments` | 댓글 목록 | ❌ |

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
  "activityLevel": "MEDIUM",
  "healthNote": "슬개골 탈구 1기",
  "preferredWalkTime": "EVENING"
}
```

**Validation**
- name: 1~30자, 필수
- breed: 필수
- weight: 0.1 ~ 100, 선택
- coatType: LONG / SHORT / MEDIUM
- activityLevel: LOW / MEDIUM / HIGH

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
    "activityLevel": "MEDIUM",
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
    "supplies": [
      "물병",
      "쿨링매트"
    ],
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
| `INVALID_CREDENTIALS` | 401 | 로그인 실패 |
| `UNAUTHORIZED` | 401 | 인증 필요 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `USER_NOT_FOUND` | 404 | 사용자 없음 |
| `DOG_NOT_FOUND` | 404 | 반려견 없음 |
| `POST_NOT_FOUND` | 404 | 글 없음 |
| `INVALID_SUB_TAG` | 400 | 서브태그가 카테고리에 정의되지 않음 |
| `CATEGORY_NOT_FOUND` | 404 | 카테고리 없음 |
| `EMAIL_DUPLICATED` | 409 | 이메일 중복 |
| `WEATHER_API_ERROR` | 503 | 외부 API 오류 |
| `AI_SERVER_ERROR` | 503 | AI 서버 오류 |

---

## 🔗 관련 문서

- 시스템 흐름: [04. 시스템 아키텍처](./04-architecture.md)
- 데이터 모델: [05. 데이터베이스 설계](./05-database.md)
