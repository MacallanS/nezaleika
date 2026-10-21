import { authenticatedFetch } from '@/shared/api/http/authenticatedFetch'
import { buildDocumentProxyFetchUrl } from '@/shared/api/http/http'
import { getJsZip } from '@/shared/lib/lazy/lazyLibs'
import type { StaffProfilePassportView } from '../composables/useStaffProfile'

const FILE_ENTRIES: Array<{ label: string; key: keyof StaffProfilePassportView }> = [
  { label: 'Паспорт', key: 'file_passport' },
  { label: 'Прописка', key: 'file_passport_registration' },
  { label: 'Фото с паспортом', key: 'file_agent_with_passport' },
  { label: 'ИНН', key: 'file_inn' },
  { label: 'СНИЛС', key: 'file_snils' },
  { label: 'Банковские реквизиты', key: 'file_banking_details' },
]

/** Фамилия + инициалы имени и отчества: «Мелихова Ева Борисовна» → «МелиховаЕБ» */
export function compactFioForDocumentFileName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0 || parts[0] === '—') return 'user'
  const surname = parts[0]
  const initials = parts
    .slice(1)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
  return `${surname}${initials}`
}

function downloadBaseNameForDocument(options: {
  key: keyof StaffProfilePassportView | string
  label: string
  fullName: string
}): string {
  if (options.key === 'file_agent_with_passport') {
    return `Фото_на_пропуск_${compactFioForDocumentFileName(options.fullName)}`
  }
  return options.label
}

export function listStaffProfileDocumentFiles(
  passport: StaffProfilePassportView | null | undefined,
): Array<{ label: string; path: string; key: keyof StaffProfilePassportView }> {
  if (!passport) return []

  return FILE_ENTRIES.flatMap((entry) => {
    const path = passport[entry.key]
    if (typeof path !== 'string' || !path.trim()) return []
    return [{ label: entry.label, path: path.trim(), key: entry.key }]
  })
}

/** Файлы типа оформления (самозанятый / ИП) из registration / staff details. */
export function listStaffProfileAgentTypeFiles(
  profile: {
    rawRegistration?: Record<string, unknown> | null
    rawStaffDetails?: Record<string, unknown> | null
  } | null | undefined,
): Array<{ label: string; path: string; key: string }> {
  if (!profile) return []

  const reg = profile.rawRegistration ?? null
  const staff = profile.rawStaffDetails ?? null
  const out: Array<{ label: string; path: string; key: string }> = []

  const pick = (...sources: unknown[]): Record<string, unknown> | null => {
    for (const source of sources) {
      if (source && typeof source === 'object') return source as Record<string, unknown>
    }
    return null
  }

  const push = (key: string, label: string, value: unknown) => {
    if (typeof value !== 'string' || !value.trim()) return
    out.push({ key, label, path: value.trim() })
  }

  const se = pick(staff?.self_employed, reg?.self_employed, reg?.SelfEmployed)
  if (se) {
    push('file_self_employed', 'Справка о постановке на учёт', se.file_self_employed)
    push('file_income_statement', 'Справка о доходах', se.file_income_statement)
  }

  const ie = pick(
    staff?.individual_enterepreneur,
    reg?.individual_enterepreneur,
    reg?.IndividualEnterepreneur,
  )
  if (ie) {
    push('file_ogrnip', 'Лист записи ЕГРИП', ie.file_ogrnip)
  }

  return out
}

/** Все загруженные файлы агента: паспортный блок + тип оформления. */
export function listStaffProfileAllDocumentFiles(
  profile: {
    passport?: StaffProfilePassportView | null
    rawRegistration?: Record<string, unknown> | null
    rawStaffDetails?: Record<string, unknown> | null
  } | null | undefined,
): Array<{ label: string; path: string; key: string }> {
  if (!profile) return []

  const fromPassport = listStaffProfileDocumentFiles(profile.passport).map((item) => ({
    label: item.label,
    path: item.path,
    key: String(item.key),
  }))
  const fromAgentType = listStaffProfileAgentTypeFiles(profile)

  return [...fromPassport, ...fromAgentType]
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'file'
}

function extensionFromBlobType(type: string): string {
  if (type === 'application/pdf') return 'pdf'
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  if (type === 'image/jpeg' || type === 'image/jpg') return 'jpg'
  if (type.startsWith('image/')) return type.slice('image/'.length) || 'jpg'
  return 'bin'
}

export async function downloadStaffProfileDocumentsZip(options: {
  fullName: string
  files: Array<{ label: string; path: string; key?: string }>
}): Promise<{ addedCount: number }> {
  const JSZip = await getJsZip()
  const zip = new JSZip()
  let addedCount = 0

  for (const entry of options.files) {
    const proxyUrl = buildDocumentProxyFetchUrl(entry.path)
    if (!proxyUrl) continue

    let response: Response
    try {
      response = await authenticatedFetch(proxyUrl, { method: 'GET', credentials: 'omit' })
    } catch {
      continue
    }
    if (!response.ok) continue

    const blob = await response.blob()
    if (blob.size <= 0) continue

    const ext = extensionFromBlobType(blob.type)
    const baseName = downloadBaseNameForDocument({
      key: entry.key ?? entry.label,
      label: entry.label,
      fullName: options.fullName,
    })
    zip.file(`${sanitizeFileName(baseName)}.${ext}`, blob, { binary: true })
    addedCount += 1
  }

  if (addedCount === 0) {
    return { addedCount }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(zipBlob)
  link.download = `${sanitizeFileName(options.fullName)}_документы.zip`
  link.click()
  URL.revokeObjectURL(link.href)

  return { addedCount }
}
