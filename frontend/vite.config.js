import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 운영(Vercel)은 vercel.json rewrite 로 /api·/uploads 를 BE 로 프록시한다(쿠키 1st-party).
  // dev 도 동일 구조: VITE_API_BASE_URL=/api 면 vite 프록시가 BE 로 넘긴다.
  // 타깃은 VITE_DEV_PROXY_TARGET 으로 교체 가능(기본 로컬 8081) — 운영 BE 를 붙여 볼 때 사용.
  const target = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8081'

  return {
    plugins: [react()],
    server: {
      proxy: {
        // 업로드 이미지(<img src="/uploads/...">)는 상대경로라 프록시 없으면 FE 오리진(5173)으로 가서 깨진다.
        '/uploads': { target, changeOrigin: true },
        // Origin 헤더를 지워 BE CORS 필터를 우회한다 — 브라우저 입장에선 same-origin 이라
        // CORS 가 애초에 불필요하고, BE 는 Origin 이 없으면 일반 요청으로 처리한다.
        '/api': {
          target,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
          },
        },
      },
    },
  }
})
