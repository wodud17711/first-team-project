# 📅 6주 주차별 로드맵

> **기간**: 2026-05-19 ~ 2026-06-30 (6주)
> **팀**: 4명 (BE × 2 / FE × 1 / AI × 1, PM은 겸직 또는 별도)
> **목표**: MVP 5개 기능 완성 (인증·반려견 프로필·**AI 위험도**·산책 기록·커뮤니티)

이 문서는 [docs/02-features.md](./02-features.md)의 MVP 정의와 [docs/05-database.md](./05-database.md)의 schema v1.3 기반입니다.

---

## 🎯 전체 그림

| 주차 | 기간 | 키 테마 | 핵심 산출물 |
|---|---|---|---|
| Week 1 | 5/19-5/25 | 환경 세팅 + 설계 매듭 | 페르소나·와이어프레임·시드 데이터 |
| Week 2 | 5/26-6/1 | 인증 + 반려견 프로필 | 회원가입 ~ 반려견 등록 e2e |
| Week 3 | 6/2-6/8 | **AI 산책 위험도** (핵심 차별화) | 점수 카드 + 룰베이스 v1 |
| Week 4 | 6/9-6/15 | 산책 기록 + 커뮤니티 | 산책 기록 + 게시판 + 댓글 |
| Week 5 | 6/16-6/22 | UX 향상 + 통계 | 통계·캘린더·알림·디자인 적용 |
| Week 6 | 6/23-6/29 | QA + 배포 + 발표 | 배포 환경 + 발표 자료 |

---

## 🟢 Week 1 (5/19 ~ 5/25) · 환경 세팅 + 설계 매듭

**목표**: 다음 주부터 코드만 짜면 되는 상태 만들기

### ✅ 이미 완료
- GitHub 저장소 + Branch Protection + develop 브랜치
- Notion 협업 페이지 (프로젝트 허브 · Git 가이드 · 일일 회고 · API 키 가이드 · 일일 회고 DB)
- React 19 + Vite + Tailwind + Router + Axios 초기 세팅
- DB 스키마 v1.3 (24테이블)
- ERD DBML 시각화 (`docs/erd.dbml`)
- 백엔드 코딩 가이드 (`docs/10-backend-coding-guide.md`)
- 폴더 rename (be → backend / fe → frontend)
- 커뮤니티 카테고리 5개 + 서브태그 시스템

### 🟡 이번 주 마저 끝낼 것

| 담당 | 작업 | 산출물 |
|---|---|---|
| PM | 팀원별 실제 담당 확정 (이름 매핑) | 노션 프로젝트 허브 |
| PM | AI 처리 구조 결정 (백엔드 통합 vs FastAPI) | docs/03 + CLAUDE.md 갱신 |
| PM | 경쟁 서비스 분석 마무리 | competitor-analysis.html (로컬) |
| PM | 사용자 페르소나 3종 정의 | 노션 문서 |
| BE | 외부 API 신청 완료 (기상청·에어코리아·OpenAI·카카오) | API 키 + 노션 상태 ✅ |
| BE | 패키지 구조 + ApiResponse + GlobalExceptionHandler 스켈레톤 | `backend/src/.../common/` PR |
| FE | Figma 와이어프레임 6페이지 (저충실도) | Figma 링크 |
| FE | 디자인 시스템 (컬러·폰트·spacing) | Figma + `tailwind.config.js` 반영 |
| AI | Kaggle 데이터셋 다운로드 + EDA | `ai/notebooks/01_eda.ipynb` |

---

## 🟡 Week 2 (5/26 ~ 6/1) · 인증 + 반려견 프로필

**목표**: 사용자가 가입하고 반려견 정보를 등록할 수 있는 상태

### BE
- [ ] User Entity + Repository + Service
- [ ] AuthController: signup / login / logout / refresh
- [ ] JWT 발급·검증 (Spring Security)
- [ ] PasswordEncoder (BCrypt)
- [ ] Dog Entity + DogController (CRUD)
- [ ] DogBreed Entity (read-only, 시드 활용)
- [ ] 단위 테스트 (Service 레이어)

### FE
- [ ] 로그인 / 회원가입 페이지
- [ ] 반려견 등록 폼 (견종 드롭다운 · 체중 · 털 길이 등)
- [ ] 반려견 목록 / 상세 / 수정 / 삭제
- [ ] axios 인터셉터 JWT 자동 첨부 연동 확인
- [ ] 프로필 이미지 업로드 (로컬 또는 S3)

