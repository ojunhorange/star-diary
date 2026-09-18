"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import CharCount from "@/components/CharCount";
import NightSky from "@/components/NightSky";
import { addEntry, findByDay, getServerSnapshot, getSnapshot, isLocked, latestFreeDay, MIN_LENGTH, shiftDay, subscribe, today, updateEntry, type Entry } from "@/lib/store";

export default function Write() {
  const entries = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // 기본 날짜 = 일기가 없는 가장 최근 날. 저장소가 로드되면 key가 바뀌어 다시 초기화됨
  const defaultDay = latestFreeDay(entries);
  return <DayPicker key={defaultDay} defaultDay={defaultDay} entries={entries} />;
}

function DayPicker({ defaultDay, entries }: { defaultDay: string; entries: Entry[] }) {
  const [day, setDay] = useState(defaultDay);
  const existing = findByDay(entries, day);
  // 날짜나 해당 날짜의 일기가 바뀌면 입력창을 새로 초기화
  return <Editor key={`${day}:${existing?.id ?? "new"}`} day={day} setDay={setDay} existing={existing} />;
}

const arrow = "rounded-full px-2 text-muted transition hover:text-starlight disabled:opacity-30 disabled:hover:text-muted";

function Editor({ day, setDay, existing }: { day: string; setDay: (d: string) => void; existing?: Entry }) {
  const router = useRouter();
  const [text, setText] = useState(existing?.text ?? "");
  const ready = text.trim().length >= MIN_LENGTH;
  const locked = existing ? isLocked(existing) : false;

  function save() {
    if (!ready || locked) return;
    if (existing) updateEntry(existing.id, text.trim());
    else addEntry(text.trim(), day);
    // 채점은 홈이 "점수 없는 별"을 보고 즉시 요청함(a-1)
    router.push("/sky");
  }

  return (
    <main className="relative min-h-screen">
      <NightSky />
      <div className="fixed inset-0 bg-sky/55" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-6 px-6 py-16">
        <p className="flex items-center gap-3 font-serif text-muted">
          <button onClick={() => setDay(shiftDay(day, -1))} className={arrow} aria-label="하루 전">‹</button>
          <input
            type="date"
            value={day}
            max={today()}
            onChange={(e) => e.target.value && setDay(e.target.value)}
            className="rounded bg-transparent text-starlight [color-scheme:dark] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          />
          <button onClick={() => setDay(shiftDay(day, 1))} disabled={day === today()} className={arrow} aria-label="하루 뒤">›</button>
          {day !== today() && (
            <button onClick={() => setDay(today())} className="rounded-full border border-muted/40 px-3 py-1 text-sm hover:border-starlight hover:text-starlight">
              오늘
            </button>
          )}
          {existing && !locked && "· 이 날의 별을 다시 쓰는 중"}
        </p>
        {locked ? (
          <>
            <p className="min-h-72 whitespace-pre-wrap font-serif text-lg leading-loose [overflow-wrap:anywhere] [word-break:normal]">{existing!.text}</p>
            <p className="text-sm text-muted">이 기록은 별자리의 일부가 되어 고정됐어요. 다른 날짜를 고르면 새 별을 찍을 수 있어요.</p>
          </>
        ) : (
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="오늘 있었던 일 중 마음에 남은 걸 적어보세요. 잘 쓰려고 하지 않아도 돼요."
            className="min-h-72 w-full resize-none bg-transparent font-serif text-lg leading-relaxed text-starlight placeholder:text-muted/60 focus:outline-none"
          />
        )}
        <div className="flex items-center justify-between">
          <Link href="/sky" className="text-muted hover:text-starlight">
            돌아가기
          </Link>
          {!locked && (
            <div className="flex items-center gap-4">
              <CharCount text={text} />
              <button
                onClick={save}
                disabled={!ready}
                className="rounded-full border border-gold/60 px-8 py-3 text-gold transition enabled:hover:bg-gold/10 disabled:border-muted/30 disabled:text-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                {existing ? "다시 저장" : "별 찍기"}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
