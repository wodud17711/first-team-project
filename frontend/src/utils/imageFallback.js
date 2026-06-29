/**
 * 이미지 로드 실패(404 등) 시 기본 이미지로 교체하는 onError 핸들러.
 *
 * `src={url || fallback}` 는 url 이 null/빈문자일 때만 막아주고, **url 은 있는데 파일이
 * 사라진 경우(404)** 는 깨진 이미지가 그대로 노출된다. (운영: Render 무료 디스크 비영구라
 * 재배포·슬립 시 업로드 파일이 소실되어 강아지/프로필 사진이 404 가 되는 일이 잦다.)
 * 그 경우 onError 로 기본 이미지로 교체한다.
 *
 * 사용:
 *   import { onImgError, DOG_FALLBACK } from '../utils/imageFallback'
 *   <img src={dog.profileImageUrl} onError={onImgError()} />              // 강아지 기본
 *   <img src={me?.profileImageUrl} onError={onImgError(HUMAN_FALLBACK)} /> // 다른 기본 지정
 */
import dogFallback from '../assets/dogImg1.jpg'

/** 강아지 기본 이미지 (번들 에셋). */
export const DOG_FALLBACK = dogFallback

/** 보호자/유저 기본 이미지 (public 경로). */
export const HUMAN_FALLBACK = '/userpanel/humanProfile.png'

/**
 * onError 핸들러를 생성한다. 한 번 교체한 뒤엔 재시도하지 않아(무한 루프 방지)
 * 기본 이미지 자체가 또 404 여도 안전하다.
 * @param {string} fallback 교체할 기본 이미지 경로 (기본값: 강아지 이미지)
 */
export function onImgError(fallback = dogFallback) {
  return (e) => {
    const img = e.currentTarget
    if (img.dataset.fbApplied) return
    img.dataset.fbApplied = '1'
    img.src = fallback
  }
}
