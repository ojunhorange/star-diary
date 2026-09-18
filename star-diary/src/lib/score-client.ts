import { setScore, type Entry } from "@/lib/store";

export type ScoreFailure = "limit" | "down";

const inFlight = new Set<string>();
const failed = new Map<string, ScoreFailure>(); // entryId → 실패 종류
let version = 0;
const EVT = "star-diary:score-error";

// 채점 요청. 실패해도 일기는 남고 점수만 비어 있음 → 실패 종류를 기억해 화면이 안내할 수 있게
export async function requestScore(entry: Entry, force = false) {
  if (entry.score || inFlight.has(entry.id)) return;
  if (failed.has(entry.id) && !force) return; // 실패한 건 사용자가 다시 시도할 때만
  inFlight.add(entry.id);
  try {
    const res = await fetch("/api/score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: entry.text }),
    });
    if (res.ok) {
      failed.delete(entry.id);
      setScore(entry.id, await res.json());
    } else {
      failed.set(entry.id, res.status === 429 ? "limit" : "down");
      console.warn("[score]", res.status, await res.text());
    }
  } catch (e) {
    failed.set(entry.id, "down");
    console.warn("[score]", e);
  } finally {
    inFlight.delete(entry.id);
    version++;
    window.dispatchEvent(new Event(EVT));
  }
}

export const scoreFailure = (id: string): ScoreFailure | undefined => failed.get(id);
export const retryScore = (entry: Entry) => requestScore(entry, true);

// React 구독용 (실패 상태가 바뀌면 다시 그리기)
let cached = { version: -1, failed: new Map<string, ScoreFailure>() };
export function getScoreErrorsSnapshot() {
  if (cached.version !== version) cached = { version, failed: new Map(failed) };
  return cached;
}
const SERVER = { version: -1, failed: new Map<string, ScoreFailure>() };
export const getScoreErrorsServerSnapshot = () => SERVER;
export function subscribeScoreErrors(cb: () => void) {
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}

export const failureMessage = (f: ScoreFailure) =>
  f === "limit" ? "오늘 하늘이 너무 붐벼서 별을 읽지 못했어요. 잠시 뒤 다시 시도해 주세요." : "지금은 하늘이 흐려서 별을 읽지 못했어요. 잠시 뒤 다시 시도해 주세요.";
