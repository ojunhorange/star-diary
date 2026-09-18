export type Entry = {
  id: string;
  createdAt: string; // ISO
  text: string;
  star: { x: number; y: number }; // 밤하늘 위 좌표 (0~100)
  constellationId?: string; // 완성된 별자리에 속하면 설정됨(4단계) → 수정·삭제 불가, 열람만
};

export const MIN_LENGTH = 30;

export const isLocked = (e: Entry) => !!e.constellationId;

// 날짜는 "YYYY-MM-DD"(로컬) 기준으로 하루 1편
export const toDay = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const today = () => toDay(new Date());
export const findByDay = (entries: Entry[], day: string) => entries.find((e) => toDay(new Date(e.createdAt)) === day);
export const findToday = (entries: Entry[]) => findByDay(entries, today());

// 브라우저마다 괄호 유무가 달라 직접 조립: 2026년 9월 18일 (목)
export function formatDate(iso: string) {
  const d = new Date(iso);
  const w = "일월화수목금토"[d.getDay()];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${w})`;
}

const KEY = "star-diary:entries";
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
    // 하늘 중앙 영역에 무작위 배치. 별자리 완성 시(4단계) 정해진 형태로 이동
    star: { x: 25 + Math.random() * 50, y: 18 + Math.random() * 40 },
  };
  save([...loadEntries(), entry]);
  return entry;
}

export function updateEntry(id: string, text: string) {
  save(loadEntries().map((e) => (e.id === id ? { ...e, text } : e)));
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
export function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE, cb);
  };
}
