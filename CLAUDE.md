# CLAUDE.md

> 이 파일은 Claude Code가 작업 시작 시 자동으로 참고하는 프로젝트 컨텍스트 문서입니다.

---

## 🐾 프로젝트

**반려견 산책 라이프 플랫폼**
날씨와 반려견 데이터를 기반으로 맞춤형 산책 가이드를 제공하는 서비스

---

## 🛠️ 기술 스택

- **Backend**: Spring Boot 4.0.6, Java 21, Gradle
- **Frontend**: React 19 + Vite + **JavaScript** (TypeScript 점진 도입 가능)
  - React Router, Axios, Tailwind CSS 설치 완료
- **Database**: MySQL 8.0 (운영), H2 (테스트)
- **AI 처리**: ✅ **FastAPI 분리 확정** (Python 룰베이스 별도 서비스, Spring이 HTTP 호출)
- **외부 API**: 기상청 단기예보, 에어코리아, OpenAI, 카카오 지도

---

## 📁 디렉토리 구조

```
프로젝트 루트/
├── CLAUDE.md              # 이 파일
├── docs/                  # 모든 설계 문서
│   ├── README.md
│   ├── 01-project-overview.md
│   ├── 02-features.md
│   ├── 03-tech-stack.md
│   ├── 04-architecture.md
│   ├── 05-database.md
│   ├── 06-api-spec.md
│   ├── 07-personas.md
│   ├── 08-risk-rules.md
│   └── 09-external-apis.md
├── backend/               # Spring Boot
├── frontend/              # React + Vite
└── ai/                    # ✅ FastAPI 분리 (Python 룰베이스 위험도 서비스)
```

---

## 📚 문서 참조 가이드

작업 유형별로 다음 문서를 참조하세요:

| 작업 | 우선 참조 문서 |
| --- | --- |
| **이번 주 할 일 / 일정** | `docs/weekly-roadmap.md` |
| **새 기능 구현** | `docs/02-features.md` → `docs/06-api-spec.md` |
| **백엔드 코드 작성** | `docs/10-backend-coding-guide.md` |
| **DB 작업 / 엔티티** | `docs/05-database.md` + `backend/schema.sql` (v1.4) |
| **API 추가/수정** | `docs/06-api-spec.md` |
| **외부 API 연동** | `docs/09-external-apis.md` |
| **위험도 계산 로직** | `docs/08-risk-rules.md` |
| **시스템 흐름 이해** | `docs/04-architecture.md` |
| **사용자 관점 설계** | `docs/07-personas.md` |

---

## ⚙️ 개발 컨벤션

### 커밋 메시지
Conventional Commits 형식:
```
feat: 새 기능
fix: 버그 수정
docs: 문서 수정
refactor: 리팩토링
test: 테스트 코드
chore: 빌드/설정
```

### 브랜치 전략
```
main              # 배포 가능 코드 (직접 push 금지)
develop           # 개발 통합
feature/{도메인}-{작업}
fix/{도메인}-{작업}
```

### 코드 스타일
- **Java**: Google Java Style + Lombok 활용
- **JavaScript**: ESLint + Prettier (Vite 기본 ESLint 적용 중)
- **Python**: PEP 8 + black (AI 작업 시)

### API 응답 형식 (필수 준수)

**성공**
```json
{
  "success": true,
  "data": { ... },
  "message": "..."
}
```

**실패**
```json
{
  "success": false,
  "data": null,
  "message": "에러 메시지",
  "errorCode": "ERROR_CODE"
}
```

자세한 규칙: `docs/06-api-spec.md` 참고

---

## 🚧 현재 진행 상황

**Week 1 완료 (2026-05-22 기준)**
- ✅ 협업 환경 (GitHub, Notion) + **GitHub Actions CI** (PR마다 빌드 검사 + 브랜치 보호)
- ✅ 폴더 rename 완료 (`backend/`, `frontend/`, `ai/`), 포트 **8081** 고정
- ✅ DB 스키마 **v1.4** (25테이블 — refresh_tokens + users.role), ERD DBML
- ✅ 프론트 세팅 + **디자인 시스템 컬러 토큰(파스텔)·무드보드 v0.5·사용자 플로우 3종**
- ✅ 백엔드 세팅 + **공통 응답·예외 스켈레톤** (`common`: ApiResponse·ErrorCode·BusinessException·GlobalExceptionHandler)
- ✅ 외부 API 4종 신청 / API 명세서 v3.2
- ✅ AI: **dog_breeds 388종 시드 SQL** + 룰베이스 v1 + 값 근거 문서(`ai/견종-데이터-근거.md`)
- ✅ **AI 처리 구조 = FastAPI 분리 확정**
- 🔄 인증(로그인/JWT) PR #13 — CI 통과, 머지 직전 (Week 2 선행 진행)
- 🔄 Figma 와이어프레임 마무리 (FE)

