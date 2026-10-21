import { ref, watch, type Ref } from 'vue'
import {
  AddStaffProduct,
  DeleteStaffProduct,
  FetchAvailableProducts,
  GetStaffProducts,
  UpdateStaffProductField,
  type AvailableProduct,
  type ProductField,
  type StaffProduct,
} from '@/pages/agents/api'

export type StaffProfileProductFieldRow = ProductField & {
  id: number
  name: string
  product_id: number
}

function normalizeStaffProducts(raw: unknown): StaffProduct[] {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object') {
    if ('data' in raw && Array.isArray((raw as { data: unknown }).data)) {
      return (raw as { data: StaffProduct[] }).data
    }
    if ('products' in raw && Array.isArray((raw as { products: unknown }).products)) {
      return (raw as { products: StaffProduct[] }).products
    }
  }
  return []
}

export function useStaffProfileProducts(userId: Ref<number | null>) {
  const staffProducts = ref<StaffProduct[]>([])
  const productFields = ref<StaffProfileProductFieldRow[]>([])
  const availableProducts = ref<AvailableProduct[]>([])
  const newProductId = ref('')
  const listLoading = ref(false)
  const availableLoading = ref(false)
  const addLoading = ref(false)

  function rebuildFieldsFromProducts(products: StaffProduct[], uid: number) {
    const allFields: StaffProfileProductFieldRow[] = []
    for (const product of products) {
      if (!Array.isArray(product.fields)) continue
      for (const field of product.fields) {
        allFields.push({
          ...field,
          id: Number(field.id),
          user_id: uid.toString(),
          type_id: field.type_id?.toString() || String(field.id ?? ''),
          value: field.value || '',
          name: field.name || 'Поле',
          product_id: product.id,
        })
      }
    }
    productFields.value = allFields.filter((f) => Number.isFinite(f.id))
  }

  async function loadProducts() {
    const id = userId.value
    if (!id) {
      staffProducts.value = []
      productFields.value = []
      return
    }
    listLoading.value = true
    try {
      const products = await GetStaffProducts(id)
      staffProducts.value = products
      rebuildFieldsFromProducts(products, id)
    } catch {
      staffProducts.value = []
      productFields.value = []
      throw new Error('load_products_failed')
    } finally {
      listLoading.value = false
    }
  }

  async function loadAvailable() {
    const id = userId.value
    if (!id) {
      availableProducts.value = []
      return
    }
    availableLoading.value = true
    try {
      const allActive = (await FetchAvailableProducts()).filter((p) => p.disabled === 0)
      const userProducts = normalizeStaffProducts(await GetStaffProducts(id))
      const assignedIds = new Set(userProducts.map((p) => p.id))
      availableProducts.value = allActive.filter((p) => !assignedIds.has(p.id))
    } catch {
      availableProducts.value = []
      throw new Error('load_available_failed')
    } finally {
      availableLoading.value = false
    }
  }

  async function refresh() {
    await loadProducts()
    await loadAvailable()
  }

  async function addProduct(productId: string) {
    const id = userId.value
    if (!id || !productId) return false
    addLoading.value = true
    try {
      await AddStaffProduct(id, id.toString(), productId)
      newProductId.value = ''
      await refresh()
      return true
    } finally {
      addLoading.value = false
    }
  }

  async function removeProduct(productId: number) {
    const id = userId.value
    if (!id) return false
    await DeleteStaffProduct(id, productId)
    await refresh()
    return true
  }

  async function updateField(fieldId: number, value: string) {
    const id = userId.value
    if (!id) return false
    const field = productFields.value.find((f) => f.id === fieldId)
    if (!field) return false
    await UpdateStaffProductField(id, {
      user_id: id.toString(),
      type_id: field.type_id || '',
      value,
    })
    field.value = value
    return true
  }

  watch(
    userId,
    () => {
      void refresh().catch(() => undefined)
    },
    { immediate: true },
  )

  return {
    staffProducts,
    productFields,
    availableProducts,
    newProductId,
    listLoading,
    availableLoading,
    addLoading,
    refresh,
    addProduct,
    removeProduct,
    updateField,
  }
}
