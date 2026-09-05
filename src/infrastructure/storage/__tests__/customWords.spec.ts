import { beforeEach, describe, expect, it } from '@jest/globals';

import {
  addCustomWord,
  clearCustomWords,
  getCustomWordIds,
  getCustomWords,
} from '@infrastructure/storage/customWords';

describe('infrastructure/storage/customWords', () => {
  beforeEach(() => {
    clearCustomWords();
  });

  it('returns empty after clear', () => {
    expect(getCustomWords()).toEqual({});
    expect(getCustomWordIds()).toEqual([]);
  });

  it('ignores empty and whitespace-only input', () => {
    expect(addCustomWord('')).toBe('empty');
    expect(addCustomWord('   ')).toBe('empty');
    expect(addCustomWord('\n\t')).toBe('empty');
    expect(getCustomWords()).toEqual({});
  });

  it('trims and collapses internal whitespace', () => {
    expect(addCustomWord('  свята   вечеря  ')).toBe('added');
    expect(getCustomWords()).toEqual({ custom_1: 'свята вечеря' });
  });

  it('treats Ukrainian case variants as duplicates', () => {
    expect(addCustomWord('Футбол')).toBe('added');
    expect(addCustomWord('футбол')).toBe('duplicate');
    expect(addCustomWord('ФУТБОЛ')).toBe('duplicate');
    expect(getCustomWordIds()).toEqual(['custom_1']);
  });

  it('treats whitespace-normalized variants as duplicates', () => {
    expect(addCustomWord('свята вечеря')).toBe('added');
    expect(addCustomWord('  свята   вечеря')).toBe('duplicate');
  });

  it('allows short tokens and numbers', () => {
    expect(addCustomWord('NASA')).toBe('added');
    expect(addCustomWord('ОК')).toBe('added');
    expect(addCustomWord('AI')).toBe('added');
    expect(addCustomWord('42')).toBe('added');
    expect(getCustomWordIds()).toEqual(['custom_1', 'custom_2', 'custom_3', 'custom_4']);
  });

  it('assigns sequential custom_N ids', () => {
    addCustomWord('один');
    addCustomWord('два');
    addCustomWord('три');
    expect(getCustomWordIds()).toEqual(['custom_1', 'custom_2', 'custom_3']);
    expect(getCustomWords()).toEqual({
      custom_1: 'один',
      custom_2: 'два',
      custom_3: 'три',
    });
  });
});
