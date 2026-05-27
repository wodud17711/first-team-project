/**
 * 백엔드 표준 응답 {success:false, message, errorCode} 를
 * Error 로 wrapping. 호출부에서 try/catch 로 받음.
 */
export class BusinessError extends Error {
  constructor({ message, errorCode, status }) {
    super(message || '요청 처리에 실패했습니다.')
    this.name = 'BusinessError'
    this.errorCode = errorCode
    this.status = status
  }
}