### AI / Data
- [ ] Kaggle 데이터셋 정제 → `dog_breeds` 시드 SQL 작성
  - `is_brachycephalic`, `heat_tolerance`, `cold_tolerance` 컬럼 채우기
- [ ] 기상청 API 응답 구조 분석 + Python 호출 예제

### 통합
- [ ] **e2e 시나리오 1**: 회원가입 → 로그인 → 반려견 등록 → 목록 조회

---

## 🔴 Week 3 (6/2 ~ 6/8) · AI 산책 위험도 (핵심 차별화)

**목표**: "오늘 우리 강아지 산책 가능한가?"에 답변하는 핵심 기능 완성

### AI / Data
- [ ] 룰베이스 v1 함수 완성 (`calculate_walk_risk()`)
  - 지면온도 · 기온 · 습도 · 미세먼지 × 견종 특성 (단두종 · 내열 · 내한)
- [ ] 룰별 가중치 표 (노션)
- [ ] 단위 테스트 10개 케이스

### BE
- [ ] 기상청 단기예보 API 클라이언트 (`WeatherClient`)
- [ ] 에어코리아 API 클라이언트
- [ ] 위경도 → 격자 좌표 변환 유틸
- [ ] **`WeatherSnapshot` 캐싱 로직** (같은 좌표+시각 = 같은 결과)
- [ ] `WalkScoreService`: 위험도 계산 + DB 기록
- [ ] `GET /api/walk/score?dogId={id}` 엔드포인트
- [ ] `GET /api/walk/optimal-time` (시간대별 점수 분석)

### FE
- [ ] 홈 화면 (오늘의 산책 점수 카드)
- [ ] 위험 사유 표시 컴포넌트
- [ ] 최적 산책 시간 추천 UI
- [ ] 준비물 알림 카드 (강수 시 우산 등)
- [ ] **카카오 지도 SDK 연동** (현재 위치 마커)

### 통합
- [ ] **e2e 시나리오 2**: 로그인 → 반려견 선택 → 위험도 조회 → 점수·사유·추천 시간 확인

---

## 🟣 Week 4 (6/9 ~ 6/15) · 산책 기록 + 커뮤니티

**목표**: 산책을 기록하고 견주끼리 글을 주고받을 수 있는 상태

### BE
- [ ] Walk Entity + Service
- [ ] `POST /api/walks/start`, `/end`
- [ ] `GET /api/walks/history?dogId=`
- [ ] **카테고리 + 게시판 API 전체** (sub_tag 포함)
  - `GET /api/categories`
  - `POST /api/posts`, `GET /api/posts`, `GET /api/posts/{id}`
  - `PATCH/DELETE /api/posts/{id}`
- [ ] Comments API (1단계 대댓글)
- [ ] Post Likes API (`POST /api/posts/{id}/likes`)
- [ ] Post Images 업로드 API

### FE
- [ ] 산책 시작/종료 화면 (큰 버튼, 타이머)
- [ ] 산책 기록 목록 페이지
- [ ] 산책 종료 후 피드백 입력 폼
- [ ] **커뮤니티 화면**: 카테고리 5개 탭
- [ ] **서브태그 필터 버튼** (`[전체][사료][간식]`)
- [ ] 글 작성 폼 (서브태그 라디오 선택)
- [ ] 글 목록 (`[사료] 제목` 형식)
- [ ] 글 상세 + 댓글 + 좋아요

### AI
- [ ] 산책 종료 후 피드백 수집 → 룰베이스 보완 데이터 분석

### 통합
- [ ] **e2e 시나리오 3**: 위험도 확인 → 산책 시작 → 종료 → 통계 누적
- [ ] **e2e 시나리오 4**: 글 작성([사료] 추천) → 댓글 → 좋아요

---

## 🔵 Week 5 (6/16 ~ 6/22) · UX 향상 + 통계

**목표**: MVP 완성도 끌어올리기 — 통계 · 캘린더 · 디자인 · 알림

### BE
- [ ] 산책 통계 API (`GET /api/walks/statistics?range=week|month`)
- [ ] 산책 캘린더 API (월별 산책 여부)
- [ ] 알림 API (`GET /api/notifications`, `PATCH /read`)
- [ ] 알림 생성 트리거 (댓글 달림 · 좋아요 · 동반 신청)
- [ ] 사용자 정보 수정 API
- [ ] 이미지 업로드 (게시글 · 반려견 프로필)

