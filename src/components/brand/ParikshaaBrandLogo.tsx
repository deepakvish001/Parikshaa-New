import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ParikshaaWordmark } from "./ParikshaaWordmark";
import parikshaaLogo from "@/assets/brand/logo-transparent.png";

type Size = "sm" | "md" | "lg";

const TILE_SIZE: Record<Size, string> = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14",
};

const ICON_SIZE: Record<Size, string> = {
  sm: "h-6 w-6",
  md: "h-7 w-7",
  lg: "h-9 w-9",
};

interface Props {
  /** Overall size preset applied to both the icon tile and the wordmark. */
  size?: Size;
  /** Wrap in a react-router Link. Pass false when the caller already wraps it. */
  asLink?: boolean;
  to?: string;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Canonical Parikshaa brand mark: amber-ringed icon tile + highlighted wordmark,
 * rendered identically across Navbar, Footer, and any future surface. Do not
 * hand-roll the icon-tile + <ParikshaaWordmark> pairing elsewhere.
 */
export function ParikshaaBrandLogo({
  size = "md",
  asLink = true,
  to = "/",
  onClick,
  ariaLabel = "Parikshaa home",
  className,
}: Props) {
  const inner = (
    <>
      <span
        className={cn(
          "relative grid place-items-center rounded-xl border border-primary/40 bg-primary/[0.12] shadow-[inset_0_1px_0_hsl(var(--primary)/0.25),0_0_24px_-6px_hsl(var(--primary)/0.55)] transition-all duration-300 group-hover:border-primary/70 group-hover:shadow-[inset_0_1px_0_hsl(var(--primary)/0.35),0_0_32px_-4px_hsl(var(--primary)/0.75)]",
          TILE_SIZE[size],
        )}
      >
        <img src={parikshaaLogo} alt="" className={cn("object-contain", ICON_SIZE[size])} />
      </span>
      <ParikshaaWordmark size={size} showAccents={false} />
    </>
  );

  const wrapperClass = cn("group inline-flex items-center gap-2.5", className);

  if (!asLink) {
    return (
      <span className={wrapperClass} aria-label={ariaLabel}>
        {inner}
      </span>
    );
  }

  return (
    <Link to={to} className={wrapperClass} onClick={onClick} aria-label={ariaLabel}>
      {inner}
    </Link>
  );
}

export default ParikshaaBrandLogo;
