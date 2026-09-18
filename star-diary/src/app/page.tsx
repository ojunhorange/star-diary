import NightSky from "@/components/NightSky";

const STARS_TO_COMPLETE = 3; // 데모용. 실서비스 5

export default function Home() {
  const stars: { x: number; y: number }[] = []; // 2단계에서 localStorage로 교체

  return (
    <main className="relative min-h-screen">
      <NightSky stars={stars} />

      <header className="absolute left-10 top-8">
        <h1 className="font-serif text-lg tracking-wide">별자리 일기</h1>
      </header>

      <section className="absolute inset-x-0 bottom-[18vh] flex flex-col items-center gap-6 text-center">
        <p className="text-muted">
          {stars.length === 0
            ? "아직 별이 없어요. 오늘 첫 별을 찍어보세요."
            : `별 ${stars.length}개 · 별자리까지 ${STARS_TO_COMPLETE - stars.length}개`}
        </p>
        <a
          href="/write"
          className="rounded-full border border-gold/60 px-8 py-3 text-gold transition hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          오늘 별 하나 찍기
        </a>
      </section>
    </main>
  );
}
