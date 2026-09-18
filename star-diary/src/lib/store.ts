export type Entry = {
  id: string;
  createdAt: string; // ISO
  text: string;
  star: { x: number; y: number }; // 밤하늘 위 좌표 (0~100)
};

const KEY = "star-diary:entries";

export function loadEntries(): Entry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addEntry(text: string): Entry {
  const entries = loadEntries();
  const entry: Entry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    text,
    // 하늘 중앙 영역에 무작위 배치. 별자리 완성 시(4단계) 정해진 형태로 이동
    star: { x: 25 + Math.random() * 50, y: 18 + Math.random() * 40 },
  };
  localStorage.setItem(KEY, JSON.stringify([...entries, entry]));
  return entry;
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
  return () => window.removeEventListener("storage", cb);
}
