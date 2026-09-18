import type { Constellation } from "@/lib/constellations";

// 선택 화면·아카이브용 작은 별자리 그림. filled = 채워진 별 개수
export default function ConstellationPreview({ c, filled = 3, className = "" }: { c: Constellation; filled?: number; className?: string }) {
  return (
    <svg viewBox="15 15 70 70" className={className} aria-label={c.name}>
      {c.edges.map(([a, b], i) => (
        <line key={i} x1={c.stars[a][0]} y1={c.stars[a][1]} x2={c.stars[b][0]} y2={c.stars[b][1]} stroke="var(--gold)" strokeWidth={0.4} opacity={a < filled && b < filled ? 0.6 : 0.15} />
      ))}
      {c.stars.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i < filled ? 1.4 : 0.9} fill={i < filled ? "var(--gold)" : "none"} stroke="var(--starlight)" strokeWidth={0.3} opacity={i < filled ? 1 : 0.4} />
      ))}
    </svg>
  );
}
