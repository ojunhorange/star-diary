import { GoogleGenAI } from "@google/genai";
import { SCORE_SCHEMA, SCORING_SYSTEM, type Score } from "@/lib/scoring";

// 빠르고 무료 한도가 넉넉한 lite 계열. 앞 모델이 실패(503·빈 응답)하면 다음 모델로
const MODELS = [process.env.GEMINI_MODEL || "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];

export async function POST(req: Request) {
  const { text } = await req.json().catch(() => ({}));
  if (typeof text !== "string" || text.trim().length < 10) {
    return Response.json({ error: "text required" }, { status: 400 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "GEMINI_API_KEY not set" }, { status: 503 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const diary = text.slice(0, 4000);
  let lastError = "";

  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: `일기:\n${diary}`,
        config: {
          systemInstruction: SCORING_SYSTEM,
          temperature: 0, // 채점엔 창의성 불필요 → 흔들림 최소화
          responseMimeType: "application/json",
          responseJsonSchema: SCORE_SCHEMA,
        },
      });
      if (!res.text) throw new Error(`empty response (${res.candidates?.[0]?.finishReason})`);
      const score: Score = JSON.parse(res.text);
      // 키워드는 "발췌"가 규칙 → 일기에 실제로 없는 말은 버림 (환각 방지)
      const flat = diary.replace(/\s/g, "");
      score.keywords = score.keywords.filter((k) => flat.includes(k.replace(/\s/g, "")));
      return Response.json(score);
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.warn(`[score] ${model} failed:`, lastError.slice(0, 160));
      if (/429|RESOURCE_EXHAUSTED/.test(lastError)) break; // 한도 초과는 모델 바꿔도 소용없음
    }
  }
  const status = /429|RESOURCE_EXHAUSTED/.test(lastError) ? 429 : 502;
  return Response.json({ error: lastError }, { status });
}
