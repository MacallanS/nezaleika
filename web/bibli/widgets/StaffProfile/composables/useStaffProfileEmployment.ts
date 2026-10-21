import { computed, reactive, ref, watch, type Ref } from 'vue'
import {
  FetchUserTypes,
  UpdateStaffEmploymentType,
  type StaffDetailsResponse,
  type UserType,
} from '@/pages/agents/api'
import { getDocumentUrl } from '@/shared/api/http/http'
import {
  EMPLOYMENT_TYPE_FALLBACK_NAMES,
  IE_TEXT_FIELDS,
  buildFileField,
  buildTextField,
  getEmploymentTypeDisplayName as resolveEmploymentTypeName,
  validateEmploymentTypeForm as validateEmploymentTypeFields,
  type EmploymentTypeFieldsMap,
} from '@/pages/agents/lib/employmentTypeFields'
import type {
  EmploymentDisplaySection,
} from '@/shared/ui/user-details/userEmploymentTypes'
import type {
  EmploymentFileKey,
  EmploymentIeField,
} from '@/shared/ui/user-details/userEmploymentTypes'

type StaffDetailsDataWithAccountType = StaffDetailsResponse['data'] & {
  account_type?: string | null
}

function getAccountTypeFromDetailsData(details?: StaffDetailsResponse | null): string {
  const detailsData = details?.data as StaffDetailsDataWithAccountType | undefined
  return detailsData?.account_type ? String(detailsData.account_type) : ''
}

function determineAccountTypeFromDetails(details?: StaffDetailsResponse | null): string {
  if (!details) return ''
  const detailsAccountType = getAccountTypeFromDetailsData(details)
  if (detailsAccountType) return detailsAccountType
  if (details.individual_enterepreneur) return '3'
  if (details.self_employed) return '2'
  return '1'
}

