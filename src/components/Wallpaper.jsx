// Abstract dusk render of Lilletorget's geometry — thin lines, one lamp glow.
// Deliberately not a photo: visitors don't get to see what Melvin hasn't seen.
export default function Wallpaper() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMax slice"
      viewBox="0 0 1600 900"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e7e2d6" />
          <stop offset="0.7" stopColor="#dfd8c8" />
          <stop offset="1" stopColor="#d4cab6" />
        </linearGradient>
        <radialGradient id="lamp" cx="0.585" cy="0.82" r="0.32">
          <stop offset="0" stopColor="#e8a04c" stopOpacity="0.2" />
          <stop offset="0.6" stopColor="#e8a04c" stopOpacity="0.06" />
          <stop offset="1" stopColor="#e8a04c" stopOpacity="0" />
        </radialGradient>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.028 0" />
        </filter>
      </defs>

      <rect width="1600" height="900" fill="url(#sky)" />

      {/* Lilletorget block geometry, abstracted to wireframe on the horizon */}
      <g stroke="#938d7e" strokeWidth="1" fill="none" opacity="0.35">
        {/* the triangular flatiron block */}
        <path d="M 780 900 L 780 620 L 1000 668 L 1000 900" />
        <path d="M 780 620 L 880 594 L 1000 668" />
        <path d="M 880 594 L 880 872" opacity="0.6" />
        {/* window rhythm */}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`l${i}`} x1="792" y1={654 + i * 38} x2="872" y2={646 + i * 38} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`r${i}`} x1="890" y1={646 + i * 38} x2="990" y2={680 + i * 38} />
        ))}
        {/* neighbouring volumes */}
        <path d="M 560 900 L 560 700 L 748 700 L 748 900" opacity="0.5" />
        <path d="M 1040 900 L 1040 660 L 1078 648 L 1210 692 L 1210 900" opacity="0.5" />
        <path d="M 1250 900 L 1250 760 L 1400 760 L 1400 900" opacity="0.35" />
        <path d="M 380 900 L 380 780 L 540 780" opacity="0.35" />
      </g>

      {/* one lit window — someone is home */}
      <rect x="912" y="762" width="30" height="22" fill="#e8a04c" opacity="0.45" />

      <rect width="1600" height="900" fill="url(#lamp)" />
      <rect width="1600" height="900" filter="url(#grain)" />
    </svg>
  )
}
