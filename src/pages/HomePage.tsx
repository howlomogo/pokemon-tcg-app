import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HomePage({ seriesCount }: { seriesCount: number }) {
  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-900 px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
      <div className="pointer-events-none absolute -right-20 -top-24 -z-10 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-4">
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">
            <Sparkles size={14} aria-hidden="true" />
            Your Pokémon TCG collection
          </p>
          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Every set.
            <br />
            <span className="text-amber-400">Every card.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-400 sm:text-lg">
            Explore Pokémon TCG expansions, browse complete card lists, and keep track of the cards
            you want in your binder.
          </p>
          <Link
            to="/series"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-neutral-950 transition hover:bg-amber-300"
          >
            Explore all series
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>

        <div className="relative mx-auto flex aspect-[1.15] w-full max-w-lg items-center justify-center lg:aspect-square">
          <div className="absolute h-[76%] w-[76%] rounded-full border border-amber-300/10 bg-amber-300/[0.03] shadow-[0_0_100px_rgba(251,191,36,0.12)]" />
          <div className="absolute h-[58%] w-[58%] rounded-full border border-white/5" />
          <div className="absolute left-[16%] top-[17%] h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.9)]" />
          <div className="absolute right-[18%] top-[25%] h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_16px_rgba(125,211,252,0.9)]" />
          <div className="absolute bottom-[19%] left-[22%] h-1.5 w-1.5 rounded-full bg-rose-300 shadow-[0_0_16px_rgba(253,164,175,0.9)]" />

          <CardShowcase
            cardId="base1-2"
            name="Blastoise"
            image="https://assets.tcgdex.net/en/base/base1/2/high.webp"
            className="absolute left-[18%] top-1/2 z-10 w-[37%] -translate-y-1/2 -rotate-[14deg]"
          />
          <CardShowcase
            cardId="base1-15"
            name="Venusaur"
            image="https://assets.tcgdex.net/en/base/base1/15/high.webp"
            className="absolute right-[18%] top-1/2 z-10 w-[37%] -translate-y-1/2 rotate-[14deg]"
          />
          <CardShowcase
            cardId="base1-4"
            name="Charizard"
            image="https://assets.tcgdex.net/en/base/base1/4/high.webp"
            className="absolute left-1/2 top-1/2 z-20 w-[42%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_24px_40px_rgba(0,0,0,0.55)]"
          />

          <div className="absolute bottom-[5%] right-[5%] z-30 rounded-2xl border border-white/10 bg-neutral-950/90 px-4 py-3 shadow-xl backdrop-blur">
            <p className="text-lg font-black text-white">{seriesCount || '21'}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">Series to explore</p>
          </div>
          <div className="absolute left-[2%] top-[9%] z-30 flex h-11 w-11 items-center justify-center rounded-full border border-amber-200/20 bg-amber-300 text-xl text-neutral-950 shadow-[0_0_30px_rgba(251,191,36,0.25)]">
            ✦
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-3 border-t border-neutral-800 pt-6 sm:mt-16 sm:grid-cols-3 sm:gap-6">
        <HomeFeature title="Browse expansions" description="Find sets by name and explore their artwork." />
        <HomeFeature title="Explore every card" description="Open any card for its attacks and details." />
        <HomeFeature
          title={seriesCount > 0 ? `${seriesCount} series to discover` : 'Build your binder'}
          description="Browse each series and save cards to your binder."
        />
      </div>
    </section>
  );
}

function CardShowcase({
  cardId,
  name,
  image,
  className,
}: {
  cardId: string;
  name: string;
  image: string;
  className: string;
}) {
  return (
    <Link
      to={`/cards/${cardId}`}
      aria-label={`View ${name} card details`}
      className={`overflow-hidden rounded-[5%] border border-white/20 bg-neutral-950 shadow-2xl transition-transform duration-300 hover:z-40 hover:scale-105 ${className}`}
    >
      <img src={image} alt={name} className="block h-auto w-full" />
    </Link>
  );
}

function HomeFeature({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/50 p-4">
      <h2 className="font-bold text-neutral-100">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-neutral-500">{description}</p>
    </div>
  );
}
