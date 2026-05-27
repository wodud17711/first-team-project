import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'

/**
 * 로그인 폼 로직 hook.
 *
 * 사용 예 (정선혜 Login.jsx):
 *   // 기본: 성공 시 "/" 로 이동
 *   const { form, handleChange, handleSubmit, loading, error } = useLogin()
 *
 *   // 커스텀 경로
 *   const ... = useLogin({ redirectTo: '/welcome' })
 *
 *   // 완전 커스텀 (navigate 호출 X, 콜백 직접 처리)
 *   const ... = useLogin({ onSuccess: () => navigate('/x', { state: ... }) })
 *
 *   <form onSubmit={handleSubmit}>
 *     <input name="email"      value={form.email}      onChange={handleChange} />
 *     <input name="password"   value={form.password}   onChange={handleChange} type="password" />
 *     <input name="rememberMe" checked={form.rememberMe} onChange={handleChange} type="checkbox" />
 *     {error && <p className="text-danger">{error}</p>}
 *     <button disabled={loading}>{loading ? '로그인 중...' : '로그인'}</button>
 *   </form>
 *
 * @param {Object}   [options]
 * @param {string}   [options.redirectTo='/']  성공 시 이동할 경로
 * @param {Function} [options.onSuccess]       지정 시 navigate(redirectTo) 대신 이 콜백 호출
 */
export function useLogin({ redirectTo = '/', onSuccess } = {}) {
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.email || !form.password) {
      setError('이메일과 비밀번호를 입력해 주세요.')
      return
    }

    setLoading(true)
    try {
      await login({ email: form.email, password: form.password })
      if (onSuccess) {
        onSuccess()
      } else {
        navigate(redirectTo)
      }
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return { form, handleChange, handleSubmit, loading, error }
}
