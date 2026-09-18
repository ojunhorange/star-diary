"use client";

import StarField from "@/components/StarField";

export type Star = { x: number; y: number; dim?: boolean; label?: string; size?: number }; // dim = 아직 읽는 중, label = hover 표시, size = 크기 배율
export type Point = { x: number; y: number }; // 화면 픽셀 좌표
export type Line = [Star, Star];

import { useState } from "react";

export default function NightSky({
  stars = [],
  ghosts = [],
  lines = [],
  lineOpacity = 0.45,
  selected = null,
  onStarClick,
}: {
  stars?: Star[];
  ghosts?: Star[]; // 아직 안 채워진 별자리 자리
  lines?: Line[]; // 채워진 별 사이의 연결선
  lineOpacity?: number; // 회고가 쌓일수록 밝아짐 (0.4 → 1.0)
  selected?: number | null;
  onStarClick?: (index: number, at: Point) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <>
    <StarField />
    <svg
      aria-hidden={!onStarClick}
      className="fixed inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="spike" gradientUnits="userSpaceOnUse" x1="-3.2" y1="0" x2="3.2" y2="0">
          <stop offset="0" stopColor="var(--gold)" stopOpacity="0" />
          <stop offset="0.5" stopColor="var(--gold)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {lines.map(([a, b], i) => (
        <line key={`l${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--gold)" strokeWidth={0.12 + lineOpacity * 0.06} opacity={lineOpacity} className="transition-all duration-1000" />
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
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <circle cx={s.x} cy={s.y} r={3} fill="transparent" />
            <circle cx={s.x} cy={s.y} r={(on ? 2.4 : 1.6) * (s.size ?? 1)} fill="var(--gold)" opacity={s.dim ? 0.06 : on ? 0.32 : 0.18} className="transition-all duration-1000" />
            {/* 회절 십자 광선 — 내 별에만 */}
            {!s.dim && [0, 90].map((deg) => (
              <line
                key={deg}
                x1={-3.2 * (s.size ?? 1)} y1={0} x2={3.2 * (s.size ?? 1)} y2={0}
                transform={`translate(${s.x} ${s.y}) rotate(${deg})`}
                stroke="url(#spike)" strokeWidth={0.14} strokeLinecap="round" opacity={on ? 0.9 : 0.6}
              />
            ))}
            <circle cx={s.x} cy={s.y} r={0.45 * (s.size ?? 1)} fill="var(--gold)" opacity={s.dim ? 0.45 : 1} className="transition-all duration-1000" />
            {s.label && hover === i && (
              <text x={s.x} y={s.y - 2.2} textAnchor="middle" fill="var(--starlight)" fontSize={1.4} className="pointer-events-none font-serif">
                {s.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
    </>
  );
}
