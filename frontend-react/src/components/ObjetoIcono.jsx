// Icono SVG colorido por categoría de objeto. Es puramente visual: se anima desde el contenedor.

const ICONOS = {
  llaves: (
    <>
      <defs>
        <linearGradient id="g-llaves" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe066" />
          <stop offset="1" stopColor="#f59f00" />
        </linearGradient>
      </defs>
      <circle cx="22" cy="24" r="14" fill="none" stroke="url(#g-llaves)" strokeWidth="7" />
      <path d="M32 34 L54 56 M46 48 L40 54 M52 54 L46 60" stroke="url(#g-llaves)" strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx="22" cy="24" r="4" fill="#fff8db" />
    </>
  ),
  movil: (
    <>
      <defs>
        <linearGradient id="g-movil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff8787" />
          <stop offset="1" stopColor="#e03131" />
        </linearGradient>
      </defs>
      <rect x="16" y="4" width="32" height="56" rx="7" fill="url(#g-movil)" />
      <rect x="20" y="11" width="24" height="38" rx="3" fill="#fff5f5" />
      <circle cx="32" cy="55" r="2.5" fill="#fff5f5" />
      <path d="M24 20 H40 M24 27 H36" stroke="#e03131" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  cartera: (
    <>
      <defs>
        <linearGradient id="g-cartera" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c58b5a" />
          <stop offset="1" stopColor="#7b4a24" />
        </linearGradient>
      </defs>
      <rect x="5" y="14" width="54" height="40" rx="8" fill="url(#g-cartera)" />
      <path d="M5 26 H59" stroke="#5c3416" strokeWidth="3" opacity="0.5" />
      <rect x="38" y="30" width="21" height="14" rx="6" fill="#ffd8a8" />
      <circle cx="46" cy="37" r="3" fill="#7b4a24" />
    </>
  ),
  ropa: (
    <>
      <defs>
        <linearGradient id="g-ropa" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#63e6be" />
          <stop offset="1" stopColor="#0ca678" />
        </linearGradient>
      </defs>
      <path d="M22 6 L4 16 L11 30 L18 27 V58 H46 V27 L53 30 L60 16 L42 6 C40 12 24 12 22 6 Z" fill="url(#g-ropa)" />
      <path d="M22 6 C24 12 40 12 42 6" fill="none" stroke="#087f5b" strokeWidth="2.5" />
    </>
  ),
  auriculares: (
    <>
      <defs>
        <linearGradient id="g-aur" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b197fc" />
          <stop offset="1" stopColor="#6741d9" />
        </linearGradient>
      </defs>
      <path d="M10 38 V32 C10 16 20 8 32 8 C44 8 54 16 54 32 V38" fill="none" stroke="url(#g-aur)" strokeWidth="6" strokeLinecap="round" />
      <rect x="6" y="34" width="14" height="22" rx="6" fill="url(#g-aur)" />
      <rect x="44" y="34" width="14" height="22" rx="6" fill="url(#g-aur)" />
    </>
  ),
  documentos: (
    <>
      <defs>
        <linearGradient id="g-doc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#74c0fc" />
          <stop offset="1" stopColor="#1971c2" />
        </linearGradient>
      </defs>
      <path d="M14 4 H38 L52 18 V58 H14 Z" fill="url(#g-doc)" />
      <path d="M38 4 V18 H52" fill="#d0ebff" />
      <path d="M22 30 H44 M22 38 H44 M22 46 H36" stroke="#e7f5ff" strokeWidth="3.5" strokeLinecap="round" />
    </>
  ),
  otros: (
    <>
      <defs>
        <linearGradient id="g-otros" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffc078" />
          <stop offset="1" stopColor="#f76707" />
        </linearGradient>
      </defs>
      <path d="M32 6 L57 18 V44 L32 58 L7 44 V18 Z" fill="url(#g-otros)" />
      <path d="M7 18 L32 31 L57 18 M32 31 V58" stroke="#fff4e6" strokeWidth="3" fill="none" strokeLinejoin="round" />
    </>
  ),
};

export default function ObjetoIcono({ categoria, size = 64, className = '' }) {
  return (
    <svg
      className={`objeto-icono ${className}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={categoria}
    >
      {ICONOS[categoria] ?? ICONOS.otros}
    </svg>
  );
}
