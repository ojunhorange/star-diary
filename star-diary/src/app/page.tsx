import Link from "next/link";
import NightSky from "@/components/NightSky";
import { LANDING } from "@/data/landing-content";

const btn = "rounded-full border border-gold/60 px-8 py-3 text-gold transition hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold text-[19px]";
const btnQuiet = "rounded-full border border-starlight/25 px-8 py-3 text-starlight/80 transition hover:border-starlight/60 hover:text-starlight text-[19px]";

export default function Landing() {
  return (
    <main className="relative min-h-screen">
      <NightSky />
      <section className="relative flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-serif text-4xl tracking-wide">{LANDING.title}</h1>
        <p className="text-muted">{LANDING.tagline}</p>
        <div className="mt-10 flex items-center gap-4">
          <Link href="/welcome" className={btnQuiet}>{LANDING.secondary}</Link>
          <Link href="/sky" className={btn}>{LANDING.primary}</Link>
        </div>
        <Link href="/constellations" className="mt-6 text-[17px] text-muted underline-offset-4 transition hover:text-starlight hover:underline text-[19px]">
          열 개의 별자리 미리 보기
        </Link>
      </section>
    </main>
  );
}
