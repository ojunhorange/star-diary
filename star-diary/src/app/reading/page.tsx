"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import ConstellationPreview from "@/components/ConstellationPreview";
import NightSky from "@/components/NightSky";
import { byId, type Constellation } from "@/lib/constellations";
import type { Narrative, Retro } from "@/lib/narrative";
import { DEMO_NARRATIVES } from "@/data/demo-narratives";
import { addChapter, currentMonth, isDemo, formatDate, isSunday, lastAction, monthEntries, monthLabel, repairIfBroken, RETRO_MAX, RETRO_STEP, retroPool, getChosenServerSnapshot, getChosenSnapshot, getReadingServerSnapshot, getReadingSnapshot, getServerSnapshot, getSnapshot, getViewMonthServerSnapshot, getViewMonthSnapshot, subscribe, type Chapter } from "@/lib/store";

const btn = "rounded-full border border-gold/60 px-8 py-3 text-gold transition hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold text-[19px]";

export default function Reading() {
  const all = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const chosenMap = useSyncExternalStore(subscribe, getChosenSnapshot, getChosenServerSnapshot);
  const readingMap = useSyncExternalStore(subscribe, getReadingSnapshot, getReadingServerSnapshot);
  const month = useSyncExternalStore(subscribe, getViewMonthSnapshot, getViewMonthServerSnapshot) || currentMonth();
  const entries = monthEntries(all, month);
  const chosen = chosenMap[month] ?? null;
  const reading = readingMap[month] ?? null;
  const c = chosen ? byId(chosen.id) : undefined;
  const chapters = reading?.chapters ?? [];
  const [current, setCurrent] = useState<number | null>(null); // null = 최근 장
  const [error, setError] = useState<string | null>(null);
  const requested = useRef(false);
  const [wantOrigin, setWantOrigin] = useState(true); // 1장은 진입 즉시 생성. 답(회고)은 버튼으로

  useEffect(() => {
    repairIfBroken();
  }, [all]);

  // 1장: 버튼을 누르면 한 번만 생성. 생성된 이야기는 저장되어 고정됨
  useEffect(() => {
    if (!wantOrigin || !chosen || !c || chapters.length > 0 || requested.current) return;
    const core = chosen.entryIds.map((id) => entries.find((e) => e.id === id)).filter((e) => e?.score);
    if (core.length < 3) return;
    requested.current = true;
    // 예시 모드: API를 부르지 않고 캐시된 이야기를 붙임 (사용량 절약)
    const cachedOrigin = isDemo() ? ({ argo: DEMO_NARRATIVES.argo, hercules: DEMO_NARRATIVES.hercules, gemini: DEMO_NARRATIVES.gemini } as Record<string, Narrative | undefined>)[chosen.id] : undefined;
    if (cachedOrigin) {
      addChapter(month, { kind: "origin", createdAt: new Date().toISOString(), narrative: cachedOrigin });
      return;
    }
    fetch("/api/reading", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        constellationId: chosen.id,
        entries: core.map((e) => ({ date: formatDate(e!.createdAt), text: e!.text, score: e!.score })),
      }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        const { narrative } = await r.json();
        addChapter(month, { kind: "origin", createdAt: new Date().toISOString(), narrative });
      })
      .catch((e) => {
        setError(e.message);
        requested.current = false;
      });
  }, [wantOrigin, chosen, c, chapters.length, entries, error, month]);

  // 회고: 1장이 있고, 아직 안 쓰인 채점 일기 3편 이상, 일요일(부터)이면 한 번 생성
  const pool = retroPool(entries, chosen, reading);
  const retroReady = chapters.length > 0 && pool.length >= RETRO_STEP;
  const retroRequested = useRef(false);
  const [wantRetro, setWantRetro] = useState(false); // 자동 생성 안 함 — 버튼으로만
  useEffect(() => {
    if (!wantRetro || !chosen || !c || !retroReady || retroRequested.current || !isSunday()) return;
    const target = pool.slice(0, RETRO_MAX); // 모인 만큼 전부 (최소 3, 최대 7)
    const core = chosen.entryIds.map((id) => entries.find((e) => e.id === id)).filter((e) => e?.score);
    retroRequested.current = true;
    if (isDemo() && chosen.id === "argo" && chapters.filter((ch) => ch.kind === "retro").length === 0) {
      addChapter(month, { kind: "retro", createdAt: new Date().toISOString(), entryIds: target.map((e) => e.id), narrative: DEMO_NARRATIVES.argoRetro });
      setCurrent(null);
      setWantRetro(false);
      retroRequested.current = false;
      return;
    }
    fetch("/api/reading", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode: "retro",
        constellationId: chosen.id,
        previousAction: lastAction(reading),
        coreSummary: core.map((e) => `${formatDate(e!.createdAt)}: 감정 ${e!.score!.emotions.join("·")} / 표현 ${e!.score!.keywords.join(", ")}`).join("\n"),
        entries: target.map((e) => ({ date: formatDate(e.createdAt), text: e.text, score: e.score })),
      }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        const { narrative } = await r.json();
        addChapter(month, { kind: "retro", createdAt: new Date().toISOString(), entryIds: target.map((e) => e.id), narrative });
        setCurrent(null); // 최근 장으로
        setWantRetro(false);
        retroRequested.current = false;
      })
      .catch((e) => {
        setError(e.message);
        retroRequested.current = false;
      });
  }, [wantRetro, chosen, c, retroReady, pool, entries, reading, error, month]);

  if (!chosen || !c) {
    return (
      <Shell>
        <p className="text-muted">
          아직 별자리가 없어요. <Link href="/sky" className="underline text-[19px] text-[19px]">하늘로 돌아가기</Link>
        </p>
      </Shell>
    );
  }

  const idx = current ?? chapters.length - 1;
  const chapter = chapters[idx];

  return (
    <main className="relative min-h-screen">
      <NightSky />
      <div className="fixed inset-0 bg-sky/60" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-12 px-8 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {/* 좌측 고정 패널 */}
        <aside className="md:sticky md:top-12 md:self-start">
          <div className="flex items-center gap-4 text-sm">
            <Link href="/sky" className="text-muted hover:text-starlight text-[19px] text-[19px]">← 하늘로</Link>
            <Link href="/constellations" className="text-muted hover:text-starlight text-[19px] text-[19px]">별자리 도감</Link>
          </div>
          <ConstellationPreview c={c} filled={Math.min(entries.length, c.stars.length)} className="mt-6 w-full max-w-xs" />
          <h1 className="mt-4 font-serif text-2xl">{c.name}</h1>
          <p className="text-gold">{c.persona}</p>
          <p className="mt-1 text-sm text-muted">{c.philosopher} · {c.concept}</p>
          <p className="mt-1 text-sm text-muted">{monthLabel(month)}의 하늘 · {formatDate(chosen.chosenAt)} 완성</p>

          <nav className="mt-8">
            <p className="text-sm text-muted">이야기</p>
            <ol className="mt-2 space-y-2">
              {chapters.map((ch, i) => (
                <li key={i}>
                  <button
                    onClick={() => setCurrent(i)}
                    className={`flex items-center gap-3 text-left transition ${i === idx ? "text-starlight" : "text-muted hover:text-starlight"} text-[19px]`}
                  >
                    <span className={`inline-block h-2 w-2 rounded-full ${i === idx ? "bg-gold" : "bg-gold/50"}`} />
                    {chapterTitle(ch, chapters.slice(0, i + 1).filter((x) => x.kind === "retro").length)}
                  </button>
                </li>
              ))}
              <li className="flex items-center gap-3 text-muted/60">
                <span className="inline-block h-2 w-2 rounded-full border border-starlight/40" />
                {pool.length >= RETRO_STEP ? (isSunday() ? (wantRetro ? "하늘의 제안을 쓰는 중" : "하늘의 제안이 도착했어요") : "하늘의 제안 · 일요일에 열려요") : `다음 제안까지 ${Math.min(pool.length, RETRO_STEP)}/${RETRO_STEP}`}
              </li>
            </ol>
            {chapters.length > 0 && retroReady && !wantRetro && (
              <button
                onClick={() => setWantRetro(true)}
                disabled={!isSunday()}
                title={isSunday() ? undefined : "일요일에 열려요"}
                className="mt-4 rounded-full border border-gold/60 px-6 py-2 text-gold transition enabled:hover:bg-gold/10 disabled:border-muted/30 disabled:text-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold text-[19px]"
              >
                하늘의 제안 열기
              </button>
            )}
          </nav>
        </aside>

        {/* 우측 본문 */}
        <article className="max-w-2xl font-serif text-lg leading-loose [overflow-wrap:anywhere] [word-break:normal]">
          {chapter ? (
            chapter.kind === "origin" ? <Origin n={chapter.narrative} lesson={c.lesson} /> : <RetroView r={chapter.narrative} previous={previousActionOf(chapters, idx)} count={chapter.entryIds.length} />
          ) : !wantOrigin && !error ? (
            <div className="flex flex-col items-start gap-6">
              <p className="text-muted">세 편의 기록이 {c.name}를 가리켰어요. 하늘이 무엇을 읽었는지 들어볼까요.</p>
              <button onClick={() => setWantOrigin(true)} className={btn}>하늘 열기</button>
            </div>
          ) : error ? (
            <Fallback c={c} limit={/429|RESOURCE_EXHAUSTED/.test(error)} onRetry={() => { setError(null); setWantOrigin(true); }} />
          ) : (
            <p className="text-muted">
              <span className="twinkle inline-block text-gold">✦</span> 하늘을 읽는 중이에요. 세 편의 기록과 신화를 나란히 놓고 있어요.
            </p>
          )}
        </article>
      </div>
    </main>
  );
}

