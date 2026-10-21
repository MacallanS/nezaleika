export type RecognizeKind = 'passport' | 'registration' | 'snils' | 'inn' | 'bank'

export type OcrRecognizeStatus = 'done' | 'ok' | 'failed' | 'unavailable' | 'error'

export interface OcrRecognizeResult {
  kind: RecognizeKind
  status: OcrRecognizeStatus
  mapped: Record<string, string>
  raw?: Record<string, unknown>
  error?: string | null
}

export interface PersonalOcrPatch {
  surname?: string
  name?: string
  patronymic?: string
  gender?: 'm' | 'f'
  birthday?: string
  noPatronymic?: boolean
}

export interface ProfileOcrClientOptions {
  baseUrl?: string
  fetchImpl?: typeof fetch
}