export function useStaffProfileEmployment(
  staffDetails: Ref<StaffDetailsResponse | null | undefined>,
  userId: Ref<number | null>,
) {
  const userTypes = ref<UserType[]>([])
  const isEditing = ref(false)
  const isSaving = ref(false)
  const form = reactive<{
    account_type: string
    fields: EmploymentTypeFieldsMap
  }>({
    account_type: '',
    fields: {},
  })

  const existingFiles = computed<Record<EmploymentFileKey, string | null>>(() => ({
    file_self_employed: staffDetails.value?.self_employed?.file_self_employed || null,
    file_income_statement: staffDetails.value?.self_employed?.file_income_statement || null,
    file_ogrnip: staffDetails.value?.individual_enterepreneur?.file_ogrnip || null,
  }))

  const typeOptions = computed(() =>
    userTypes.value.map((type) => ({
      id: String(type.id),
      name: type.name || EMPLOYMENT_TYPE_FALLBACK_NAMES[Number(type.id)] || `Тип ${type.id}`,
    })),
  )

  function getFileUrl(path: string | null | undefined) {
    return path ? getDocumentUrl(path) : ''
  }

  function getEmploymentTypeDisplayName(typeId: number) {
    return resolveEmploymentTypeName(userTypes.value, typeId)
  }

  const displaySections = computed<EmploymentDisplaySection[]>(() => {
    const details = staffDetails.value
    const currentTypeId = Number(getAccountTypeFromDetailsData(details) || 0)
    const sections: EmploymentDisplaySection[] = [
      {
        id: 1,
        name: getEmploymentTypeDisplayName(1),
        description: 'Гражданско-правовой договор без дополнительных документов',
        isActive: currentTypeId === 1,
        hasData: true,
        fields: [],
      },
      {
        id: 2,
        name: getEmploymentTypeDisplayName(2),
        description: 'Самозанятость, требуется загрузка подтверждающих справок',
        isActive: currentTypeId === 2,
        hasData: !!details?.self_employed,
        fields: [
          buildFileField(
            'Справка о самозанятости',
            existingFiles.value.file_self_employed,
            getFileUrl,
          ),
          buildFileField(
            'Справка о доходах',
            existingFiles.value.file_income_statement,
            getFileUrl,
          ),
        ],
      },
    ]

    const ie = details?.individual_enterepreneur
    sections.push({
      id: 3,
      name: getEmploymentTypeDisplayName(3),
      description: 'Индивидуальный предприниматель с банковскими реквизитами',
      isActive: currentTypeId === 3,
      hasData: !!ie,
      fields: [
        buildTextField('ФИО', ie?.name),
        buildTextField('ИНН', ie?.inn),
        buildTextField('ОГРНИП', ie?.ogrnip),
        buildTextField('Расчетный счет', ie?.payment_account),
        buildTextField('Банк', ie?.bank),
        buildTextField('БИК банка', ie?.bank_bik),
        buildTextField('ИНН банка', ie?.bank_inn),
        buildTextField('Корреспондентский счет', ie?.correspondent_account),
        buildFileField('Скан ОГРНИП', existingFiles.value.file_ogrnip, getFileUrl),
      ],
    })

    return sections.filter((section) => {
      if (section.id === 1) return section.isActive
      return section.isActive || section.hasData
    })
  })

  function syncFromDetails(force = false) {
    const accountType = determineAccountTypeFromDetails(staffDetails.value)
    if (!isEditing.value || force) {
      form.account_type = accountType
      form.fields = {}
    }
  }

  function toggleEdit() {
    if (isEditing.value) {
      isEditing.value = false
      syncFromDetails(true)
      return
    }
    syncFromDetails(true)
    isEditing.value = true
  }

  function onFileChange(event: Event, fieldKey: EmploymentFileKey) {
    const target = event.target as HTMLInputElement | null
    const file = target?.files?.[0]
    if (!file) return
    form.fields = { ...form.fields, [fieldKey]: file }
    if (target) target.value = ''
  }

  function getTextField(field: EmploymentIeField) {
    const value = form.fields[field]
    return typeof value === 'string' ? value : ''
  }

  function setTextField(field: EmploymentIeField, value: string) {
    form.fields = { ...form.fields, [field]: value }
  }

  function hasSelectedFile(fieldKey: EmploymentFileKey) {
    return form.fields[fieldKey] instanceof File
  }

  function getSelectedFileName(fieldKey: EmploymentFileKey) {
    const file = form.fields[fieldKey]
    return file instanceof File ? file.name : ''
  }

  function getEmploymentFileName(fieldKey: EmploymentFileKey) {
    if (form.fields[fieldKey] instanceof File) {
      return (form.fields[fieldKey] as File).name
    }
    if (isEditing.value) return 'Файл не выбран'
    const existingPath = existingFiles.value[fieldKey]
    if (existingPath) {
      const name = existingPath.split('/').pop() || existingPath
      return `${name} (загружено)`
    }
    return 'Файл не выбран'
  }

  async function save() {
    const id = userId.value
    if (!id) return { ok: false as const, error: 'no_user' }
    if (!form.account_type) return { ok: false as const, error: 'no_type' }

    const validationErrors = validateEmploymentTypeFields(
      form.account_type,
      form.fields,
      existingFiles.value,
      {
        individualEntrepreneurExists: Boolean(staffDetails.value?.individual_enterepreneur),
      },
    )
    if (validationErrors.length) {
      return { ok: false as const, error: 'validation', details: validationErrors }
    }

    isSaving.value = true
    try {
      await UpdateStaffEmploymentType(id, form.account_type, form.fields)
      isEditing.value = false
      return { ok: true as const }
    } catch {
      return { ok: false as const, error: 'save_failed' }
    } finally {
      isSaving.value = false
    }
  }

  watch(staffDetails, () => syncFromDetails(), { immediate: true })

  watch(
    () => form.account_type,
    (newType, oldType) => {
      if (!isEditing.value || !newType || newType === oldType) return
      const allowedFileKeys =
        newType === '2'
          ? (['file_self_employed', 'file_income_statement'] as EmploymentFileKey[])
          : newType === '3'
            ? (['file_ogrnip'] as EmploymentFileKey[])
            : []
      const preserved: EmploymentTypeFieldsMap = {}
      Object.entries(form.fields).forEach(([key, value]) => {
        if (value instanceof File && allowedFileKeys.includes(key as EmploymentFileKey)) {
          preserved[key] = value
        }
      })
      form.fields = preserved
    },
  )

  void FetchUserTypes()
    .then((types) => {
      userTypes.value = types || []
    })
    .catch(() => {
      userTypes.value = []
    })

  return {
    form,
    isEditing,
    isSaving,
    typeOptions,
    displaySections,
    fancyboxGroup: computed(() => (userId.value ? `employment-docs-${userId.value}` : 'employment-docs')),
    toggleEdit,
    onFileChange,
    getTextField,
    setTextField,
    hasSelectedFile,
    getSelectedFileName,
    getEmploymentFileName,
    save,
  }
}
