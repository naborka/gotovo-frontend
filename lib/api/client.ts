import type { z } from 'zod';
import { clientEnv } from '@/lib/env';
import {
  EventDetail,
  type EventDetail as EventDetailT,
  EventsPage,
  type EventsPage as EventsPageT,
  type Event as EventT,
  Facets,
  type Facets as FacetsT,
  Health,
  type Health as HealthT,
  Problem,
  type Problem as ProblemT,
} from './schemas';

/**
 * Typed fetcher for the Gotovo /v1/* API.
 *
 * Every call:
 *   1. Builds the URL (base from clientEnv + path + querystring).
 *   2. Sends Accept / Accept-Language / X-Request-ID.
 *   3. Parses the body through the Zod schema before returning.
 *   4. Non-2xx → ApiError(status, Problem, requestId).
 *   5. Body-shape mismatch → ContractValidationError.
 *
 * For ISR, pass `next.revalidate` and `next.tags` via FetchOptions — Next.js
 * fetch forwards them to its cache layer.
 */

export interface ListEventsParams {
  category?: string;
  city?: string;
  tag?: string[];
  tagMode?: 'any' | 'all';
  from?: string;
  to?: string;
  sort?: 'timeline' | 'recent';
  limit?: number;
  cursor?: string;
}

export interface FacetParams {
  category?: string;
  city?: string;
  tag?: string[];
  tagMode?: 'any' | 'all';
  from?: string;
  to?: string;
}

export interface FetchOptions {
  /** Next.js cache options. Forwarded to fetch as-is. */
  next?: { revalidate?: number; tags?: string[] };
  /** Override fetch cache mode (e.g. 'no-store' for health). */
  cache?: RequestCache;
  /** Forwarded as Accept-Language. Defaults to 'ru'. */
  locale?: 'ru' | 'en';
  /** Forwarded as X-Request-ID. Generated when omitted. */
  requestId?: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly problem: ProblemT,
    public readonly requestId: string,
  ) {
    super(`${problem.title} (status ${status}, requestId ${requestId})`);
    this.name = 'ApiError';
  }
}

export class ContractValidationError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly zodIssues: z.ZodIssue[],
  ) {
    super(`Contract validation failed for ${endpoint}: ${JSON.stringify(zodIssues)}`);
    this.name = 'ContractValidationError';
  }
}

const generateRequestId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `rid-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const baseUrl = (): string => clientEnv.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, '');

const buildQuery = (params: Record<string, unknown>): string => {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) {
        if (v != null) usp.append(key, String(v));
      }
    } else {
      usp.set(key, String(value));
    }
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
};

interface RequestInitWithNext extends RequestInit {
  next?: FetchOptions['next'];
}

const request = async <S extends z.ZodTypeAny>(
  endpoint: string,
  schema: S,
  options: FetchOptions,
): Promise<z.infer<S>> => {
  const url = `${baseUrl()}${endpoint}`;
  const requestId = options.requestId ?? generateRequestId();
  const init: RequestInitWithNext = {
    headers: {
      Accept: 'application/json',
      'Accept-Language': options.locale ?? 'ru',
      'X-Request-ID': requestId,
    },
    ...(options.cache ? { cache: options.cache } : {}),
    ...(options.next ? { next: options.next } : {}),
  };

  const res = await fetch(url, init);

  if (!res.ok) {
    const raw = await res.json().catch(() => ({}));
    const parsed = Problem.safeParse(raw);
    const problem: ProblemT = parsed.success
      ? parsed.data
      : { type: 'about:blank', title: res.statusText || 'Error', status: res.status };
    throw new ApiError(res.status, problem, requestId);
  }

  const body = await res.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ContractValidationError(endpoint, parsed.error.issues);
  }
  return parsed.data;
};

export const getEvents = (
  params: ListEventsParams,
  options: FetchOptions = {},
): Promise<EventsPageT> =>
  request(`/events${buildQuery(params as Record<string, unknown>)}`, EventsPage, options);

export const getEvent = (uid: string, options: FetchOptions = {}): Promise<EventDetailT> =>
  request(`/events/${encodeURIComponent(uid)}`, EventDetail, options);

export const getFacets = (params: FacetParams, options: FetchOptions = {}): Promise<FacetsT> =>
  request(`/facets${buildQuery(params as Record<string, unknown>)}`, Facets, options);

export const getHealth = (options: FetchOptions = {}): Promise<HealthT> =>
  request('/health', Health, { cache: 'no-store', ...options });

export type { EventDetailT as EventDetail, EventsPageT as EventsPage, EventT as Event };
