// 배경 별은 고정 시드로 생성 → 서버/클라이언트 렌더가 같아 깜빡임 없음
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
const rand = seeded(42);
const BACKGROUND_STARS = Array.from({ length: 220 }, () => ({
  x: rand() * 100,
  y: rand() * 100,
  r: 0.4 + rand() * 1.1,
  o: 0.25 + rand() * 0.6,
}));

export type Star = { x: number; y: number; dim?: boolean }; // dim = 아직 읽는 중
export type Point = { x: number; y: number }; // 화면 픽셀 좌표
export type Line = [Star, Star];

export default function NightSky({
  stars = [],
  ghosts = [],
  lines = [],
  selected = null,
  onStarClick,
}: {
  stars?: Star[];
  ghosts?: Star[]; // 아직 안 채워진 별자리 자리
  lines?: Line[]; // 채워진 별 사이의 연결선
  selected?: number | null;
  onStarClick?: (index: number, at: Point) => void;
}) {
  return (
    <svg
      aria-hidden={!onStarClick}
      className="fixed inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      {BACKGROUND_STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.12} fill="var(--starlight)" opacity={s.o} />
      ))}
      {lines.map(([a, b], i) => (
        <line key={`l${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--gold)" strokeWidth={0.12} opacity={0.45} className="transition-all duration-1000" />
      ))}
      {ghosts.map((g, i) => (
        <circle key={`g${i}`} cx={g.x} cy={g.y} r={0.35} fill="none" stroke="var(--starlight)" strokeWidth={0.08} opacity={0.35} />
      ))}
      {stars.map((s, i) => {
        const on = selected === i;
        return (
          <g
            key={`u${i}`}
            className={`twinkle ${onStarClick ? "cursor-pointer" : ""}`}
            style={{ animationDelay: `${i * 0.7}s`, animationPlayState: on ? "paused" : undefined }}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              onStarClick?.(i, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
            }}
          >
            <circle cx={s.x} cy={s.y} r={3} fill="transparent" />
            <circle cx={s.x} cy={s.y} r={on ? 2.4 : 1.6} fill="var(--gold)" opacity={s.dim ? 0.06 : on ? 0.32 : 0.18} className="transition-all duration-1000" />
            <circle cx={s.x} cy={s.y} r={0.45} fill="var(--gold)" opacity={s.dim ? 0.45 : 1} className="transition-all duration-1000" />
          </g>
        );
      })}
    </svg>
  );
}
