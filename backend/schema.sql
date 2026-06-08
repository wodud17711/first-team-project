-- ============================================================
-- 반려견 산책 라이프 플랫폼 ERD v1.5
-- 작성일: 2026-05-19 (v1.5: 2026-06-02)
-- MySQL 8.0 기준
-- 저장 위치: backend/schema.sql (현재) / 또는 backend/src/main/resources/schema.sql (Spring Boot 자동 실행 시)
-- 테이블: 25개
--
-- 변경 사항 (v1.4 → v1.5) — weather_snapshots 를 실제 JPA 엔티티에 정합화
--  • weather_snapshots: 위경도 기반 → 기상청 격자(grid_x/grid_y) + base_date_time 기반으로 재정의
--    (WeatherSnapshot 엔티티는 #45부터 격자 기반이었으나 schema 가 따라오지 않았던 드리프트 정리)
--  • weather_snapshots: uv_index 컬럼 추가 (생활기상지수 V5 자외선, 룰 v1.2 UV_HIGH/UV_VERY_HIGH 입력)
--  • UNIQUE uk_weather_grid_time(grid_x, grid_y, base_date_time) + index idx_weather_grid_time
--
-- 변경 사항 (v1.3 → v1.4) — API 명세서 v3.1 인증 지원
--  • users: role 컬럼 추가 (USER / ADMIN)
--  • refresh_tokens 테이블 신규 (RT 서버 저장, HttpOnly 쿠키 인증 / 단일 세션)
--
-- 변경 사항 (v1.2 → v1.3)
--  • categories: sub_tags JSON 컬럼 추가 (서브태그 정의)
--  • categories 시드 데이터 5개 갱신 (사료·간식 / 병원·영양제 / 산책로 추천 / 반려견 자랑 / 산책 메이트 찾기)
--  • posts: sub_tag VARCHAR(20) 컬럼 추가 (글 작성 시 선택)
--  • posts 인덱스 (category_id, sub_tag, created_at) 추가 - 필터 쿼리 최적화
--
-- 변경 사항 (v1.1 → v1.2)
--  • UNIQUE 제약 추가 (중복 방지)
--  • 모든 FK에 ON DELETE 정책 명시
--  • VARCHAR enum성 컬럼 → ENUM 변환
--  • dog_breeds 단두종/내한·내열 컬럼 추가
--  • walk_routes 경로(JSON)·거리 추가
--  • 누락 인덱스 보강
--  • 신규 테이블 9개:
--    post_likes, post_images, walk_locations,
--    qna_history, daily_missions, walk_missions,
--    walking_companions, notifications, user_walk_stats
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 자식 테이블부터 역순 삭제
DROP TABLE IF EXISTS user_walk_stats;
DROP TABLE IF EXISTS qna_history;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS walk_missions;
DROP TABLE IF EXISTS daily_missions;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS badges;
DROP TABLE IF EXISTS walking_companions;
DROP TABLE IF EXISTS post_images;
DROP TABLE IF EXISTS post_likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS walk_route_reviews;
DROP TABLE IF EXISTS walk_scores;
DROP TABLE IF EXISTS walk_locations;
DROP TABLE IF EXISTS walks;
DROP TABLE IF EXISTS walk_routes;
DROP TABLE IF EXISTS weather_snapshots;
DROP TABLE IF EXISTS dogs;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS dog_breeds;
DROP TABLE IF EXISTS users;

-- ============================================================
-- 1. 사용자 (users)
-- ============================================================
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '사용자 ID',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '이메일 (로그인 ID)',
    password VARCHAR(255) NOT NULL COMMENT '비밀번호 (BCrypt 해시)',
    nickname VARCHAR(50) NOT NULL COMMENT '닉네임',
    profile_image_url VARCHAR(500) COMMENT '프로필 이미지 URL',
    role VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT '권한 (USER / ADMIN)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '가입일시',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL COMMENT '탈퇴일시 (소프트 삭제)',
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 계정';

-- ============================================================
-- 1-1. Refresh Token (refresh_tokens)  ⭐ v1.4 신규
-- ============================================================
CREATE TABLE refresh_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'RT ID',
    user_id BIGINT NOT NULL COMMENT '사용자 ID',
    token_hash VARCHAR(255) NOT NULL COMMENT 'Refresh Token 해시 (원문 미저장)',
    expires_at DATETIME NOT NULL COMMENT '만료일시 (발급 +14일)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '발급일시',
    UNIQUE KEY uk_refresh_user_token (user_id, token_hash),
    INDEX idx_refresh_tokens_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Refresh Token 관리 (단일 세션)';

-- ============================================================
-- 2. 견종 마스터 (dog_breeds)
-- ============================================================
CREATE TABLE dog_breeds (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '견종 ID',
    name_kr VARCHAR(50) NOT NULL COMMENT '견종명 (한글)',
    name_en VARCHAR(50) COMMENT '견종명 (영문)',
    size ENUM('소형', '중형', '대형') COMMENT '크기',
    avg_weight_min DECIMAL(5,2) COMMENT '평균 체중 최소 (kg)',
    avg_weight_max DECIMAL(5,2) COMMENT '평균 체중 최대 (kg)',
    required_activity ENUM('저', '중', '고') COMMENT '필요 활동량',
    coat_type ENUM('장모', '단모') COMMENT '털 종류',
    avg_lifespan INT COMMENT '평균 수명 (년)',
    is_brachycephalic BOOLEAN DEFAULT FALSE COMMENT '단두종 여부 (불독·퍼그·시츄 등)',
    heat_tolerance TINYINT COMMENT '더위 내성 1(약)~5(강)',
    cold_tolerance TINYINT COMMENT '추위 내성 1(약)~5(강)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='견종 마스터';

-- ============================================================
-- 3. 반려견 프로필 (dogs)
-- ============================================================
CREATE TABLE dogs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '반려견 ID',
    user_id BIGINT NOT NULL COMMENT '소유자 ID',
    breed_id BIGINT COMMENT '견종 ID (Mix 등 미확정인 경우 NULL)',
    name VARCHAR(50) NOT NULL COMMENT '반려견 이름',
    birth_date DATE COMMENT '생년월일',
    weight DECIMAL(5,2) COMMENT '체중 (kg)',
    gender ENUM('M', 'F') COMMENT '성별',
    is_neutered BOOLEAN DEFAULT FALSE COMMENT '중성화 여부',
    is_main BOOLEAN NOT NULL DEFAULT FALSE COMMENT '대표 강아지 여부 (유저당 1마리)',
    activity_level ENUM('저', '중', '고') COMMENT '활동량',
    favor_walk_time VARCHAR(100) COMMENT '선호 산책 시간대(0~23시) CSV, 예: "1,3,16"',
    health_notes TEXT COMMENT '건강 특이사항',
    profile_image_url VARCHAR(500) COMMENT '프로필 사진 URL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL COMMENT '삭제일시 (소프트 삭제)',
    INDEX idx_dogs_user_id (user_id),
    INDEX idx_dogs_breed_id (breed_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (breed_id) REFERENCES dog_breeds(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='반려견 프로필';

-- ============================================================
-- 4. 날씨 스냅샷 (weather_snapshots)
-- ============================================================
-- ⚠️ WeatherSnapshot 엔티티(JPA, ddl-auto=create)가 실제 생성하는 테이블 정의를 반영.
--    기상청 단기예보는 위경도가 아닌 격자(nx, ny)+발표시각 단위라 같은 격자+시각은 같은 결과(UNIQUE).
--    측정값은 엔티티 필드 타입(double/Integer)을 그대로 따른다.
--    PM10/PM25는 AirKoreaClient가 수집한 미세먼지 농도(μg/m³)로, 산책지수 계산 입력값으로 사용된다.
CREATE TABLE weather_snapshots (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '날씨 스냅샷 ID',
    grid_x INT NOT NULL COMMENT '기상청 격자 X (nx)',
    grid_y INT NOT NULL COMMENT '기상청 격자 Y (ny)',
    base_date_time DATETIME NOT NULL COMMENT '예보 대상 시각 (격자별 가장 가까운 예보)',
    temperature DOUBLE NOT NULL COMMENT '기온 (°C)',
    humidity DOUBLE NOT NULL COMMENT '습도 (%)',
    wind_speed DOUBLE NOT NULL COMMENT '풍속 (m/s)',
    feels_like_temperature DOUBLE NOT NULL COMMENT '체감온도 (°C)',
    ground_temperature DOUBLE COMMENT '지면온도 (°C) - ASOS(GroundTempParser) 보강, 발바닥 화상 판단용',
    uv_index INT COMMENT '자외선지수 (생활기상지수 V5, 0~11+) - UvIdxClient 보강, 룰 v1.2 입력',
    pm_10 INT COMMENT '미세먼지(PM10, μg/m³) - AirKoreaClient 수집, 산책지수 입력',
    pm_25 INT COMMENT '초미세먼지(PM2.5, μg/m³) - AirKoreaClient 수집, 산책지수 입력',
    UNIQUE KEY uk_weather_grid_time (grid_x, grid_y, base_date_time),
    INDEX idx_weather_grid_time (grid_x, grid_y, base_date_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='기상청 날씨 스냅샷 (격자+발표시각 단위)';

-- ============================================================
-- 5. 산책로 (walk_routes)
-- ============================================================
CREATE TABLE walk_routes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '산책로 ID',
    name VARCHAR(100) NOT NULL COMMENT '산책로 이름',
    description TEXT COMMENT '산책로 설명',
    latitude DECIMAL(10,7) COMMENT '시작 위도',
    longitude DECIMAL(10,7) COMMENT '시작 경도',
    distance_km DECIMAL(5,2) COMMENT '총 거리 (km)',
    path_coordinates JSON COMMENT '경로 좌표 배열 [{lat, lng}, ...]',
    difficulty ENUM('초보', '중수', '고수') COMMENT '난이도',
    has_shade BOOLEAN DEFAULT FALSE COMMENT '그늘 유무',
    average_rating DECIMAL(2,1) COMMENT '평균 평점 (캐시)',
    review_count INT DEFAULT 0 COMMENT '리뷰 수 (캐시)',
    created_by_user_id BIGINT COMMENT '등록한 사용자 ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    INDEX idx_walk_routes_location (latitude, longitude),
    INDEX idx_walk_routes_created_by (created_by_user_id),
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='산책로';

-- ============================================================
-- 6. 산책 기록 (walks)
-- ============================================================
CREATE TABLE walks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '산책 기록 ID',
    user_id BIGINT NOT NULL COMMENT '사용자 ID',
    dog_id BIGINT NOT NULL COMMENT '반려견 ID',
    walk_route_id BIGINT COMMENT '산책로 ID (자유 산책인 경우 NULL)',
    start_time DATETIME NOT NULL COMMENT '시작 시각',
    end_time DATETIME COMMENT '종료 시각',
    duration_minutes INT COMMENT '산책 시간 (분)',
    distance_km DECIMAL(5,2) COMMENT '산책 거리 (km)',
    user_feedback TEXT COMMENT '산책 후 사용자 피드백 (AI 개선용)',
    memo TEXT COMMENT '메모',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    INDEX idx_walks_user_id (user_id),
    INDEX idx_walks_dog_id (dog_id),
    INDEX idx_walks_start_time (start_time),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE,
    FOREIGN KEY (walk_route_id) REFERENCES walk_routes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='산책 기록';

-- ============================================================
-- 7. 산책 GPS 좌표 (walk_locations) [신규]
-- ============================================================
CREATE TABLE walk_locations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    walk_id BIGINT NOT NULL COMMENT '연결된 산책 기록',
    latitude DECIMAL(10,7) NOT NULL COMMENT '위도',
    longitude DECIMAL(10,7) NOT NULL COMMENT '경도',
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '기록 시각',
    INDEX idx_walk_locations_walk_id (walk_id),
    FOREIGN KEY (walk_id) REFERENCES walks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='산책 중 GPS 좌표 기록';

-- ============================================================
-- 8. 산책 위험도 점수 (walk_scores)
-- ============================================================
CREATE TABLE walk_scores (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '점수 ID',
    walk_id BIGINT COMMENT '연결된 산책 기록 (산책 전 조회만 한 경우 NULL)',
    dog_id BIGINT NOT NULL COMMENT '반려견 ID',
    weather_snapshot_id BIGINT COMMENT '날씨 스냅샷 ID',
    score INT COMMENT '위험도 점수 (0-100)',
    level ENUM('안전', '주의', '위험') COMMENT '위험 등급',
    reason TEXT COMMENT '점수 산정 사유',
    measured_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '측정 시각',
    INDEX idx_walk_scores_dog_id (dog_id),
    INDEX idx_walk_scores_measured_at (measured_at),
    FOREIGN KEY (walk_id) REFERENCES walks(id) ON DELETE CASCADE,
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE CASCADE,
    FOREIGN KEY (weather_snapshot_id) REFERENCES weather_snapshots(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='산책 위험도 점수 이력';

-- ============================================================
-- 9. 산책로 리뷰 (walk_route_reviews)
-- ============================================================
CREATE TABLE walk_route_reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    walk_route_id BIGINT NOT NULL COMMENT '산책로 ID',
    user_id BIGINT NOT NULL COMMENT '리뷰 작성자',
    rating INT COMMENT '평점 (1-5)',
    season ENUM('봄', '여름', '가을', '겨울') COMMENT '계절',
    content TEXT COMMENT '리뷰 내용',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    UNIQUE KEY uk_route_user (walk_route_id, user_id),
    INDEX idx_walk_route_reviews_route_id (walk_route_id),
    INDEX idx_walk_route_reviews_user_id (user_id),
    FOREIGN KEY (walk_route_id) REFERENCES walk_routes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='산책로 리뷰';

-- ============================================================
-- 10. 게시판 카테고리 (categories)
-- ============================================================
CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL UNIQUE COMMENT '카테고리명',
    sub_tags JSON COMMENT '선택 가능한 서브태그 목록 ["사료", "간식"] 형태, NULL이면 서브태그 없음',
    display_order INT DEFAULT 0 COMMENT '표시 순서'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='게시판 카테고리';

INSERT INTO categories (name, sub_tags, display_order) VALUES
('사료·간식',      JSON_ARRAY('사료', '간식'),   1),
('병원·영양제',    JSON_ARRAY('병원', '영양제'), 2),
('산책로 추천',    NULL,                          3),
('반려견 자랑',    NULL,                          4),
('산책 메이트 찾기', NULL,                          5);

-- ============================================================
-- 11. 게시글 (posts)
-- ============================================================
CREATE TABLE posts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT COMMENT '작성자 (탈퇴 시 NULL)',
    category_id BIGINT NOT NULL,
    sub_tag VARCHAR(20) COMMENT '서브태그 (예: 사료, 간식, 병원, 영양제). NULL 허용 - 카테고리에 서브태그 없는 경우',
    title VARCHAR(200) NOT NULL,
    content TEXT,
    view_count INT DEFAULT 0 COMMENT '조회수',
    like_count INT DEFAULT 0 COMMENT '좋아요 수 (캐시)',
    comment_count INT DEFAULT 0 COMMENT '댓글 수 (캐시)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    INDEX idx_posts_category_id (category_id),
    INDEX idx_posts_created_at (created_at),
    INDEX idx_posts_user_id (user_id),
    INDEX idx_posts_category_subtag (category_id, sub_tag, created_at) COMMENT '서브태그 필터 + 최신순 쿼리 최적화',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='게시글';

-- ============================================================
-- 12. 댓글 (comments) - 1단계 대댓글
-- ============================================================
CREATE TABLE comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    user_id BIGINT COMMENT '작성자 (탈퇴 시 NULL)',
    parent_comment_id BIGINT COMMENT '대댓글의 경우 부모 ID',
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    INDEX idx_comments_post_id (post_id),
    INDEX idx_comments_user_id (user_id),
    INDEX idx_comments_parent_id (parent_comment_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='댓글';

-- ============================================================
-- 13. 게시글 좋아요 (post_likes) [신규]
-- ============================================================
CREATE TABLE post_likes (
    user_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id),
    INDEX idx_post_likes_post_id (post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='게시글 좋아요';

-- ============================================================
-- 14. 게시글 이미지 (post_images) [신규]
-- ============================================================
CREATE TABLE post_images (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_post_images_post_id (post_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='게시글 첨부 이미지';

-- ============================================================
-- 15. 동반 산책 참여자 (walking_companions) [신규]
-- ============================================================
CREATE TABLE walking_companions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    post_id BIGINT NOT NULL COMMENT '모집글 (동반산책모집 카테고리)',
    user_id BIGINT NOT NULL COMMENT '참여 신청자',
    status ENUM('대기', '수락', '거절', '취소') DEFAULT '대기',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_post_user (post_id, user_id),
    INDEX idx_companions_user (user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='동반 산책 참여자';

-- ============================================================
-- 16. 배지 마스터 (badges)
-- ============================================================
CREATE TABLE badges (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '배지명',
    description TEXT COMMENT '획득 조건 설명',
    icon_url VARCHAR(500) COMMENT '배지 아이콘',
    condition_type VARCHAR(30) COMMENT '조건 종류 (walk_count/walk_distance/mission_complete 등)',
    condition_value INT COMMENT '조건 값'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='배지 마스터';

-- ============================================================
-- 17. 회원-배지 연결 (user_badges)
-- ============================================================
CREATE TABLE user_badges (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    badge_id BIGINT NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_badge (user_id, badge_id),
    INDEX idx_user_badges_user_id (user_id),
    INDEX idx_user_badges_badge_id (badge_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='회원이 획득한 배지';

-- ============================================================
-- 18. 업적 마스터 (achievements)
-- ============================================================
CREATE TABLE achievements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '업적명 (예: 누적 100km 산책)',
    description TEXT,
    icon_url VARCHAR(500),
    metric_type VARCHAR(30) COMMENT '측정 종류 (total_distance/total_time/total_walks)',
    target_value INT COMMENT '목표값'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='업적 마스터';

-- ============================================================
-- 19. 회원 업적 진행도 (user_achievements)
-- ============================================================
CREATE TABLE user_achievements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    achievement_id BIGINT NOT NULL,
    current_value INT DEFAULT 0 COMMENT '현재까지 진행한 값',
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_achievement (user_id, achievement_id),
    INDEX idx_user_achievements_user_id (user_id),
    INDEX idx_user_achievements_achievement_id (achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='회원 업적 진행 현황';

-- ============================================================
-- 20. 미션 마스터 (daily_missions) [신규]
-- ============================================================
CREATE TABLE daily_missions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '미션명 (예: 쓰레기 줍기, 물 마시기)',
    description TEXT,
    reward_points INT DEFAULT 0 COMMENT '보상 포인트',
    icon_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 여부'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='산책 미션 마스터';

-- ============================================================
-- 21. 산책별 미션 수행 (walk_missions) [신규]
-- ============================================================
CREATE TABLE walk_missions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    walk_id BIGINT NOT NULL,
    mission_id BIGINT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at DATETIME,
    UNIQUE KEY uk_walk_mission (walk_id, mission_id),
    INDEX idx_walk_missions_walk_id (walk_id),
    FOREIGN KEY (walk_id) REFERENCES walks(id) ON DELETE CASCADE,
    FOREIGN KEY (mission_id) REFERENCES daily_missions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='산책별 미션 수행 기록';

-- ============================================================
-- 22. 알림 (notifications) [신규]
-- ============================================================
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type VARCHAR(30) COMMENT 'BADGE_EARNED / COMMENT / COMPANION_REQUEST 등',
    title VARCHAR(200),
    content TEXT,
    link_url VARCHAR(500) COMMENT '클릭 시 이동할 경로',
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user_unread (user_id, is_read),
    INDEX idx_notifications_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 알림';

-- ============================================================
-- 23. AI Q&A 이력 (qna_history) [신규]
-- ============================================================
CREATE TABLE qna_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    dog_id BIGINT COMMENT '특정 반려견 관련 질문 시',
    question TEXT NOT NULL,
    answer TEXT,
    tokens_used INT COMMENT 'OpenAI 토큰 사용량 (비용 추적)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_qna_user_id (user_id),
    INDEX idx_qna_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='OpenAI Q&A 이력';

-- ============================================================
-- 24. 사용자 산책 통계 (user_walk_stats) [신규]
-- ============================================================
CREATE TABLE user_walk_stats (
    user_id BIGINT PRIMARY KEY,
    total_walks INT DEFAULT 0 COMMENT '총 산책 횟수',
    total_distance_km DECIMAL(8,2) DEFAULT 0 COMMENT '총 누적 거리',
    total_duration_minutes INT DEFAULT 0 COMMENT '총 누적 시간',
    avg_walks_per_week DECIMAL(4,2) COMMENT '주당 평균 산책 횟수',
    favorite_time_slot VARCHAR(20) COMMENT '주로 산책하는 시간대 (예: 18-20시)',
    user_type VARCHAR(30) COMMENT '견주 유형 (예: 새벽형/저녁형/주말형/꾸준형)',
    last_calculated_at DATETIME COMMENT '마지막 집계 시각',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 산책 통계 (배치 집계)';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 끝. 총 24개 테이블 생성 완료 (v1.3)
-- ============================================================
