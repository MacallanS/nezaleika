import { notify } from '~/utils/toast'

interface UndoState {
  wateringId: number
  label: string
  timer: ReturnType<typeof setTimeout> | null
}

const UNDO_MS = 5000

export function useUndoState() {
  return useState<UndoState | null>('nz-undo', () => null)
}

export function useWateringActions() {
  const plants = usePlantsStore()
  const undo = useUndoState()

  function clearUndo() {
    if (undo.value?.timer) clearTimeout(undo.value.timer)
    undo.value = null
  }

  async function water(plantId: number, wateredAt?: string) {
    const name = plants.plantById(plantId)?.name ?? 'Растение'
    try {
      const id = await plants.water(plantId, wateredAt)
      if (id == null) return
      if (import.meta.client && 'vibrate' in navigator) navigator.vibrate(10)
      clearUndo()
      undo.value = {
        wateringId: id,
        label: `Полито: ${name}`,
        timer: setTimeout(clearUndo, UNDO_MS),
      }
    } catch {
      notify('Не удалось отметить полив', 'error')
    }
  }

  async function unwater(wateringId: number) {
    if (wateringId < 0) return
    clearUndo()
    try {
      await plants.undoWatering(wateringId)
    } catch {
      notify('Не удалось отменить полив', 'error')
    }
  }

  async function undoLast() {
    const id = undo.value?.wateringId
    if (id == null) return
    await unwater(id)
  }

  return { water, unwater, undoLast, clearUndo }
}
