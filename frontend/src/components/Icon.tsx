interface IconProps {
  name: string;
  /** Fill style: 0 = outline, 1 = filled */
  filled?: boolean;
  size?: number;
  className?: string;
}

/** Wrapper for Material Symbols Outlined font loaded in index.html */
export function Icon({ name, filled = false, size = 20, className = '' }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
      }}
    >
      {name}
    </span>
  );
}
