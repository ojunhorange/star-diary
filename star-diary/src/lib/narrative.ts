import type { Constellation } from "@/lib/constellations";
import { COMPACT_LYRA, COMPACT_PERSEUS } from "@/prompts/fewshot-compact";
import type { Score } from "@/lib/scoring";
import { SERVICE_CONTEXT } from "@/lib/service-context";

// 1장(별자리 이야기)의 4섹션 + 제목들
export type Narrative = {
  pattern: string; // ① 세 편의 기록에서 반복된 것
  mythTitle: string; // 예: 뒤돌아본 음악가
  myth: string; // ② 신화 (사용자 장면 나란히)
  lesson: string; // 신화가 말하는 것 (한 줄)
  reframeTitle: string; // 예: 피론의 판단 유보
  reframe: string; // ③ 철학의 재해석
  actionTitle: string; // 예: 발표까지, 이렇게 해보는 건 어떨까요
  action: string; // ④ 이번 주 제안
  closing: string; // 마지막 한 줄 (별이 밝아진다는 안내)
};

export const NARRATIVE_SCHEMA = {
  type: "object",
  properties: {
    pattern: { type: "string" },
    mythTitle: { type: "string" },
    myth: { type: "string" },
    lesson: { type: "string" },
    reframeTitle: { type: "string" },
    reframe: { type: "string" },
    actionTitle: { type: "string" },
    action: { type: "string" },
    closing: { type: "string" },
  },
  required: ["pattern", "mythTitle", "myth", "lesson", "reframeTitle", "reframe", "actionTitle", "action", "closing"],
  additionalProperties: false,
} as const;

// few-shot 예시 포함 여부. 2026-09-19: naive 비교 결과 깊이·분량이 떨어져 압축본으로 다시 켬
const USE_FEWSHOT = true;

