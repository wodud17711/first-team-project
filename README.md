# 🐾 반려견 산책 라이프 플랫폼

> 날씨와 반려견 데이터를 기반으로 맞춤형 산책 가이드를 제공하는 서비스

---

## 📋 프로젝트 개요

기상청 날씨 데이터와 반려견의 견종·나이·건강상태·활동성을 AI로 분석하여 **산책 위험도 진단**과 **최적 산책시간 추천**을 제공하고, 견주 간 정보 교류가 가능한 커뮤니티 기능을 통합한 플랫폼입니다.

- **팀 구성**: 4명
- **개발 기간**: 2026-05-19 ~ 2026-06-30 (6주, 조정 가능)
- **기술 스택**: Spring Boot 4 · React 19 (JS) · MySQL 8 · Tailwind CSS
- **AI 처리**: ⏳ 구조 검토 중

---

## 📚 문서 인덱스

| 문서 | 내용 |
| --- | --- |
| [01. 프로젝트 개요](./01-project-overview.md) | 기획 배경, 목표, 차별점 |
| [02. 기능 명세](./02-features.md) | MVP 기능 상세 정의 |
| [03. 기술 스택](./03-tech-stack.md) | 사용 기술 및 선정 이유 |
| [04. 시스템 아키텍처](./04-architecture.md) | 전체 시스템 구조 |
| [05. 데이터베이스 설계](./05-database.md) | ERD 및 테이블 명세 |
| [06. API 명세서](./06-api-spec.md) | REST API 엔드포인트 정의 |
| [07. 사용자 페르소나](./07-personas.md) | 타겟 사용자 정의 |
| [08. 산책 위험도 룰베이스](./08-risk-rules.md) | AI 모델 룰 정의 |
| [09. 외부 API 사용 가이드](./09-external-apis.md) | 기상청·에어코리아 API 연동 |

---

## 🚀 빠른 시작

### 백엔드 실행
```bash
cd backend
./gradlew bootRun
```

### 프론트엔드 실행
```bash
cd frontend
npm install
cp .env.example .env
npm run dev    # http://localhost:5173
```

### AI (구조 검토 중)
백엔드 통합 vs FastAPI 분리 결정 후 작성 예정

---

## 👥 팀

| 역할 | 담당 |
| --- | --- |
| 백엔드 1 | 오연수 |
| 백엔드 2 | 윤소윤 |
| 프론트엔드 | 정선혜 |
| AI · PM | 임재영 (@wodud17711) |

---

## 📝 개발 컨벤션

- **커밋 메시지**: Conventional Commits (`feat:`, `fix:`, `docs:` 등)
- **브랜치 전략**: `feature/{도메인}-{작업}` 형식
- **PR 머지**: Squash and merge, 리뷰 1명 이상 필수
- **코드 스타일**: 백엔드는 Google Java Style, 프론트는 Prettier + ESLint

---

## 🔗 참고 자료

- [Kaggle - Dogs Breeds](https://www.kaggle.com/datasets/yonkotoshiro/dogs-breeds)
- [Kaggle - 150+ Dog Breeds Around the World](https://www.kaggle.com/datasets/prajwaldongre/top-dog-breeds-around-the-world)
- [Kaggle - Stanford Dogs Dataset](https://www.kaggle.com/datasets/jessicali9530/stanford-dogs-dataset)
- [공공데이터포털](https://www.data.go.kr/)
