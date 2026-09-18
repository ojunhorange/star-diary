import { byId, CORE_STARS, fittedStars } from "@/lib/constellations";
import type { Narrative, Retro } from "@/lib/narrative";
import type { Score } from "@/lib/scoring";

export type Entry = {
  id: string;
  createdAt: string; // ISO
  text: string;
  star: { x: number; y: number }; // 밤하늘 위 좌표 (0~100)
  constellationId?: string; // 완성된 별자리에 속하면 설정됨(4단계) → 수정·삭제 불가, 열람만
  score?: Score; // Gemini 채점 결과. 없으면 아직 못 읽은 상태(재시도 대상)
};

export const MIN_LENGTH = 30;

export const isLocked = (e: Entry) => !!e.constellationId;

// 날짜는 "YYYY-MM-DD"(로컬) 기준으로 하루 1편
export const toDay = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const today = () => toDay(new Date());
export const findByDay = (entries: Entry[], day: string) => entries.find((e) => toDay(new Date(e.createdAt)) === day);
export const findToday = (entries: Entry[]) => findByDay(entries, today());
export const shiftDay = (day: string, n: number) => toDay(new Date(new Date(`${day}T12:00:00`).getTime() + n * 86400000));
// 일기가 없는 가장 최근 날짜 (오늘부터 거슬러 올라감)
export function latestFreeDay(entries: Entry[]) {
  let d = today();
  while (findByDay(entries, d)) d = shiftDay(d, -1);
  return d;
}

