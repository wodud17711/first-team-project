# 03. 기술 스택

본 프로젝트에서 사용하는 기술 스택과 선정 이유를 정리합니다.

---

## 🏗️ 전체 구성

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   React (Web)   │ ───→ │  Spring Boot    │ ───→ │      MySQL      │
│   - 사용자 UI   │      │  - 메인 백엔드  │      │   - 데이터 저장 │
└─────────────────┘      └────────┬────────┘      └─────────────────┘
                                  │
                                  ↓
                         ┌─────────────────┐
                         │ Python FastAPI  │
                         │ - 위험도 모델   │
                         └────────┬────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                ↓                 ↓                 ↓
         [기상청 API]      [에어코리아 API]   [Kaggle 데이터]
```

---

## 🖥️ Frontend

### React + Vite

| 항목 | 선택 | 이유 |
| --- | --- | --- |
| 프레임워크 | React 18 | 팀원 친숙도, 풍부한 생태계 |
| 빌드 도구 | Vite | CRA 대비 빠른 개발 서버 |
| 언어 | TypeScript (권장) | 타입 안정성 |
| 스타일링 | TailwindCSS or styled-components | 빠른 UI 개발 |
| 상태 관리 | TanStack Query + Zustand | 서버 상태 + 클라이언트 상태 분리 |
| 라우팅 | React Router v6 | 표준 |
| HTTP 클라이언트 | Axios | 인터셉터 활용 (JWT 자동 첨부) |

---

## ⚙️ Backend

### Spring Boot 3.3

| 항목 | 선택 | 이유 |
| --- | --- | --- |
| 언어 | Java 17 | LTS, Spring Boot 3 최소 요구 |
| 프레임워크 | Spring Boot 3.3 | 안정 버전 |
| 빌드 | Gradle | 표준 |
| ORM | Spring Data JPA | 생산성 |
| 동적 쿼리 | QueryDSL | 산책 통계 등 복잡 쿼리 |
| 보안 | Spring Security + JWT | 표준 인증 |
| 검증 | Bean Validation | 입력값 검증 |
| API 문서 | Springdoc OpenAPI (Swagger) | 자동 문서화 |
| HTTP 클라이언트 | WebClient | 기상청·AI 서버 호출 |
| DTO 매핑 | MapStruct | Entity ↔ DTO 변환 |
| 캐싱 | Redis (선택) | 날씨 데이터 캐싱 |

### 의존성 상세

자세한 `build.gradle` 의존성은 별도 회의록에 정리됨.

---

## 🗄️ Database

### MySQL 8.0

| 항목 | 내용 |
| --- | --- |
| RDBMS | MySQL 8.0 |
| 개발 환경 | H2 (인메모리, 테스트용) |
| 운영 환경 | MySQL (Docker 또는 AWS RDS) |
| 마이그레이션 | Flyway (선택) |

**선정 이유**
- 팀원 친숙도
- Spring Boot 통합 용이
- 무료, 풍부한 자료
- 향후 확장 시 PostgreSQL/PostGIS 전환 가능

---

## 🤖 AI Server

### Python FastAPI

| 항목 | 선택 | 이유 |
| --- | --- | --- |
| 언어 | Python 3.11+ | AI 생태계 표준 |
| 프레임워크 | FastAPI | 빠른 API 서빙, 자동 문서화 |
| 데이터 처리 | pandas, numpy | 표준 |
| ML (향후) | scikit-learn | 룰베이스 → ML 전환 시 |
| 이미지 분류 (향후) | PyTorch | 견종 이미지 분류 모델 |
| 배포 | Uvicorn + Gunicorn | 표준 |

**Spring과 분리하는 이유**
- AI 모델 학습/서빙은 Python 생태계가 압도적으로 풍부
- Spring Boot는 비즈니스 로직에 집중
- 모델 교체 시 백엔드 영향 최소화

---

## 🌐 외부 API

| API | 용도 | 비고 |
| --- | --- | --- |
| 기상청 단기예보 | 기온·습도·풍속·강수 | 1일 1,000회 (개발계정) |
| 기상청 생활기상지수 | 체감온도·자외선 | |
| 에어코리아 | 미세먼지·초미세먼지 | |
| OpenAI API (선택) | 견종별 Q&A 챗봇 | 2차 확장 |

자세한 사용법: [09. 외부 API 사용 가이드](./09-external-apis.md)

---

## 📊 Data Source

| 데이터셋 | 출처 | 용도 |
| --- | --- | --- |
| Dogs Breeds | Kaggle | 견종별 크기·체중 |
| 150+ Dog Breeds Around the World | Kaggle | 활동량·털 관리·수명 |
| Stanford Dogs Dataset | Kaggle | 견종 이미지 (2차) |

---

## 🛠️ 개발 도구

| 도구 | 용도 |
| --- | --- |
| **IDE** | IntelliJ IDEA (백엔드), VSCode (프론트·AI) |
| **버전 관리** | Git, GitHub |
| **협업** | Notion, Discord(또는 Slack) |
| **API 테스트** | Postman 또는 Swagger UI |
| **DB 도구** | DBeaver 또는 MySQL Workbench |
| **디자인** | Figma (와이어프레임) |
| **다이어그램** | draw.io, dbdiagram.io |

---

## ☁️ 배포 (예정)

| 구성요소 | 환경 | 비고 |
| --- | --- | --- |
| 백엔드 | AWS EC2 또는 Railway | Docker 컨테이너 |
| 프론트엔드 | Vercel 또는 Netlify | 정적 배포 |
| DB | AWS RDS 또는 PlanetScale | |
| AI 서버 | AWS EC2 또는 Render | Python 실행 환경 |
| 이미지 저장 | AWS S3 | 반려견 사진 |

> ⚠️ 배포 환경은 비용 및 학생 크레딧 활용 가능성에 따라 변경될 수 있음

---

## 🔄 CI/CD (예정)

- **GitHub Actions** 사용 검토
- 빌드 자동화, 테스트 실행
- 메인 브랜치 머지 시 자동 배포 (2차)

---

## 🔗 관련 문서

- 시스템 구조: [04. 시스템 아키텍처](./04-architecture.md)
- DB 설계: [05. 데이터베이스 설계](./05-database.md)
