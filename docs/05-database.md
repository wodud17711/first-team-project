# 05. 데이터베이스 설계

본 서비스의 데이터베이스 스키마 설계 문서입니다.

- **DBMS**: MySQL 8.0
- **문자셋**: utf8mb4 (이모지 지원)
- **타임존**: Asia/Seoul

---

## 🗂️ ERD (Entity Relationship Diagram)

```
┌──────────────┐
│     User     │
│──────────────│
│ id (PK)      │
│ email        │
│ password     │
│ nickname     │
│ profile_img  │
│ created_at   │
└──────┬───────┘
       │ 1
       │
       │ N
┌──────┴───────┐         ┌──────────────────┐
│     Dog      │         │   WalkRiskLog    │
│──────────────│         │──────────────────│
│ id (PK)      │ 1     N │ id (PK)          │
│ user_id (FK) ├────────→│ dog_id (FK)      │
│ name         │         │ measured_at      │
│ breed        │         │ risk_score       │
│ birth_date   │         │ risk_level       │
│ weight       │         │ reasons (JSON)   │
│ coat_type    │         │ recommended_time │
│ activity_lvl │         └──────────────────┘
│ health_note  │
│ pref_time    │
│ profile_img  │
│ created_at   │
└──────┬───────┘
       │ 1
       │
       │ N
┌──────┴───────┐
│  WalkRecord  │
│──────────────│
│ id (PK)      │
│ dog_id (FK)  │
│ start_time   │
│ end_time     │
│ duration_min │
│ distance_km  │
│ weather_temp │
│ weather_cond │
│ risk_score   │
│ feedback     │
│ created_at   │
└──────────────┘


┌──────────────┐
│     User     │
└──────┬───────┘
       │ 1
       │ N
┌──────┴───────┐         ┌──────────────────┐
│     Post     │         │     Comment      │
│──────────────│         │──────────────────│
│ id (PK)      │ 1     N │ id (PK)          │
│ user_id (FK) │────────→│ post_id (FK)     │
│ category     │         │ user_id (FK)     │
│ title        │         │ content          │
│ content      │         │ created_at       │
│ image_url    │         └──────────────────┘
│ view_count   │
│ created_at   │
│ updated_at   │
└──────────────┘
```

---

## 📋 테이블 명세

### 1. `users` - 사용자

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGINT | PK, AUTO_INCREMENT | 사용자 ID |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 이메일 (로그인 ID) |
| password | VARCHAR(255) | NOT NULL | BCrypt 해시 |
| nickname | VARCHAR(30) | NOT NULL | 닉네임 |
| profile_image_url | VARCHAR(500) | NULL | 프로필 이미지 URL |
| created_at | DATETIME | NOT NULL | 가입일 |
| updated_at | DATETIME | NOT NULL | 수정일 |

**인덱스**
- `idx_email` (email)

---

### 2. `dogs` - 반려견

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGINT | PK, AUTO_INCREMENT | 반려견 ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 보호자 ID |
| name | VARCHAR(30) | NOT NULL | 이름 |
| breed | VARCHAR(50) | NOT NULL | 견종 |
| birth_date | DATE | NULL | 생년월일 |
| weight | DECIMAL(4,1) | NULL | 체중 (kg) |
| coat_type | ENUM | NOT NULL | LONG / SHORT / MEDIUM |
| activity_level | ENUM | NOT NULL | LOW / MEDIUM / HIGH |
| health_note | TEXT | NULL | 건강 특이사항 |
| preferred_walk_time | VARCHAR(20) | NULL | 선호 산책 시간대 |
| profile_image_url | VARCHAR(500) | NULL | 프로필 이미지 |
| created_at | DATETIME | NOT NULL | 등록일 |
| updated_at | DATETIME | NOT NULL | 수정일 |

**인덱스**
- `idx_user_id` (user_id)

**ENUM 값**
- `coat_type`: `LONG`(장모), `SHORT`(단모), `MEDIUM`(중간)
- `activity_level`: `LOW`(낮음), `MEDIUM`(보통), `HIGH`(높음)

---

### 3. `walk_records` - 산책 기록

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGINT | PK, AUTO_INCREMENT | 기록 ID |
| dog_id | BIGINT | FK → dogs.id, NOT NULL | 반려견 ID |
| start_time | DATETIME | NOT NULL | 산책 시작 시각 |
| end_time | DATETIME | NULL | 산책 종료 시각 |
| duration_minutes | INT | NULL | 소요 시간 (분) |
| distance_km | DECIMAL(5,2) | NULL | 이동 거리 (선택) |
| weather_temp | DECIMAL(4,1) | NULL | 산책 당시 기온 |
| weather_condition | VARCHAR(20) | NULL | 날씨 상태 |
| risk_score | INT | NULL | 산책 당시 위험도 점수 |
| user_feedback | TEXT | NULL | 사용자 피드백 |
| created_at | DATETIME | NOT NULL | 생성일 |

