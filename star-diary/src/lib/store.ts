import { byId, CORE_STARS, fittedStars } from "@/lib/constellations";
import type { Narrative, Retro } from "@/lib/narrative";
import type { Score } from "@/lib/scoring";

export type Entry = {
  id: string;
  createdAt: string; // ISO (일기 날짜, 정오)
  text: string;
  star: { x: number; y: number }; // 밤하늘 위 좌표 (0~100)
  constellationId?: string; // 완성된 별자리의 핵심 3편이면 설정 → 수정·삭제 불가, 열람만
  score?: Score; // Gemini 채점 결과. 없으면 아직 못 읽은 상태(재시도 대상)
};

export const MIN_LENGTH = 30;

export const isLocked = (e: Entry) => !!e.constellationId;

// ---------- 날짜 ----------
// "YYYY-MM-DD"(로컬) 기준으로 하루 1편, "YYYY-MM" 기준으로 한 달 하나의 하늘
export const toDay = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const today = () => toDay(new Date());
export const monthOf = (iso: string) => toDay(new Date(iso)).slice(0, 7);
export const currentMonth = () => today().slice(0, 7);
export const shiftMonth = (m: string, n: number) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
export const monthLabel = (m: string) => `${m.slice(0, 4)}년 ${Number(m.slice(5))}월`;
export const findByDay = (entries: Entry[], day: string) => entries.find((e) => toDay(new Date(e.createdAt)) === day);
export const findToday = (entries: Entry[]) => findByDay(entries, today());
export const shiftDay = (day: string, n: number) => toDay(new Date(new Date(`${day}T12:00:00`).getTime() + n * 86400000));
// 일기가 없는 가장 최근 날짜 (from부터 거슬러 올라감). 과거 달을 보고 있으면 그 달 말일부터
export function latestFreeDay(entries: Entry[], month = currentMonth()) {
  let d = month === currentMonth() ? today() : lastDayOf(month);
  while (findByDay(entries, d)) d = shiftDay(d, -1);
  return d;
}
export const lastDayOf = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return toDay(new Date(y, mo, 0, 12));
};

