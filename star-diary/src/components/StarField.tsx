"use client";

import { useEffect, useRef } from "react";

// 배경 별 (디자인 1b: 광채 + 색온도). Canvas에 가산 혼합으로 그려 은하수 같은 결을 냄.
// 내 별·별자리 선·클릭은 위에 겹치는 SVG(NightSky)가 맡는다.
const COUNT = 220;
const SEED = 22;
const TINTS: [number, number, number][] = [[207, 222, 255], [226, 234, 255], [243, 231, 203], [255, 238, 208], [255, 216, 176]];

// 고정 시드 난수 (mulberry32) — 새로고침해도 같은 하늘
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 별 하나의 스프라이트: 넓은 헤일로 + 흰 중심
function sprite(rgb: [number, number, number]) {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const x = c.getContext("2d")!;
  const m = S / 2;
  const col = (a: number) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
  const halo = x.createRadialGradient(m, m, 0, m, m, m);
  halo.addColorStop(0, col(0.55));
  halo.addColorStop(0.12, col(0.22));
  halo.addColorStop(0.35, col(0.055));
  halo.addColorStop(1, col(0));
  x.fillStyle = halo;
  x.fillRect(0, 0, S, S);
  const core = x.createRadialGradient(m, m, 0, m, m, S * 0.055);
  core.addColorStop(0, "rgba(255,255,255,1)");
  core.addColorStop(0.45, col(0.9));
  core.addColorStop(1, col(0));
  x.fillStyle = core;
  x.beginPath();
  x.arc(m, m, S * 0.055, 0, 7);
  x.fill();
  return c;
}

export default function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sprites = TINTS.map(sprite);
    let raf = 0;
    let stars: { x: number; y: number; b: number; t: number; ph: number; sp: number }[] = [];
    let W = 0, H = 0;

    const layout = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = rng(SEED);
      // 실제 등급 분포처럼: 어두운 별이 압도적으로 많고 밝은 별은 드묾 (b = r^2.7)
      stars = Array.from({ length: COUNT }, () => ({
        x: r() * W,
        y: r() * H,
        b: Math.pow(r(), 2.7),
        t: Math.floor(r() * TINTS.length),
        ph: r() * 6.28,
        sp: 0.5 + r() * 1.3,
      }));
    };

    const t0 = performance.now();
    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter"; // 겹치는 빛이 더해짐
      for (const s of stars) {
        const amp = reduce ? 0 : 0.28 * (1 - s.b) + 0.05;
        const tw = 1 + amp * Math.sin(t * s.sp + s.ph);
        ctx.globalAlpha = Math.min(1, (0.16 + s.b * 0.84) * tw);
        const k = 5 + s.b * s.b * 44; // 화면 픽셀 크기
        ctx.drawImage(sprites[s.t], s.x - k / 2, s.y - k / 2, k, k);
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    layout();
    raf = requestAnimationFrame(draw);
    const onResize = () => {
      layout();
      if (reduce) draw(performance.now());
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="fixed inset-0 h-full w-full" />;
}