---

## ⚠️ 주의사항

### API 키 보안
- 모든 API 키는 환경변수로 관리
- `.env` 파일은 절대 커밋 금지 (`.gitignore`에 등록)
- 키 노출 시 즉시 팀에 공유
- **JWT 시크릿**: `application.properties`엔 `jwt.secret=${JWT_SECRET}`(키 텍스트 없음). 값은 환경변수 — CI는 GitHub Actions Secret, 로컬은 각자 env, 운영은 배포 env. (공개 레포에 키 노출 금지)

### 외부 API 호출 한도
- 기상청·에어코리아 API는 **1일 1,000회** 제한 (개발 계정)
- 반드시 캐싱 적용 (같은 좌표+같은 시각 = 같은 결과)
- 잘못된 파라미터로도 호출 횟수 차감됨 (`pageNo` 오타 등 주의!)

### 코드 작성 시
1. Entity 변경 시 → `docs/05-database.md` 함께 업데이트
2. API 변경 시 → `docs/06-api-spec.md` 함께 업데이트
3. 새 외부 의존성 추가 시 → `docs/03-tech-stack.md`에 명시

---

## 👥 팀

- **백엔드 1**: 오연수
- **백엔드 2**: 윤소윤
- **프론트엔드**: 정선혜
- **AI / PM**: 임재영 (@wodud17711, 룰베이스 모델 + 데이터 분석 + 일정·조율)

---

## 📅 주차별 로드맵 (6주, 2026-05-19 ~ 06-30)

상세: [`docs/weekly-roadmap.md`](./docs/weekly-roadmap.md)

| 주차 | 기간 | 키 테마 |
| --- | --- | --- |
| **Week 1** | 5/19-5/25 | 환경 세팅 + 설계 매듭 ✅ 완료 |
| Week 2 | 5/26-6/1 | 인증 + 반려견 프로필 |
| Week 3 | 6/2-6/8 | **AI 산책 위험도 (핵심 차별화)** |
| Week 4 | 6/9-6/15 | 산책 기록 + 커뮤니티 |
| Week 5 | 6/16-6/22 | 통계·캘린더·디자인 적용 |
| Week 6 | 6/23-6/29 | QA + 배포 + 발표 |

### MVP 범위 (Phase 분리)
- **MVP (P0~P2)**: 인증 / 반려견 프로필 / AI 위험도 / 산책 기록 / 커뮤니티 / 통계
- **Phase 2 (보류)**: 1:1 채팅 · 게이미피케이션 · 산책로 추천 · 견주 유형 · OpenAI Q&A
- **Phase 3 (모바일)**: 실시간 GPS 트래킹

### 주요 결정 사항 (기록)
- 폴더명: `backend/`, `frontend/`, `ai/` (be/fe에서 rename됨)
- 프론트 언어: **JavaScript** (TS 점진 도입 가능)
- 지도: **카카오 Maps SDK** (1차)
- DB 스키마: **v1.4** (25테이블 — refresh_tokens + users.role)
- **AI 처리 구조: FastAPI 분리 확정** (Python 룰베이스 별도 서비스, Spring이 HTTP 호출)
- **공통 패키지: `common`** (ApiResponse·ErrorCode·BusinessException·GlobalExceptionHandler)
- **응답 포맷: flat** `{success, data, message, errorCode}` — 정본은 `docs/06-api-spec.md`
- **JWT 시크릿: 환경변수 `${JWT_SECRET}`** (레포 미커밋 / GitHub Secret·로컬 env)
- 인증: **RT HttpOnly 쿠키** + `/api/auth/refresh` + 로테이션 미적용(MVP)
- 견종: dog_breeds **388종**, 믹스 명명 `부모1 × 부모2` / `이름(부모×부모)`
- 디자인: **파스텔 톤 확정** (연두 #AEEA94 · 연노랑 #FFFBCA · 하늘 #7BD3EA + warm gray)
- **브랜치명: 영문·하이픈만** (한글 X)
- 커뮤니티 카테고리: 사료·간식 / 병원·영양제 / 산책로 추천 / 반려견 자랑 / 산책 메이트 찾기
