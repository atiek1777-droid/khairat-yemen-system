/**
 * Original vector brand mark for معامل خيرات اليمن.
 * Two variants:
 *  - <Logo />       full circular emblem with wordmark (login page, print headers)
 *  - <LogoIcon />   compact drop-in-circle mark (sidebar, favicon, loading states)
 */

const GOLD = "#D9A441";
const OIL = "#F4C542";
const GREEN = "#146B4A";
const EMERALD = "#1F8A5B";
const CREAM = "#FCF8EE";

export function LogoIcon({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-label="معامل خيرات اليمن">
      <circle cx="32" cy="32" r="31" fill={GREEN} />
      <circle cx="32" cy="32" r="31" fill="none" stroke={GOLD} strokeWidth="2" />
      <circle cx="32" cy="32" r="24" fill={CREAM} />
      <path
        d="M32 14c5 7 9.5 12.6 9.5 18.2A9.5 9.5 0 1 1 22.5 32.2C22.5 26.6 27 21 32 14Z"
        fill={OIL}
        stroke={GOLD}
        strokeWidth="1.2"
      />
      <path d="M27 34.5c0 3 2.2 5.4 5 5.8" stroke={CREAM} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  );
}

export function Logo({ size = 96, showWordmark = true, className }: { size?: number; showWordmark?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} role="img" aria-label="معامل خيرات اليمن">
      <circle cx="100" cy="100" r="98" fill={GREEN} />
      <circle cx="100" cy="100" r="98" fill="none" stroke={GOLD} strokeWidth="3" />
      <circle cx="100" cy="100" r="84" fill="none" stroke={GOLD} strokeWidth="1.2" opacity="0.6" />
      <circle cx="100" cy="100" r="74" fill={CREAM} />

      {/* olive branches */}
      <g stroke={EMERALD} strokeWidth="2.2" fill={EMERALD} opacity="0.9">
        <path d="M48 118c-6-16-4-34 6-46" fill="none" strokeLinecap="round" />
        <ellipse cx="52" cy="100" rx="5" ry="8" transform="rotate(-25 52 100)" />
        <ellipse cx="47" cy="86" rx="5" ry="8" transform="rotate(-15 47 86)" />
        <ellipse cx="46" cy="70" rx="5" ry="8" transform="rotate(0 46 70)" />
        <path d="M152 118c6-16 4-34-6-46" fill="none" strokeLinecap="round" />
        <ellipse cx="148" cy="100" rx="5" ry="8" transform="rotate(25 148 100)" />
        <ellipse cx="153" cy="86" rx="5" ry="8" transform="rotate(15 153 86)" />
        <ellipse cx="154" cy="70" rx="5" ry="8" transform="rotate(0 154 70)" />
      </g>

      {/* oil drop */}
      <path
        d="M100 46c11 15 20 26.4 20 37.8C120 96.5 111 106 100 106s-20-9.5-20-22.2C80 72.4 89 61 100 46Z"
        fill={OIL}
        stroke={GOLD}
        strokeWidth="2"
      />
      <path d="M91 88c0 6 4.5 11 10.5 12" stroke={CREAM} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.65" />

      {showWordmark && (
        <>
          <text x="100" y="134" textAnchor="middle" fontSize="19" fontWeight="700" fill={GREEN} style={{ fontFamily: "Tajawal, Arial, sans-serif" }}>
            خيرات اليمن
          </text>
          <text x="100" y="151" textAnchor="middle" fontSize="10.5" fontWeight="700" fill={EMERALD} letterSpacing="0.5" style={{ fontFamily: "Tajawal, Arial, sans-serif" }}>
            معامل زيوت ومنتجات غذائية
          </text>
        </>
      )}
    </svg>
  );
}
