-- 커뮤니티 카테고리 시드 (정본: backend/schema.sql L275~)
-- 컬럼: name, sub_tags(JSON), display_order
-- 주의: '사료·간식'·'병원·영양제'는 가운뎃점(·) 사용

INSERT INTO categories (name, sub_tags, display_order) VALUES
('사료·간식',      JSON_ARRAY('사료', '간식'),   1),
('병원·영양제',    JSON_ARRAY('병원', '영양제'), 2),
('산책로 추천',    NULL,                          3),
('반려견 자랑',    NULL,                          4),
('산책 메이트 찾기', NULL,                          5);
