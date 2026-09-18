import Link from "next/link";
import NightSky from "@/components/NightSky";
import { LANDING } from "@/data/landing-content";

const btn = "rounded-full border border-gold/60 px-8 py-3 text-gold transition hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";
const btnQuiet = "rounded-full border border-starlight/25 px-8 py-3 text-starlight/80 transition hover:border-starlight/60 hover:text-starlight";

export default function Landing() {
  return (
    <main className="relative min-h-screen">
      <NightSky />
      <section className="absolute inset-x-0 top-[34vh] flex flex-col items-center gap-4 text-center">
        <h1 className="font-serif text-4xl tracking-wide">{LANDING.title}</h1>
        <p className="text-muted">{LANDING.tagline}</p>
      </section>
      <section className="absolute inset-x-0 bottom-[10vh] flex items-center justify-center gap-4">
        <Link href="/welcome" className={btnQuiet}>{LANDING.secondary}</Link>
        <Link href="/sky" className={btn}>{LANDING.primary}</Link>
      </section>
    </main>
  );
}
