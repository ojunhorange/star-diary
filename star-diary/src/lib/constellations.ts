import { CONTENT } from "@/data/constellations-content";

// 페르소나 / 별자리 / 철학 매칭표 (CLAUDE.md 확정 10개). LLM 자유생성 금지 — 고정 데이터.
// stars: 밤하늘 좌표(0~100), 순서 있음. 앞 3개 = 핵심 별(일기 3편이 채움), 이후 = 채움 별.
// edges: 별 인덱스 쌍. 두 별이 모두 채워졌을 때만 선이 그려짐.

export type Trait = "O" | "C" | "E" | "A" | "N";
export type Profile = Record<Trait, number>; // −2 ~ +2, 0 = 판별에 안 씀

// 구조 데이터(프로필·좌표)는 여기, 글(신화·철학·설명)은 content/constellations/*.md → src/data/constellations-content.ts
type Shape = {
  id: keyof typeof CONTENT;
  profile: Profile;
  nFacet: string | null; // N 세부 요인 (일치 시 가산)
  stars: [number, number][];
  edges: [number, number][];
};
export type Constellation = Shape & {
  name: string;
  persona: string;
  tagline: string;
  tone: "고쳐보기" | "정리하기" | "넓히기" | "지키기";
  lesson: string; // 표면적 교훈
  philosopher: string;
  concept: string;
  core: string; // 철학 핵심 한 줄
  hint: string; // 비유 힌트
  keep: string; // 조언 전략: 없애지 말 것
  change: string; // 조언 전략: 바꿀 것 (A → B)
  action: string; // 조언 전략: 행동의 형태
  myth: string; // 신화 참고자료 (선택, 베끼지 않음)
};

export const CORE_STARS = 3;

const SHAPES: Shape[] = [
  {
    id: "cassiopeia",
    profile: { O: 0, C: 0, E: 1, A: -1, N: 1 },
    nFacet: "자의식",
    stars: [[35, 55], [50, 42], [65, 58], [20, 40], [80, 45]],
    edges: [[0, 1], [1, 2], [3, 0], [2, 4]],
  },
  {
    id: "eridanus",
    profile: { O: 0, C: 1, E: 1, A: -1, N: 1 },
    nFacet: "충동",
    stars: [[55, 40], [50, 52], [40, 60], [65, 35], [75, 25], [35, 70], [25, 78]],
    edges: [[0, 1], [1, 2], [3, 0], [4, 3], [2, 5], [5, 6]],
  },
  {
    id: "lyra",
    profile: { O: 0, C: 1, E: 1, A: 0, N: 2 },
    nFacet: "불안",
    stars: [[50, 30], [45, 42], [43, 60], [56, 44], [55, 62]],
    edges: [[0, 1], [1, 2], [0, 3], [3, 4], [4, 2]],
  },
  {
    id: "ursa",
    profile: { O: 0, C: 0, E: -1, A: 1, N: 1 },
    nFacet: "적대감",
    stars: [[55, 36], [66, 32], [78, 25], [42, 38], [40, 50], [27, 48], [25, 35]],
    edges: [[0, 1], [1, 2], [3, 0], [3, 4], [4, 5], [5, 6], [6, 3]],
  },
  {
    id: "argo",
    profile: { O: 0, C: 0, E: -1, A: 0, N: 1 },
    nFacet: "불안",
    stars: [[30, 60], [40, 50], [52, 48], [64, 52], [74, 60], [60, 66], [45, 66]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]],
  },
  {
    id: "hercules",
    profile: { O: 0, C: 1, E: 0, A: 1, N: 1 },
    nFacet: "취약성",
    stars: [[44, 40], [56, 38], [58, 52], [42, 54], [34, 30], [66, 28], [36, 66], [64, 68]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 5], [3, 6], [2, 7]],
  },
  {
    id: "virgo",
    profile: { O: 0, C: 0, E: -2, A: -1, N: 1 },
    nFacet: "취약성",
    stars: [[56, 70], [46, 52], [62, 58], [36, 32], [42, 44], [22, 58], [34, 56]],
    edges: [[0, 1], [1, 4], [4, 3], [1, 6], [6, 5], [0, 2], [2, 4]],
  },
  {
    id: "orion",
    profile: { O: 1, C: -1, E: 1, A: 0, N: 0 },
    nFacet: null,
    stars: [[46, 50], [50, 52], [54, 54], [38, 28], [62, 30], [62, 74], [40, 72]],
    edges: [[0, 1], [1, 2], [3, 4], [3, 0], [4, 2], [0, 6], [2, 5], [5, 6]],
  },
  {
    id: "gemini",
    profile: { O: 0, C: 0, E: 1, A: 1, N: 0 },
    nFacet: null,
    stars: [[40, 25], [60, 28], [38, 42], [58, 45], [36, 58], [56, 60], [34, 74], [54, 74]],
    edges: [[0, 1], [0, 2], [2, 4], [4, 6], [1, 3], [3, 5], [5, 7]],
  },
  {
    id: "perseus",
    profile: { O: 1, C: 1, E: 1, A: 0, N: -1 },
    nFacet: null,
    stars: [[50, 40], [55, 52], [38, 56], [45, 28], [40, 20], [60, 64], [52, 74]],
    edges: [[4, 3], [3, 0], [0, 1], [1, 5], [5, 6], [0, 2]],
  },
];

export const CONSTELLATIONS: Constellation[] = SHAPES.map((s) => ({ ...s, ...CONTENT[s.id] }));

export const byId = (id: string) => CONSTELLATIONS.find((c) => c.id === id);

// 화면 안전 영역(16:9에서 위아래가 잘리고 하단 UI를 피한 곳)에 비율 유지한 채 맞춘 별 좌표
const SAFE = { x0: 30, x1: 70, y0: 38, y1: 62 };
export function fittedStars(c: Constellation): [number, number][] {
  const xs = c.stars.map((s) => s[0]);
  const ys = c.stars.map((s) => s[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = Math.min((SAFE.x1 - SAFE.x0) / (maxX - minX || 1), (SAFE.y1 - SAFE.y0) / (maxY - minY || 1));
  const ox = (SAFE.x0 + SAFE.x1) / 2 - ((minX + maxX) / 2) * k;
  const oy = (SAFE.y0 + SAFE.y1) / 2 - ((minY + maxY) / 2) * k;
  return c.stars.map(([x, y]) => [x * k + ox, y * k + oy]);
}
