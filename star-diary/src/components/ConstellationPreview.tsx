import { fittedStars, type Constellation } from "@/lib/constellations";

// 선택 화면·결과 화면용 작은 별자리 그림. filled = 채워진 별 개수. 하늘과 같은 좌표(fittedStars)를 씀
export default function ConstellationPreview({ c, filled = 3, className = "" }: { c: Constellation; filled?: number; className?: string }) {
  const pts = fittedStars(c);
  return (
    <svg viewBox="24 28 52 32" className={className} aria-label={c.name}>
      {c.edges.map(([a, b], i) => (
        <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} stroke="var(--gold)" strokeWidth={0.3} opacity={a < filled && b < filled ? 0.6 : 0.15} />
      ))}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i < filled ? 1.1 : 0.7} fill={i < filled ? "var(--gold)" : "none"} stroke="var(--starlight)" strokeWidth={0.25} opacity={i < filled ? 1 : 0.4} />
      ))}
    </svg>
  );
}
