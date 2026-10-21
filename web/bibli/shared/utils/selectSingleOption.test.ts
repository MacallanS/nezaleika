import { describe, expect, it } from 'vitest';
import {
  getSelectableOptions,
  getSingleSelectableValue,
  isSelectAllSentinel,
  shouldHideSingleOption,
} from './selectSingleOption';

describe('isSelectAllSentinel', () => {
  it('treats «Все» and empty id as sentinel', () => {
    expect(isSelectAllSentinel({ id: '', name: 'Все' })).toBe(true);
    expect(isSelectAllSentinel({ id: '', name: 'Все проекты' })).toBe(true);
    expect(isSelectAllSentinel({ id: 'all', name: 'All' })).toBe(true);
  });

  it('treats real options as non-sentinel', () => {
    expect(isSelectAllSentinel({ id: 1, name: 'Проект A' })).toBe(false);
    expect(isSelectAllSentinel('option')).toBe(false);
  });
});

describe('getSelectableOptions', () => {
  it('excludes sentinel options', () => {
    const options = [
      { id: '', name: 'Все' },
      { id: 1, name: 'Проект A' },
    ];
    expect(getSelectableOptions(options)).toEqual([{ id: 1, name: 'Проект A' }]);
  });

  it('returns all options when no sentinel', () => {
    const options = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ];
    expect(getSelectableOptions(options)).toEqual(options);
  });
});

describe('getSingleSelectableValue', () => {
  it('returns value when exactly one real option', () => {
    expect(getSingleSelectableValue([{ id: 5, name: 'Точка' }])).toBe(5);
  });

  it('returns null for zero or multiple real options', () => {
    expect(getSingleSelectableValue([])).toBeNull();
    expect(getSingleSelectableValue([
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ])).toBeNull();
  });

  it('ignores sentinel when counting', () => {
    const options = [
      { id: '', name: 'Все' },
      { id: 42, name: 'Единственный' },
    ];
    expect(getSingleSelectableValue(options)).toBe(42);
  });
});

describe('shouldHideSingleOption', () => {
  const oneOption = [{ id: 1, name: 'Only' }];

  it('returns true when enabled and zero or one real option', () => {
    expect(shouldHideSingleOption(oneOption, { hideWhenSingle: true })).toBe(true);
    expect(shouldHideSingleOption([], { hideWhenSingle: true })).toBe(true);
    expect(shouldHideSingleOption([{ id: '', name: 'Все' }], { hideWhenSingle: true })).toBe(true);
  });

  it('returns false when disabled, loading, multiple, or two+ options', () => {
    expect(shouldHideSingleOption(oneOption, { hideWhenSingle: false })).toBe(false);
    expect(shouldHideSingleOption([], { hideWhenSingle: false })).toBe(false);
    expect(shouldHideSingleOption(oneOption, { hideWhenSingle: true, loading: true })).toBe(false);
    expect(shouldHideSingleOption(oneOption, { hideWhenSingle: true, multiple: true })).toBe(false);
    expect(shouldHideSingleOption([
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ], { hideWhenSingle: true })).toBe(false);
  });
});
