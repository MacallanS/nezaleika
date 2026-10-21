/** Wait for in-flight profile OCR before showing the data step (no late field pop-in). */
export const OCR_LOCAL_SOFT_DEADLINE_MS = 15_000

/** RDocs passport recognize often needs longer than local EasyOCR. */
export const OCR_PASSPORT_SOFT_DEADLINE_MS = 30_000
