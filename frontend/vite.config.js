import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 업로드 이미지(<img src="/uploads/...">)는 상대경로라 기본적으로 FE 오리진(5173)
    // 으로 요청돼 깨진다. 백엔드 정적 서빙(8081)으로 프록시해 dev 에서 표시되게 한다.
    // (API 는 apiClient 가 절대 URL(VITE_API_BASE_URL)을 쓰므로 프록시 불필요.)
    // 운영(Vercel)은 vercel.json 의 /uploads rewrite 로 동일하게 Render 백엔드로 보낸다.
    proxy: {
      '/uploads': 'http://localhost:8081',
    },
  },
})
