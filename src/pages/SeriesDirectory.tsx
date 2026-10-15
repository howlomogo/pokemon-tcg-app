import { useEffect, useState } from 'react';
import { ArrowDownWideNarrow, CalendarDays, ChevronDown, Layers3, Search } from 'lucide-react';
import type { Serie, SerieList, SetResume } from '@tcgdex/sdk';
import { Link } from 'react-router-dom';
import {
  ErrorMessage,
  LoadingMessage,
  SeriesBackground,
  SetArtwork,
  SetBackground,
} from '../components/shared';
import { getSerie, getSetDirectoryData } from '../services/tcgdex';

export default function SeriesDirectory({
  series,
  loading,
  error,
  binderIds,
}: {
  series: SerieList;
  loading: boolean;
  error: string | null;
  binderIds: string[];
}) {
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('newest');
  const orderedSeries = sortOrder === 'oldest' ? series : [...series].reverse();
  const visibleSeries = orderedSeries.filter((serie) =>
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
        <div className="flex w-full gap-2 sm:w-auto sm:items-center">
          <label className="relative block min-w-0 flex-1 sm:w-64 sm:flex-none">
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
          <button
            type="button"
            onClick={() => setSortOrder((order) => (order === 'oldest' ? 'newest' : 'oldest'))}
            aria-label={`Switch to ${sortOrder === 'oldest' ? 'newest' : 'oldest'} first`}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-3 text-sm font-medium text-neutral-300 transition hover:border-neutral-600 hover:text-neutral-100"
          >
            <ArrowDownWideNarrow size={16} aria-hidden="true" />
            {sortOrder === 'oldest' ? 'Oldest first' : 'Newest first'}
          </button>
        </div>
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
        <div className="space-y-5">
          {visibleSeries.map((serie) => (
            <SeriesSection
              key={serie.id}
              serie={serie}
              binderIds={binderIds}
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

function SeriesSection({
  serie,
  binderIds,
}: {
  serie: SerieList[number];
  binderIds: string[];
}) {
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
        className="group relative isolate flex w-full items-center gap-5 px-5 py-6 text-left transition hover:bg-neutral-800/60 sm:gap-6 sm:px-7 sm:py-8"
      >
        <SeriesBackground seriesId={serie.id} />
        <span className="relative z-10 flex w-full items-center gap-4">
          <SetArtwork
            set={serie}
            className="flex h-28 w-44 shrink-0 items-center justify-center sm:h-32 sm:w-52"
            imageClassName="max-h-[80%] max-w-[90%] transition-transform duration-300 group-hover:scale-105"
          />
          <span className="min-w-0 flex-1">
            <h2 className="m-0 block truncate text-[1.625rem] font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] transition-colors group-hover:text-amber-300 sm:text-[2.125rem]">
              {serie.name}
            </h2>
            <span className="mt-2 block text-sm text-slate-300">
              {seriesDetails
                ? `${seriesDetails.sets.length} ${seriesDetails.sets.length === 1 ? 'set' : 'sets'}`
                : 'Expand to browse sets'}
            </span>
          </span>
          <ChevronDown
            size={26}
            aria-hidden="true"
            className={`shrink-0 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-neutral-800 p-4 sm:p-5">
          {loading ? (
            <LoadingMessage message={`Loading ${serie.name} sets...`} />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : seriesDetails?.sets.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {seriesDetails.sets.map((set) => (
                <SetCard
                  key={set.id}
                  set={set}
                  seriesId={serie.id}
                  binderIds={binderIds}
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

function SetCard({
  set,
  seriesId,
  binderIds,
}: {
  set: SetResume;
  seriesId: string;
  binderIds: string[];
}) {
  const [directoryData, setDirectoryData] = useState<{
    releaseDate: string | null;
    cardIds: string[];
  } | null>(null);
  const [directoryDataError, setDirectoryDataError] = useState<string | null>(null);
  const [loadingDirectoryData, setLoadingDirectoryData] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void getSetDirectoryData(set.id, seriesId)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          setDirectoryDataError('Set details are unavailable.');
          return;
        }
        setDirectoryData(data);
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setDirectoryDataError(
            error instanceof Error ? error.message : 'Unable to load set details.'
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoadingDirectoryData(false);
      });

    return () => {
      isMounted = false;
    };
  }, [seriesId, set.id]);

  const parsedDate = directoryData?.releaseDate
    ? new Date(`${directoryData.releaseDate}T00:00:00`)
    : null;
  const formattedReleaseDate =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? new Intl.DateTimeFormat(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(parsedDate)
      : null;
  const releaseDateLabel =
    formattedReleaseDate ?? (loadingDirectoryData ? 'Loading date…' : 'Date unavailable');
  const collectedCount = directoryData?.cardIds.filter((id) => binderIds.includes(id)).length;
  const collectionPercentage =
    collectedCount === undefined || set.cardCount.total === 0
      ? null
      : Math.round((collectedCount / set.cardCount.total) * 100);

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
          imageClassName="max-h-[60%] max-w-[80%] transition-transform duration-300 group-hover/set:scale-105"
        />
        <span
          className="absolute right-2 top-2 z-20 inline-flex items-center gap-1.5 rounded-full bg-slate-950/50 px-2.5 py-1 text-[10px] font-bold text-slate-100 shadow-sm backdrop-blur-sm"
          title={
            formattedReleaseDate
              ? `Released ${formattedReleaseDate}`
              : directoryDataError ?? 'Release date unavailable'
          }
        >
          <CalendarDays size={12} aria-hidden="true" />
          {releaseDateLabel}
        </span>
        {collectionPercentage !== null && (
          <span className="absolute bottom-2 right-2 z-20 rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-bold text-amber-300 shadow-sm backdrop-blur-sm">
            {collectionPercentage}%
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="truncate font-bold tracking-wide text-neutral-100 group-hover/set:text-amber-300">
          {set.name}
        </h3>
        {collectionPercentage !== null ? (
          <div className="mt-1 flex items-center justify-between text-xs text-neutral-300">
            <span className="inline-flex items-center gap-1.5">
              <Layers3 size={14} aria-hidden="true" />
              Cards collected
            </span>
            <span className="font-bold">{collectedCount}/{set.cardCount.total}</span>
          </div>
        ) : loadingDirectoryData ? (
          <p className="mt-1 text-xs text-neutral-500">Loading collection progress…</p>
        ) : (
          <p className="mt-1 text-xs text-neutral-500">
            {directoryDataError ?? 'Collection progress unavailable'}
          </p>
        )}
      </div>
    </Link>
  );
}
