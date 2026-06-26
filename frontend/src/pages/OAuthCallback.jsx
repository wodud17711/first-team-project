import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { refresh } from "../api/auth"

/**
 * 소셜 로그인 콜백 랜딩.
 * BE 가 RT 쿠키를 set 한 뒤 이 경로로 리다이렉트 → refresh 로 AT 를 받아 로그인 완료 후 홈으로.
 * (AT 를 URL 에 노출하지 않는 설계 — RT 쿠키 + refresh 로만 AT 획득)
 */
export default function OAuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    refresh()
      .then(() => { if (active) navigate("/", { replace: true }) })
      .catch(() => { if (active) navigate("/login", { replace: true }) })
    return () => { active = false }
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-[40vh] text-[14px] text-txtcolor-400">
      카카오 로그인 처리 중...
    </div>
  )
}
