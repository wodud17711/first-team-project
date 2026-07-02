# 05. 데이터베이스 설계

본 서비스의 데이터베이스 스키마 설계 문서입니다.

- **DBMS**: MySQL 8.0
- **문자셋**: utf8mb4 (이모지 지원)
- **타임존**: Asia/Seoul
- **테이블 수**: 26개
- **버전**: v1.8 (2026-07-02) — email_verifications 신규(가입 이메일 인증) / users: provider·provider_id·password NULL 드리프트 정리(소셜 로그인)

---

## 📄 단일 진실 공급원 (Single Source of Truth)

- 🔷 **실제 스키마**: [`backend/schema.sql`](../backend/schema.sql)
- 🔷 **시각화용 DBML**: [`docs/erd.dbml`](./erd.dbml)
  - [dbdiagram.io](https://dbdiagram.io/d) 에 붙여넣어 ERD 자동 생성

> ⚠️ **이 문서는 개요용**입니다. 컬럼 변경 시 `schema.sql`을 먼저 수정하고, 이 문서는 표만 갱신하세요.

---

## 🗂️ 테이블 한눈에 보기 (26개)

### 👤 사용자 / 인증 / 반려견 (6)

| 테이블 | 설명 |
| --- | --- |
| `users` | 사용자 계정 (이메일/BCrypt 비밀번호(소셜=NULL) / `provider`·`provider_id`: LOCAL·KAKAO·GOOGLE·NAVER ⭐ v1.8 / `role`: USER·ADMIN / `guardian_level`: 보호자 연차 자기신고 ⭐ v1.7) |
| `refresh_tokens` | Refresh Token 관리 (해시 저장, HttpOnly 쿠키 인증 / 단일 세션) ⭐ v1.4 |
| `email_verifications` | 가입 이메일 인증 코드 (6자리·10분 유효·5회 실패 폐기·검증 후 30분 내 가입) ⭐ v1.8 |
| `dog_breeds` | 견종 마스터 (Kaggle 시드 데이터) |
| `dogs` | 반려견 프로필 (`is_main` 대표견 1마리 강제 / `favor_walk_time` 선호 산책시간 0~23시 CSV) |
| `user_walk_stats` | 사용자 산책 통계 (배치 집계 - 견주 유형 분석) |

### 🐾 산책 (6)

| 테이블 | 설명 |
| --- | --- |
| `walks` | 산책 기록 (시작/종료/거리/시간) |
| `walk_locations` | 산책 중 GPS 좌표 (실시간 트래킹) |
| `walk_routes` | 산책로 마스터 (이름·경로·난이도) |
| `walk_route_reviews` | 산책로 리뷰 (계절별·평점) |
| `walk_scores` | 산책 위험도 점수 이력 |
| `weather_snapshots` | 기상청 날씨 스냅샷 (분석용) |

### 💬 커뮤니티 (6)

| 테이블 | 설명 |
| --- | --- |
| `categories` | 게시판 카테고리 (사료/병원/산책로/자랑/동반산책) |
| `posts` | 게시글 (조회수·좋아요·댓글수 캐시) |
| `comments` | 댓글 (1단계 대댓글 지원) |
| `post_likes` | 게시글 좋아요 (중복 방지) |
| `post_images` | 게시글 첨부 이미지 |
| `walking_companions` | 동반 산책 참여자 |

### 🏆 보상 / 미션 (6)

| 테이블 | 설명 |
| --- | --- |
| `badges` | 배지 마스터 (시각 보상) |
| `user_badges` | 회원이 획득한 배지 |
| `achievements` | 업적 마스터 (누적 통계 보상) |
| `user_achievements` | 회원 업적 진행도 |
| `daily_missions` | 산책 미션 마스터 (쓰레기 줍기 등) |
| `walk_missions` | 산책별 미션 수행 기록 |

### 🤖 AI / 알림 (2)

| 테이블 | 설명 |
| --- | --- |
| `qna_history` | OpenAI Q&A 이력 + 토큰 사용량 |
| `notifications` | 사용자 알림 (배지/댓글/동반 신청 등). `actor_id`·`post_id`·`comment_id` FK 로 조회 시 반응자 프로필·게시글 제목·댓글 내용을 조인(v3.8) |

---

## 🔑 핵심 설계 원칙

### 1. 소프트 삭제
대부분의 테이블은 `deleted_at DATETIME NULL` 컬럼 보유.
물리 삭제 대신 NULL이 아닌 값으로 표시.

### 2. 캐시 컬럼
조회 성능을 위한 의도적 비정규화:
- `posts.like_count`, `posts.comment_count`
- `walk_routes.average_rating`, `walk_routes.review_count`

### 3. UNIQUE 제약 (중복 방지)
| 테이블 | UNIQUE 키 | 방지 대상 |
| --- | --- | --- |
| `user_badges` | (user_id, badge_id) | 같은 배지 중복 획득 |
| `user_achievements` | (user_id, achievement_id) | 같은 업적 중복 |
| `walk_route_reviews` | (walk_route_id, user_id) | 리뷰 도배 |
| `post_likes` | (post_id, user_id) UNIQUE | 무한 좋아요 (v1.6: 복합 PK → id PK + UNIQUE, 엔티티 컨벤션 통일) |
| `walking_companions` | (post_id, user_id) | 중복 참여 신청 |
| `walk_missions` | (walk_id, mission_id) | 미션 중복 수행 |
| `refresh_tokens` | (user_id, token_hash) | RT 중복 저장 |

### 4. FK ON DELETE 정책
- `CASCADE`: 자식 함께 삭제 (예: 사용자 삭제 → dogs, walks 등)
- `SET NULL`: 작성자 표시만 제거 (예: 사용자 탈퇴 → posts.user_id NULL, 글은 보존)

### 5. ENUM 사용
잘못된 값 입력 방지를 위해 fixed-value 컬럼은 ENUM:
- `gender` (M/F)
- `size` (소형/중형/대형)
- `activity_level` (저/중/고)
- `coat_type` (장모/단모)
- `difficulty` (초보/중수/고수)
- `level` (안전/주의/위험)
- `season` (봄/여름/가을/겨울)
- `companion_status` (대기/수락/거절/취소)

### 6. 견종 위험도 판단 핵심 컬럼
`dog_breeds`에 AI 룰베이스에 직접 사용되는 컬럼:
- `is_brachycephalic` (단두종 여부)
- `heat_tolerance` (더위 내성 1~5)
- `cold_tolerance` (추위 내성 1~5)

---

## 🌱 시드 데이터

### `categories` (자동 INSERT)
schema.sql 실행 시 자동으로 5개 행 입력:
- 사료/간식, 병원후기, 산책로후기, 반려견자랑, 동반산책모집

### `dog_breeds` (수동 시드 필요)
Kaggle 데이터셋을 정제하여 입력 예정:
- [Dogs Breeds](https://www.kaggle.com/datasets/yonkotoshiro/dogs-breeds)
- [150+ Dog Breeds Around the World](https://www.kaggle.com/datasets/prajwaldongre/top-dog-breeds-around-the-world)

### `daily_missions`, `badges`, `achievements` (수동 시드 필요)
마스터 데이터 정의 후 입력 (AI/PM 담당자가 정리)

---

## 📝 마이그레이션 관리

| 단계 | 도구 | 비고 |
| --- | --- | --- |
| 개발 초기 | `schema.sql` 수동 실행 | 매번 DROP + CREATE |
| 개발 중기 | Flyway 도입 검토 | 버전별 마이그레이션 |
| 운영 | Flyway 필수 | 운영 데이터 보존 |

### Spring Boot 자동 실행 설정 (개발용)

`application.properties`:
```properties
spring.sql.init.mode=always
spring.sql.init.schema-locations=classpath:schema.sql
spring.jpa.hibernate.ddl-auto=none
```

> ⚠️ `mode=always`는 매번 DROP & CREATE. 운영 배포 전 반드시 `never`로 변경.

---

## 🔗 관련 문서

- API 정의: [06. API 명세서](./06-api-spec.md)
- 룰베이스 (견종 데이터 활용): [08. 산책 위험도 룰베이스](./08-risk-rules.md)
- 외부 API 연동: [09. 외부 API 사용 가이드](./09-external-apis.md)
