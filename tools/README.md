# 🧪 외부 API 작동 테스트

기상청·에어코리아·카카오 API가 실제로 동작하는지 한 번에 확인하는 스크립트입니다.
**Node 18+ 만 있으면 추가 설치 불필요** (built-in fetch 사용).

## 사용법

```bash
# 1. 키 파일 생성
cd tools
cp .env.example .env

# 2. .env 에 실제 키 입력
#    WEATHER_API_KEY=...
#    AIRQUALITY_API_KEY=...
#    KAKAO_REST_API_KEY=...

# 3. 실행 (프로젝트 루트 또는 어디서든)
node tools/test-apis.mjs
```

## 결과

- 콘솔에 API별 `✅ PASS` / `❌ FAIL` + 핵심 값 출력
- `tools/samples/` 에 실제 응답 JSON 저장
  - `weather-sample.json`
  - `airkorea-sample.json`
  - `kakao-keyword-sample.json`

> 💡 저장된 샘플 JSON을 **API 명세서 작성자에게 공유**하세요.

## 자주 나오는 에러

| 증상 | 원인 / 해결 |
| --- | --- |
| `JSON 파싱 실패` | 기상청 키 인코딩 문제 → Decoding 키로 시도 |
| `resultCode 03` (NO_DATA) | base_time이 미래 → 잠시 후 재시도 |
| `resultCode 30` | 서비스키 미등록 → 키 확인 |
| 카카오 `401` | Authorization 헤더 형식 (`KakaoAK ` + 키) |
| 카카오 지도 회색 박스 | 콘솔 플랫폼에 `http://localhost:5173` 미등록 |

## 참고
- 외부 API 상세: [`docs/09-external-apis.md`](../docs/09-external-apis.md)
- 카카오 지도 SDK는 프론트엔드에서 별도 확인 (이 스크립트는 REST API만 테스트)
