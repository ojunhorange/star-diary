// 매칭 함수 검증: 알려진 채점값 3세트가 기대 별자리를 1위로 내는지. 실행: npm run check:match
import assert from "node:assert/strict";
import { match } from "../src/lib/match.ts";
const S = (O, C, E, A, N, nFacet = null) => ({ O, C, E, A, N, nFacet, emotions: [], keywords: [] });
const cases = {
  lyra: [S(0, 2, 1, 0, 2, "불안"), S(0, 1, 1, 1, 2, "불안"), S(0, 2, 1, 0, 2, "불안")],
  perseus: [S(1, 2, 1, 1, -1), S(1, 1, 2, 1, -2), S(1, 0, 1, 1, 0, "자의식")],
  argo: [S(2, -1, -1, 0, 1, "자의식"), S(1, -2, -1, 1, 1, "우울"), S(0, -1, -1, 0, 2, "불안")],
};
for (const [want, scores] of Object.entries(cases)) {
  const top = match(scores).slice(0, 3);
  console.log(want, "→", top.map((c) => `${c.constellation.id}(${c.distance.toFixed(2)})`).join(" > "));
  assert.equal(top[0].constellation.id, want);
}
console.log("ok");
