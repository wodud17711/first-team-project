# 🐕 Frontend (React + Vite)

반려견 산책 라이프 플랫폼의 프론트엔드 프로젝트입니다.

## 🛠 기술 스택

- **Vite** + **React 19**
- **JavaScript** (TypeScript 점진 도입 가능)
- **React Router** — 페이지 라우팅
- **Axios** — HTTP 클라이언트
- **Tailwind CSS** + 일반 CSS (혼용 가능)

## 🚀 시작하기

```bash
# 1. 의존성 설치 (처음 한 번)
npm install

# 2. 환경변수 파일 생성
cp .env.example .env

# 3. 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 접속.

## 📁 폴더 구조

```
fe/
├─ src/
│  ├─ main.jsx          # 앱 진입점
│  ├─ App.jsx           # 라우터 설정
│  ├─ index.css         # Tailwind + 전역 스타일
│  ├─ pages/            # 페이지 컴포넌트
│  │  ├─ Home.jsx
│  │  ├─ WalkRecord.jsx
│  │  ├─ Community.jsx
│  │  ├─ Profile.jsx
│  │  └─ NotFound.jsx
│  ├─ components/       # 재사용 컴포넌트
│  │  └─ Layout.jsx
│  ├─ api/              # API 통신
│  │  └─ client.js      # axios 인스턴스
│  ├─ hooks/            # 커스텀 훅
│  └─ assets/           # 이미지, 아이콘
├─ public/              # 정적 파일
├─ index.html
├─ vite.config.js
├─ tailwind.config.js
├─ postcss.config.js
└─ package.json
```

## 📜 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 (HMR 지원) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint 검사 |

## 🎨 스타일링 가이드

### Tailwind 유틸리티 (권장)

```jsx
<button className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-500">
  버튼
</button>
```

### 일반 CSS도 가능

```jsx
// MyComponent.jsx
import './MyComponent.css'

function MyComponent() {
  return <div className="my-component">...</div>
}
```

복잡한 애니메이션, 전역 스타일은 일반 CSS로 작성하면 됩니다.

## 🌐 API 호출 예시

```jsx
import apiClient from './api/client'

const fetchWalkScore = async () => {
  const { data } = await apiClient.get('/walk/score')
  return data
}
```

`VITE_API_BASE_URL` 환경변수가 자동으로 적용됩니다.

## ⚠️ 주의사항

- `.env` 파일은 **절대 commit 금지** (`.gitignore`에 포함됨)
- 모든 환경변수는 `VITE_` 접두사 필요 (브라우저에서 접근 가능)
- `node_modules/`는 commit 금지

## 🔄 TypeScript 전환 (나중에 원할 때)

```bash
npm install -D typescript @types/react @types/react-dom
```

`tsconfig.json` 추가 후 파일을 하나씩 `.jsx` → `.tsx`로 변경.
점진적으로 마이그레이션 가능합니다.
