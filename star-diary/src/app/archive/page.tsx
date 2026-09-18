"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import ConstellationPreview from "@/components/ConstellationPreview";
import NightSky from "@/components/NightSky";
import { byId, type Trait } from "@/lib/constellations";
import { currentMonth, getChosenServerSnapshot, getChosenSnapshot, getReadingServerSnapshot, getReadingSnapshot, getServerSnapshot, getSnapshot, monthEntries, retroCount, setViewMonth, subscribe, type Entry } from "@/lib/store";

const TRAITS: { key: Trait; label: string; hi: string; lo: string }[] = [
  { key: "O", label: "개방성", hi: "새로운 것에 끌림", lo: "익숙한 것을 지킴" },
  { key: "C", label: "성실성", hi: "계획·마무리", lo: "흐름에 맡김" },
  { key: "E", label: "외향성", hi: "사람·활동", lo: "혼자·조용히" },
  { key: "A", label: "우호성", hi: "배려·순응", lo: "거리·경쟁" },
  { key: "N", label: "신경성", hi: "불안·자책 등 흔들림", lo: "안정·평온" },
];

// 그 달의 다섯 축 평균(−2~+2)과 자주 읽힌 감정
function summarize(entries: Entry[]) {
  const scored = entries.filter((e) => e.score);
  if (!scored.length) return null;
  const avg = Object.fromEntries(TRAITS.map((t) => [t.key, scored.reduce((s, e) => s + e.score![t.key], 0) / scored.length])) as Record<Trait, number>;
  const count = new Map<string, number>();
  scored.forEach((e) => e.score!.emotions.forEach((em) => count.set(em, (count.get(em) ?? 0) + 1)));
  const emotions = [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([em]) => em);
  return { avg, emotions, n: scored.length };
}