function chapterTitle(ch: Chapter, n: number) {
  const d = new Date(ch.createdAt);
  const when = `${d.getMonth() + 1}월 ${d.getDate()}일`;
  return ch.kind === "origin" ? `별자리가 뜬 날 · ${when}` : `${["첫", "두", "세", "네", "다섯", "여섯"][n - 1] ?? n} 번째 제안 · ${when}`;
}

// 이 회고 장 직전 장의 제안 (되짚어 보여주기용)
function previousActionOf(chapters: Chapter[], idx: number) {
  const prev = chapters[idx - 1];
  if (!prev) return "";
  return prev.kind === "origin" ? prev.narrative.action : prev.narrative.next;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center">
      <NightSky />
      <div className="relative">{children}</div>
    </main>
  );
}

// 인용부호가 든 문단 = 사용자의 장면 → 왼쪽 금빛 세로선
function Paragraphs({ text, plain = false }: { text: string; plain?: boolean }) {
  return (
    <>
      {text.split(/\n+/).filter(Boolean).map((p, i) => (
        <p key={i} className={`mt-4 first:mt-0 ${!plain && /[“”"]/.test(p) ? "border-l-2 border-gold/60 pl-4" : ""}`}>{p}</p>
      ))}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 first:mt-0">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Origin({ n, lesson }: { n: Narrative; lesson: string }) {
  return (
    <>
      <Section title="세 편의 기록에서 반복된 것"><Paragraphs text={n.pattern} /></Section>
      <Section title={n.mythTitle}>
        <Paragraphs text={n.myth} plain />
        <p className="mt-6 text-muted">신화가 말하는 것 — {lesson}</p>
      </Section>
      <Section title="이 이야기에서 당신이 서 있는 자리"><Paragraphs text={n.place} /></Section>
      <Section title={n.reframeTitle}><Paragraphs text={n.reframe} /></Section>
      <Section title={n.actionTitle}>
        <div className="rounded-xl border border-gold/50 px-6 py-5"><Paragraphs text={n.action} /></div>
        <p className="mt-6 text-sm italic text-muted">{n.closing}</p>
      </Section>
    </>
  );
}

const KOREAN_COUNT: Record<number, string> = { 3: "세", 4: "네", 5: "다섯", 6: "여섯", 7: "일곱" };

function RetroView({ r, previous, count }: { r: Retro; previous: string; count: number }) {
  return (
    <>
      {previous && (
        <Section title="그때의 제안">
          <div className="rounded-xl border border-starlight/20 px-6 py-5 text-muted"><Paragraphs text={previous} plain /></div>
        </Section>
      )}
      <Section title={`${KOREAN_COUNT[count] ?? count} 편 사이에 있었던 것`}><Paragraphs text={r.practice} /></Section>
      <Section title="별자리가 뜬 날과 지금"><Paragraphs text={r.change} /></Section>
      <Section title={r.nextTitle}>
        <div className="rounded-xl border border-gold/50 px-6 py-5"><Paragraphs text={r.next} /></div>
        <p className="mt-6 text-sm italic text-muted">{r.closing}</p>
      </Section>
    </>
  );
}

// 생성 실패 시: 저장하지 않는 기본 이야기 (조언 전략 시트 그대로). 사용자 기록 인용은 없으니 그 점을 분명히 알림
function Fallback({ c, limit, onRetry }: { c: Constellation; limit: boolean; onRetry: () => void }) {
  return (
    <>
      <div className="rounded-xl border border-starlight/20 bg-sky-low/80 px-6 py-5 text-[17px] leading-relaxed text-muted">
        {limit ? "오늘 하늘이 너무 붐벼서 당신의 기록으로 이야기를 쓰지 못했어요." : "지금은 하늘이 흐려서 당신의 기록으로 이야기를 쓰지 못했어요."}{" "}
        대신 이 별자리의 기본 이야기를 보여드려요 — 당신의 일기는 담겨 있지 않습니다.{" "}
        <button onClick={onRetry} className="text-gold underline-offset-4 hover:underline">잠시 뒤 다시 열기</button>
      </div>
      {c.myth && (
        <Section title={`${c.name}의 신화`}>
          <Paragraphs text={c.myth} plain />
          <p className="mt-6 text-muted">신화가 말하는 것 — {c.lesson}</p>
        </Section>
      )}
      <Section title={`${c.philosopher}, ${c.concept}`}>
        <Paragraphs text={c.core} plain />
      </Section>
      <Section title="이 별자리가 건네는 방향">
        <div className="rounded-xl border border-gold/50 px-6 py-5">
          <p>없애지 말 것 — {c.keep}</p>
          <p className="mt-3">바꿔볼 것 — {c.change}</p>
        </div>
      </Section>
    </>
  );
}
