import { CONSTELLATIONS, type Constellation, type Trait } from "./constellations.ts";
import type { Score } from "./scoring.ts";

const TRAITS: Trait[] = ["O", "C", "E", "A", "N"];
const TRAIT_LABEL: Record<Trait, string> = { O: "개방성", C: "성실성", E: "외향성", A: "우호성", N: "신경성" };
const FACET_BONUS = 0.8;
export const CLOSE_GAP = 0.5; // 1·2위 거리 차이가 이 이하일 때만 두 후보를 제시 (아니면 1위만) // N 세부 요인 일치 시 거리 차감 — 숫자만으론 가까운 쌍(거문고↔안드로메다 등)을 가르는 핵심

export type Candidate = {
  constellation: Constellation;
  distance: number;
  evidence: string[]; // "성실성이 높고 불안이 반복됐어요" 같은 근거
};

export function average(scores: Score[]) {
  const avg = Object.fromEntries(TRAITS.map((t) => [t, scores.reduce((s, x) => s + x[t], 0) / scores.length])) as Record<Trait, number>;
  const facets = scores.map((s) => s.nFacet).filter(Boolean) as string[];
  const facet = facets.length ? mode(facets) : null;
  return { avg, facet };
}

// 평균 벡터 ↔ 프로필 벡터 거리. 프로필이 0인 축은 그 별자리 판별에 안 쓰므로 가중치 절반
export function match(scores: Score[]): Candidate[] {
  const { avg, facet } = average(scores);
  return CONSTELLATIONS.map((c) => {
    let d2 = 0;
    for (const t of TRAITS) {
      const diff = avg[t] - c.profile[t];
      d2 += diff * diff * (c.profile[t] === 0 ? 0.5 : 1);
    }
    let distance = Math.sqrt(d2);
    const facetHit = !!c.nFacet && c.nFacet === facet;
    if (facetHit) distance = Math.max(0, distance - FACET_BONUS);

    const evidence = TRAITS.filter((t) => c.profile[t] !== 0 && Math.sign(avg[t]) === Math.sign(c.profile[t]) && Math.abs(avg[t]) >= 0.5)
      .map((t) => `${TRAIT_LABEL[t]}${c.profile[t] > 0 ? "이 높게" : "이 낮게"}`);
    if (facetHit) evidence.push(`${facet}이 반복해서`);
    return { constellation: c, distance, evidence };
  }).sort((a, b) => a.distance - b.distance);
}

function mode(xs: string[]) {
  const n = new Map<string, number>();
  xs.forEach((x) => n.set(x, (n.get(x) ?? 0) + 1));
  return [...n.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

// 사용자에게 보여줄 후보: 확실하면 1개, 가까우면 2개
export function candidates(scores: Score[]): Candidate[] {
  const [a, b] = match(scores);
  return b && b.distance - a.distance <= CLOSE_GAP ? [a, b] : [a];
}
