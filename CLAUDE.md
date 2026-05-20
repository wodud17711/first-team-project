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
- **AI 처리**: ⏳ 구조 검토 중 (백엔드 통합 vs FastAPI 분리)
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
└── ai-server/             # ⏳ 구조 미정 (백엔드 통합 가능성)
```

---

## 📚 문서 참조 가이드

작업 유형별로 다음 문서를 참조하세요:

| 작업 | 우선 참조 문서 |
| --- | --- |
| **새 기능 구현** | `docs/02-features.md` → `docs/06-api-spec.md` |
| **DB 작업 / 엔티티** | `docs/05-database.md` |
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
```json
{
  "success": true,
  "data": { ... },
  "message": "..."
}
```

자세한 규칙: `docs/06-api-spec.md` 참고

---

## 🚧 현재 진행 상황

- ✅ 기획 및 기술 스택 확정
- ✅ 협업 환경 세팅 (GitHub, Notion)
- ✅ DB 스키마 v1.2 작성 완료 (24 테이블, `backend/src/main/resources/schema.sql`)
- ✅ ERD DBML 작성 완료 (`docs/erd.dbml`)
- ✅ 프론트엔드 프로젝트 세팅 완료 (Vite + React 19 + Tailwind)
- ✅ 백엔드 프로젝트 기본 세팅 완료 (Spring Boot 4.0.6)
- 🔄 외부 API 신청 진행 중 (기상청·에어코리아·OpenAI·카카오)
- 🔄 와이어프레임 작업 중
- ⏳ 폴더명 `be→backend`, `fe→frontend` rename 예정
- ⏳ AI 처리 구조 결정 (백엔드 통합 vs FastAPI 분리)

---

## ⚠️ 주의사항

### API 키 보안
- 모든 API 키는 환경변수로 관리
- `.env` 파일은 절대 커밋 금지 (`.gitignore`에 등록)
- 키 노출 시 즉시 팀에 공유

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

- **백엔드 1**: TBD
- **백엔드 2**: TBD
- **프론트엔드**: TBD
- **AI**: TBD (룰베이스 모델 + 데이터 분석)

---

## 🎯 다음 작업 우선순위

1. Spring Boot 프로젝트 초기 세팅
2. React 프로젝트 초기 세팅
3. 사용자 인증 (회원가입/로그인) 구현
4. 반려견 프로필 CRUD 구현
5. 외부 API 연동 (기상청)
6. AI 서버 룰베이스 구현
7. 산책 위험도 측정 API 통합
