import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup } from '../api/auth'

/**
 * 회원가입 폼 로직 hook.
 *
 * 사용 예 (정선혜 Join.jsx):
 *   // 기본: 성공 시 "/" 로 이동
 *   const { form, handleChange, handleSubmit, loading, error } = useSignup()
 *
 *   // 가입 후 반려견 등록 페이지로 (댕기온 회원가입 흐름)
 *   const ... = useSignup({ redirectTo: '/dog-profile' })
 *
 *   // 완전 커스텀
 *   const ... = useSignup({ onSuccess: () => navigate('/welcome') })
 *
 * BE schema users 컬럼 = email + password + nickname + role + timestamps
 * → form 도 그에 맞춰 4 필드 (password2 는 클라이언트 확인용).
 * → name/birth/phone/career 등은 schema 에 없으므로 Phase 2 마이페이지 추가 정보 단계로.
 *
 * @param {Object}   [options]
 * @param {string}   [options.redirectTo='/']  성공 시 이동할 경로 (예: '/dog-profile')
 * @param {Function} [options.onSuccess]       지정 시 navigate(redirectTo) 대신 이 콜백 호출
 */
export function useSignup({ redirectTo = '/', onSuccess } = {}) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    password2: '',
    nickname: '',
    guardianLevel: "BEGINNER"
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // 클라이언트 검증
    if (!form.email || !form.password || !form.nickname) {
      setError('이메일·비밀번호·닉네임을 모두 입력해 주세요.')
      return
    }
    if (form.password !== form.password2) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (form.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (form.nickname.length < 2 || form.nickname.length > 20) {
      setError('닉네임은 2~20자여야 합니다.')
      return
    }

    setLoading(true)
    try {
      await signup({ 
        email: form.email,
        password: form.password,
        nickname: form.nickname,
        guardianLevel: form.guardianLevel,
      })
      if (onSuccess) {
        onSuccess()
      } else {
        navigate(redirectTo)
      }
    } catch (err) {
      setError(err.message || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return { form, handleChange, handleSubmit, loading, error }
}