export default function Archive() {
  const all = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const chosenMap = useSyncExternalStore(subscribe, getChosenSnapshot, getChosenServerSnapshot);
  const readingMap = useSyncExternalStore(subscribe, getReadingSnapshot, getReadingServerSnapshot);
  const [year, setYear] = useState(() => Number(currentMonth().slice(0, 4)));
  const [showLegend, setShowLegend] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const rows = months.map((m) => ({ m, entries: monthEntries(all, m), chosen: chosenMap[m], summary: summarize(monthEntries(all, m)), retros: retroCount(readingMap[m]) }));
  const done = rows.filter((r) => r.chosen);
  const isFuture = (m: string) => m > currentMonth();

  return (
    <main className="relative min-h-screen">
      <NightSky />
      <div className="fixed inset-0 bg-sky/60" />

      <section className="relative mx-auto w-full max-w-6xl px-8 py-14">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/sky" className="text-[17px] text-muted hover:text-starlight text-[19px]">← 하늘로</Link>
            <h1 className="mt-4 font-serif text-3xl">{year}년의 하늘</h1>
            <p className="mt-2 text-muted">한 달에 별자리 하나. 열두 달이 모이면 한 해의 나입니다. 지금까지 {done.length}개.</p>
          </div>
          <div className="flex items-center gap-2 font-serif text-lg text-muted">
            <button onClick={() => setYear(year - 1)} className="px-2 text-[27px] hover:text-starlight">‹</button>
            {year}
            <button onClick={() => setYear(year + 1)} disabled={year >= Number(currentMonth().slice(0, 4))} className="px-2 text-[27px] hover:text-starlight disabled:opacity-25">›</button>
          </div>
        </header>

        {/* 열두 달 */}
        <ul className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {rows.map(({ m, chosen, entries, retros }) => {
            const c = chosen ? byId(chosen.id) : undefined;
            const n = Number(m.slice(5));
            if (isFuture(m)) {
              return (
                <li key={m} className="flex h-48 flex-col rounded-xl border border-starlight/10 bg-sky-low/40 p-4 opacity-40">
                  <span className="text-sm text-muted">{n}월</span>
                  <span className="m-auto h-3 w-3 rounded-full border border-starlight/25" />
                </li>
              );
            }
            return (
              <li key={m}>
                <Link
                  href="/sky"
                  onClick={() => setViewMonth(m)}
                  className={`flex h-48 flex-col rounded-xl border p-4 transition ${c ? "border-gold/40 bg-sky-low/80 hover:border-gold" : "border-starlight/10 bg-sky-low/40 hover:border-starlight/30"} text-[19px]`}
                >
                  <span className="text-sm text-muted">{n}월{entries.length > 0 && !c ? ` · 별 ${entries.length}개` : ""}</span>
                  {c ? (
                    <>
                      <ConstellationPreview c={c} filled={Math.min(entries.length, c.stars.length)} className="my-2 h-20 w-full" />
                      <span className="font-serif">{c.name}</span>
                      <span className="text-sm text-gold">{c.persona}</span>
                      {retros > 0 && <span className="mt-auto text-xs text-muted">하늘의 답 {retros}번</span>}
                    </>
                  ) : (
                    <span className="m-auto h-3 w-3 rounded-full border border-starlight/25" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* 동향 */}
        <section className="mt-16 max-w-3xl">
          <h2 className="font-serif text-2xl">동향</h2>
          {done.length === 0 ? (
            <p className="mt-3 text-muted">별자리가 하나 이상 뜨면 달마다의 흐름이 여기에 쌓입니다.</p>
          ) : (
            <>
              <p className="mt-3 leading-relaxed">
                {done.map((r, i) => (
                  <span key={r.m}>
                    {i > 0 && <span className="text-muted"> → </span>}
                    <span className="text-muted">{Number(r.m.slice(5))}월 </span>
                    <span className="text-gold">{byId(r.chosen!.id)?.persona}</span>
                  </span>
                ))}
              </p>

              <div className="mt-8 flex items-baseline justify-between">
                <h3 className="text-lg">달마다 읽힌 다섯 축</h3>
                <button onClick={() => setShowLegend(!showLegend)} className="text-[17px] text-muted underline-offset-4 hover:text-starlight hover:underline">
                  {showLegend ? "설명 닫기" : "다섯 축이 뭔가요?"}
                </button>
              </div>
              {showLegend && (
                <div className="mt-3 rounded-xl border border-starlight/15 bg-sky-low/80 p-5 text-sm leading-relaxed">
                  <p>
                    성격심리학에서 가장 널리 쓰는 다섯 가지 축(Big Five, OCEAN)입니다. 일기 한 편마다 각 축을 −2에서 +2 사이로 읽고, 한 달치를 평균 냅니다.
                    <span className="text-muted"> 성격 진단이 아니라 그 달 기록에 드러난 경향입니다 — 달이 바뀌면 값도 바뀝니다.</span>
                  </p>
                  <ul className="mt-3 space-y-1">
                    {TRAITS.map((t) => (
                      <li key={t.key} className="flex gap-3">
                        <span className="w-12 shrink-0 text-gold">{t.label}</span>
                        <span className="text-muted">− {t.lo}</span>
                        <span className="text-muted">·</span>
                        <span className="text-muted">+ {t.hi}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <ul className="mt-4 space-y-3">
                {rows.filter((r) => r.summary).map(({ m, summary }) => (
                  <li key={m} className="flex items-center gap-4">
                    <span className="w-10 shrink-0 text-sm text-muted">{Number(m.slice(5))}월</span>
                    <div className="flex flex-1 gap-2">
                      {TRAITS.map((t) => {
                        const v = summary!.avg[t.key];
                        return (
                          <div key={t.key} className="flex-1" title={`${t.label} ${v >= 0 ? "+" : ""}${v.toFixed(1)}`}>
                            <div className="flex h-5 items-center rounded bg-starlight/8">
                              <div className="h-5 w-1/2 border-r border-starlight/25" />
                            </div>
                            <div className="relative -mt-5 h-5">
                              <div
                                className="absolute top-1 h-3 rounded bg-gold/70"
                                style={{ left: v >= 0 ? "50%" : `${50 + (v / 2) * 50}%`, width: `${(Math.abs(v) / 2) * 50}%` }}
                              />
                            </div>
                            <div className="mt-1 text-center text-[11px] text-muted">{t.label[0]}</div>
                          </div>
                        );
                      })}
                    </div>
                    <span className="w-40 shrink-0 text-sm text-muted">{summary!.emotions.join(" · ")}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">막대는 가운데(0)에서 오른쪽이 +, 왼쪽이 −. 오른쪽 끝은 그 달 자주 읽힌 감정.</p>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