### FE
- [ ] 산책 통계 화면 (차트 - Recharts 또는 Chart.js)
- [ ] 산책 캘린더 (월별 히트맵)
- [ ] 마이페이지 (수정 · 로그아웃)
- [ ] 알림 벨 아이콘 + 드롭다운
- [ ] 게시글 이미지 첨부
- [ ] **디자인 시스템 전체 적용** (Figma → 실제 UI)
- [ ] 반응형 마무리

### AI
- [ ] 1주차 누적 피드백 분석 → 룰베이스 v2 (가중치 조정)

### 통합
- [ ] 전체 화면 디자인 review
- [ ] 모바일 뷰 동작 확인

---

## 🟠 Week 6 (6/23 ~ 6/29) · QA + 배포 + 발표

**목표**: 팀 외부에서 써볼 수 있는 상태 + 발표 준비

### 월 · 화 (6/23-24)
- [ ] 전체 시나리오 QA (가입 ~ 산책 종료까지)
- [ ] 버그 리스트업 + 우선순위 분류
- [ ] 보안 점검 (`.env`, JWT 만료, CORS, SQL Injection)

### 수 · 목 (6/25-26)
- [ ] 버그 픽스 (P0/P1)
- [ ] 백엔드 배포: Railway 또는 AWS EC2
- [ ] DB: RDS 또는 PlanetScale
- [ ] 프론트 배포: Vercel
- [ ] 환경변수 운영 분리
- [ ] HTTPS 적용

### 금 (6/27)
- [ ] 시드 데이터 입력 (배지·미션·산책로 샘플)
- [ ] 친구·지인 대상 베타 테스트 (5명+)
- [ ] 피드백 수집

### 주말 (6/28-29)
- [ ] 발표 자료 (PPT 15~20장)
  - 문제 정의 / 해결책 / 시연 / 차별점 / 기술 스택 / 향후 계획
- [ ] **시연 영상** 녹화 (3분)
- [ ] 시연 리허설 (시간 측정)
- [ ] README + docs 최종 정리

---

## 📊 우선순위 매트릭스

| 우선순위 | 기능군 | 주차 |
|---|---|---|
| **P0** (필수) | 인증 · 반려견 프로필 · AI 위험도 | Week 2-3 |
| **P1** (MVP) | 산책 기록 · 커뮤니티 | Week 4 |
| **P2** (UX) | 통계 · 캘린더 · 알림 | Week 5 |
| **P3** (보강) | 디자인 다듬기 · 이미지 업로드 | Week 5 |
| **Phase 2** | 1:1 채팅 · 게이미피케이션 · 산책로 추천 · 견주 유형 · OpenAI Q&A | 추후 |
| **Phase 3** | 실시간 GPS 트래킹 | 모바일 앱 |

자세한 분류: [docs/02-features.md](./02-features.md)

---

## ⚠️ 매주 공통 루틴

- **월요일 오전 10시**: 주간 킥오프 + 지난주 회고
- **매일 퇴근 전**: `git push` + 일일 회고 작성 (노션)
- **매일 오전 10시**: `git pull origin develop && git merge develop` (충돌 폭탄 방지)
- **금요일 오후 5시**: 주간 회고 + 다음주 계획
- **PR 머지 규칙**: feature 브랜치 → develop, 리뷰어 1명+ Approve

자세한 Git 흐름: 노션 "Git 협업 가이드"

---

## 🚨 리스크 & 대응

| 리스크 | 대응 |
|---|---|
| 외부 API 신청 지연 (1~2일) | Week 1에 미리 신청 완료 |
| AI 룰베이스 정확도 부족 | Week 3에 충분한 케이스 + Week 5 피드백 루프 |
| 디자인 vs 개발 일정 어긋남 | Figma는 Week 1 완료, 개발은 Week 2부터 |
| 통합 테스트 시간 부족 | 매주 e2e 시나리오 1개씩 검증 |
| 6주 일정 빠듯 | **Phase 2 기능 절대 끌어오지 않기** (1:1 채팅 등) |

---

## 🔗 관련 문서

- 기능 명세 (MVP / Phase 분류): [02-features.md](./02-features.md)
- 기술 스택: [03-tech-stack.md](./03-tech-stack.md)
- DB 설계 (schema v1.3): [05-database.md](./05-database.md)
- API 명세: [06-api-spec.md](./06-api-spec.md)
- 위험도 룰베이스: [08-risk-rules.md](./08-risk-rules.md)
- 백엔드 코딩 가이드: [10-backend-coding-guide.md](./10-backend-coding-guide.md)

---

_📅 작성일: 2026-05-19_
