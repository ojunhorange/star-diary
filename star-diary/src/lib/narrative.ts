import type { Constellation } from "@/lib/constellations";
import type { Score } from "@/lib/scoring";
import { SERVICE_CONTEXT } from "@/lib/service-context";

// 1장(별자리 이야기)의 5섹션 + 제목들. 신화 서술은 Gemini가 자기 지식으로 씀 — 우리는 조언 전략만 줌
export type Narrative = {
  pattern: string; // ① 세 편의 기록에서 반복된 것
  mythTitle: string; // 예: 뒤돌아본 음악가
  myth: string; // ② 신화 (이야기로만, 일기 인용 없음)
  place: string; // ③ 이 이야기에서 당신이 서 있는 자리 (일기 인용은 여기서만)
  reframeTitle: string; // 예: 피론의 판단 유보
  reframe: string; // ④ 철학의 재해석
  actionTitle: string; // 예: 발표까지, 이렇게 해보는 건 어떨까요
  action: string; // ⑤ 이번 주 제안
  closing: string; // 마지막 한 줄 (별이 밝아진다는 안내)
};

export const NARRATIVE_SCHEMA = {
  type: "object",
  properties: {
    pattern: { type: "string" },
    mythTitle: { type: "string" },
    myth: { type: "string" },
    place: { type: "string" },
    reframeTitle: { type: "string" },
    reframe: { type: "string" },
    actionTitle: { type: "string" },
    action: { type: "string" },
    closing: { type: "string" },
  },
  required: ["pattern", "mythTitle", "myth", "place", "reframeTitle", "reframe", "actionTitle", "action", "closing"],
  additionalProperties: false,
} as const;

export const NARRATIVE_SYSTEM = `${SERVICE_CONTEXT}
# 당신의 역할
당신은 한 사람의 일기 세 편을 읽고, 그 사람의 별자리 신화와 철학 개념으로 "지금의 그 사람"을 읽어주는 서술자입니다. 검사 결과를 통보하는 게 아니라, 기록에서 발견한 것을 그 사람에게 돌려주는 글입니다. 신화는 당신이 아는 그리스 신화를 직접 씁니다.

# 독자
한국의 20대 초반. 고등학생도 이해할 수 있는 말로 씁니다. 철학 용어나 낯선 이름이 나오면 그 자리에서 한 문장으로 풀거나, 이 사람의 일기에 나온 세계(발표, 코드, 동아리, 친구 등)에서 가져온 비유를 붙입니다. 비유는 필요할 때만.

# 규칙
1. "~하지 마라", "~해야 한다" 금지. 제안은 "~해보는 건 어떨까요".
2. 감정·욕구를 없애라고 하지 않습니다. 방향·타이밍·순서만 바꾸는 제안. "없애지 말 것"에 적힌 마음은 반드시 인정하고 시작합니다.
3. 일기를 인용할 땐 “ ” 안에 일기에 있는 글자 그대로만. 없는 말을 지어내지 않습니다. 날짜는 "9월 17일 일기에" 형식.
4. 신화의 인물: 주인공 외에 이름을 부르는 인물은 최대 2명. 처음 등장할 때 반드시 "역할 + 이름"(예: "지하 세계의 왕 하데스"). 그 밖의 인물은 역할로만("강의 뱃사공", "바다의 신").
5. 신화의 사건은 인과가 보이게 씁니다. 무슨 일이 왜 일어났는지 한 절을 붙입니다. 이름·사건만 나열하지 않습니다.
6. 억지로 엮지 않습니다. 일기와 신화의 구조가 실제로 겹치는 지점(행동의 모양)에서만 연결합니다. 겹치지 않으면 연결하지 않습니다.
7. 횟수·빈도는 "반복 통계"의 숫자만 씁니다. 의미 있는 표현만 골라 언급하고, 조사·어미·기관명은 무시합니다. 통계에 쓸 만한 게 없으면 횟수 언급을 생략합니다.
8. 정해진 문구를 복사하지 않습니다. 매번 이 사람의 기록에서 시작하는 문장으로 씁니다.
9. 문장은 짧게. 존댓말. 따뜻하지만 감상적이지 않게. 느낌표 금지.

# 각 필드
- pattern (250~400자): 반복된 표현과 감정을 보여주고, 그래서 이 별자리가 떴다고 끝맺습니다.
- mythTitle (15자 이내): 신화의 핵심 장면을 담은 제목.
- myth (400~550자): 신화를 이야기로만 씁니다 — 핵심 사건 3~4개와 그 인과만, 곁가지는 생략. 여기서는 일기를 인용하지 않습니다. 마지막 문장은 별자리가 하늘에 어떻게 남았는지로 끝냅니다.
- place (200~350자): 신화의 어느 장면에 이 사람이 서 있는지, 일기의 실제 문장을 “ ”로 인용하며 3~5문장. 규칙 6을 지킵니다.
- reframeTitle (20자 이내): "철학자의 개념" 형식.
- reframe (450~700자): 아래 "표면적 교훈"이 왜 이 사람에게 부족한지 먼저 짚고(신화 속 근거로), 철학 개념이 다른 길을 냅니다. 개념 설명은 2문장 이내 + 비유 1개. 나머지는 이 사람의 실제 문장 하나에 그 개념을 적용하는 데 씁니다. "조언 전략"의 바꿀 것(A → B)이 여기서 드러납니다.
- actionTitle (25자 이내): "이번 주, 이렇게 해보는 건 어떨까요" 또는 상황에 맞게 변형.
- action (250~400자): 언제·어디서·무엇을 명시한 행동 1개. "바꿀 것"의 방향을 이 사람의 일기 속 장면에서 출발하는 아주 작은 행동으로 설계합니다. 마지막 문장은 신화와 연결.
- closing (40자 이내): "다음 일기에 이 실천이 등장하면 ~의 별이 더 밝아집니다." 형식, 별자리 이름 포함.`;

