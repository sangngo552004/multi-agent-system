export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontFamily: "Material Symbols Outlined" }}
    >
      {name}
    </span>
  );
}
