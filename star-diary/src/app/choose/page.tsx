"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import ConstellationPreview from "@/components/ConstellationPreview";
import NightSky from "@/components/NightSky";
import { candidates } from "@/lib/match";
import { chooseConstellation, coreEntries, getChosenServerSnapshot, getChosenSnapshot, getServerSnapshot, getSnapshot, subscribe } from "@/lib/store";

const btn = "rounded-full border border-gold/60 px-8 py-3 text-gold transition hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";

export default function Choose() {
  const router = useRouter();
  const entries = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const chosen = useSyncExternalStore(subscribe, getChosenSnapshot, getChosenServerSnapshot);
  const core = coreEntries(entries);

  if (chosen || core.length < 3) {
    return (
      <main className="relative flex min-h-screen items-center justify-center">
        <NightSky />
        <p className="relative text-muted">
          {chosen ? "별자리는 이미 정해졌어요." : "아직 별이 부족해요."} <Link href="/" className="underline">돌아가기</Link>
        </p>
      </main>
    );
  }

  const cands = candidates(core.map((e) => e.score!));
  const two = cands.length === 2;
  const emotions = [...new Set(core.flatMap((e) => e.score!.emotions))].slice(0, 4);
  const quotes = [...new Set(core.flatMap((e) => e.score!.keywords))].slice(0, 5);

  function pick(id: string) {
    chooseConstellation(id, cands.map((c) => c.constellation.id), core.map((e) => e.id));
    router.push("/");
  }

  return (
    <main className="relative min-h-screen">
      <NightSky />
      <div className="fixed inset-0 bg-sky/55" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-10 px-8 py-16">
        <header className={two ? "max-w-2xl" : "mx-auto max-w-2xl text-center"}>
          <h1 className="font-serif text-2xl">{two ? "기록이 두 개의 하늘을 가리켰어요" : "기록이 한 하늘을 가리켰어요"}</h1>
          <p className="mt-3 leading-relaxed text-muted">
            세 편의 기록에서 <span className="text-starlight">{emotions.join(", ")}</span>이 읽혔고,
            {quotes.length > 0 && <> “{quotes.join("”, “")}” 같은 말이 남았어요.</>}
            {two ? " 어느 쪽이 지금의 당신에 더 가까운가요? 정답은 없어요 — 고르는 쪽이 당신의 이야기가 됩니다." : " 이 하늘이 지금의 당신과 가장 가까워요."}
          </p>
        </header>

        <div className={`grid gap-6 ${two ? "md:grid-cols-2" : "mx-auto w-full max-w-md"}`}>
          {cands.map((cand, i) => {
            const c = cand.constellation;
            return (
              <article key={c.id} className="flex flex-col rounded-xl border border-starlight/15 bg-sky-low/80 p-8">
                <ConstellationPreview c={c} className="h-40 w-full" />
                {two && <p className="mt-2 text-sm text-muted">{i === 0 ? "기록이 가장 가까이 가리킨 곳" : "그다음으로 가까운 곳"}</p>}
                <h2 className="mt-1 font-serif text-xl">{c.name}</h2>
                <p className="mt-1 text-gold">{c.persona}</p>
                <p className="mt-3 leading-relaxed">{c.tagline}</p>
                {cand.evidence.length > 0 && (
                  <p className="mt-3 text-sm text-muted">당신의 기록에서: {cand.evidence.join(", ")} 나타났어요.</p>
                )}
                <button onClick={() => pick(c.id)} className={`${btn} mt-8 self-start`}>
                  {two ? "이 하늘로 할게요" : "이 하늘로 갈게요"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
