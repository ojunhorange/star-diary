import { addEntry, chooseConstellation, currentMonth, lastDayOf, monthOf, setScore, setViewMonth, shiftDay, shiftMonth, today, type Entry } from "@/lib/store";

// 마켓·시연용 예시 일기 6편 (완벽 추구·유예형 → 아르고자리). 앞 3편 = 별자리, 뒤 3편 = 첫 번째 답(회고). 채점값을 함께 넣어 API 호출 없이 별자리 선택까지 감
const DEMO: { daysAgo: number; text: string; score: Entry["score"] }[] = [
  {
    daysAgo: 12,
    text: "포트폴리오 사이트 만들려고 노션에 기획서 3페이지 썼다. 색 조합표까지 정했는데 막상 코드는 한 줄도 안 쳤다. 아직 디자인 레퍼런스를 더 봐야 할 것 같아서. 유튜브로 튜토리얼 두 개 저장해놓고 잤다.",
    score: { O: 1, C: -1, E: 0, A: 0, N: 0, nFacet: null, emotions: ["답답함", "기대감"], keywords: ["기획서 3페이지", "코드는 한 줄도 안 쳤다", "더 봐야 할 것 같아서", "저장해놓고"] },
  },
  {
    daysAgo: 9,
    text: "동아리 프로젝트 역할 정하는 날. 프론트 맡겠다고 하려다가 아직 리액트를 제대로 공부 안 했으니까 다음 기회에 하기로 했다. 대신 자료조사 맡음. 집에 와서 리액트 강의 커리큘럼만 3시간 비교했다. 어떤 게 제일 완벽한 커리큘럼인지 아직 모르겠다.",
    score: { O: 1, C: 1, E: -1, A: 1, N: 1, nFacet: "불안", emotions: ["고민", "조바심"], keywords: ["아직 리액트를 제대로", "다음 기회에", "3시간 비교했다", "제일 완벽한 커리큘럼"] },
  },
  {
    daysAgo: 6,
    text: "친구가 같이 공모전 나가자고 했다. 하고 싶은데 지금 실력으로 나가면 어차피 떨어질 것 같아서 내년에 준비 제대로 해서 나가자고 했다. 친구는 그냥 나가보자는데. 밤에 기획서 파일 열어봤다가 또 닫았다. 계획은 다 있는데 왜 손이 안 움직이지.",
    score: { O: 0, C: -1, E: -1, A: 0, N: 1, nFacet: "취약성", emotions: ["불안", "답답함"], keywords: ["어차피 떨어질 것 같아서", "내년에 준비 제대로", "기획서 파일 열어봤다가 또 닫았다", "손이 안 움직이지"] },
  },
  // ---- 별자리가 뜬 뒤 3편 (첫 번째 답의 재료) ----
  {
    daysAgo: 4,
    text: "포트폴리오 노션 열었다가 코드 에디터 켰다. 다섯 줄만 치자고 했는데 헤더 하나 만들고 끝. 근데 뭔가 시작한 느낌이라 기분이 이상하게 괜찮았다.",
    score: { O: 1, C: 1, E: 0, A: 0, N: 0, nFacet: null, emotions: ["안도", "약간의 뿌듯함"], keywords: ["코드 에디터 켰다", "다섯 줄만 치자고", "헤더 하나 만들고 끝", "시작한 느낌"] },
  },
  {
    daysAgo: 2,
    text: "동아리 회의에서 자료조사 발표했다. 프론트 맡은 애가 리액트 어렵다고 해서 나도 같이 보기로 했다. 아직 잘 모르는데 일단 같이 하기로.",
    score: { O: 1, C: 1, E: 1, A: 1, N: 0, nFacet: null, emotions: ["기대", "조금의 긴장"], keywords: ["자료조사 발표했다", "같이 보기로 했다", "아직 잘 모르는데", "일단 같이 하기로"] },
  },
  {
    daysAgo: 0,
    text: "공모전 친구한테 내년 말고 이번에 같이 하자고 했다. 기획서 파일 다시 열어서 목차만 정리했다. 완벽하진 않은데 일단 보냈다.",
    score: { O: 1, C: 1, E: 1, A: 1, N: 0, nFacet: null, emotions: ["설렘", "불안"], keywords: ["이번에 같이 하자고", "목차만 정리했다", "완벽하진 않은데", "일단 보냈다"] },
  },
];

