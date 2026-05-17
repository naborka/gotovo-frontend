export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6"
    >
      <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      <span className="sr-only">Загрузка</span>
    </main>
  );
}
