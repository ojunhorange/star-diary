import { GoogleGenAI } from "@google/genai";
import { byId } from "@/lib/constellations";
import { grounded, groundedRetro, NARRATIVE_SCHEMA, NARRATIVE_SYSTEM, narrativeUserMessage, RETRO_SCHEMA, RETRO_SYSTEM, retroUserMessage, type Narrative, type NarrativeInput, type Retro, type RetroInput } from "@/lib/narrative";

const MODELS = [process.env.GEMINI_MODEL || "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const constellation = body && byId(body.constellationId);
  if (!constellation || !Array.isArray(body.entries) || body.entries.length < 3) {
    return Response.json({ error: "constellationId and 3 entries required" }, { status: 400 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "GEMINI_API_KEY not set" }, { status: 503 });
  }

  const retro = body.mode === "retro";
  const entries = body.entries.slice(0, retro ? 7 : 3);
  const keywords = entries.flatMap((e: { score: { keywords: string[] } }) => e.score.keywords);
  const texts = entries.map((e: { text: string }) => e.text);
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let lastError = "";
  let fallback: Narrative | Retro | null = null; // 근거 부족이어도 응답은 있었던 경우

  const contents = retro
    ? retroUserMessage({ constellation, previousAction: body.previousAction ?? "", coreSummary: body.coreSummary ?? "", entries } satisfies RetroInput)
    : narrativeUserMessage({ constellation, entries } satisfies NarrativeInput);

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: retro ? RETRO_SYSTEM : NARRATIVE_SYSTEM,
            temperature: 0.7, // 서사엔 창의성 필요. 결과는 저장해 고정하므로 매번 달라도 됨
            responseMimeType: "application/json",
            responseJsonSchema: retro ? RETRO_SCHEMA : NARRATIVE_SCHEMA,
          },
        });
        if (!res.text) throw new Error(`empty response (${res.candidates?.[0]?.finishReason})`);
        if (retro) {
          const r: Retro = JSON.parse(res.text);
          if (/[A-Za-z]/.test(r.nextTitle)) r.nextTitle = "다음 별 세 개, 이렇게 해보는 건 어떨까요";
          const g = groundedRetro(r, keywords, texts);
          if (g.ok) return Response.json({ narrative: r, model, grounded: g });
          console.warn(`[reading/retro] ${model} attempt ${attempt}: grounded ${g.total}, retrying`);
          fallback = r;
          continue;
        }
        const n: Narrative = JSON.parse(res.text);
        // lite 모델이 제목에 깨진 글자를 섞는 경우가 있어 영문·기호가 들어가면 기본 제목으로
        if (/[A-Za-z]/.test(n.actionTitle)) n.actionTitle = "이번 주, 이렇게 해보는 건 어떨까요";
        if (/[A-Za-z]/.test(n.mythTitle)) n.mythTitle = `${constellation.name}의 이야기`;
        const g = grounded(n, keywords, texts);
        if (g.ok) return Response.json({ narrative: n, model, grounded: g });
        console.warn(`[reading] ${model} attempt ${attempt}: grounded place=${g.inPlace} total=${g.total}, retrying`);
        fallback = n;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        console.warn(`[reading] ${model} failed:`, lastError.slice(0, 160));
        if (/429|RESOURCE_EXHAUSTED/.test(lastError)) return Response.json({ error: lastError }, { status: 429 });
        break; // 이 모델은 포기, 다음 모델로
      }
    }
  }
  if (fallback) return Response.json({ narrative: fallback });
  return Response.json({ error: lastError || "no narrative" }, { status: 502 });
}