// 브라우저마다 괄호 유무가 달라 직접 조립: 2026년 9월 18일 (목)
export function formatDate(iso: string) {
  const d = new Date(iso);
  const w = "일월화수목금토"[d.getDay()];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${w})`;
}

// 확정된 별자리. 한 번 정해지면 재계산하지 않음
export type Chosen = {
  id: string; // 별자리 id
  entryIds: string[]; // 핵심 3편 (잠김)
  candidates: string[]; // 기록이 가리킨 후보 순서 [1위, 2위]
  chosenAt: string;
};

// 이야기는 장(章)으로 쌓임. 1장 = origin(고정), 이후 3편마다 retro가 뒤에 붙음
export type Chapter =
  | { kind: "origin"; createdAt: string; narrative: Narrative }
  | { kind: "retro"; createdAt: string; entryIds: string[]; narrative: Retro };
export type Reading = { chapters: Chapter[] };

const OKEY = "star-diary:onboarded";
export const isOnboarded = () => !!localStorage.getItem(OKEY);
export const markOnboarded = () => localStorage.setItem(OKEY, new Date().toISOString());

const KEY = "star-diary:entries";
const CKEY = "star-diary:constellation";
const RKEY = "star-diary:reading";
const CHANGE = "star-diary:change"; // 같은 탭 안에서는 storage 이벤트가 안 오므로 직접 알림

export function loadEntries(): Entry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(entries: Entry[]) {
  entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); // 날짜순 → 별자리는 가장 이른 3편
  localStorage.setItem(KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event(CHANGE));
}

export function addEntry(text: string, day = today()): Entry {
  const entry: Entry = {
    id: crypto.randomUUID(),
    createdAt: new Date(`${day}T12:00:00`).toISOString(), // 정오로 고정해 시간대 경계에서 날짜가 밀리지 않게
    text,
    // 하늘 중앙 영역(별자리 배치 영역과 동일)에 무작위 배치. 별자리 확정 시 정해진 형태로 이동
    star: { x: 30 + Math.random() * 40, y: 38 + Math.random() * 24 },
  };
  save([...loadEntries(), entry]);
  return entry;
}

export function updateEntry(id: string, text: string) {
  // 글이 바뀌면 점수는 무효 → 다시 채점
  save(loadEntries().map((e) => (e.id === id ? { ...e, text, score: undefined } : e)));
}

export function setScore(id: string, score: Score) {
  save(loadEntries().map((e) => (e.id === id ? { ...e, score } : e)));
}

// 핵심 3편 = 채점된 일기 중 가장 이른 3편
export const coreEntries = (entries: Entry[]) => entries.filter((e) => e.score).slice(0, CORE_STARS);

export function loadChosen(): Chosen | null {
  try {
    return JSON.parse(localStorage.getItem(CKEY) ?? "null");
  } catch {
    return null;
  }
}

export function chooseConstellation(id: string, candidates: string[], entryIds: string[]) {
  localStorage.setItem(CKEY, JSON.stringify({ id, entryIds, candidates, chosenAt: new Date().toISOString() } satisfies Chosen));
  save(loadEntries().map((e) => (entryIds.includes(e.id) ? { ...e, constellationId: id } : e)));
}

// 핵심 3편 중 하나라도 사라졌으면(개발자도구 등) 별자리를 해제하고 잠금을 풂 — 반쪽 상태 방지
// 전부 지우기 (시연 후 초기화). 온보딩 완료 표시는 유지
export function resetAll() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(CKEY);
  localStorage.removeItem(RKEY);
  localStorage.removeItem("star-diary:debug-sunday");
  window.dispatchEvent(new Event(CHANGE));
}

export function repairIfBroken(entries: Entry[], chosen: Chosen | null) {
  // 옛 구조의 이야기(place 섹션 없음)는 버리고 다시 생성
  const r = loadReading();
  if (r && r.chapters.some((ch) => !ch.narrative || (ch.kind === "origin" && typeof ch.narrative.place !== "string"))) {
    localStorage.removeItem(RKEY);
    window.dispatchEvent(new Event(CHANGE));
  }
  if (!chosen) return;
  const ids = new Set(entries.map((e) => e.id));
  // 핵심 3편이 사라졌거나, 별자리가 더 이상 존재하지 않으면(삭제된 id) 해제
  if (byId(chosen.id) && chosen.entryIds.every((id) => ids.has(id))) return;
  localStorage.removeItem(CKEY);
  localStorage.removeItem(RKEY);
  save(entries.map((e) => ({ ...e, constellationId: undefined })));
}

// 하늘 위 별 위치: 별자리가 정해졌으면 핵심 3편 → 핵심 별, 이후 일기 → 채움 별 순서대로. 넘치면 원래 무작위 자리
export function placeStars(entries: Entry[], chosen: Chosen | null) {
  const c = chosen && byId(chosen.id);
  if (!c) return entries.map((e) => e.star);
  const core = chosen.entryIds;
  const rest = entries.filter((e) => !core.includes(e.id)).map((e) => e.id);
  const stars = fittedStars(c);
  // 자리를 다 채운 뒤의 별: 연결선 위에 순서대로. 첫 바퀴는 선의 1/2 지점, 다음 바퀴는 1/3·2/3 … (겹치지 않게)
  return entries.map((e) => {
    const i = core.includes(e.id) ? core.indexOf(e.id) : CORE_STARS + rest.indexOf(e.id);
    const pos = stars[i];
    if (pos) return { x: pos[0], y: pos[1] };
    const k = i - stars.length;
    const [a, b] = c.edges[k % c.edges.length];
    const round = Math.floor(k / c.edges.length); // 0: 1/2, 1: 1/3, 2: 2/3, 3: 1/4 …
    const t = round === 0 ? 0.5 : round === 1 ? 1 / 3 : round === 2 ? 2 / 3 : 0.25;
    return { x: stars[a][0] + (stars[b][0] - stars[a][0]) * t, y: stars[a][1] + (stars[b][1] - stars[a][1]) * t };
  });
}

export function removeEntry(id: string) {
  save(loadEntries().filter((e) => e.id !== id));
}

// React용 구독 훅 재료. 스냅샷은 원문이 같으면 같은 배열을 돌려줘야 함(useSyncExternalStore 규칙)
const EMPTY: Entry[] = [];
let cachedRaw = "";
let cachedEntries: Entry[] = EMPTY;

export function getSnapshot(): Entry[] {
  const raw = localStorage.getItem(KEY) ?? "";
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedEntries = loadEntries();
  }
  return cachedEntries;
}
export const getServerSnapshot = () => EMPTY;

let cachedCRaw = "";
let cachedChosen: Chosen | null = null;
export function getChosenSnapshot(): Chosen | null {
  const raw = localStorage.getItem(CKEY) ?? "";
  if (raw !== cachedCRaw) {
    cachedCRaw = raw;
    cachedChosen = loadChosen();
  }
  return cachedChosen;
}
export const getChosenServerSnapshot = () => null;

export function loadReading(): Reading | null {
  try {
    return JSON.parse(localStorage.getItem(RKEY) ?? "null");
  } catch {
    return null;
  }
}
export function addChapter(ch: Chapter) {
  const r = loadReading() ?? { chapters: [] };
  localStorage.setItem(RKEY, JSON.stringify({ chapters: [...r.chapters, ch] }));
  window.dispatchEvent(new Event(CHANGE));
}
let cachedRRaw = "";
let cachedReading: Reading | null = null;
export function getReadingSnapshot(): Reading | null {
  const raw = localStorage.getItem(RKEY) ?? "";
  if (raw !== cachedRRaw) {
    cachedRRaw = raw;
    cachedReading = loadReading();
  }
  return cachedReading;
}
export const getReadingServerSnapshot = () => null;
export function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE, cb);
  };
}

// ---------- 회고(3편 단위) ----------
export const RETRO_STEP = 3; // 최소 편수
export const RETRO_MAX = 7; // 한 답에 넣는 최대 편수

// 별자리 확정 후, 아직 어떤 장에도 쓰이지 않은 채점된 일기 (일기 날짜순)
export function retroPool(entries: Entry[], chosen: Chosen | null, reading: Reading | null): Entry[] {
  if (!chosen) return [];
  const used = new Set<string>(chosen.entryIds);
  reading?.chapters.forEach((ch) => ch.kind === "retro" && ch.entryIds.forEach((id) => used.add(id)));
  return entries.filter((e) => e.score && !used.has(e.id));
}

// 일요일부터 열림. 테스트용 스위치: localStorage star-diary:debug-sunday = 1
export const isSunday = () => new Date().getDay() === 0 || localStorage.getItem("star-diary:debug-sunday") === "1";

// 별자리 선 투명도: 확정 0.4 → 회고마다 +0.2 → 최대 1.0
export const lineOpacity = (reading: Reading | null) =>
  Math.min(1, 0.4 + 0.2 * (reading?.chapters.filter((c) => c.kind === "retro").length ?? 0));

// 직전 장의 제안 문장
export function lastAction(reading: Reading | null) {
  const ch = reading?.chapters.at(-1);
  if (!ch) return "";
  return ch.kind === "origin" ? ch.narrative.action : ch.narrative.next;
}
