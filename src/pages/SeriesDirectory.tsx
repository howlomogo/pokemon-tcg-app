import { useState } from 'react';
import { Search } from 'lucide-react';
import type { SerieList } from '@tcgdex/sdk';
import { Link } from 'react-router-dom';
import { ErrorMessage, LoadingMessage, SetArtwork } from '../components/shared';

export default function SeriesDirectory({
  series,
  loading,
  error,
}: {
  series: SerieList;
  loading: boolean;
  error: string | null;
}) {
  const [search, setSearch] = useState('');
  const visibleSeries = series.filter((serie) =>
    serie.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  );

  return (
    <section>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
            Pokémon TCG library
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Explore series</h1>
          <p className="mt-2 max-w-xl text-sm text-neutral-400 sm:text-base">
            Browse Pokémon TCG by series, then choose an expansion to see its cards.
          </p>
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Search series</span>
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search series..."
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-3 pl-10 pr-4 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-amber-400"
          />
        </label>
      </div>

      {!loading && !error && (
        <div className="mb-4 flex items-center justify-between text-sm text-neutral-500">
          <span>{visibleSeries.length} series</span>
          <span>Select a series to browse its sets</span>
        </div>
      )}

      {loading ? (
        <LoadingMessage message="Loading Pokémon TCG series..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : visibleSeries.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {visibleSeries.map((serie) => (
            <Link
              key={serie.id}
              to={`/sets/${encodeURIComponent(serie.id)}`}
              className="group overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 text-left transition hover:-translate-y-1 hover:border-amber-400/60 hover:bg-neutral-900"
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800 to-neutral-950 p-5">
                <SetArtwork
                  key={serie.id}
                  set={serie}
                  className="flex h-full w-full items-center justify-center"
                  imageClassName="max-h-full max-w-full transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h2 className="truncate font-bold text-neutral-100 group-hover:text-amber-300">
                  {serie.name}
                </h2>
                <p className="mt-1 text-xs text-neutral-500">Browse series</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-800 px-6 py-16 text-center">
          <p className="font-semibold text-neutral-300">No series match “{search}”</p>
          <p className="mt-1 text-sm text-neutral-500">Try another series name.</p>
        </div>
      )}
    </section>
  );
}
