"use client";

import { useState } from "react";
import CharCount from "@/components/CharCount";
import { formatDate, isLocked, MIN_LENGTH, removeEntry, updateEntry, type Entry } from "@/lib/store";

const btn =
  "rounded-full px-5 py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";

export default function EntryModal({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
  const [draft, setDraft] = useState(entry.text);
  const ready = draft.trim().length >= MIN_LENGTH;
  const locked = isLocked(entry);

  const date = formatDate(entry.createdAt);

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-sky/70 p-8" onClick={onClose}>
      <article
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-starlight/15 bg-sky-low/95 px-12 py-10 shadow-2xl"
      >
        <time className="font-serif text-muted">{date}</time>

        {mode === "edit" ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="mt-6 min-h-64 flex-1 resize-none bg-transparent font-serif text-lg leading-loose text-starlight focus:outline-none"
          />
        ) : (
          <p className="mt-6 overflow-y-auto whitespace-pre-wrap font-serif text-lg leading-loose [overflow-wrap:anywhere] [word-break:normal]">
            {entry.text}
          </p>
        )}

        {mode !== "edit" && (
          <p className="mt-6 flex items-center gap-2 text-sm">
            <span className="text-muted">이 별에서 읽은 것</span>
            {entry.score ? (
              entry.score.emotions.map((em) => (
                <span key={em} className="rounded-full border border-gold/40 px-3 py-0.5 text-gold">
                  {em}
                </span>
              ))
            ) : (
              <span className="text-muted/70">아직 읽는 중이에요</span>
            )}
          </p>
        )}

        <footer className="mt-8 flex items-center justify-between text-sm">
          {mode === "view" && locked && <span className="text-muted">이 기록은 별자리의 일부가 되어 고정됐어요. 그때의 나를 그대로 남겨두는 거예요.</span>}
          {mode === "view" && !locked && (
            <>
              <span />
              <div className="flex gap-2">
                <button onClick={() => setMode("edit")} className={`${btn} text-muted hover:text-starlight`}>
                  수정
                </button>
                <button onClick={() => setMode("delete")} className={`${btn} text-muted hover:text-starlight`}>
                  삭제
                </button>
              </div>
            </>
          )}
          {mode === "edit" && (
            <>
              <CharCount text={draft} />
              <div className="flex gap-2">
                <button onClick={() => { setDraft(entry.text); setMode("view"); }} className={`${btn} text-muted hover:text-starlight`}>
                  취소
                </button>
                <button
                  disabled={!ready}
                  onClick={() => { updateEntry(entry.id, draft.trim()); setMode("view"); }}
                  className={`${btn} border border-gold/60 text-gold enabled:hover:bg-gold/10 disabled:border-muted/30 disabled:text-muted/50`}
                >
                  저장
                </button>
              </div>
            </>
          )}
          {mode === "delete" && (
            <>
              <span className="text-muted">이 별을 지울까요? 되돌릴 수 없어요.</span>
              <div className="flex gap-2">
                <button onClick={() => setMode("view")} className={`${btn} text-muted hover:text-starlight`}>
                  취소
                </button>
                <button
                  onClick={() => { removeEntry(entry.id); onClose(); }}
                  className={`${btn} border border-starlight/40 text-starlight hover:bg-starlight/10`}
                >
                  지우기
                </button>
              </div>
            </>
          )}
        </footer>
      </article>
    </div>
  );
}
