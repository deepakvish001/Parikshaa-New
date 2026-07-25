// Lightweight analytics wrapper. Emits to window.gtag / plausible / dataLayer
// when present, else logs in dev.
type Props = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: string, props: Props = {}) {
  try {
    const w = window as unknown as {
      gtag?: (...args: unknown[]) => void;
      plausible?: (name: string, opts?: { props?: Props }) => void;
      dataLayer?: unknown[];
    };
    w.gtag?.("event", name, props);
    w.plausible?.(name, { props });
    w.dataLayer?.push({ event: name, ...props });
    if (import.meta.env.DEV) console.debug("[analytics]", name, props);
  } catch {
    /* noop */
  }
}
