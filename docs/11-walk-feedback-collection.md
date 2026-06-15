# 11. 산책 피드백 수집 설계 (룰베이스 튜닝용)

> 작성: 임재영(AI/PM) · 2026-06-10 · Week 4
> 선행: #77(산책 기록 API, `walks.user_feedback` 도입) · #79(A-2, `walk_scores.walk_id` 귀속)
> 목적: **"모델이 매긴 위험도 vs 사용자가 실제 느낀 체감"의 괴리**를 구조적으로 수집해, 룰베이스(`ai/`) 임계값을 데이터로 튜닝한다.
> 정본 참조: 룰 코드 = [`ai/README.md`](../ai/README.md) · 스키마 = [`05-database.md`](./05-database.md) · API = [`06-api-spec.md`](./06-api-spec.md)

---

## 0. 왜 지금 가능한가 (전제)

A-2(#79)로 **산책 1건 ↔ 직전 위험도 점수 1건**이 연결됐다. 이제 한 산책 레코드에서 아래 3개가 한 줄로 묶인다.

```
walks(산책)  ──walk_id──  walk_scores(모델 출력: score·level·reason)  ──weather_snapshot_id──  weather_snapshots(실측 날씨)
   └ user_feedback (사용자 체감)
```

→ **모델 판정(level)** 과 **사용자 체감(feedback)** 을 같은 날씨 조건 위에서 대조할 수 있다. 이게 룰베이스 검증/튜닝의 원천 데이터다.

> ⚠️ **이 문서는 "수집 배선" 설계까지다.** 실제 튜닝은 표본이 쌓인 뒤(§5 가드). 지금은 데이터가 새지 않게 파이프만 깐다.

---

## 1. 피드백 태깅 스키마

### 1.1 현행 한계
`walks.user_feedback`는 **자유 TEXT**(#77). 종료 요청 `WalkEndRequest.userFeedback`(String, 선택)을 그대로 저장한다. → 자유서술은 **집계·대조 불가**. 통제 어휘(controlled vocabulary)가 필요하다.

### 1.2 1차 축 = 체감 온도 (thermal)
룰베이스 v1.x는 사실상 **열/한파/자외선/미세먼지 감점기**다(`GROUND_TEMP_*`, `FEELS_HOT`, `BRACHY_HEAT`, `HUMID_HEAT`, `FEELS_COLD`, `UV_*`). 사용자가 가장 정확히 답할 수 있고 룰과 직결되는 신호는 **체감 더위/추위**다.

| 코드 | 라벨(UX) | 의미 |
| --- | --- | --- |
| `HOT` | 더웠어요 | 산책 중 더위로 힘들어함(헐떡임·지면 회피 등) |
| `OK` | 적당했어요 | 무난 |
| `COLD` | 추웠어요 | 추위로 힘들어함(떨림·웅크림 등) |

선택 보강 필드(있으면 정밀도↑, 없어도 동작):
- `intensity` 1~2 (1=조금, 2=많이) — 괴리 가중치용
- `note` 자유서술 — 정성 분석용(집계 제외)

### 1.3 저장 방식 — **마이그레이션 없이 시작**

`user_feedback`(TEXT)에 **컴팩트 JSON 문자열**로 적재한다. FE가 구조화해 보내고 BE는 그대로 저장 → **#77/스키마 변경 0, API 변경 0**.

```json
{"thermal":"HOT","intensity":2,"note":"발바닥 뜨거워했어요"}
```

- 빈 피드백(미응답)은 기존처럼 `NULL` 유지.
- MySQL 8은 TEXT라도 유효 JSON이면 `JSON_EXTRACT(user_feedback,'$.thermal')`로 추출 가능(§4).

> **(후속, 선택) Week 5 정식 컬럼 승격**: 표본이 의미 있게 쌓이고 쿼리가 잦아지면
> `ALTER TABLE walks ADD COLUMN feedback_thermal ENUM('HOT','OK','COLD') NULL`을 추가해 인덱스/집계를 단순화한다.
> 지금은 JSON-in-TEXT로 충분(스키마 정본 `05-database.md`엔 "컨벤션"으로만 명시, 컬럼 추가는 보류).

---

## 2. 괴리 매트릭스 (모델 level × 체감 thermal)

핵심 질문: **모델이 경고한 만큼 실제로 힘들었나?** 룰베이스는 더위/한파에 감점하므로 "경고(주의·위험) = discomfort 예측"으로 본다.

|  | 체감 `OK`(적당) | 체감 `HOT`/`COLD`(힘듦) |
| --- | --- | --- |
| **모델 `안전`** | ✅ 정합 (TN) | 🔴 **과소경보 (FN)** — 모델이 위험을 놓침 *(가장 위험한 오류)* |
| **모델 `주의`/`위험`** | 🟡 **과대경보 (FP)** — 모델이 과하게 겁줌 | ✅ 정합 (TP) |

- **FN(과소경보)** = 안전이라 했는데 사용자가 더웠/추웠음 → **임계값을 낮춰야**(더 민감하게). 안전 직결이라 **최우선 점검**.
- **FP(과대경보)** = 경고했는데 적당 → 임계값이 과하게 보수적. 신뢰도(겁쟁이 모델) 저하 요인.
- 지표화: 정밀도 `TP/(TP+FP)`, 재현율 `TP/(TP+FN)`. **재현율을 우선**(놓친 위험 최소화).

> 더위/추위 방향 일치도 함께 본다: 모델 사유가 `FEELS_COLD`인데 체감 `HOT`이면 방향 자체가 어긋난 것 → 룰 오작동 신호.

---

## 3. 데이터 흐름

```
[산책 종료] FE 피드백 카드 → userFeedback(JSON 문자열)
   → POST /api/walks/{walkId}/end  (API 변경 없음)
   → walks.user_feedback 저장
                                  ┌ walk_scores (walk_id, level, score, reason)
[분석] 수집 뷰 = walks ⨝ ─────────┤
                                  └ weather_snapshots (feels_like, ground_temp, uv, pm…)
                          ⨝ dogs ⨝ dog_breeds (size: 단두종 등 세그먼트)
```

수집은 **운영 DB 직접 조회(읽기 전용)** 로 시작. 별도 ETL/배치는 표본이 쌓인 뒤 판단(과설계 금지).

---

## 4. 수집 쿼리 (MySQL 8)

> 모두 **읽기 전용**. `deleted_at IS NULL`, 종료된 산책(`end_time` 있음), 피드백 있는 건만.

### 4.1 산책별 괴리 뷰 (원천 1행/산책)
```sql
SELECT
  w.id AS walk_id,
  w.dog_id,
  b.size                              AS breed_size,     -- 단두종 세그먼트는 breed 메타로 보강
  ws.level                            AS model_level,
  ws.score                            AS model_score,
  ws.reason                           AS model_reason,
  JSON_UNQUOTE(JSON_EXTRACT(w.user_feedback,'$.thermal'))   AS fb_thermal,
  CAST(JSON_EXTRACT(w.user_feedback,'$.intensity') AS UNSIGNED) AS fb_intensity,
  wsnap.feels_like_temperature        AS feels_like,
  wsnap.ground_temperature            AS ground_temp,
  wsnap.uv_index, wsnap.pm_10, wsnap.humidity,
  /* 괴리 분류 */
  CASE
    WHEN ws.level = '안전' AND JSON_UNQUOTE(JSON_EXTRACT(w.user_feedback,'$.thermal')) IN ('HOT','COLD')
      THEN 'FN_과소경보'
    WHEN ws.level IN ('주의','위험') AND JSON_UNQUOTE(JSON_EXTRACT(w.user_feedback,'$.thermal')) = 'OK'
      THEN 'FP_과대경보'
    ELSE 'HIT_정합'
  END AS divergence
FROM walks w
JOIN walk_scores ws        ON ws.walk_id = w.id              -- A-2 연결 덕분에 가능
LEFT JOIN weather_snapshots wsnap ON wsnap.id = ws.weather_snapshot_id
JOIN dogs d                ON d.id = w.dog_id
LEFT JOIN dog_breeds b     ON b.id = d.breed_id
WHERE w.deleted_at IS NULL
  AND w.end_time IS NOT NULL
  AND w.user_feedback IS NOT NULL
  AND JSON_VALID(w.user_feedback);
```

### 4.2 괴리 매트릭스 집계 (level × thermal)
```sql
SELECT ws.level AS model_level,
       JSON_UNQUOTE(JSON_EXTRACT(w.user_feedback,'$.thermal')) AS fb_thermal,
       COUNT(*) AS n
FROM walks w
JOIN walk_scores ws ON ws.walk_id = w.id
WHERE w.end_time IS NOT NULL AND w.deleted_at IS NULL
  AND JSON_VALID(w.user_feedback)
GROUP BY model_level, fb_thermal
ORDER BY model_level, fb_thermal;
```

### 4.3 과소경보(FN) 튜닝 후보 — 체감온도 구간별
"안전이라 했는데 더웠다"가 어느 체감온도 밴드에서 터지는지 → **`FEELS_HOT`(≥33℃) 임계값을 내릴지 판단**.
```sql
SELECT FLOOR(wsnap.feels_like_temperature/2)*2 AS feels_band,  -- 2℃ 버킷
       COUNT(*) AS fn_count
FROM walks w
JOIN walk_scores ws        ON ws.walk_id = w.id
JOIN weather_snapshots wsnap ON wsnap.id = ws.weather_snapshot_id
WHERE ws.level = '안전'
  AND JSON_UNQUOTE(JSON_EXTRACT(w.user_feedback,'$.thermal')) = 'HOT'
  AND w.end_time IS NOT NULL AND w.deleted_at IS NULL AND JSON_VALID(w.user_feedback)
GROUP BY feels_band ORDER BY feels_band DESC;
```

### 4.4 단두종 세그먼트 (BRACHY_HEAT 검증)
`dog_breeds.is_brachycephalic`(BOOLEAN)가 룰 `BRACHY_HEAT`와 1:1 대응 → 추정 없이 정확히 가른다.
```sql
SELECT b.is_brachycephalic, ws.level,
       JSON_UNQUOTE(JSON_EXTRACT(w.user_feedback,'$.thermal')) AS fb_thermal,
       COUNT(*) n
FROM walks w
JOIN walk_scores ws ON ws.walk_id = w.id
JOIN dogs d         ON d.id = w.dog_id
JOIN dog_breeds b   ON b.id = d.breed_id
WHERE w.end_time IS NOT NULL AND JSON_VALID(w.user_feedback)
GROUP BY b.is_brachycephalic, ws.level, fb_thermal;
```
> 단두종 군(`is_brachycephalic = TRUE`)에서 과소경보(FN)가 비단두종보다 높으면 `BRACHY_HEAT`(단두종+기온≥28℃) 임계 강화(예: 기온 문턱 ↓) 근거가 된다. `size`(소/중/대형)는 보조 세그먼트로만.

---

## 5. 운영 가드 (튜닝 착수 기준)

데이터가 적을 때 튜닝하면 노이즈에 과적합한다. **수집은 지금부터, 임계값 변경은 아래 충족 후.**

- **셀당 최소 표본**: 매트릭스 한 칸(level×thermal) **n ≥ 30** 전엔 그 칸 근거로 룰 수정 금지.
- **FN 우선**: 과소경보(안전 오판)부터 검토 — 안전 직결.
- **변경은 1축씩**: 한 번에 임계값 하나만 조정하고 재수집으로 효과 확인(A/B처럼).
- **PII 없음**: 집계는 dog_id·견종·날씨까지만. 사용자 식별정보 미사용. note(자유서술)는 정성 검토용, 집계/외부 공유 금지.

---

## 6. 인접 영역 인계 (영역 경계)

- **FE 피드백 카드 UI(비주얼·문구·레이아웃) = 정선혜 영역.** 이 문서는 **카드가 emit해야 할 데이터 계약**만 규정한다:
  - 필수: `thermal ∈ {HOT, OK, COLD}` → `userFeedback` JSON으로 직렬화해 종료 요청에 포함.
  - 선택: `intensity ∈ {1,2}`, `note`(string).
  - 빈 응답이면 `userFeedback` 미전송(NULL 유지).
- **BE**: 종료 API(`/api/walks/{walkId}/end`)는 **변경 불필요**(String 그대로 저장). 단 §1.3 JSON 컨벤션을 `06-api-spec.md` 종료 항목에 한 줄 주석으로 명시 권장.
- **AI(임재영)**: 위 수집 쿼리를 `ai/scripts/`에 노트북/스크립트로 두고, 표본 누적 시 §2 지표·§4.3 밴드로 룰 튜닝 PR 제안.

---

## 7. 체크리스트 (착수 순서)

- [ ] (FE/정선혜) 종료 피드백 카드가 `userFeedback`에 §1.2 JSON을 실어 보냄
- [ ] (문서) `06-api-spec.md` 종료 항목에 JSON 컨벤션 주석 1줄
- [ ] (AI/임재영) `ai/scripts/feedback_divergence.sql` 또는 노트북에 §4 쿼리 적재
- [ ] (운영) 표본 셀당 n≥30 도달 모니터 → 도달 시 §2 지표 산출 → 튜닝 PR
- [ ] (후속/선택) 쿼리 빈번해지면 `feedback_thermal` 컬럼 승격 + `05-database.md` 반영
