"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import NightSky from "@/components/NightSky";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/store";

const STARS_TO_COMPLETE = 3; // 데모용. 실서비스 5

export default function Home() {
  const entries = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const left = STARS_TO_COMPLETE - entries.length;

  return (
    <main className="relative min-h-screen">
      <NightSky stars={entries.map((e) => e.star)} />

      <header className="absolute left-10 top-8">
        <h1 className="font-serif text-lg tracking-wide">별자리 일기</h1>
      </header>

      <section className="absolute inset-x-0 bottom-[18vh] flex flex-col items-center gap-6 text-center">
        <p className="text-muted">
          {entries.length === 0
            ? "아직 별이 없어요. 오늘 첫 별을 찍어보세요."
            : left > 0
              ? `별 ${entries.length}개 · 별자리까지 ${left}개`
              : `별 ${entries.length}개 · 별자리가 완성됐어요`}
        </p>
        <Link
          href="/write"
          className="rounded-full border border-gold/60 px-8 py-3 text-gold transition hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          오늘 별 하나 찍기
        </Link>
      </section>
    </main>
  );
}