// 아카이브용: 지난 두 달 (별자리 확정 상태). 각각 갓생 번아웃형 → 헤라클레스, 연결 불안형 → 쌍둥이
const PAST: { monthsAgo: number; constellation: string; entries: { day: number; text: string; score: Entry["score"] }[] }[] = [
  {
    monthsAgo: 2,
    constellation: "hercules",
    entries: [
      { day: 3, text: "아침 러닝, 오전 인턴 지원서 두 개, 오후 스터디, 저녁 알바. 잠은 다섯 시간. 일정표가 꽉 차 있으면 마음이 놓인다.", score: { O: 0, C: 2, E: 1, A: 0, N: 1, nFacet: "취약성", emotions: ["뿌듯함", "피로"], keywords: ["일정표가 꽉 차 있으면", "잠은 다섯 시간", "마음이 놓인다"] } },
      { day: 9, text: "팀플에서 자료조사 내가 다 했다. 다들 바쁘다길래. 집에 오니 아무것도 하기 싫어서 유튜브만 봤다. 열심히 살았는데 왜 허무하지.", score: { O: 0, C: 1, E: 0, A: 2, N: 2, nFacet: "취약성", emotions: ["허무", "지침"], keywords: ["내가 다 했다", "아무것도 하기 싫어서", "열심히 살았는데 왜 허무하지"] } },
      { day: 15, text: "동아리 회장이 행사 준비 도와달라고 해서 또 맡았다. 거절을 못 하겠다. 내 과제는 밀렸다. 몸이 무겁다.", score: { O: 0, C: 1, E: 0, A: 2, N: 2, nFacet: "취약성", emotions: ["지침", "미안함"], keywords: ["또 맡았다", "거절을 못 하겠다", "내 과제는 밀렸다"] } },
    ],
  },
  {
    monthsAgo: 1,
    constellation: "gemini",
    entries: [
      { day: 4, text: "개강 첫 주. 다들 이미 친한 것 같은데 나만 겉도는 느낌. 단톡방에서 말 걸 타이밍을 못 잡았다.", score: { O: 0, C: 0, E: 1, A: 1, N: 1, nFacet: "자의식", emotions: ["소외감", "긴장"], keywords: ["나만 겉도는 느낌", "말 걸 타이밍을 못 잡았다"] } },
      { day: 11, text: "동아리 지원서 넣었다. 사람들이랑 어울려야 뭐라도 될 것 같아서. 근데 인스타 보니 다들 벌써 모임 사진이 올라온다.", score: { O: 1, C: 0, E: 1, A: 1, N: 1, nFacet: "자의식", emotions: ["조급함", "기대"], keywords: ["어울려야 뭐라도 될 것 같아서", "다들 벌써 모임 사진"] } },
      { day: 18, text: "MT에서 옆자리 애랑 세 시간 얘기했다. 많은 사람은 아니어도 한 명이랑 깊게 얘기하니까 이상하게 안심됐다.", score: { O: 0, C: 0, E: 2, A: 2, N: -1, nFacet: null, emotions: ["안심", "즐거움"], keywords: ["세 시간 얘기했다", "한 명이랑 깊게", "이상하게 안심됐다"] } },
    ],
  },
];

export function loadDemo() {
  // 예시 6편이 한 달 안에 들어가도록: 오늘이 13일 이후면 이번 달(12일 전~오늘), 6~12일이면 간격을 좁혀 이번 달, 그 전이면 지난달 말을 기준으로
  const dom = Number(today().slice(8));
  const base = dom >= 6 ? today() : lastDayOf(shiftMonth(currentMonth(), -1));
  const demoMonth = base.slice(0, 7);
  const gaps = dom >= 13 || dom < 6 ? [12, 9, 6, 4, 2, 0] : [5, 4, 3, 2, 1, 0];
  DEMO.forEach((d, i) => {
    const e = addEntry(d.text, shiftDay(base, -gaps[i]));
    setScore(e.id, d.score!);
  });
  if (demoMonth !== currentMonth()) setViewMonth(demoMonth);
  for (const p of PAST) {
    const m = shiftMonth(demoMonth, -p.monthsAgo);
    const ids = p.entries.map((d) => {
      const e = addEntry(d.text, `${m}-${String(d.day).padStart(2, "0")}`);
      setScore(e.id, d.score!);
      return e.id;
    });
    chooseConstellation(monthOf(`${m}-01T12:00:00`), p.constellation, [p.constellation], ids);
  }
  localStorage.setItem("star-diary:debug-sunday", "1"); // 예시 모드에선 일요일 조건 통과 → 회고까지 바로 체험
  localStorage.setItem("star-diary:demo", "1"); // 예시 모드: 이야기는 API 대신 캐시 사용
}
