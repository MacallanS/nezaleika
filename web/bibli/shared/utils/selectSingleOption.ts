export type SelectOption = string | number | Record<string, unknown>;

export function getOptionLabel(option: SelectOption, optionLabel = 'name'): string {
  if (typeof option === 'object' && option !== null) {
    return String(option[optionLabel] ?? '');
  }
  return String(option);
}

export function getOptionValue(option: SelectOption, optionValue = 'id'): string | number | null | undefined {
  if (typeof option === 'object' && option !== null) {
    return option[optionValue] as string | number | null | undefined;
  }
  return option;
}

/** Sentinel «Все» / пустое значение — не считается реальным вариантом выбора. */
export function isSelectAllSentinel(
  option: SelectOption,
  optionLabel = 'name',
  optionValue = 'id',
): boolean {
  const label = getOptionLabel(option, optionLabel).toLowerCase();
  const value = getOptionValue(option, optionValue);
  return (
    label === 'все'
    || value === ''
    || value === 'all'
    || value === undefined
    || value === null
  );
}

export function getSelectableOptions(
  options: SelectOption[] | null | undefined,
  optionLabel = 'name',
  optionValue = 'id',
): SelectOption[] {
  return (options ?? []).filter(
    (option) => !isSelectAllSentinel(option, optionLabel, optionValue),
  );
}

export function shouldHideSingleOption(
  options: SelectOption[] | null | undefined,
  {
    hideWhenSingle = false,
    multiple = false,
    loading = false,
    optionLabel = 'name',
    optionValue = 'id',
  }: {
    hideWhenSingle?: boolean;
    multiple?: boolean;
    loading?: boolean;
    optionLabel?: string;
    optionValue?: string;
  } = {},
): boolean {
  if (!hideWhenSingle || multiple || loading) {
    return false;
  }
  const selectableCount = getSelectableOptions(options, optionLabel, optionValue).length;
  return selectableCount === 0 || selectableCount === 1;
}

export function getSingleSelectableValue(
  options: SelectOption[] | null | undefined,
  optionLabel = 'name',
  optionValue = 'id',
): string | number | null {
  const selectable = getSelectableOptions(options, optionLabel, optionValue);
  if (selectable.length !== 1) {
    return null;
  }
  const value = getOptionValue(selectable[0], optionValue);
  return value == null ? null : value;
}