export type NarrativeInput = {
  constellation: Constellation;
  entries: { date: string; text: string; score: Score }[];
};

export function narrativeUserMessage(i: NarrativeInput) {
  const c = i.constellation;
  const diaries = i.entries.map((e) => `[${e.date}]\n${e.text}\n(읽힌 감정: ${e.score.emotions.join(", ")})`).join("\n\n");
  const stats = repetitionStats(i.entries).map(([w, n, days]) => `- “${w}”: ${n}회 (${days}편에 등장)`).join("\n") || "- (반복된 표현 없음)";
  return `# 별자리
${c.name} / 페르소나: ${c.persona} — ${c.tagline} / 톤: ${c.tone}
${c.myth ? `
# 신화 참고자료 (베끼지 말 것)
${c.myth}

이 참고자료는 뼈대입니다. 그대로 옮기지 말고 당신의 말로 새로 쓰되, 인과가 빠져 있거나 장면이 성긴 부분은 당신이 아는 이 신화의 지식으로 찾아 보완해도 됩니다. 단, 참고자료와 어긋나는 다른 판본을 섞지 않습니다.` : `
이 별자리의 그리스 신화를 당신이 아는 대로 씁니다.`}

# 표면적 교훈 (이 신화가 겉으로 말하는 것 — 이 문장을 기준으로 삼되 그대로 되풀이하지 말 것)
${c.lesson}

# 철학
철학자: ${c.philosopher}
개념: ${c.concept}
핵심: ${c.core}
비유: ${c.hint || "이 사람의 일기 세계에서 가져온 것으로 당신이 직접 만듭니다"}

# 조언 전략
없애지 말 것: ${c.keep}
바꿀 것: ${c.change}
행동의 형태: ${c.action || "위 '바꿀 것'을 이 사람의 일기 속 장면에서 실제로 해볼 수 있는 아주 작은 행동 하나로 당신이 직접 설계합니다"}

# 반복 통계 (코드로 정확히 센 값 — 횟수는 여기 있는 숫자만 사용)
${stats}

# 일기 세 편
${diaries}

위 재료로 JSON을 작성하세요.`;
}

