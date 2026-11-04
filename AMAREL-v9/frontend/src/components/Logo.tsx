import { Link } from "@tanstack/react-router";

/** AMARÉL mark: an arched window with a single point of light, inside a solid roundel. */
export function LogoMark({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="currentColor" />
      <path d="M9.5 23V14.2a6.5 6.5 0 0 1 13 0V23" stroke="var(--background, #fff)" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="16" cy="15.5" r="2.1" fill="var(--background, #fff)" />
      <path d="M7.5 23h17" stroke="var(--background, #fff)" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`amarel-brand flex shrink-0 items-center gap-2.5 text-foreground ${className}`} aria-label="AMARÉL home">
      <LogoMark className="brand-emblem" />
      <span className="text-[1.05rem] leading-none font-semibold tracking-[0.2em] uppercase">AMARÉL</span>
    </Link>
  );
}
