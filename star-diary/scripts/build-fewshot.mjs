// fewshot/*.md 의 "## 결과 화면" 부분을 TS 상수로 추출. md를 고치면 `npm run fewshot` 재실행.
import fs from "node:fs";
const pick = (f) => fs.readFileSync(`src/prompts/fewshot/${f}.md`, "utf8").split("## 결과 화면")[1].trim();
const out = `// 자동 생성 — 직접 수정 금지. 원본: src/prompts/fewshot/*.md, 생성: npm run fewshot
export const FEWSHOT_LYRA = ${JSON.stringify(pick("lyra"))};
export const FEWSHOT_PERSEUS = ${JSON.stringify(pick("perseus"))};
`;
fs.writeFileSync("src/prompts/fewshot-data.ts", out);
console.log("fewshot-data.ts written");
