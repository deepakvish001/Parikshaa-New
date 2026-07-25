/**
 * Admin ambient backdrop — flat sales-ops surface.
 * No orbs or blurred glows: just the deep-black `--background` token
 * with a very faint dot grid for texture. Amber accents come from the
 * shell chrome and content cards, not the backdrop.
 */
export const AdminBackdrop = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-background">
    <div
      className="absolute inset-0 opacity-[0.05]"
      style={{
        backgroundImage:
          "radial-gradient(hsl(var(--border)) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
        maskImage:
          "radial-gradient(ellipse at top, hsl(var(--background)) 40%, transparent 80%)",
      }}
    />
  </div>
);
