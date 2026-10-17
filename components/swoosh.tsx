// The car-line swoosh from the logo, as a quiet decorative accent.
export function Swoosh({ className = "swoosh" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 520 70" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="swoosh-gold" x1="0" x2="1">
          <stop offset="0" stopColor="#D9AE5F" stopOpacity="0" />
          <stop offset=".35" stopColor="#D9AE5F" />
          <stop offset=".8" stopColor="#F3D79A" />
          <stop offset="1" stopColor="#D9AE5F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M4 62 C 110 30, 230 8, 340 20 S 470 48, 516 56" stroke="url(#swoosh-gold)" strokeWidth="1.4" />
      <path d="M90 66 C 190 44, 300 38, 430 48" stroke="url(#swoosh-gold)" strokeWidth=".8" opacity=".6" />
    </svg>
  );
}
