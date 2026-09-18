// content/**/*.md → src/data/*.ts
// 실행: npm run content (빌드 전 자동). 형식이 어긋나면 파일명·항목을 알려주고 실패함.
import fs from "node:fs";
import path from "node:path";

const errors = [];
const read = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const section = (text, title) => text.split(new RegExp(`^## ${title}\\s*$`, "m"))[1]?.split(/^## /m)[0]?.trim();
const line = (text, label) => text.match(new RegExp(`^${label}:\\s*(.+)$`, "m"))?.[1]?.trim();
const optional = (block, label) => (block && line(block, label)) ?? ""; // 비워두면 LLM이 직접 만듦

// ---- 별자리 10개 ----
const DIR = "content/constellations";
const TONES = ["고쳐보기", "정리하기", "넓히기", "지키기"];
const content = {};
for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith(".md") && f !== "README.md")) {
  const id = path.basename(file, ".md");
  const text = read(path.join(DIR, file));
  const fail = (msg) => errors.push(`${file}: ${msg}`);

  const name = text.match(/^# (.+)$/m)?.[1]?.trim() ?? fail("첫 줄에 '# 별자리 이름'이 없음");
  const persona = line(text, "페르소나") ?? fail("'페르소나:' 줄 없음");
  const tagline = line(text, "한 줄") ?? fail("'한 줄:' 줄 없음");
  const tone = line(text, "톤") ?? fail("'톤:' 줄 없음");
  if (tone && !TONES.includes(tone)) fail(`톤은 ${TONES.join("/")} 중 하나여야 함 (지금: ${tone})`);
  const lesson = section(text, "표면적 교훈") ?? fail("'## 표면적 교훈' 섹션 없음");
  const phil = section(text, "철학") ?? fail("'## 철학' 섹션 없음");
  const pick = (block, label) => (block && line(block, label)) ?? fail(`'${label}:' 줄 없음`);
  const philosopher = pick(phil, "철학자");
  const concept = pick(phil, "개념");
  const core = pick(phil, "핵심");
  const hint = optional(phil, "비유 힌트");
  const strat = section(text, "조언 전략") ?? fail("'## 조언 전략' 섹션 없음");
  const keep = pick(strat, "없애지 말 것");
  const change = pick(strat, "바꿀 것");
  const action = optional(strat, "행동의 형태");
  const myth = section(text, "신화 참고자료") ?? ""; // 선택. LLM이 베끼지 않고 참고만 함

  content[id] = { name, persona, tagline, tone, lesson, philosopher, concept, core, hint, keep, change, action, myth };
}

// ---- 온보딩 3장 ----
const ob = read("content/onboarding.md");
const slides = [1, 2, 3].map((n) => {
  const body = ob.split(new RegExp(`^## ${n}\\s*$`, "m"))[1]?.split(/^## |^버튼:/m)[0]?.trim();
  if (!body) errors.push(`onboarding.md: '## ${n}' 섹션 없음`);
  return body ? body.split(/\n\s*\n/).map((p) => p.trim()) : [];
});
const cta = line(ob, "버튼") ?? errors.push("onboarding.md: '버튼:' 줄 없음");

if (errors.length) {
  console.error("content 형식 오류:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}

fs.mkdirSync("src/data", { recursive: true });
const header = (src) => `// 자동 생성 — 직접 수정 금지. 원본: ${src}, 생성: npm run content\n`;
fs.writeFileSync("src/data/constellations-content.ts", header("content/constellations/*.md") + `export const CONTENT = ${JSON.stringify(content, null, 2)} as const;\n`);
fs.writeFileSync("src/data/onboarding-content.ts", header("content/onboarding.md") + `export const ONBOARDING = ${JSON.stringify({ slides, cta }, null, 2)} as const;\n`);
console.log(`content 반영: 별자리 ${Object.keys(content).length}개, 온보딩 ${slides.length}장`);
