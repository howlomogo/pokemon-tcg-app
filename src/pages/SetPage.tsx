import { useEffect, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import type { Set as TcgSet } from '@tcgdex/sdk';
import { Link, useParams } from 'react-router-dom';
import CardGrid from '../components/CardGrid';
import { ErrorMessage, LoadingMessage, SetArtwork } from '../components/shared';
import { getSet } from '../services/tcgdex';

type SetPageProps = {
  binderIds: string[];
  setBinderIds: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function SetPage({ binderIds, setBinderIds }: SetPageProps) {
  const { seriesId = '', setId = '' } = useParams();
  const [result, setResult] = useState<{ id: string; set?: TcgSet; error?: string } | null>(null);
  const [searchState, setSearchState] = useState({ setId, value: '' });
  const [sortBy, setSortBy] = useState<'localId' | 'name'>('localId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let isMounted = true;

    const loadSet = async () => {
      try {
        const data = await getSet(setId);
        if (!isMounted) return;

        if (!data) {
          setResult({ id: setId, error: 'This set could not be found.' });
          return;
        }

        setResult({ id: setId, set: data });
      } catch (error) {
        if (isMounted) {
          setResult({
            id: setId,
            error: error instanceof Error ? error.message : 'Unable to load this set.',
          });
        }
      }
    };

    void loadSet();

    return () => {
      isMounted = false;
    };
  }, [setId]);

  const search = searchState.setId === setId ? searchState.value : '';
  const current = result?.id === setId ? result : null;
  const filteredCards = current?.set?.cards
    .filter((card) => card.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    .sort((first, second) => {
      const firstValue = sortBy === 'name' ? first.name : first.localId;
      const secondValue = sortBy === 'name' ? second.name : second.localId;
      const comparison = firstValue.localeCompare(secondValue, undefined, {
        numeric: true,
        sensitivity: 'base',
      });

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <section>
      <Link
        to={`/sets/${encodeURIComponent(seriesId)}`}
        className="mb-7 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-neutral-400 transition hover:text-white"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to series sets
      </Link>

      {current?.set && (
        <div className="mb-9 flex flex-col gap-6 rounded-3xl border border-neutral-800 bg-neutral-900/70 p-5 sm:flex-row sm:items-center sm:p-7">
          <SetArtwork
            key={current.set.id}
            set={current.set}
            className="flex h-32 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 px-6 sm:w-56"
            imageClassName="max-h-24 max-w-full"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
              Set collection
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {current.set.name}
            </h1>
            <p className="mt-2 text-sm text-neutral-400">
              {current.set.cardCount.total} cards
              {current.set.cardCount.official !== current.set.cardCount.total &&
                ` · ${current.set.cardCount.official} official`}
            </p>
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Cards in this set</h2>
          <p className="mt-1 text-sm text-neutral-400">
            {current?.set
              ? `${filteredCards?.length ?? 0} of ${current.set.cards.length} cards`
              : 'Browse the complete set'}
          </p>
        </div>
        {current?.set && (
          <div className="grid w-full gap-3 sm:max-w-2xl sm:grid-cols-[minmax(12rem,1fr)_auto_auto]">
            <label className="relative block">
              <span className="sr-only">Search cards by name</span>
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearchState({ setId, value: event.target.value })}
                placeholder="Search cards..."
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-amber-400"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              <span>Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => {
                  if (event.target.value === 'localId' || event.target.value === 'name') {
                    setSortBy(event.target.value);
                  }
                }}
                className="min-w-28 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-3 text-sm text-white outline-none focus:border-amber-400"
              >
                <option value="localId">Id</option>
                <option value="name">Name</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              <span className="sr-only">Sort direction</span>
              <select
                value={sortOrder}
                onChange={(event) => {
                  if (event.target.value === 'asc' || event.target.value === 'desc') {
                    setSortOrder(event.target.value);
                  }
                }}
                className="min-w-32 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-3 text-sm text-white outline-none focus:border-amber-400"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {!current ? (
        <LoadingMessage message="Loading cards in this set..." />
      ) : current.error ? (
        <ErrorMessage message={current.error} />
      ) : current.set ? (
        <CardGrid
          cards={filteredCards ?? []}
          binderIds={binderIds}
          setBinderIds={setBinderIds}
        />
      ) : null}
    </section>
  );
}
