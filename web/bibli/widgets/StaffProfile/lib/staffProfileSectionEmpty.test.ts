import { describe, expect, it } from 'vitest'
import { isStaffDocSectionEmpty, resolveStaffDocPanelEmpty } from './staffProfileSectionEmpty'

describe('isStaffDocSectionEmpty', () => {
  it('возвращает true, если поля и изображения пустые', () => {
    expect(
      isStaffDocSectionEmpty({
        rows: [{ value: '—' }],
        images: [{ url: '' }],
      }),
    ).toBe(true)
  })

  it('возвращает false, если у поля есть значение', () => {
    expect(
      isStaffDocSectionEmpty({
        rows: [{ value: '123-456-789 01' }],
        images: [{ url: '' }],
      }),
    ).toBe(false)
  })

  it('возвращает false, если есть url изображения', () => {
    expect(
      isStaffDocSectionEmpty({
        rows: [{ value: '—' }],
        imageUrls: ['https://example.com/doc.jpg'],
      }),
    ).toBe(false)
  })
})

describe('resolveStaffDocPanelEmpty', () => {
  it('показывает панель, если есть файлы или поля, даже при статусе empty', () => {
    expect(
      resolveStaffDocPanelEmpty({
        stepStatus: 'empty',
        rows: [{ value: 'Второй' }, { value: '+7 999 000-56-78' }],
      }),
    ).toBe(false)

    expect(
      resolveStaffDocPanelEmpty({
        stepStatus: 'empty',
        images: [{ url: 'https://example.com/passport.jpg' }],
      }),
    ).toBe(false)
  })

  it('возвращает true при статусе empty и без локальных данных', () => {
    expect(
      resolveStaffDocPanelEmpty({
        stepStatus: 'empty',
        rows: [{ value: '—' }],
        images: [{ url: '' }],
      }),
    ).toBe(true)
  })

  it('возвращает false при статусе review', () => {
    expect(
      resolveStaffDocPanelEmpty({
        stepStatus: 'review',
        rows: [{ value: '—' }],
        images: [{ url: '' }],
      }),
    ).toBe(false)
  })

  it('при неизвестном статусе смотрит на локальные поля и файлы', () => {
    expect(
      resolveStaffDocPanelEmpty({
        rows: [{ value: '—' }],
        images: [{ url: '' }],
      }),
    ).toBe(true)
  })
})
