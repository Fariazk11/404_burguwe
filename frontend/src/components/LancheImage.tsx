import { LOGO_SVG } from "../types";

// Mostra a foto do lanche; se não tiver foto, mostra a logo neon da casa no lugar
export function LancheImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  if (src) {
    return <img src={src} alt={alt} className={`lanche-img ${className}`} />;
  }

  return (
    <div className={`lanche-img lanche-img-placeholder ${className}`} aria-hidden>
      <img src={LOGO_SVG} alt="" />
    </div>
  );
}
