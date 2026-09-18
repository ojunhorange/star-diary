import { setScore, type Entry } from "@/lib/store";

const inFlight = new Set<string>();

// 채점 요청. 실패해도 일기는 남고 점수만 비어 있음 → 다음 방문 때 재시도
export async function requestScore(entry: Entry) {
  if (entry.score || inFlight.has(entry.id)) return;
  inFlight.add(entry.id);
  try {
    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: entry.text }),
    });
    if (res.ok) setScore(entry.id, await res.json());
    else console.warn("[score]", res.status, await res.text());
  } catch (e) {
    console.warn("[score]", e);
  } finally {
    inFlight.delete(entry.id);
  }
}
