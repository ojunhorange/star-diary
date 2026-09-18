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

// 실제 별 위치(적경 h, 적위 °)를 2D로 투영. 앞 3개 = 핵심 별(중심에 가깝고 서로 이어진 것). 좌표계는 fittedStars가 화면에 맞춤
type Sky = { id: Shape["id"]; profile: Profile; nFacet: string | null; stars: [number, number][]; edges: [number, number][] };
const project = (stars: [number, number][]): [number, number][] => {
  const decMean = stars.reduce((s, [, d]) => s + d, 0) / stars.length;
  const k = Math.cos((decMean * Math.PI) / 180);
  // 북반구에서 남쪽 하늘을 볼 때처럼: 적경이 클수록 왼쪽, 적위가 클수록 위
  return stars.map(([ra, dec]) => [-ra * 15 * k, -dec]);
};
const RAW: Sky[] = [
  { // 카시오페이아: W — 핵심 α Schedar, γ Navi, δ Ruchbah
    id: "cassiopeia", profile: { O: 0, C: 0, E: 1, A: -1, N: 1 }, nFacet: "자의식",
    stars: [[0.675, 56.54], [0.945, 60.72], [1.43, 60.24], [0.153, 59.15], [1.907, 63.67]],
    edges: [[3, 0], [0, 1], [1, 2], [2, 4]],
  },
  { // 에리다누스: 오리온 발치의 상류 구간 — 핵심 γ Zaurak, δ, ε
    id: "eridanus", profile: { O: 0, C: 1, E: 1, A: -1, N: 1 }, nFacet: "충동",
    stars: [[3.967, -13.51], [3.721, -9.76], [3.549, -9.46], [5.131, -5.09], [4.758, -3.25], [4.197, -6.84], [2.94, -8.9], [2.751, -18.57]],
    edges: [[3, 4], [4, 5], [5, 0], [0, 1], [1, 2], [2, 6], [6, 7]],
  },
  { // 거문고: 베가 + 평행사변형 — 핵심 Vega, ζ, β Sheliak
    id: "lyra", profile: { O: 0, C: 1, E: 1, A: 0, N: 2 }, nFacet: "불안",
    stars: [[18.616, 38.78], [18.746, 37.6], [18.835, 33.36], [18.908, 36.9], [18.982, 32.69]],
    edges: [[0, 1], [1, 3], [3, 4], [4, 2], [2, 1]],
  },
  { // 큰곰: 북두칠성 — 핵심 ε Alioth, ζ Mizar, δ Megrez
    id: "ursa", profile: { O: 0, C: 0, E: -1, A: 1, N: 1 }, nFacet: "적대감",
    stars: [[12.9, 55.96], [13.399, 54.93], [12.257, 57.03], [13.792, 49.31], [11.897, 53.69], [11.03, 56.38], [11.062, 61.75]],
    edges: [[3, 1], [1, 0], [0, 2], [2, 4], [4, 5], [5, 6], [6, 2]],
  },
  { // 아르고(용골·돛·고물): 선체 — 핵심 ε Avior, ι Aspidiske, δ Vel
    id: "argo", profile: { O: 0, C: 0, E: -1, A: 0, N: 1 }, nFacet: "불안",
    stars: [[8.375, -59.51], [9.285, -59.28], [8.745, -54.71], [6.399, -52.7], [9.22, -69.72], [10.716, -64.39], [8.158, -47.34], [8.06, -40.0]],
    edges: [[3, 0], [0, 2], [2, 6], [6, 7], [0, 1], [1, 5], [5, 4], [4, 0]],
  },
  { // 헤라클레스: 키스톤 — 핵심 ζ, η, π
    id: "hercules", profile: { O: 0, C: 1, E: 0, A: 1, N: 1 }, nFacet: "취약성",
    stars: [[16.688, 31.6], [16.715, 38.92], [17.251, 36.81], [17.005, 30.93], [16.503, 21.49], [17.25, 24.84], [17.244, 14.39]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [3, 5], [5, 6]],
  },
  { // 오리온: 허리띠 — 핵심 δ Mintaka, ε Alnilam, ζ Alnitak
    id: "orion", profile: { O: 1, C: -1, E: 1, A: 0, N: 0 }, nFacet: null,
    stars: [[5.533, -0.3], [5.604, -1.2], [5.679, -1.94], [5.919, 7.41], [5.419, 6.35], [5.242, -8.2], [5.796, -9.67]],
    edges: [[0, 1], [1, 2], [3, 4], [4, 0], [3, 2], [2, 6], [6, 5], [5, 0]],
  },
  { // 쌍둥이: 두 줄 — 핵심 Castor, Pollux, δ Wasat
    id: "gemini", profile: { O: 0, C: 0, E: 1, A: 1, N: 1 }, nFacet: "자의식",
    stars: [[7.577, 31.89], [7.755, 28.03], [7.335, 21.98], [6.732, 25.13], [6.383, 22.51], [7.068, 20.57], [6.629, 16.4]],
    edges: [[0, 3], [3, 4], [1, 2], [2, 5], [5, 6], [0, 1]],
  },
  { // 페르세우스: 굽은 사슬 — 핵심 α Mirfak, δ, γ
    id: "perseus", profile: { O: 1, C: 1, E: 1, A: 0, N: -1 }, nFacet: null,
    stars: [[3.405, 49.86], [3.715, 47.79], [3.08, 53.5], [2.845, 55.9], [3.964, 40.01], [3.902, 31.88], [3.136, 40.96]],
    edges: [[3, 2], [2, 0], [0, 1], [1, 4], [4, 5], [0, 6]],
  },
];
const SHAPES: Shape[] = RAW.map((r) => ({ ...r, stars: project(r.stars) }));

export const CONSTELLATIONS: Constellation[] = SHAPES.map((s) => ({ ...s, ...CONTENT[s.id] }));

export const byId = (id: string) => CONSTELLATIONS.find((c) => c.id === id);

// 화면 안전 영역(16:9에서 위아래가 잘리고 하단 UI를 피한 곳)에 비율 유지한 채 맞춘 별 좌표
const SAFE = { x0: 30, x1: 70, y0: 34, y1: 58 };
export function fittedStars(c: Constellation): [number, number][] {
  const xs = c.stars.map((s) => s[0]);
  const ys = c.stars.map((s) => s[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = Math.min((SAFE.x1 - SAFE.x0) / (maxX - minX || 1), (SAFE.y1 - SAFE.y0) / (maxY - minY || 1));
  const ox = (SAFE.x0 + SAFE.x1) / 2 - ((minX + maxX) / 2) * k;
  const oy = (SAFE.y0 + SAFE.y1) / 2 - ((minY + maxY) / 2) * k;
  return c.stars.map(([x, y]) => [x * k + ox, y * k + oy]);
}