export const NARRATIVE_SYSTEM = `${SERVICE_CONTEXT}
# 당신의 역할
당신은 한 사람의 일기 세 편을 읽고, 그 사람의 별자리 신화와 철학 개념으로 "지금의 그 사람"을 읽어주는 서술자입니다. 검사 결과를 통보하는 게 아니라, 기록에서 발견한 것을 그 사람에게 돌려주는 글입니다.

## 독자
한국의 20대 초반. 고등학생도 이해할 수 있는 말로 씁니다. 철학 용어나 낯선 신화 속 이름·장치가 나오면 그 자리에서 한 문장으로 풀거나 일상 비유를 붙이세요. 비유는 필요할 때만 — 이미 쉬운 말에 비유를 덧붙이지 마세요. 비유의 재료는 가능하면 이 사람의 일기에 나온 세계(발표, 코드, 동아리, 강의, 친구 등)에서 가져오세요.

## 절대 규칙
1. "~하지 마라", "~해야 한다" 금지. 제안은 항상 "~해보는 건 어떨까요" 형식.
2. 욕구·감정을 없애라고 하지 않습니다. 방향·타이밍·순서를 바꾸는 제안만 합니다.
3. 일기를 직접 인용합니다. 인용부호 “ ” 안은 일기에 있는 글자 그대로만 넣습니다. 없는 말을 지어내지 마세요. 날짜는 "9월 16일 일기에" 형식으로 부릅니다.
4. "당신도 그럴 수 있어요" 같은 일반론 금지. 반드시 일기의 구체적 장면·표현을 짚습니다.
5. 신화 요약은 참고자료입니다. 그대로 베끼지 말고 매번 새로 씁니다. 디테일(이름, 장면, 사물)은 살리고 요약체는 금지.
6. 횟수·빈도는 사용자 메시지의 "반복 통계"에 있는 숫자만 씁니다. 직접 세지 마세요. 통계에 없는 표현의 횟수는 말하지 않습니다(대신 "여러 번"). 틀린 숫자는 신뢰를 무너뜨립니다.
7. 각 필드의 최소 분량을 반드시 채웁니다. 짧게 끝내지 마세요 — 특히 myth와 reframe.
8. 신화에서 **이름을 부르는 인물은 주인공 외 최대 2명**입니다. 그 밖의 인물·신·괴물은 이름 대신 역할로 서술합니다("바다의 신", "지하 세계의 왕", "그의 아내"). 낯선 이름이 많으면 독자가 길을 잃습니다.

## 나란히 놓기 (가장 중요)
- myth: 신화를 처음부터 끝까지 서술하되, 신화의 전환점마다 이 사람의 일기 장면을 **나란히** 놓습니다. 최소 2회. 신화의 주인공을 이 사람으로 바꿔 쓰지는 마세요 — 신화는 신화대로 가고, 옆에 이 사람의 장면을 세웁니다. 예: "오르페우스는 앞서 걸었습니다. 발소리는 들리지 않았어요 — 죽은 자의 발은 소리가 없으니까요. 팀원이 “괜찮다”고 세 번 말했을 때 그 말이 안 들어왔다고 쓰셨죠. 같은 침묵이에요."
- reframe: 철학 개념 설명은 2문장 이내. 나머지는 전부 이 사람의 실제 문장 하나에 그 개념을 적용하는 데 씁니다. 표면적 교훈(lesson)이 왜 이 사람에게 부족한지 먼저 짚고, 철학이 다른 길을 냅니다.

## 톤
- 별자리의 tone이 "고쳐보기"면 방향 전환을, "정리하기"면 하나를 고르는 것을, "넓히기"면 관계의 깊이를, "지키기"면 지금 상태를 지키고 돌려주는 것을 제안합니다.
- 문장은 짧게. 존댓말. 따뜻하지만 감상적이지 않게. 느낌표 금지.

## 각 필드
- pattern (250~450자): 세 편에서 반복된 표현·감정을 세어 보여주고("‘다시’라는 말이 일곱 번"), 그래서 이 별자리가 떴다고 끝맺습니다. 사용자가 기록이 가리킨 1위가 아닌 2위를 골랐다면, 그 선택 자체를 의미 있게 짚습니다(예: "기록은 카시오페이아를 먼저 가리켰지만 당신은 페르세우스를 골랐어요. 그 선택도 기록이에요.").
- mythTitle (15자 이내): 신화의 핵심 장면을 담은 제목. 예: "뒤돌아본 음악가", "모든 무기가 빌린 것이었던 영웅"
- myth (800~1,200자): 위 규칙대로. **필수 조건: 일기 표현을 “ ”로 그대로 인용한 문장이 2개 이상 들어가야 합니다. 인용이 없는 myth는 실패로 처리됩니다.** 마지막 문단은 별자리가 하늘에 어떻게 남았는지로 끝냅니다.
- lesson (40자 이내): 표면적 교훈 한 줄. "신화가 말하는 것:" 같은 접두어 없이 교훈 문장만.
- reframeTitle (20자 이내): "철학자의 개념" 형식. 예: "피론의 판단 유보", "마르쿠스 아우렐리우스의 첫 페이지"
- reframe (450~750자): 위 규칙대로.
- actionTitle (25자 이내): "이번 주, 이렇게 해보는 건 어떨까요" 또는 상황에 맞게 변형("발표까지, ~").
- action (250~450자): 언제·어디서·무엇을 명시한 행동 1개. 일기 속 장면에서 출발해 아주 작게. 잘하려는 마음은 그대로 두고 순서·타이밍만 바꾸는 제안.
- closing (40자 이내): "다음 일기에 이 실천이 등장하면 ~의 별이 더 밝아집니다." 형식, 별자리 이름 포함.

${USE_FEWSHOT ? `## 출력 예시 1 — 거문고자리 (N↑, 고쳐보기 톤). 이 톤·구조·깊이를 따르세요. 실제 출력은 이보다 길어도 됩니다.
${COMPACT_LYRA}

## 출력 예시 2 — 페르세우스자리 (N↓, 지키기 톤)
${COMPACT_PERSEUS}` : ""}`;

export type NarrativeInput = {
  constellation: Constellation;
  candidates: [string, string]; // 기록이 가리킨 1위·2위 이름
  chosenFirst: boolean; // 1위를 골랐는지
  entries: { date: string; text: string; score: Score }[];
};

