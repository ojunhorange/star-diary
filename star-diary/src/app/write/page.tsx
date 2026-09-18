"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import NightSky from "@/components/NightSky";
import { addEntry } from "@/lib/store";

const MIN_LENGTH = 30;

export default function Write() {
  const router = useRouter();
  const [text, setText] = useState("");
  const ready = text.trim().length >= MIN_LENGTH;

  const today = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

  function save() {
    if (!ready) return;
    addEntry(text.trim());
    router.push("/");
  }

  return (
    <main className="relative min-h-screen">
      <NightSky />
      <div className="absolute inset-0 bg-sky/55" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-6 px-6 py-16">
        <p className="font-serif text-muted">{today}</p>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="오늘 있었던 일 중 마음에 남은 걸 적어보세요. 잘 쓰려고 하지 않아도 돼요."
          className="min-h-72 w-full resize-none bg-transparent font-serif text-lg leading-relaxed text-starlight placeholder:text-muted/60 focus:outline-none"
        />
        <div className="flex items-center justify-between">
          <Link href="/" className="text-muted hover:text-starlight">
            돌아가기
          </Link>
          <div className="flex items-center gap-4">
            {!ready && text.length > 0 && (
              <span className="text-sm text-muted">{MIN_LENGTH - text.trim().length}자 더</span>
            )}
            <button
              onClick={save}
              disabled={!ready}
              className="rounded-full border border-gold/60 px-8 py-3 text-gold transition enabled:hover:bg-gold/10 disabled:border-muted/30 disabled:text-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              별 찍기
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
