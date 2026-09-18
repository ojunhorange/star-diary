"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import NightSky from "@/components/NightSky";
import { ONBOARDING } from "@/data/onboarding-content";
import { markOnboarded } from "@/lib/store";

const btn = "rounded-full border border-gold/60 px-8 py-3 text-gold transition hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold text-[19px]";
const btnQuiet = "rounded-full border border-starlight/25 px-8 py-3 text-starlight/80 transition hover:border-starlight/60 hover:text-starlight text-[19px]";

// 장마다 별이 하나 → 둘 → 셋(선으로 이어짐)으로 자람 — 앱의 구조를 미리 보여줌
const STARS = [
  [[50, 40]],
  [[42, 44], [58, 36]],
  [[42, 44], [58, 36], [50, 56]],
] as const;

export default function Welcome() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const last = i === ONBOARDING.slides.length - 1;

  function finish() {
    markOnboarded();
    router.replace("/sky");
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="drift fixed inset-0">
        <NightSky />
      </div>

      <button onClick={finish} className="absolute right-10 top-8 text-[17px] text-muted transition hover:text-starlight text-[19px]">
        건너뛰기
      </button>

      <section className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <svg viewBox="30 25 40 40" className="h-28 w-28" aria-hidden>
          {i === 2 && (
            <>
              <line x1={42} y1={44} x2={58} y2={36} stroke="var(--gold)" strokeWidth={0.25} opacity={0.6} />
              <line x1={58} y1={36} x2={50} y2={56} stroke="var(--gold)" strokeWidth={0.25} opacity={0.6} />
              <line x1={50} y1={56} x2={42} y2={44} stroke="var(--gold)" strokeWidth={0.25} opacity={0.6} />
            </>
          )}
          {STARS[i].map(([x, y], k) => (
            <g key={k} className="twinkle" style={{ animationDelay: `${k * 0.6}s` }}>
              <circle cx={x} cy={y} r={3} fill="var(--gold)" opacity={0.15} />
              <circle cx={x} cy={y} r={0.9} fill="var(--gold)" />
            </g>
          ))}
        </svg>

        <div key={i} className="fade-in flex min-h-[16rem] flex-col justify-center gap-6 font-serif text-lg leading-loose">
          {ONBOARDING.slides[i].map((p, k) => (
            <p key={k} className="whitespace-pre-line">{p}</p>
          ))}
        </div>

        <div className="mt-4 flex flex-col items-center gap-6">
          <span className="flex gap-2" aria-label={`${i + 1} / ${ONBOARDING.slides.length}`}>
            {ONBOARDING.slides.map((_, k) => (
              <span key={k} className={`h-1.5 w-1.5 rounded-full ${k === i ? "bg-gold" : "bg-starlight/25"}`} />
            ))}
          </span>
          <div className="flex items-center gap-4">
            {i > 0 && <button onClick={() => setI(i - 1)} className={btnQuiet}>이전</button>}
            {last ? (
              <button onClick={finish} className={btn}>{ONBOARDING.cta}</button>
            ) : (
              <button onClick={() => setI(i + 1)} className={btn}>다음</button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
