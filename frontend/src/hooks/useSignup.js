import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup, sendEmailCode, verifyEmailCode } from '../api/auth'

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

  // 이메일 인증 상태 (sent → code 입력 → verified 후에만 가입 가능)
  const [emailAuth, setEmailAuth] = useState({
    sent: false,
    verified: false,
    sending: false,
    verifying: false,
    code: '',
    notice: null,
    error: null,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // 이메일을 바꾸면 기존 인증 무효 — 새 주소로 다시 인증해야 함.
    if (name === 'email') {
      setEmailAuth({
        sent: false, verified: false, sending: false, verifying: false,
        code: '', notice: null, error: null,
      })
    }
  }

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setEmailAuth((prev) => ({ ...prev, code: value, error: null }))
  }

  const handleSendCode = async () => {
    if (!form.email) {
      setEmailAuth((prev) => ({ ...prev, error: '이메일을 먼저 입력해 주세요.' }))
      return
    }
    setEmailAuth((prev) => ({ ...prev, sending: true, notice: null, error: null }))
    try {
      await sendEmailCode(form.email)
      setEmailAuth((prev) => ({
        ...prev, sent: true, sending: false,
        notice: '인증 코드를 보냈어요. 메일함을 확인해 주세요. (10분 유효)',
      }))
    } catch (err) {
      setEmailAuth((prev) => ({
        ...prev, sending: false,
        error: err.message || '인증 메일 발송에 실패했습니다.',
      }))
    }
  }

  const handleVerifyCode = async () => {
    if (emailAuth.code.length !== 6) {
      setEmailAuth((prev) => ({ ...prev, error: '인증 코드 6자리를 입력해 주세요.' }))
      return
    }
    setEmailAuth((prev) => ({ ...prev, verifying: true, notice: null, error: null }))
    try {
      await verifyEmailCode(form.email, emailAuth.code)
      setEmailAuth((prev) => ({
        ...prev, verified: true, verifying: false,
        notice: '이메일 인증이 완료됐어요!',
      }))
    } catch (err) {
      setEmailAuth((prev) => ({
        ...prev, verifying: false,
        error: err.message || '인증 코드 확인에 실패했습니다.',
      }))
    }
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
    if (!emailAuth.verified) {
      setError('이메일 인증을 완료해 주세요.')
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

  return {
    form, handleChange, handleSubmit, loading, error,
    emailAuth, handleSendCode, handleVerifyCode, handleCodeChange,
  }
}
