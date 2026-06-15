-- ============================================================================
-- 산책 피드백 괴리 수집 쿼리 (룰베이스 튜닝용)
-- 설계 정본: docs/11-walk-feedback-collection.md
-- 전제: #79(A-2)로 walk_scores.walk_id 귀속됨 / user_feedback = JSON-in-TEXT 컨벤션
--        {"thermal":"HOT|OK|COLD","intensity":1|2,"note":"..."}
-- 모두 읽기 전용. MySQL 8 (JSON_EXTRACT / JSON_VALID 사용).
-- ⚠️ 튜닝은 셀당 표본 n>=30 이후 (docs §5 가드).
-- ============================================================================

-- [1] 산책별 괴리 뷰 — 원천 1행/산책
SELECT
  w.id  AS walk_id,
  w.dog_id,
  b.size               AS breed_size,
  b.is_brachycephalic  AS is_brachy,
  ws.level             AS model_level,
  ws.score             AS model_score,
  ws.reason            AS model_reason,
  JSON_UNQUOTE(JSON_EXTRACT(w.user_feedback,'$.thermal'))        AS fb_thermal,
  CAST(JSON_EXTRACT(w.user_feedback,'$.intensity') AS UNSIGNED)  AS fb_intensity,
  wsnap.feels_like_temperature AS feels_like,
  wsnap.ground_temperature     AS ground_temp,
  wsnap.uv_index, wsnap.pm_10, wsnap.humidity,
  CASE
    WHEN ws.level = '안전'
         AND JSON_UNQUOTE(JSON_EXTRACT(w.user_feedback,'$.thermal')) IN ('HOT','COLD')
      THEN 'FN_과소경보'
    WHEN ws.level IN ('주의','위험')
         AND JSON_UNQUOTE(JSON_EXTRACT(w.user_feedback,'$.thermal')) = 'OK'
      THEN 'FP_과대경보'
    ELSE 'HIT_정합'
  END AS divergence
FROM walks w
JOIN walk_scores ws            ON ws.walk_id = w.id
LEFT JOIN weather_snapshots wsnap ON wsnap.id = ws.weather_snapshot_id
JOIN dogs d                    ON d.id = w.dog_id
LEFT JOIN dog_breeds b         ON b.id = d.breed_id
WHERE w.deleted_at IS NULL
  AND w.end_time IS NOT NULL
  AND w.user_feedback IS NOT NULL
  AND JSON_VALID(w.user_feedback);

-- [2] 괴리 매트릭스 집계 (모델 level x 체감 thermal)
SELECT ws.level AS model_level,
       JSON_UNQUOTE(JSON_EXTRACT(w.user_feedback,'$.thermal')) AS fb_thermal,
       COUNT(*) AS n
FROM walks w
JOIN walk_scores ws ON ws.walk_id = w.id
WHERE w.end_time IS NOT NULL AND w.deleted_at IS NULL
  AND JSON_VALID(w.user_feedback)
GROUP BY model_level, fb_thermal
ORDER BY model_level, fb_thermal;

-- [3] 과소경보(FN) 튜닝 후보 — 체감온도 2℃ 버킷별 ("안전인데 더웠음")
SELECT FLOOR(wsnap.feels_like_temperature/2)*2 AS feels_band,
       COUNT(*) AS fn_count
FROM walks w
JOIN walk_scores ws            ON ws.walk_id = w.id
JOIN weather_snapshots wsnap   ON wsnap.id = ws.weather_snapshot_id
WHERE ws.level = '안전'
  AND JSON_UNQUOTE(JSON_EXTRACT(w.user_feedback,'$.thermal')) = 'HOT'
  AND w.end_time IS NOT NULL AND w.deleted_at IS NULL AND JSON_VALID(w.user_feedback)
GROUP BY feels_band
ORDER BY feels_band DESC;

-- [4] 단두종 세그먼트 (BRACHY_HEAT 검증) — is_brachycephalic 가 룰과 1:1
SELECT b.is_brachycephalic, ws.level,
       JSON_UNQUOTE(JSON_EXTRACT(w.user_feedback,'$.thermal')) AS fb_thermal,
       COUNT(*) AS n
FROM walks w
JOIN walk_scores ws ON ws.walk_id = w.id
JOIN dogs d         ON d.id = w.dog_id
JOIN dog_breeds b   ON b.id = d.breed_id
WHERE w.end_time IS NOT NULL AND w.deleted_at IS NULL AND JSON_VALID(w.user_feedback)
GROUP BY b.is_brachycephalic, ws.level, fb_thermal;
