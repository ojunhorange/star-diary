// content/constellations/*.md → src/data/constellations-content.ts
// 실행: npm run content (빌드 전 자동). 형식이 어긋나면 파일명·항목을 알려주고 실패함.
import fs from "node:fs";
import path from "node:path";

const DIR = "content/constellations";
const TONES = ["고쳐보기", "정리하기", "넓히기", "지키기"];
const out = {};
const errors = [];

for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith(".md") && f !== "README.md")) {
  const id = path.basename(file, ".md");
  const text = fs.readFileSync(path.join(DIR, file), "utf8").replace(/\r\n/g, "\n");
  const fail = (msg) => errors.push(`${file}: ${msg}`);

  const name = text.match(/^# (.+)$/m)?.[1]?.trim();
  if (!name) fail("첫 줄에 '# 별자리 이름'이 없음");
  const head = (label) => text.match(new RegExp(`^${label}:\s*(.+)$`, "m"))?.[1]?.trim();
  const section = (title) => text.split(new RegExp(`^## ${title}\s*$`, "m"))[1]?.split(/^## /m)[0]?.trim();

  const persona = head("페르소나") ?? fail("'페르소나:' 줄 없음");
  const tagline = head("한 줄") ?? fail("'한 줄:' 줄 없음");
  const tone = head("톤") ?? fail("'톤:' 줄 없음");
  if (tone && !TONES.includes(tone)) fail(`톤은 ${TONES.join("/")} 중 하나여야 함 (지금: ${tone})`);
  const myth = section("신화") ?? fail("'## 신화' 섹션 없음");
  const lesson = section("표면적 교훈") ?? fail("'## 표면적 교훈' 섹션 없음");
  const phil = section("철학") ?? fail("'## 철학' 섹션 없음");
  const pick = (label) => phil?.match(new RegExp(`^${label}:\s*(.+)$`, "m"))?.[1]?.trim() ?? fail(`철학 섹션에 '${label}:' 줄 없음`);
  const philosopher = pick("철학자");
  const concept = pick("개념");
  const explain = pick("풀이");
  const direction = pick("조언 방향");
  if (myth && myth.length < 300) fail(`신화가 너무 짧음 (${myth.length}자, 300자 이상 권장)`);

  out[id] = { name, persona, tagline, tone, myth, lesson, philosopher, concept, explain, direction };
}

if (errors.length) {
  console.error("content 형식 오류:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync(
  "src/data/constellations-content.ts",
  `// 자동 생성 — 직접 수정 금지. 원본: content/constellations/*.md, 생성: npm run content\n` +
    `export const CONTENT = ${JSON.stringify(out, null, 2)} as const;\n`,
);
console.log(`constellations-content.ts written (${Object.keys(out).length}개)`);
