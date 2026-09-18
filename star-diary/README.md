# star-diary (앱 코드)

프로젝트 소개는 상위 [`README.md`](../README.md).

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # GEMINI_API_KEY 입력 (aistudio.google.com)
npm run dev                  # http://localhost:3000
```

## 스크립트

| 명령 | 역할 |
|---|---|
| `npm run dev` / `build` / `start` | 개발 / 배포용 빌드 / 배포 실행 |
| `npm run lint` | 코드 검사 |
| `npm run check:match` | 매칭 알고리즘 검증 (알려진 채점값 3세트) |
| `npm run fewshot` | `src/prompts/fewshot/*.md` → `fewshot-data.ts` (빌드 전 자동) |
| `npm run prompts` | 현재 Gemini에 보내는 프롬프트 전문을 `../PROMPTS_현재.txt`로 저장 |

## 구조

```
src/
  app/            화면·API 라우트 (/, /write, /choose, /reading, /api/score, /api/reading)
  components/     NightSky(밤하늘), EntryModal(일기 열람·수정), ConstellationPreview
  lib/
    store.ts      localStorage 저장소 (일기, 별자리, 이야기 장)
    scoring.ts    채점 프롬프트 + JSON 스키마
    match.ts      OCEAN 거리 매칭
    constellations.ts  별자리 10개 고정 데이터 (프로필·철학·신화 요약·별 좌표)
    narrative.ts  이야기 프롬프트 + 반복 통계 + 인용 검증
    service-context.ts  프롬프트 공통 머리말 (서비스 맥락)
  prompts/fewshot/  톤 고정용 few-shot 2편
```

## Vercel 배포

저장소 루트가 `BYPP/`이므로 Import 시 **Root Directory = `star-diary`**, 환경변수 `GEMINI_API_KEY` 필요.
