"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import ConstellationPreview from "@/components/ConstellationPreview";
import NightSky from "@/components/NightSky";
import { CONSTELLATIONS } from "@/lib/constellations";

// 별자리 도감 — 열 개의 별자리과 각각의 페르소나·철학
export default function Constellations() {
  const router = useRouter();
  return (
    <main className="relative min-h-screen">
      <NightSky />
      <div className="fixed inset-0 bg-sky/60" />

      <section className="relative mx-auto w-full max-w-6xl px-8 py-14">
        <header className="max-w-2xl">
          <div className="flex items-center gap-4 text-sm">
            <button onClick={() => (history.length > 1 ? router.back() : router.push("/"))} className="text-muted hover:text-starlight text-[19px]">← 돌아가기</button>
            <Link href="/" className="text-muted hover:text-starlight text-[19px] text-[19px]">처음으로</Link>
          </div>
          <h1 className="mt-4 font-serif text-3xl">열 개의 별자리</h1>
          <p className="mt-3 leading-relaxed text-muted">
            기록에서 읽힌 경향은 이 열 개 중 하나의 별자리로 뜹니다. 모두 실제 별자리이고, 신화는 그리스 신화 그대로입니다.
            별자리마다 신화가 표면적으로 말하는 교훈이 있고, 철학자 한 명이 그 교훈의 한계를 짚어 다른 길을 냅니다.
          </p>
        </header>

        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {CONSTELLATIONS.map((c) => (
            <li key={c.id} className="flex gap-6 rounded-xl border border-starlight/15 bg-sky-low/80 p-7">
              <ConstellationPreview c={c} filled={c.stars.length} className="h-28 w-36 shrink-0" />
              <div className="min-w-0">
                <h2 className="font-serif text-xl">{c.name}</h2>
                <p className="text-gold">{c.persona}</p>
                <p className="mt-2 leading-relaxed">{c.tagline}</p>
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex gap-3"><dt className="w-16 shrink-0 text-muted">교훈</dt><dd>{c.lesson}</dd></div>
                  <div className="flex gap-3"><dt className="w-16 shrink-0 text-muted">철학</dt><dd>{c.philosopher} · {c.concept}</dd></div>
                  <div className="flex gap-3"><dt className="w-16 shrink-0 text-muted">방향</dt><dd>{c.change}</dd></div>
                </dl>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