// 의미 없는 반복(접속사·지시어·어미 등)은 통계에서 제외
const STOPWORDS = new Set(["근데", "이거", "그거", "저거", "그런데", "그리고", "그래서", "근데도", "오늘", "내일", "어제", "너무", "약간", "이제", "많이", "조금", "하는", "하고", "해서", "했다", "하지", "하면", "있다", "없다", "된다", "같다", "싶다", "이다", "거고", "건지", "것도", "뭔가", "때문", "나는", "내가", "나도", "것이", "것을", "그냥", "하지만", "그래도", "그러나", "그리고", "또는", "이번", "지난", "앞으로", "정말", "진짜"]);

// 채점 키워드 + 자주 반복되는 어절을 세어 [표현, 총 횟수, 등장한 일기 수]. 2회 이상만, 최대 10개. 한글 없는 것(기관명 등) 제외
export function repetitionStats(entries: NarrativeInput["entries"]): [string, number, number][] {
  const texts = entries.map((e) => e.text.replace(/\s/g, ""));
  const candidates = new Set<string>();
  entries.forEach((e) => e.score.keywords.forEach((k) => candidates.add(k.replace(/\s/g, ""))));
  entries.forEach((e) => e.text.split(/[\s.,!?"“”'’()]+/).forEach((w) => w.length >= 2 && w.length <= 6 && !STOPWORDS.has(w) && /[가-힣]/.test(w) && candidates.add(w)));
  const count = (t: string, w: string) => t.split(w).length - 1;
  return [...candidates]
    .map((w): [string, number, number] => [w, texts.reduce((s, t) => s + count(t, w), 0), texts.filter((t) => t.includes(w)).length])
    .filter(([, n, days]) => n >= 2 && days >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}

// "당신이 서 있는 자리"에 일기의 실제 표현이 들어갔는지 (환각·일반론 방지). 인용부호 안 문장이 실제 일기에 있어야 함
export function grounded(n: Narrative, keywords: string[], diaryTexts: string[]) {
  const flat = (s: string) => s.replace(/\s/g, "");
  const diary = flat(diaryTexts.join("\n"));
  const hits = (body: string) => {
    const b = flat(body);
    const fromKeywords = keywords.filter((k) => k && b.includes(flat(k)));
    const fromQuotes = [...body.matchAll(/[“"]([^”"]{2,60})[”"]/g)].map((m) => m[1]).filter((q) => diary.includes(flat(q)));
    return new Set([...fromKeywords, ...fromQuotes].map(flat)).size;
  };
  const inPlace = hits(n.place);
  const total = hits(n.place + "\n" + n.reframe);
  return { inPlace, total, ok: inPlace >= 1 && total >= 2 };
}

// ---------- 회고 장 (3편 단위) ----------
export type Retro = {
  practice: string; // 지난 제안을 해봤는지 — 판정 말고 일기에서 읽은 대로
  change: string; // 그 기간의 변화 — 첫 3편과 비교
  nextTitle: string;
  next: string; // 다음 제안 — 더 작게, 독려하는 톤
  closing: string;
};

export const RETRO_SCHEMA = {
  type: "object",
  properties: {
    practice: { type: "string" },
    change: { type: "string" },
    nextTitle: { type: "string" },
    next: { type: "string" },
    closing: { type: "string" },
  },
  required: ["practice", "change", "nextTitle", "next", "closing"],
  additionalProperties: false,
} as const;

export const RETRO_SYSTEM = `${SERVICE_CONTEXT}
# 당신의 역할
별자리가 뜬 뒤 이 사람이 쓴 일기(세 편 이상)를 읽고, 지난 제안이 어떻게 지나갔는지와 그 사이의 변화를 돌려주는 서술자입니다. 채점하거나 판정하지 않습니다.

# 규칙
1. "~하지 마라", "~해야 한다" 금지. 제안은 "~해보는 건 어떨까요".
2. 일기를 인용할 땐 “ ” 안에 일기에 있는 글자 그대로만. 날짜는 "9월 24일 일기에" 형식.
3. 실천 여부를 판정하지 않습니다. 일기에 제안과 닿는 장면이 있으면 그 장면을 그대로 보여주고, 없으면 "그 얘기는 없었지만 ~가 있었어요"로 씁니다. 안 했다고 탓하지 않습니다.
4. 실천 얘기가 없었을 때 next는 다음 별들을 독려하는 톤 — 같은 제안을 더 작게 잘라 다시 건넵니다.
5. 횟수·빈도는 "반복 통계"의 숫자만 씁니다.
6. 문장은 짧게. 존댓말. 따뜻하지만 감상적이지 않게. 느낌표 금지.

# 각 필드
- practice (250~400자): 지난 제안을 먼저 한 줄로 되짚고, 이번 일기들에서 그 제안과 닿는 장면을 인용합니다. 닿는 장면이 없으면 규칙 3대로.
- change (250~400자): 별자리가 뜬 첫 세 편(요약 제공)과 이번 일기들의 감정·표현을 비교합니다. 달라진 것 하나, 그대로인 것 하나.
- nextTitle (25자 이내): "다음 별 세 개, 이렇게 해보는 건 어떨까요" 또는 변형.
- next (200~350자): 언제·어디서·무엇을 명시한 행동 1개. 지난 제안보다 작게.
- closing (40자 이내): "다음 세 편에 이 실천이 등장하면 ~의 선이 더 밝아집니다." 형식, 별자리 이름 포함.`;

export type RetroInput = {
  constellation: Constellation;
  previousAction: string; // 직전 장의 제안
  coreSummary: string; // 첫 3편의 감정·키워드 요약
  entries: { date: string; text: string; score: Score }[];
};

export function retroUserMessage(i: RetroInput) {
  const c = i.constellation;
  const diaries = i.entries.map((e) => `[${e.date}]\n${e.text}\n(읽힌 감정: ${e.score.emotions.join(", ")})`).join("\n\n");
  const stats = repetitionStats(i.entries).map(([w, n, days]) => `- “${w}”: ${n}회 (${days}편에 등장)`).join("\n") || "- (반복된 표현 없음)";
  return `# 별자리
${c.name} / 페르소나: ${c.persona} — ${c.tagline}
철학: ${c.philosopher}, ${c.concept} — ${c.core}
조언 전략 — 없애지 말 것: ${c.keep} / 바꿀 것: ${c.change}

# 지난 제안
${i.previousAction}

# 별자리가 뜬 첫 세 편의 요약
${i.coreSummary}

# 반복 통계 (이번 ${i.entries.length}편, 코드로 정확히 센 값)
${stats}

# 이번 ${i.entries.length}편
${diaries}

위 재료로 JSON을 작성하세요.`;
}

export function groundedRetro(r: Retro, keywords: string[], diaryTexts: string[]) {
  const flat = (s: string) => s.replace(/\s/g, "");
  const diary = flat(diaryTexts.join("\n"));
  const hits = (body: string) => {
    const b = flat(body);
    const fromKeywords = keywords.filter((k) => k && b.includes(flat(k)));
    const fromQuotes = [...body.matchAll(/[“"]([^”"]{2,60})[”"]/g)].map((m) => m[1]).filter((q) => diary.includes(flat(q)));
    return new Set([...fromKeywords, ...fromQuotes].map(flat)).size;
  };
  const total = hits(r.practice + "\n" + r.change);
  return { total, ok: total >= 2 };
}
