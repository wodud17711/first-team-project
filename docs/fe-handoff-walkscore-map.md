# FE 인계 가이드 — 카카오 지도 · 위험사유 카드

> 대상: 프론트(정선혜). PM(임재영)이 만든 재사용 컴포넌트/유틸을 산책·홈 화면에 배선할 때 참고.
> 관련 PR: #72(카카오 지도) · #70(위험사유 매핑). 레이아웃·아이콘 에셋·색은 FE 영역 — 이 문서는 **인터페이스**만 제공.

---

## 1. 카카오 지도 `<KakaoMap/>`

현재 위치 지도(geolocation 중심 + 마커). 권한 거부/실패 시 **부산 폴백**, SDK·키 오류 시 안내(앱 안 깨짐).

```jsx
import KakaoMap from '../components/KakaoMap'

<KakaoMap height={360} />            // 산책 화면 등 원하는 위치에 배치
```

**Props**

| prop | 기본값 | 설명 |
| --- | --- | --- |
| `level` | `4` | 카카오 줌 레벨(작을수록 확대) |
| `height` | `320` | 지도 높이(px) |
| `className` | `''` | 래퍼 div 추가 클래스 |

**⚠️ 셋업 (안 하면 흰 화면)**

1. `frontend/.env` 에 `VITE_KAKAO_MAP_KEY=<카카오 JavaScript 앱키>` 추가 (`.env` 는 gitignore — 커밋 금지, 팀 dev 키 공유받아 사용)
2. 카카오 developers > 앱 설정 > **JavaScript SDK 도메인**에 `http://localhost:5173` 등록
   - 미등록 시 키가 맞아도 지도가 안 뜸(도메인 mismatch)
3. 지도가 들어갈 페이지는 `localhost:5173` 로 접속(`127.0.0.1` X — CORS·도메인 등록 기준)

> 상태 처리는 컴포넌트 내부에서 자동: 로딩("지도를 불러오는 중…") / 부산 폴백(배지) / 오류("지도를 불러오지 못했어요"). 호출부는 배치만 신경 쓰면 됨.

---

## 2. 위험사유 카드 `toDisplayReasons()`

BE `/api/walk/score` 응답의 **사유 코드+문장**을 카드 표시용 객체 배열로 변환.

```jsx
import { toDisplayReasons } from '../constants/riskReasons'

// data = useWalkScore(dogId) 결과 (= /api/walk/score 응답)
const items = toDisplayReasons(data.topReasonCodes, data.topReasons)
// 전체 사유를 쓰려면 data.reasonCodes, data.reasons 그대로 넣어도 됨

items.map(it => (
  <li key={it.code}>
    <Icon name={it.iconKey} />        {/* iconKey → 실제 아이콘 매핑은 FE에서 */}
    <span>{it.message}</span>          {/* 그대로 보여줄 한글 문장 */}
  </li>
))
```

**반환 객체 1건의 형태**

```js
{ code, message, category, categoryLabel, iconKey, severity }
```

| 필드 | 예 | 용도 |
| --- | --- | --- |
| `message` | "지면이 매우 뜨거워 발바닥 화상 위험이 큽니다" | **그대로 출력**(BE 문장) |
| `categoryLabel` | "지면온도" | 분류 칩/라벨 |
| `iconKey` | `ground` | **FE가 실제 아이콘 에셋에 매핑**(아래 키 목록) |
| `severity` | `high` \| `medium` \| `low` \| `none` | 개별 사유 시각 강조용(빨강/주황/회색 등). **산책 등급(안전/주의/위험)과 다름** — 등급은 BE `level` 정본 |

> 길이/누락에도 안전: codes 가 없거나 길이가 어긋나도 `message` 는 살리고 메타는 폴백(`기타`/`info`).

**iconKey 목록** (FE가 아이콘 정하면 됨)

| iconKey | 의미 | 해당 사유 코드(예) |
| --- | --- | --- |
| `ground` | 지면온도 | GROUND_TEMP_SEVERE, GROUND_TEMP_HIGH |
| `heat` | 더위 | FEELS_HOT, BRACHY_HEAT, LOW_HEAT_TOLERANCE, LONG_COAT_HEAT, SENIOR_HEAT |
| `humidity` | 습도 | HUMID_HEAT |
| `cold` | 추위 | FEELS_COLD, LOW_COLD_TOLERANCE, SMALL_SHORT_COLD, SENIOR_COLD |
| `air` | 미세먼지 | PM_VERY_BAD, PM_BAD, SENIOR_BAD_AIR |
| `snow` | 눈 | SNOW |
| `rain` | 비 | RAIN |
| `temp` | 기온 | PUPPY_EXTREME |
| `wind` | 바람 | STRONG_WIND |
| `uv` | 자외선 | UV_VERY_HIGH, UV_HIGH |
| `clear` | 양호(사유 없음) | ALL_CLEAR |
| `info` | 기타(미지 코드 폴백) | — |

> 매핑 정본은 `frontend/src/constants/riskReasons.js`(`RISK_REASON_MAP`). 룰 추가로 새 코드가 생겨도 미지 코드는 `기타/info` 폴백이라 카드가 안 깨짐.

**참고**: 미세먼지/강수 사유(PM_*, RAIN, SNOW)는 BE 미세먼지·강수 배선(#71) 전까진 응답에 안 떠서 카드에도 안 보임(정상).

---

## 빠른 체크리스트 (정선혜)
- [ ] `frontend/.env` 에 `VITE_KAKAO_MAP_KEY` + 카카오 콘솔 도메인 등록
- [ ] 산책/홈 화면에 `<KakaoMap/>` 배치
- [ ] WalkScore 카드에 `toDisplayReasons(topReasonCodes, topReasons)` → 사유 리스트 렌더
- [ ] `iconKey` 11종 → 아이콘 에셋 매핑, `severity` → 색 강조 결정
