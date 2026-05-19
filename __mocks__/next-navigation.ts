// Vitest alias target for `next/navigation`. Provides minimal surface that
// next-intl's createNavigation needs at import time. Tests can override via
// vi.mock for finer-grained behaviour.

export const usePathname = (): string => '/';

export const useRouter = () => ({
  push: () => {},
  replace: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
  prefetch: () => {},
});

export const useSearchParams = () => new URLSearchParams();
export const useParams = () => ({});
export const redirect = () => {
  throw new Error('redirect called in test');
};
export const permanentRedirect = () => {
  throw new Error('permanentRedirect called in test');
};
export const notFound = () => {
  throw new Error('notFound called in test');
};
export const RedirectType = { push: 'push', replace: 'replace' } as const;
