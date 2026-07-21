import { describe, expect, it } from 'vitest';
import { isEventDetailRequest, isEventsListRequest } from '@/lib/sw-matchers';

const url = (s: string) => new URL(s);

describe('isEventsListRequest', () => {
  it('matches the list endpoint with and without query', () => {
    expect(isEventsListRequest(url('https://api.example/v1/events'))).toBe(true);
    expect(isEventsListRequest(url('https://api.example/v1/events?limit=30&cursor=abc'))).toBe(
      true,
    );
    expect(isEventsListRequest(url('https://api.example/v1/events/'))).toBe(true);
  });

  it('does not match detail or unrelated paths', () => {
    expect(isEventsListRequest(url('https://api.example/v1/events/some-uid'))).toBe(false);
    expect(isEventsListRequest(url('https://api.example/v1/facets'))).toBe(false);
    expect(isEventsListRequest(url('https://api.example/v1/health'))).toBe(false);
  });
});

describe('isEventDetailRequest', () => {
  it('matches a detail path, with or without query', () => {
    expect(isEventDetailRequest(url('https://api.example/v1/events/some-uid'))).toBe(true);
    expect(isEventDetailRequest(url('https://api.example/v1/events/some-uid?x=1'))).toBe(true);
  });

  it('does not match the list endpoint or unrelated paths', () => {
    expect(isEventDetailRequest(url('https://api.example/v1/events'))).toBe(false);
    expect(isEventDetailRequest(url('https://api.example/v1/events/'))).toBe(false);
    expect(isEventDetailRequest(url('https://api.example/v1/facets'))).toBe(false);
  });
});
