import { describe, expect, it } from 'vitest';
import { sortLocale } from '@/lib/sort';

describe('sortLocale (ru)', () => {
  it('sorts Cyrillic via Russian collation (Ё before Е at base sensitivity)', () => {
    expect(sortLocale(['Ёлки', 'Ель', 'Енот'], 'ru')).toEqual(['Ёлки', 'Ель', 'Енот']);
  });

  it('treats accented Latin as base in ru locale', () => {
    expect(sortLocale(['Café', 'Caffe'], 'ru')).toEqual(['Café', 'Caffe']);
  });

  it('numeric sorting works', () => {
    expect(sortLocale(['Item 10', 'Item 2'], 'en')).toEqual(['Item 2', 'Item 10']);
  });
});

describe('sortLocale (en)', () => {
  it('orders mixed-case alphabetically (case-insensitive)', () => {
    expect(sortLocale(['banana', 'Apple', 'cherry'], 'en')).toEqual(['Apple', 'banana', 'cherry']);
  });
});
