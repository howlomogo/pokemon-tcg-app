import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Serie } from '@tcgdex/sdk';
import { Link, useParams } from 'react-router-dom';
import { getSerie } from '../services/tcgdex';
import { ErrorMessage, LoadingMessage, SetArtwork } from '../components/shared';

export default function SeriesPage() {
  const { seriesId = '' } = useParams();
  const [result, setResult] = useState<{ id: string; series?: Serie; error?: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSeries = async () => {
      try {
        const data = await getSerie(seriesId);
        if (!isMounted) return;

        if (!data) {
          setResult({ id: seriesId, error: 'This series could not be found.' });
          return;
        }

        setResult({ id: seriesId, series: data });
      } catch (error) {
        if (isMounted) {
          setResult({
            id: seriesId,
            error: error instanceof Error ? error.message : 'Unable to load this series.',
          });
        }
      }
    };

    void loadSeries();

    return () => {
      isMounted = false;
    };
  }, [seriesId]);

  const current = result?.id === seriesId ? result : null;

  return (
    <section>
      <Link
        to="/series"
        className="mb-7 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-neutral-400 transition hover:text-neutral-100"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        All series
      </Link>

      {!current ? (
        <LoadingMessage message="Loading series sets..." />
      ) : current.error ? (
        <ErrorMessage message={current.error} />
      ) : current.series ? (
        <>
          <div className="mb-9 flex flex-col gap-6 rounded-3xl border border-neutral-800 bg-neutral-900/70 p-5 sm:flex-row sm:items-center sm:p-7">
            <SetArtwork
              key={current.series.id}
              set={current.series}
              className="flex h-32 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 px-6 sm:w-56"
              imageClassName="max-h-24 max-w-full"
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                Pokémon TCG series
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                {current.series.name}
              </h1>
              <p className="mt-2 text-sm text-neutral-400">
                {current.series.sets.length} {current.series.sets.length === 1 ? 'set' : 'sets'}
              </p>
            </div>
          </div>

          <div className="mb-5">
            <h2 className="text-xl font-bold">Sets in {current.series.name}</h2>
            <p className="mt-1 text-sm text-neutral-400">Choose a set to browse its complete card list.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {current.series.sets.map((set) => (
              <Link
                key={set.id}
                to={`/sets/${encodeURIComponent(seriesId)}/${encodeURIComponent(set.id)}`}
                className="group overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 text-left transition hover:-translate-y-1 hover:border-amber-400/60 hover:bg-neutral-900"
              >
                <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800 to-neutral-950 p-5">
                  <SetArtwork
                    key={set.id}
                    set={set}
                    className="flex h-full w-full items-center justify-center"
                    imageClassName="max-h-full max-w-full transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="truncate font-bold text-neutral-100 group-hover:text-amber-300">
                    {set.name}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">{set.cardCount.total} cards</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
