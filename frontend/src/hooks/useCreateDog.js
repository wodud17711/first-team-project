import { useState } from 'react'
import { createDog } from '../api/dogs'

/**
 * 반려견 등록 mutation hook.
 *
 * useLogin/useSignup 과 달리 form state 는 컴포넌트가 직접 소유한다.
 * 이유: DogProfile 은 UI 전용 필드(선호 산책 시간·털 길이 등)가 BE 비저장 필드라
 *       hook 이 form 까지 들면 책임 분리가 어색하다. 매핑만 호출부에서 한 번 한다.
 *
 * 사용 예 (정선혜 DogProfile.jsx — 회원가입 흐름):
 *
 *   const { create, loading, error, reset } = useCreateDog({
 *     onSuccess: (dog) => {
 *       // a) "반려견 추가" 흐름 — 같은 페이지 머무름:
 *       //    setAddedDogs((prev) => [...prev, dog]); setForm(initialForm)
 *       // b) "완료" 흐름 — 홈으로 이동:
 *       //    navigate('/')
 *     },
 *   })
 *
 *   const handleSubmit = async (e) => {
 *     e.preventDefault()
 *     // UI form → BE DTO 매핑 (api/dogs.js createDog payload 주석 참조)
 *     await create({
 *       name: form.dogname,                       // 필수
 *       breedId: form.breedId ?? null,            // 견종 선택 시 BreedSummary.id, 믹스/미선택은 null
 *       birthDate: toISODate(form.dogbirth),      // 'YYYYMMDD' → 'YYYY-MM-DD'
 *       weight: parseFloat(form.weight),          // kg (소수 1자리)
 *       gender: form.gender,                      // 'M' | 'F'
 *       isNeutered: form.isNeutered,              // boolean
 *       activityLevel: form.activityLevel,        // '저' | '중' | '고'
 *       healthNotes: form.health || null,
 *     })
 *   }
 *
 * 등록 후 Home 의 반려견 목록 갱신은 navigate('/') 로 useDogs 가 remount 되며 자동 fetch.
 * 같은 페이지에 머무는 "여러 마리" 흐름은 컴포넌트가 local 칩 리스트로 표시.
 *
 * @param {Object}   [options]
 * @param {Function} [options.onSuccess]  등록 성공 후 호출 (DogResponse 객체 인자)
 * @returns {{
 *   create: (payload: object) => Promise<object|undefined>,
 *   loading: boolean,
 *   error: string|null,
 *   reset: () => void
 * }}
 */
export function useCreateDog({ onSuccess } = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const create = async (payload) => {
    setError(null)
    if (!payload?.name) {
      setError('반려견 이름은 필수입니다.')
      return undefined
    }
    setLoading(true)
    try {
      const dog = await createDog(payload)
      if (onSuccess) onSuccess(dog)
      return dog
    } catch (err) {
      setError(err.message || '반려견 등록에 실패했습니다.')
      return undefined
    } finally {
      setLoading(false)
    }
  }

  const reset = () => setError(null)

  return { create, loading, error, reset }
}
