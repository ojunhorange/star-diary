"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import EntryModal from "@/components/EntryModal";
import NightSky, { type Line, type Point, type Star } from "@/components/NightSky";
import { byId, CORE_STARS, fittedStars } from "@/lib/constellations";
import { loadDemo } from "@/lib/demo";
import { failureMessage, getScoreErrorsServerSnapshot, getScoreErrorsSnapshot, requestScore, retryScore, subscribeScoreErrors } from "@/lib/score-client";
import { coreEntries, currentMonth, findToday, getChosenServerSnapshot, getChosenSnapshot, getServerSnapshot, getSnapshot, getReadingServerSnapshot, getReadingSnapshot, getViewMonthServerSnapshot, getViewMonthSnapshot, isSunday, lineOpacity, monthEntries, monthLabel, placeStars, repairIfBroken, resetAll, RETRO_STEP, retroPool, setViewMonth, shiftMonth, subscribe } from "@/lib/store";

const btn = "rounded-full border border-gold/60 px-8 py-3 text-[21px] text-gold transition hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";
const btnQuiet = "rounded-full px-6 py-3 text-[21px] text-muted transition hover:text-starlight";
const arrow = "px-2 text-[27px] text-muted transition hover:text-starlight disabled:opacity-25 disabled:hover:text-muted";

