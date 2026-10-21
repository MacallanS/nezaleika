import type { UpdatePassportData } from '@/pages/agents/api'

/** Mutations for document photos on Staff Profile save. */
export type StaffDocImagesMutation = {
  removedImageKeys: string[]
  replacedImages: Record<string, File>
}

export type StaffPassportSavePayload = StaffDocImagesMutation & {
  fields: Partial<UpdatePassportData>
}

export type StaffFieldsSavePayload = StaffDocImagesMutation & {
  fields: Record<string, string>
}

export function emptyDocImagesMutation(): StaffDocImagesMutation {
  return { removedImageKeys: [], replacedImages: {} }
}
