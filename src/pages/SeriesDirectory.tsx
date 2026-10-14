import { useEffect, useState } from 'react';
import { CalendarDays, ChevronDown, Search } from 'lucide-react';
import type { Serie, SerieList, SetResume } from '@tcgdex/sdk';
import { Link } from 'react-router-dom';
import { ErrorMessage, LoadingMessage, SetArtwork, SetBackground } from '../components/shared';
import { getSerie, getSetReleaseDate } from '../services/tcgdex';

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
          <span>Select a series to view its sets</span>
        </div>
      )}

      {loading ? (
        <LoadingMessage message="Loading Pokémon TCG series..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : visibleSeries.length > 0 ? (
        <div className="space-y-3">
          {visibleSeries.map((serie) => (
            <SeriesSection
              key={serie.id}
              serie={serie}
            />
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

function SeriesSection({ serie }: { serie: SerieList[number] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [seriesDetails, setSeriesDetails] = useState<Serie | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleOpen = () => {
    const shouldOpen = !isOpen;
    setIsOpen(shouldOpen);
    if (!shouldOpen || seriesDetails || loading) return;

    setLoading(true);
    void getSerie(serie.id)
      .then((data) => {
        if (!data) {
          setError('This series could not be found.');
          return;
        }
        setSeriesDetails(data);
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load this series.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={toggleOpen}
        className="group flex w-full items-center gap-4 p-4 text-left transition hover:bg-neutral-800/60 sm:p-5"
      >
        <SetArtwork
          set={serie}
          className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-neutral-950 p-2 sm:h-16 sm:w-24"
          imageClassName="max-h-full max-w-full transition-transform duration-300 group-hover:scale-105"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold text-neutral-100 group-hover:text-amber-300">
            {serie.name}
          </span>
          <span className="mt-1 block text-xs text-neutral-500">
            {seriesDetails
              ? `${seriesDetails.sets.length} ${seriesDetails.sets.length === 1 ? 'set' : 'sets'}`
              : 'Expand to browse sets'}
          </span>
        </span>
        <ChevronDown
          size={20}
          aria-hidden="true"
          className={`shrink-0 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-neutral-800 p-4 sm:p-5">
          {loading ? (
            <LoadingMessage message={`Loading ${serie.name} sets...`} />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : seriesDetails?.sets.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
              {seriesDetails.sets.map((set) => (
                <SetCard
                  key={set.id}
                  set={set}
                  seriesId={serie.id}
                />
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-neutral-400">No sets are available in this series.</p>
          )}
        </div>
      )}
    </section>
  );
}

function SetCard({ set, seriesId }: { set: SetResume; seriesId: string }) {
  const [releaseDate, setReleaseDate] = useState<string | null>(null);
  const [releaseDateError, setReleaseDateError] = useState<string | null>(null);
  const [loadingReleaseDate, setLoadingReleaseDate] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void getSetReleaseDate(set.id, seriesId)
      .then((date) => {
        if (isMounted) setReleaseDate(date ?? null);
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setReleaseDateError(
            error instanceof Error ? error.message : 'Unable to load the release date.'
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoadingReleaseDate(false);
      });

    return () => {
      isMounted = false;
    };
  }, [seriesId, set.id]);

  const parsedDate = releaseDate ? new Date(`${releaseDate}T00:00:00`) : null;
  const formattedReleaseDate =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? new Intl.DateTimeFormat(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(parsedDate)
      : null;
  const releaseDateLabel =
    formattedReleaseDate ?? (loadingReleaseDate ? 'Loading date…' : 'Date unavailable');

  return (
    <Link
      to={`/sets/${encodeURIComponent(seriesId)}/${encodeURIComponent(set.id)}`}
      className="group/set overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/60 text-left transition hover:-translate-y-1 hover:border-amber-400/60 hover:bg-neutral-900"
    >
      <div className="relative isolate flex aspect-[4/3] items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800 to-neutral-950 p-5">
        <SetBackground setId={set.id} />
        <SetArtwork
          set={set}
          className="relative z-10 flex h-full w-full items-center justify-center"
          imageClassName="max-h-full max-w-full transition-transform duration-300 group-hover/set:scale-105"
        />
        <span
          className="absolute right-2 top-2 z-20 inline-flex items-center gap-1.5 rounded-full bg-slate-950/50 px-2.5 py-1 text-[10px] font-bold text-slate-100 shadow-sm backdrop-blur-sm"
          title={
            formattedReleaseDate
              ? `Released ${formattedReleaseDate}`
              : releaseDateError ?? 'Release date unavailable'
          }
        >
          <CalendarDays size={12} aria-hidden="true" />
          {releaseDateLabel}
        </span>
      </div>
      <div className="p-4">
        <h3 className="truncate font-bold text-neutral-100 group-hover/set:text-amber-300">
          {set.name}
        </h3>
        <p className="mt-1 text-xs text-neutral-500">{set.cardCount.total} cards</p>
      </div>
    </Link>
  );
}