// 브라우저마다 괄호 유무가 달라 직접 조립: 2026년 9월 18일 (목)
export function formatDate(iso: string) {
  const d = new Date(iso);
  const w = "일월화수목금토"[d.getDay()];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${w})`;
}

// ---------- 타입 ----------
// 확정된 별자리(달마다 하나). 한 번 정해지면 재계산하지 않음
export type Chosen = {
  id: string; // 별자리 id
  entryIds: string[]; // 핵심 3편 (잠김)
  candidates: string[]; // 기록이 가리킨 후보 순서
  chosenAt: string;
};

// 이야기는 장(章)으로 쌓임(달마다). 1장 = origin(고정), 이후 3편마다 retro가 뒤에 붙음
export type Chapter =
  | { kind: "origin"; createdAt: string; narrative: Narrative }
  | { kind: "retro"; createdAt: string; entryIds: string[]; narrative: Retro };
export type Reading = { chapters: Chapter[] };

export type ChosenMap = Record<string, Chosen>; // "YYYY-MM" → 별자리
export type ReadingMap = Record<string, Reading>; // "YYYY-MM" → 이야기

// ---------- 키 ----------
const OKEY = "star-diary:onboarded";
const KEY = "star-diary:entries";
const CKEY = "star-diary:constellations"; // 달 단위 (구 키 star-diary:constellation 은 이전 시 흡수)
const RKEY = "star-diary:readings";
const VKEY = "star-diary:view-month"; // 지금 보고 있는 달
const CHANGE = "star-diary:change"; // 같은 탭 안에서는 storage 이벤트가 안 오므로 직접 알림
const notify = () => window.dispatchEvent(new Event(CHANGE));

export const isOnboarded = () => !!localStorage.getItem(OKEY);
export const markOnboarded = () => localStorage.setItem(OKEY, new Date().toISOString());

// ---------- 일기 ----------
export function loadEntries(): Entry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}
function saveEntries(entries: Entry[]) {
  entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); // 날짜순 → 별자리는 그 달의 가장 이른 3편
  localStorage.setItem(KEY, JSON.stringify(entries));
  notify();
}
export function addEntry(text: string, day = today()): Entry {
  const entry: Entry = {
    id: crypto.randomUUID(),
    createdAt: new Date(`${day}T12:00:00`).toISOString(), // 정오로 고정해 시간대 경계에서 날짜가 밀리지 않게
    text,
    // 하늘 중앙 영역(별자리 배치 영역과 동일)에 무작위 배치. 별자리 확정 시 정해진 형태로 이동
    star: { x: 30 + Math.random() * 40, y: 38 + Math.random() * 24 },
  };
  saveEntries([...loadEntries(), entry]);
  return entry;
}
export function updateEntry(id: string, text: string) {
  // 글이 바뀌면 점수는 무효 → 다시 채점
  saveEntries(loadEntries().map((e) => (e.id === id ? { ...e, text, score: undefined } : e)));
}
export function setScore(id: string, score: Score) {
  saveEntries(loadEntries().map((e) => (e.id === id ? { ...e, score } : e)));
}
export function removeEntry(id: string) {
  saveEntries(loadEntries().filter((e) => e.id !== id));
}
export const monthEntries = (entries: Entry[], m: string) => entries.filter((e) => monthOf(e.createdAt) === m);
// 핵심 3편 = 그 달의 채점된 일기 중 가장 이른 3편
export const coreEntries = (entries: Entry[]) => entries.filter((e) => e.score).slice(0, CORE_STARS);

// ---------- 별자리 / 이야기 (달 단위) ----------
function loadMap<T>(key: string): Record<string, T> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}");
  } catch {
    return {};
  }
}
export const loadChosenMap = () => loadMap<Chosen>(CKEY);
export const loadReadingMap = () => loadMap<Reading>(RKEY);

export function chooseConstellation(month: string, id: string, candidates: string[], entryIds: string[]) {
  const map = loadChosenMap();
  map[month] = { id, entryIds, candidates, chosenAt: new Date().toISOString() };
  localStorage.setItem(CKEY, JSON.stringify(map));
  saveEntries(loadEntries().map((e) => (entryIds.includes(e.id) ? { ...e, constellationId: id } : e)));
}
export function addChapter(month: string, ch: Chapter) {
  const map = loadReadingMap();
  map[month] = { chapters: [...(map[month]?.chapters ?? []), ch] };
  localStorage.setItem(RKEY, JSON.stringify(map));
  notify();
}

// 보고 있는 달 (하늘의 ‹ ›). 기본은 이번 달
export const getViewMonth = () => localStorage.getItem(VKEY) ?? currentMonth();
export function setViewMonth(m: string) {
  if (m === currentMonth()) localStorage.removeItem(VKEY);
  else localStorage.setItem(VKEY, m);
  notify();
}

// 전부 지우기 (시연 후 초기화). 온보딩 완료 표시는 유지
export function resetAll() {
  [KEY, CKEY, RKEY, VKEY, "star-diary:constellation", "star-diary:reading", "star-diary:debug-sunday", "star-diary:demo"].forEach((k) => localStorage.removeItem(k));
  notify();
}

// 옛 구조(전역 별자리 1개·이야기 1묶음) → 달 단위로 이전. 그리고 깨진 상태 자가 복구
export function repairIfBroken() {
  // 인자를 받지 않고 저장소에서 직접 읽는다 — 하이드레이션 첫 렌더의 빈 스냅샷으로 판단하면 전부 지워버리므로
  const entries = loadEntries();
  let touched = false;
  // 1) 이전
  const oldChosen = localStorage.getItem("star-diary:constellation");
  if (oldChosen) {
    try {
      const c: Chosen = JSON.parse(oldChosen);
      const first = entries.find((e) => c.entryIds.includes(e.id));
      const m = monthOf(first?.createdAt ?? c.chosenAt);
      const cmap = loadChosenMap();
      if (!cmap[m]) cmap[m] = c;
      localStorage.setItem(CKEY, JSON.stringify(cmap));
      const oldReading = localStorage.getItem("star-diary:reading");
      if (oldReading) {
        const rmap = loadReadingMap();
        if (!rmap[m]) rmap[m] = JSON.parse(oldReading);
        localStorage.setItem(RKEY, JSON.stringify(rmap));
      }
    } catch {}
    localStorage.removeItem("star-diary:constellation");
    localStorage.removeItem("star-diary:reading");
    touched = true;
  }
  // 2) 복구: 옛 구조 이야기(place 없음) 버림, 핵심 3편이 사라졌거나 별자리 id가 없으면 해제
  const cmap = loadChosenMap();
  const rmap = loadReadingMap();
  const ids = new Set(entries.map((e) => e.id));
  for (const m of Object.keys(rmap)) {
    if (rmap[m].chapters.some((ch) => !ch.narrative || (ch.kind === "origin" && typeof ch.narrative.place !== "string"))) {
      delete rmap[m];
      touched = true;
    }
  }
  let unlock = false;
  for (const m of Object.keys(cmap)) {
    const c = cmap[m];
    if (byId(c.id) && c.entryIds.every((id) => ids.has(id))) continue;
    delete cmap[m];
    delete rmap[m];
    unlock = true;
    touched = true;
  }
  if (!touched) return;
  localStorage.setItem(CKEY, JSON.stringify(cmap));
  localStorage.setItem(RKEY, JSON.stringify(rmap));
  if (unlock) {
    const stillLocked = new Set(Object.values(cmap).flatMap((c) => c.entryIds));
    saveEntries(entries.map((e) => (e.constellationId && !stillLocked.has(e.id) ? { ...e, constellationId: undefined } : e)));
  } else notify();
}

// 하늘 위 별 위치(한 달치): 별자리가 정해졌으면 핵심 3편 → 핵심 별, 이후 일기 → 채움 별, 자리를 넘으면 연결선 위
export function placeStars(entries: Entry[], chosen: Chosen | null) {
  const c = chosen && byId(chosen.id);
  if (!c) return entries.map((e) => e.star);
  const core = chosen.entryIds;
  const rest = entries.filter((e) => !core.includes(e.id)).map((e) => e.id);
  const stars = fittedStars(c);
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

// ---------- React 구독 (useSyncExternalStore) ----------
// 스냅샷은 원문이 같으면 같은 객체를 돌려줘야 함
function snapshotter<T>(key: string, parse: () => T, empty: T) {
  let raw = " ";
  let cached: T = empty;
  return () => {
    const now = localStorage.getItem(key) ?? "";
    if (now !== raw) {
      raw = now;
      cached = parse();
    }
    return cached;
  };
}
const EMPTY: Entry[] = [];
export const getSnapshot = snapshotter<Entry[]>(KEY, loadEntries, EMPTY);
export const getServerSnapshot = () => EMPTY;
const EMPTY_C: ChosenMap = {};
export const getChosenSnapshot = snapshotter<ChosenMap>(CKEY, loadChosenMap, EMPTY_C);
export const getChosenServerSnapshot = () => EMPTY_C;
const EMPTY_R: ReadingMap = {};
export const getReadingSnapshot = snapshotter<ReadingMap>(RKEY, loadReadingMap, EMPTY_R);
export const getReadingServerSnapshot = () => EMPTY_R;
export const getViewMonthSnapshot = snapshotter<string>(VKEY, () => localStorage.getItem(VKEY) ?? "", ""); // 비어 있으면 페이지가 이번 달로 (캐시에 달을 고정하지 않기 위해)
export const getViewMonthServerSnapshot = () => "";

export function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE, cb);
  };
}

// ---------- 하늘의 제안 (3편 단위, 달 안에서) ----------
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
export const retroCount = (reading: Reading | null | undefined) => reading?.chapters.filter((c) => c.kind === "retro").length ?? 0;
export const lineOpacity = (reading: Reading | null | undefined) => Math.min(1, 0.4 + 0.2 * retroCount(reading));

// 직전 장의 제안 문장
export function lastAction(reading: Reading | null | undefined) {
  const ch = reading?.chapters.at(-1);
  if (!ch) return "";
  return ch.kind === "origin" ? ch.narrative.action : ch.narrative.next;
}

// 예시 모드 여부 (이야기를 API 대신 캐시에서)
export const isDemo = () => localStorage.getItem("star-diary:demo") === "1";