**인덱스**
- `idx_dog_id_start_time` (dog_id, start_time)

---

### 4. `walk_risk_logs` - 위험도 측정 이력

> 산책 안 해도 위험도만 조회한 경우를 별도 기록 (AI 학습 데이터)

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGINT | PK, AUTO_INCREMENT | 로그 ID |
| dog_id | BIGINT | FK → dogs.id, NOT NULL | 반려견 ID |
| measured_at | DATETIME | NOT NULL | 측정 시각 |
| risk_score | INT | NOT NULL | 위험도 점수 (0~100) |
| risk_level | ENUM | NOT NULL | SAFE / CAUTION / DANGER |
| reasons | JSON | NULL | 위험 사유 리스트 |
| recommended_time | VARCHAR(50) | NULL | 추천 시간대 (예: "18:00 ~ 20:00") |
| weather_snapshot | JSON | NULL | 측정 당시 날씨 데이터 |

**ENUM 값**
- `risk_level`: `SAFE`(안전), `CAUTION`(주의), `DANGER`(위험)

**JSON 예시 (reasons)**
```json
[
  {"code": "HIGH_GROUND_TEMP", "message": "지면 온도가 높아 발바닥 화상 위험"},
  {"code": "SHORT_COAT_COLD", "message": "단모종에게 추운 날씨"}
]
```

---

### 5. `posts` - 커뮤니티 글

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGINT | PK, AUTO_INCREMENT | 글 ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 작성자 |
| category | ENUM | NOT NULL | 카테고리 |
| title | VARCHAR(200) | NOT NULL | 제목 |
| content | TEXT | NOT NULL | 본문 |
| image_url | VARCHAR(500) | NULL | 첨부 이미지 |
| view_count | INT | DEFAULT 0 | 조회수 |
| created_at | DATETIME | NOT NULL | 작성일 |
| updated_at | DATETIME | NOT NULL | 수정일 |

**인덱스**
- `idx_category_created_at` (category, created_at DESC)

**ENUM 값**
- `category`: `FOOD`(사료), `SNACK`(간식), `HOSPITAL`(병원), `ROUTE`(산책로), `SHOW_OFF`(자랑), `COMPANION`(동반 산책)

---

### 6. `comments` - 댓글

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | BIGINT | PK, AUTO_INCREMENT | 댓글 ID |
| post_id | BIGINT | FK → posts.id, NOT NULL | 글 ID |
| user_id | BIGINT | FK → users.id, NOT NULL | 작성자 |
| content | TEXT | NOT NULL | 내용 |
| created_at | DATETIME | NOT NULL | 작성일 |

**인덱스**
- `idx_post_id` (post_id)

---

## 🔮 향후 확장 테이블 (2차 개발)

| 테이블 | 용도 |
| --- | --- |
| `walk_routes` | 산책로 정보 (위치, 난이도) |
| `route_reviews` | 산책로 리뷰 |
| `badges` | 배지 마스터 |
| `user_badges` | 사용자가 획득한 배지 |
| `missions` | 산책 미션 |
| `breed_master` | 견종 마스터 (Kaggle 데이터 시드) |

---

## 🌱 시드 데이터

### `breed_master` (Kaggle 데이터 기반)

> 견종 마스터 데이터는 Kaggle 데이터셋을 정제하여 시드로 입력

| 컬럼 | 설명 |
| --- | --- |
| id | 견종 ID |
| name_ko | 한글명 |
| name_en | 영문명 |
| size_category | SMALL / MEDIUM / LARGE |
| weight_min, weight_max | 표준 체중 범위 |
| coat_default | 기본 털 길이 |
| activity_default | 기본 활동량 |
| heat_sensitivity | 더위 민감도 (1~5) |
| cold_sensitivity | 추위 민감도 (1~5) |
| is_brachycephalic | 단두종 여부 (퍼그, 불독 등) |

---

## 📝 마이그레이션 관리

- **개발 초기**: JPA `ddl-auto: create-drop` 또는 `update`
- **개발 중기 이후**: Flyway 도입 검토
- **운영**: Flyway 필수

---

## 🔗 관련 문서

- API 정의: [06. API 명세서](./06-api-spec.md)
- 룰베이스 (견종 데이터 활용): [08. 산책 위험도 룰베이스](./08-risk-rules.md)
