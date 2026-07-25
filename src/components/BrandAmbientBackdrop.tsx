/**
 * Shared homepage/Learn ambient background.
 *
 * Flat deep-black surface — no animated orbs/glows. Keeps homepage and
 * /learn/* visually aligned with a single solid background token.
 */
export function BrandAmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-background" />
  );
}

export default BrandAmbientBackdrop;
