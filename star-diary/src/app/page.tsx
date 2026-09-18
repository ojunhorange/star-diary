"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import EntryModal from "@/components/EntryModal";
import NightSky, { type Line, type Point, type Star } from "@/components/NightSky";
import { byId, CORE_STARS, fittedStars } from "@/lib/constellations";
import { requestScore } from "@/lib/score-client";
import { coreEntries, findToday, getChosenServerSnapshot, getChosenSnapshot, getServerSnapshot, getSnapshot, isOnboarded, placeStars, repairIfBroken, subscribe } from "@/lib/store";

const btn = "rounded-full border border-gold/60 px-8 py-3 text-gold transition hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";
const btnQuiet = "rounded-full px-6 py-3 text-muted transition hover:text-starlight";

export default function Home() {
  const router = useRouter();
  const entries = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const chosen = useSyncExternalStore(subscribe, getChosenSnapshot, getChosenServerSnapshot);
  const [open, setOpen] = useState<{ i: number; at: Point } | null>(null);

  // 첫 방문이면 온보딩으로
  useEffect(() => {
    if (!isOnboarded()) router.replace("/welcome");
  }, [router]);

  // 아직 못 읽은 별은 홈에 올 때마다 채점 시도 (중복 요청은 score-client가 막음)
  useEffect(() => {
    repairIfBroken(entries, chosen);
    entries.filter((e) => !e.score).forEach(requestScore);
  }, [entries, chosen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const entry = open ? entries[open.i] : null;
  const today = findToday(entries);
  const constellation = chosen ? byId(chosen.id) : undefined;
  const pending = !chosen && coreEntries(entries).length >= CORE_STARS; // 3편 채점 완료, 아직 안 고름

  // 별 위치·연결선·빈 자리
  const positions = placeStars(entries, chosen);
  const stars: Star[] = positions.map((p, i) => ({ ...p, dim: !entries[i].score }));
  let lines: Line[] = [];
  let ghosts: Star[] = [];
  if (constellation) {
    const shape = fittedStars(constellation);
    const filled = new Map(positions.map((p) => [`${p.x},${p.y}`, p]));
    const at = (i: number) => filled.get(shape[i].join(","));
    lines = constellation.edges.flatMap(([a, b]) => (at(a) && at(b) ? [[at(a)!, at(b)!] as Line] : []));
    ghosts = shape.filter((s) => !filled.has(s.join(","))).map(([x, y]) => ({ x, y }));
  }

  const status = constellation
    ? ghosts.length === 0
      ? `${constellation.name} · 이 달의 하늘이 꽉 찼어요`
      : `${constellation.name} · 별 ${entries.length}개 · 남은 자리 ${ghosts.length}개`
    : pending
      ? "별 세 개가 모였어요. 기록이 가리키는 하늘을 골라보세요."
      : entries.length === 0
        ? "아직 별이 없어요. 오늘 첫 별을 찍어보세요."
        : entries.length >= CORE_STARS
          ? "별을 읽는 중이에요. 잠시만요."
          : `별 ${entries.length}개 · 별자리까지 ${CORE_STARS - entries.length}개 · 별을 누르면 그날의 기록이 열려요`;

  const cta = today ? "새로운 별 밝히기" : "오늘 별 하나 찍기";

  return (
    <main className="relative min-h-screen">
      <NightSky
        stars={stars}
        ghosts={ghosts}
        lines={lines}
        selected={open?.i ?? null}
        onStarClick={(i, at) => setOpen(open?.i === i ? null : { i, at })}
      />

      <header className="absolute left-10 top-8">
        <h1 className="font-serif text-lg tracking-wide">별자리 일기</h1>
      </header>

      <section className="absolute inset-x-0 bottom-[14vh] flex flex-col items-center gap-6 text-center">
        <p className="text-muted">{status}</p>
        <div className="flex items-center gap-3">
          {pending ? (
            <Link href="/choose" className={btn}>별자리 고르기</Link>
          ) : (
            <Link href="/write" className={constellation ? btnQuiet : btn}>{cta}</Link>
          )}
          {constellation && (
            <Link href="/reading" className={btn}>별자리 읽기</Link>
          )}
        </div>
      </section>

      {open && entry && <EntryModal entry={entry} onClose={() => setOpen(null)} />}
    </main>
  );
}
