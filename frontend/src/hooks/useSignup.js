import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup } from '../api/auth'

/**
 * 회원가입 폼 로직 hook.
 *
 * 사용 (정선혜 Join.jsx):
 *   const { form, handleChange, handleSubmit, loading, error } = useSignup()
 *
 * BE schema users 컬럼 = email + password + nickname (윤소윤 PR 머지 후) + role + timestamps
 * → form 도 그에 맞춰 4 필드 (password2 는 클라이언트 확인용).
 * → name/birth/phone/career 등은 schema 에 없으므로 Phase 2 마이페이지 추가 정보 단계로.
 */
export function useSignup() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    password2: '',
    nickname: '',
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

    setLoading(true)
    try {
      await signup({
        email: form.email,
        password: form.password,
        nickname: form.nickname, // 윤소윤 nickname PR 머지 후 BE 가 실제로 사용
      })
      navigate('/')
    } catch (err) {
      setError(err.message || '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return { form, handleChange, handleSubmit, loading, error }
}