export function narrativeUserMessage(i: NarrativeInput) {
  const c = i.constellation;
  const diaries = i.entries.map((e) => `[${e.date}]\n${e.text}\n(읽힌 감정: ${e.score.emotions.join(", ")} / 표현: ${e.score.keywords.map((k) => `“${k}”`).join(", ")})`).join("\n\n");
  const stats = repetitionStats(i.entries).map(([w, n, days]) => `- “${w}”: ${n}회 (${days}편에 등장)`).join("\n") || "- (반복된 표현 없음)";
  return `# 별자리
${c.name} / 페르소나: ${c.persona} — ${c.tagline} / 톤: ${c.tone}

# 신화 요약 (참고자료, 베끼지 말 것)
${c.myth}

# 표면적 교훈
${c.lesson}

# 철학
${c.philosopher}, ${c.concept}
조언 방향: ${c.direction}

# 선택
기록이 가리킨 순서: 1위 ${i.candidates[0]}, 2위 ${i.candidates[1]}
사용자가 고른 하늘: ${c.name} (${i.chosenFirst ? "1위와 같음" : "2위를 골랐음 — pattern에서 이 선택을 짚을 것"})

# 반복 통계 (코드로 정확히 센 값 — 횟수는 여기 있는 숫자만 사용)
${stats}

# 일기 세 편
${diaries}

위 재료로 JSON을 작성하세요.`;
}

// 의미 없는 반복(접속사·지시어 등)은 통계에서 제외
const STOPWORDS = new Set(["근데", "이거", "그거", "저거", "그런데", "그리고", "그래서", "근데도", "오늘", "내일", "어제", "너무", "약간", "이제", "많이", "조금", "하는", "하고", "해서", "했다", "있다", "없다", "된다", "같다", "싶다", "이다", "거고", "건지", "것도", "뭔가", "때문", "나는", "내가", "나도"]);

// 채점 키워드 + 자주 반복되는 어절을 세어 [표현, 총 횟수, 등장한 일기 수]. 2회 이상만, 최대 12개
export function repetitionStats(entries: NarrativeInput["entries"]): [string, number, number][] {
  const texts = entries.map((e) => e.text.replace(/\s/g, ""));
  const candidates = new Set<string>();
  entries.forEach((e) => e.score.keywords.forEach((k) => candidates.add(k.replace(/\s/g, ""))));
  entries.forEach((e) => e.text.split(/[\s.,!?"“”'’()]+/).forEach((w) => w.length >= 2 && w.length <= 6 && !STOPWORDS.has(w) && candidates.add(w)));
  const count = (t: string, w: string) => t.split(w).length - 1;
  return [...candidates]
    .map((w): [string, number, number] => [w, texts.reduce((s, t) => s + count(t, w), 0), texts.filter((t) => t.includes(w)).length])
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);
}

// 일기의 실제 표현이 신화·철학 섹션에 들어갔는지 (환각·일반론 방지 검증). 신화에 1개 이상, 합쳐서 2개 이상
// 인정 기준: 채점 키워드가 본문에 있거나, 본문의 “인용”이 실제 일기에 있는 글자 그대로일 때
export function grounded(n: Narrative, keywords: string[], diaryTexts: string[]) {
  const flat = (s: string) => s.replace(/\s/g, "");
  const diary = flat(diaryTexts.join("\n"));
  const hits = (body: string) => {
    const b = flat(body);
    const fromKeywords = keywords.filter((k) => k && b.includes(flat(k)));
    const fromQuotes = [...body.matchAll(/[“"]([^”"]{2,60})[”"]/g)].map((m) => m[1]).filter((q) => diary.includes(flat(q)));
    return new Set([...fromKeywords, ...fromQuotes].map(flat)).size;
  };
  const inMyth = hits(n.myth);
  const total = hits(n.myth + "\n" + n.reframe);
  return { inMyth, total, ok: inMyth >= 1 && total >= 2 };
}
