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

export type Star = { x: number; y: number };

export default function NightSky({ stars = [] }: { stars?: Star[] }) {
  return (
    <svg
      aria-hidden
      className="fixed inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      {BACKGROUND_STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.12} fill="var(--starlight)" opacity={s.o} />
      ))}
      {stars.map((s, i) => (
        <g key={`u${i}`} className="twinkle" style={{ animationDelay: `${i * 0.7}s` }}>
          <circle cx={s.x} cy={s.y} r={1.6} fill="var(--gold)" opacity={0.18} />
          <circle cx={s.x} cy={s.y} r={0.45} fill="var(--gold)" />
        </g>
      ))}
    </svg>
  );
}
