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

export default function NightSky({
  stars = [],
  selected = null,
  onStarClick,
}: {
  stars?: Star[];
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
            <circle cx={s.x} cy={s.y} r={on ? 2.4 : 1.6} fill="var(--gold)" opacity={s.dim ? 0.06 : on ? 0.32 : 0.18} className="transition-all" />
            <circle cx={s.x} cy={s.y} r={0.45} fill="var(--gold)" opacity={s.dim ? 0.45 : 1} className="transition-all" />
          </g>
        );
      })}
    </svg>
  );
}
