// 현재 Gemini에 보내는 프롬프트 전문을 BYPP/PROMPTS_현재.txt 로 저장. 실행: npm run prompts
import fs from "fs";
import { SCORING_SYSTEM } from "@/lib/scoring";
import { NARRATIVE_SYSTEM, narrativeUserMessage } from "@/lib/narrative";
import { CONSTELLATIONS } from "@/lib/constellations";
const diary = "D-1. 오늘 리허설 했는데 잘 됐다. 근데 잘 된 게 오히려 불안하다. 발표 날 뭐 하나 터질 것 같은 느낌. 밤에 코드 한 줄 고쳤다가 혹시 몰라서 다시 되돌렸다.";
const entries = [
  { date: "2026년 9월 16일 (수)", text: "졸업작품 거의 다 됐다. 근데 발표 자료 다시 열어보니 3페이지 그래프가 이상해 보여서 다시 만들었다. 만들고 나니 원래 게 나았나 싶다. 새벽 2시. 교수님이 이거 보고 뭐라 할지 자꾸 상상됨.", score: { O:0,C:2,E:1,A:0,N:2,nFacet:"불안" as const, emotions:["불안","조바심"], keywords:["다시 만들었다","원래 게 나았나","새벽 2시","뭐라 할지"] } },
  { date: "2026년 9월 17일 (목)", text: "팀원한테 \"우리 이거 진짜 괜찮은 거 맞지?\"라고 세 번 물어봤다. 걔는 괜찮다는데 그 말이 안 들어온다. 데모 영상 다시 찍을까 하다가 말았다. 이미 다 된 걸 자꾸 건드리는 게 문제인 걸 아는데 손이 멈추질 않는다.", score: { O:0,C:1,E:1,A:1,N:2,nFacet:"불안" as const, emotions:["불안","답답함"], keywords:["괜찮은 거 맞지","세 번","다시 찍을까","손이 멈추질"] } },
  { date: "2026년 9월 18일 (금)", text: diary, score: { O:0,C:2,E:1,A:0,N:2,nFacet:"불안" as const, emotions:["불안","예감"], keywords:["잘 됐다","오히려 불안","터질 것 같은","되돌렸다"] } },
];
const lyra = CONSTELLATIONS.find((c) => c.id === "lyra")!;
const user = narrativeUserMessage({ constellation: lyra, candidates: ["거문고자리", "안드로메다자리"], chosenFirst: true, entries });
const out = `==================== [1] /api/score (일기 1편마다) ====================
--- systemInstruction (${SCORING_SYSTEM.length}자) ---
${SCORING_SYSTEM}

--- contents (사용자 메시지) ---
일기:
${diary}

--- config ---
temperature: 0, responseMimeType: application/json, responseJsonSchema: SCORE_SCHEMA


==================== [2] /api/reading (별자리 확정 후 1회) ====================
--- systemInstruction (${NARRATIVE_SYSTEM.length}자) ---
${NARRATIVE_SYSTEM}

--- contents (사용자 메시지, 거문고자리 예시) ---
${user}

--- config ---
temperature: 0.7, responseMimeType: application/json, responseJsonSchema: NARRATIVE_SCHEMA
`;
fs.writeFileSync("../PROMPTS_현재.txt", out);
console.log(`saved ../PROMPTS_현재.txt — score system ${SCORING_SYSTEM.length}자, narrative system ${NARRATIVE_SYSTEM.length}자, narrative user ${user.length}자`);
