"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import NightSky from "@/components/NightSky";
import { byId } from "@/lib/constellations";
import { getChosenServerSnapshot, getChosenSnapshot, subscribe } from "@/lib/store";

// 5단계에서 신화·철학·행동 제안 서사로 채워질 자리
export default function Reading() {
  const chosen = useSyncExternalStore(subscribe, getChosenSnapshot, getChosenServerSnapshot);
  const c = chosen ? byId(chosen.id) : undefined;
  return (
    <main className="relative flex min-h-screen items-center justify-center">
      <NightSky />
      <div className="relative text-center">
        <h1 className="font-serif text-2xl">{c ? `당신의 별자리: ${c.name}` : "아직 별자리가 없어요"}</h1>
        <p className="mt-3 text-muted">{c ? `${c.persona} — 이야기는 곧 이곳에서 읽을 수 있어요.` : ""}</p>
        <Link href="/" className="mt-8 inline-block text-muted underline hover:text-starlight">돌아가기</Link>
      </div>
    </main>
  );
}
