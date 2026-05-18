import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';

const deepKeys = (obj: object, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? deepKeys(value as object, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

describe('i18n messages', () => {
  it('ru and en have identical key shapes', () => {
    const ruKeys = deepKeys(ru).sort();
    const enKeys = deepKeys(en).sort();
    expect(ruKeys).toEqual(enKeys);
  });
});