export default function Home() {
  const all = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const chosenMap = useSyncExternalStore(subscribe, getChosenSnapshot, getChosenServerSnapshot);
  const readingMap = useSyncExternalStore(subscribe, getReadingSnapshot, getReadingServerSnapshot);
  const viewMonth = useSyncExternalStore(subscribe, getViewMonthSnapshot, getViewMonthServerSnapshot) || currentMonth();
  const [open, setOpen] = useState<{ i: number; at: Point } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const errors = useSyncExternalStore(subscribeScoreErrors, getScoreErrorsSnapshot, getScoreErrorsServerSnapshot);

  // 옛 구조 이전·자가 복구, 아직 못 읽은 별 채점 시도 (중복 요청은 score-client가 막음)
  useEffect(() => {
    repairIfBroken();
    all.filter((e) => !e.score).forEach((e) => requestScore(e));
  }, [all]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 이 달의 하늘
  const entries = monthEntries(all, viewMonth);
  const chosen = chosenMap[viewMonth] ?? null;
  const reading = readingMap[viewMonth] ?? null;
  const isThisMonth = viewMonth === currentMonth();
  const entry = open ? entries[open.i] : null;
  const today = findToday(entries);
  const constellation = chosen ? byId(chosen.id) : undefined;
  const pending = !chosen && coreEntries(entries).length >= CORE_STARS; // 3편 채점 완료, 아직 안 고름

  // 별 위치·연결선·빈 자리
  const positions = placeStars(entries, chosen);
  const slots = constellation?.stars.length ?? Infinity;
  const stars: Star[] = positions.map((p, i) => {
    const d = new Date(entries[i].createdAt);
    const rank = !chosen ? 0 : chosen.entryIds.includes(entries[i].id) ? 0 : i < slots ? 1 : 2; // 0 핵심, 1 채움, 2 선 위
    return { ...p, dim: !entries[i].score, label: `${d.getMonth() + 1}월 ${d.getDate()}일`, size: [1, 0.85, 0.6][rank] };
  });
  let lines: Line[] = [];
  let ghosts: Star[] = [];
  if (constellation) {
    const shape = fittedStars(constellation);
    const filled = new Map(positions.map((p) => [`${p.x},${p.y}`, p]));
    const at = (i: number) => filled.get(shape[i].join(","));
    lines = constellation.edges.flatMap(([a, b]) => (at(a) && at(b) ? [[at(a)!, at(b)!] as Line] : []));
    ghosts = shape.filter((s) => !filled.has(s.join(","))).map(([x, y]) => ({ x, y }));
  }

  const hasStory = (reading?.chapters.length ?? 0) > 0;
  const pool = retroPool(entries, chosen, reading);
  const retroLine = !hasStory
    ? ""
    : pool.length >= RETRO_STEP
      ? isSunday() ? " · 하늘의 답이 열렸어요" : " · 별 세 개가 모였어요. 하늘의 답은 일요일에 열려요"
      : ` · 다음 답까지 ${pool.length}/${RETRO_STEP}`;
  const status = constellation
    ? `${constellation.name} · 별 ${entries.length}개${retroLine}`
    : pending
      ? "별 세 개가 모였어요. 기록이 가리키는 하늘을 골라보세요."
      : entries.length === 0
        ? isThisMonth ? "아직 별이 없어요. 오늘 첫 별을 찍어보세요." : "이 달엔 별이 없어요."
        : entries.length >= CORE_STARS
          ? "별을 읽는 중이에요. 잠시만요."
          : `별 ${entries.length}개 · 별자리까지 ${CORE_STARS - entries.length}개 · 별을 누르면 그날의 기록이 열려요`;

  const cta = !isThisMonth ? "이 달에 별 밝히기" : today ? "새로운 별 밝히기" : "오늘 별 하나 찍기";
  const failedEntries = entries.filter((e) => !e.score && errors.failed.has(e.id));
  const failure = failedEntries.length ? errors.failed.get(failedEntries[0].id) : undefined;

  return (
    <main className="relative min-h-screen">
      <NightSky
        stars={stars}
        ghosts={ghosts}
        lines={lines}
        lineOpacity={lineOpacity(reading)}
        selected={open?.i ?? null}
        onStarClick={(i, at) => setOpen(open?.i === i ? null : { i, at })}
      />

      <header className="absolute inset-x-10 top-8 flex items-center justify-between">
        <Link href="/" className="font-serif text-[21px] tracking-wide text-[19px]">별자리 일기</Link>
        <span className="flex items-center gap-2 font-serif text-lg text-muted">
          <button onClick={() => setViewMonth(shiftMonth(viewMonth, -1))} className={arrow} aria-label="지난달">‹</button>
          {monthLabel(viewMonth)}의 하늘
          <button onClick={() => setViewMonth(shiftMonth(viewMonth, 1))} disabled={isThisMonth} className={arrow} aria-label="다음 달">›</button>
        </span>
        <Link href="/archive" className="text-[17px] text-muted transition hover:text-starlight text-[19px]">올해의 하늘</Link>
      </header>

      <section className="absolute inset-x-0 bottom-[14vh] flex flex-col items-center gap-6 text-center">
        <p className="text-lg text-muted">
          {failure ? (
            <>
              {failureMessage(failure)}{" "}
              <button onClick={() => failedEntries.forEach(retryScore)} className="text-gold underline-offset-4 hover:underline">다시 시도</button>
            </>
          ) : status}
        </p>
        <div className="flex items-center gap-3">
          {pending ? (
            <Link href="/choose" className={btn}>별자리 고르기</Link>
          ) : (
            <Link href="/write" className={constellation ? btnQuiet : btn}>{cta}</Link>
          )}
          {constellation && (
            <Link href="/reading" className={btn}>{hasStory && pool.length >= RETRO_STEP && isSunday() ? "하늘의 답 열기" : "별자리 열기"}</Link>
          )}
        </div>
        {all.length === 0 && (
          <button onClick={loadDemo} className="text-[17px] text-muted underline-offset-4 transition hover:text-starlight hover:underline text-[19px]">
            일기 없이 예시로 체험하기
          </button>
        )}
      </section>

      {all.length > 0 && (
        <footer className="absolute bottom-6 left-10 text-sm text-muted">
          {confirmReset ? (
            <span>
              모든 별을 지울까요?{" "}
              <button onClick={() => { resetAll(); setConfirmReset(false); }} className="ml-2 text-starlight underline text-[19px]">지우기</button>
              <button onClick={() => setConfirmReset(false)} className="ml-3 hover:text-starlight text-[19px]">취소</button>
            </span>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="transition hover:text-starlight text-[19px]">처음부터</button>
          )}
        </footer>
      )}

      {open && entry && <EntryModal entry={entry} onClose={() => setOpen(null)} />}
    </main>
  );
}
