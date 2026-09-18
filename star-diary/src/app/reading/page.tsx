"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import ConstellationPreview from "@/components/ConstellationPreview";
import NightSky from "@/components/NightSky";
import { byId } from "@/lib/constellations";
import type { Narrative } from "@/lib/narrative";
import { addChapter, formatDate, repairIfBroken, getChosenServerSnapshot, getChosenSnapshot, getReadingServerSnapshot, getReadingSnapshot, getServerSnapshot, getSnapshot, subscribe, type Chapter } from "@/lib/store";

export default function Reading() {
  const entries = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const chosen = useSyncExternalStore(subscribe, getChosenSnapshot, getChosenServerSnapshot);
  const reading = useSyncExternalStore(subscribe, getReadingSnapshot, getReadingServerSnapshot);
  const c = chosen ? byId(chosen.id) : undefined;
  const chapters = reading?.chapters ?? [];
  const [current, setCurrent] = useState<number | null>(null); // null = 최근 장
  const [error, setError] = useState<string | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    repairIfBroken(entries, chosen);
  }, [entries, chosen]);

  // 1장이 없으면 한 번만 생성 요청. 생성된 이야기는 저장되어 고정됨
  useEffect(() => {
    if (!chosen || !c || chapters.length > 0 || requested.current) return;
    const core = chosen.entryIds.map((id) => entries.find((e) => e.id === id)).filter((e) => e?.score);
    if (core.length < 3) return;
    requested.current = true;
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
        addChapter({ kind: "origin", createdAt: new Date().toISOString(), narrative });
      })
      .catch((e) => {
        setError(e.message);
        requested.current = false;
      });
  }, [chosen, c, chapters.length, entries, error]);

  if (!chosen || !c) {
    return (
      <Shell>
        <p className="text-muted">
          아직 별자리가 없어요. <Link href="/" className="underline">하늘로 돌아가기</Link>
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
          <Link href="/" className="text-sm text-muted hover:text-starlight">← 하늘로</Link>
          <ConstellationPreview c={c} filled={Math.min(entries.length, c.stars.length)} className="mt-6 w-full max-w-xs" />
          <h1 className="mt-4 font-serif text-2xl">{c.name}</h1>
          <p className="text-gold">{c.persona}</p>
          <p className="mt-1 text-sm text-muted">{c.philosopher} · {c.concept}</p>
          <p className="mt-1 text-sm text-muted">{formatDate(chosen.chosenAt)}에 완성된 하늘</p>
          {chosen.candidates[0] !== chosen.id && (
            <p className="mt-3 text-sm text-muted">기록이 먼저 가리킨 곳은 {byId(chosen.candidates[0])?.name}이었고, 당신은 이 하늘을 골랐어요.</p>
          )}

          <nav className="mt-8">
            <p className="text-sm text-muted">이야기</p>
            <ol className="mt-2 space-y-2">
              {chapters.map((ch, i) => (
                <li key={i}>
                  <button
                    onClick={() => setCurrent(i)}
                    className={`flex items-center gap-3 text-left transition ${i === idx ? "text-starlight" : "text-muted hover:text-starlight"}`}
                  >
                    <span className={`inline-block h-2 w-2 rounded-full ${i === idx ? "bg-gold" : "bg-gold/50"}`} />
                    {chapterTitle(ch)}
                  </button>
                </li>
              ))}
              <li className="flex items-center gap-3 text-muted/60">
                <span className="inline-block h-2 w-2 rounded-full border border-starlight/40" />
                다음 주의 회고 (아직)
              </li>
            </ol>
          </nav>
        </aside>

        {/* 우측 본문 */}
        <article className="max-w-2xl font-serif text-lg leading-loose [overflow-wrap:anywhere] [word-break:normal]">
          {chapter ? (
            <Origin n={chapter.narrative} />
          ) : error ? (
            <p className="text-muted">
              지금은 하늘이 흐려요. <span className="text-sm">({error})</span>
              <br />
              <button onClick={() => { setError(null); }} className="mt-4 underline hover:text-starlight">다시 읽기</button>
            </p>
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

function chapterTitle(ch: Chapter) {
  const d = new Date(ch.createdAt);
  return `별자리가 뜬 날 · ${d.getMonth() + 1}월 ${d.getDate()}일`;
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

function Origin({ n }: { n: Narrative }) {
  return (
    <>
      <Section title="세 편의 기록에서 반복된 것"><Paragraphs text={n.pattern} /></Section>
      <Section title={n.mythTitle}>
        <Paragraphs text={n.myth} plain />
        <p className="mt-6 text-muted">신화가 말하는 것 — {n.lesson.replace(/^신화가 말하는 것\s*[:—-]\s*/, "")}</p>
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
