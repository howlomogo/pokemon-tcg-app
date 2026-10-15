import { useEffect, useState } from 'react';
import { ArrowDownWideNarrow, ArrowLeft, Grid2X2, ListFilter, Search } from 'lucide-react';
import type { Set as TcgSet } from '@tcgdex/sdk';
import { Link, useParams } from 'react-router-dom';
import CardGrid from '../components/CardGrid';
import { ErrorMessage, LoadingMessage, SetArtwork, SetBackground } from '../components/shared';
import { getSet, getSetCardIdsByCategory } from '../services/tcgdex';

type SetPageProps = {
  binderIds: string[];
  setBinderIds: React.Dispatch<React.SetStateAction<string[]>>;
};

const cardCategories = ['Pokemon', 'Trainer', 'Energy'] as const;
type CardCategory = (typeof cardCategories)[number];

export default function SetPage({ binderIds, setBinderIds }: SetPageProps) {
  const { seriesId = '', setId = '' } = useParams();
  const [result, setResult] = useState<{ id: string; set?: TcgSet; error?: string } | null>(null);
  const [searchState, setSearchState] = useState({ setId, value: '' });
  const [searchSuggestionsOpen, setSearchSuggestionsOpen] = useState(false);
  const [suggestionSearch, setSuggestionSearch] = useState('');
  const [sortOption, setSortOption] = useState<
    '' | 'name-asc' | 'name-desc' | 'id-asc' | 'id-desc'
  >('');
  const [gridColumns, setGridColumns] = useState<3 | 4 | 5 | 6 | null>(null);
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'owned' | 'not-owned'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'' | 'All' | CardCategory>('');
  const [categoryData, setCategoryData] = useState<{
    setId: string;
    cardIdsByCategory?: Partial<Record<CardCategory, string[]>>;
    error?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSet = async () => {
      try {
        const data = await getSet(setId, seriesId);
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
  }, [seriesId, setId]);

  const search = searchState.setId === setId ? searchState.value : '';
  const current = result?.id === setId ? result : null;
  const currentSet = current?.set;
  useEffect(() => {
    const timer = window.setTimeout(() => setSuggestionSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const searchSuggestions = suggestionSearch
    ? [...new Set(
        (currentSet?.cards ?? [])
          .map((card) => card.name)
          .filter(
            (name) =>
              name.toLocaleLowerCase().startsWith(suggestionSearch.toLocaleLowerCase()) &&
              name.toLocaleLowerCase() !== suggestionSearch.toLocaleLowerCase()
          )
      )]
        .sort((first, second) => first.localeCompare(second, undefined, { sensitivity: 'base' }))
        .slice(0, 8)
    : [];
  const showSearchSuggestions =
    searchSuggestionsOpen &&
    suggestionSearch === search.trim() &&
    searchSuggestions.length > 0;

  useEffect(() => {
    if (!currentSet) return;
    if (
      categoryData?.setId === setId &&
      (categoryData.cardIdsByCategory || categoryData.error)
    ) {
      return;
    }

    let isMounted = true;

    const loadCategories = async () => {
      try {
        const categories = await Promise.all(
          cardCategories.map(async (category) => [
            category,
            await getSetCardIdsByCategory(setId, category),
          ] as const)
        );
        if (isMounted) {
          setCategoryData({ setId, cardIdsByCategory: Object.fromEntries(categories) });
        }
      } catch (error) {
        if (isMounted) {
          setCategoryData({
            setId,
            error: error instanceof Error ? error.message : 'Unable to load card categories.',
          });
        }
      }
    };

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, [categoryData, currentSet, setId]);

  const categoriesLoaded =
    categoryData?.setId === setId && Boolean(categoryData.cardIdsByCategory);
  const availableCategories = categoriesLoaded
    ? cardCategories.filter((category) => categoryData.cardIdsByCategory?.[category]?.length)
    : [];
  const activeCategoryFilter =
    categoryFilter === '' || categoryFilter === 'All' || availableCategories.includes(categoryFilter)
      ? categoryFilter
      : 'All';
  const setCards = current?.set?.cards ?? [];
  const ownedCount = setCards.filter((card) => binderIds.includes(card.id)).length;
  const notOwnedCount = setCards.length - ownedCount;
  const filteredCards = current?.set?.cards
    .filter((card) => card.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    .filter(
      (card) =>
        activeCategoryFilter === '' ||
        activeCategoryFilter === 'All' ||
        categoryData?.cardIdsByCategory?.[activeCategoryFilter]?.includes(card.id)
    )
    .filter((card) => {
      if (ownershipFilter === 'owned') return binderIds.includes(card.id);
      if (ownershipFilter === 'not-owned') return !binderIds.includes(card.id);
      return true;
    })
    .sort((first, second) => {
      const sortByName = sortOption.startsWith('name');
      const firstValue = sortByName ? first.name : first.localId;
      const secondValue = sortByName ? second.name : second.localId;
      const comparison = firstValue.localeCompare(secondValue, undefined, {
        numeric: true,
        sensitivity: 'base',
      });

      return sortOption === '' || sortOption.endsWith('asc') ? comparison : -comparison;
    });

  return (
    <section>
      <Link
        to={`/sets/${encodeURIComponent(seriesId)}`}
        className="mb-7 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-neutral-400 transition hover:text-neutral-100"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to series sets
      </Link>

      {current?.set && (
        <div className="relative isolate mb-9 flex flex-col gap-6 overflow-hidden rounded-3xl border border-neutral-800 bg-slate-800/90 p-5 sm:flex-row sm:items-center sm:p-7">
          <SetBackground setId={current.set.id} variant="title" />
          <SetArtwork
            key={current.set.id}
            set={current.set}
            className="relative z-10 flex h-32 shrink-0 items-center justify-center px-6 sm:w-56"
            imageClassName="max-h-24 max-w-full"
          />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
              Set collection
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-100 sm:text-4xl">
              {current.set.name}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              {current.set.cardCount.total} cards
              {current.set.cardCount.official !== current.set.cardCount.total &&
                ` · ${current.set.cardCount.official} official`}
            </p>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-bold">Cards in this set</h2>
        <p className="mt-1 text-sm text-neutral-400">
          {current?.set
            ? `${filteredCards?.length ?? 0} of ${current.set.cards.length} cards`
            : 'Browse the complete set'}
        </p>
      </div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-start">
        {current?.set && (
          <div className="grid w-full gap-3 sm:grid-cols-[minmax(12rem,1fr)_auto_auto_auto_auto]">
            <div
              className="relative"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setSearchSuggestionsOpen(false);
                }
              }}
            >
              <label>
                <span className="sr-only">Search cards by name</span>
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  aria-autocomplete="list"
                  aria-expanded={showSearchSuggestions}
                  aria-controls="card-name-suggestions"
                  onFocus={() => setSearchSuggestionsOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setSearchSuggestionsOpen(false);
                  }}
                  onChange={(event) => {
                    setSearchState({ setId, value: event.target.value });
                    setSearchSuggestionsOpen(true);
                  }}
                  placeholder="Search cards..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-3 pl-10 pr-4 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-amber-400"
                />
              </label>
              <div
                id="card-name-suggestions"
                role="listbox"
                aria-label="Matching card names"
                aria-hidden={!showSearchSuggestions}
                className={`absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-900 p-1 shadow-xl transition-all duration-200 ease-out ${
                  showSearchSuggestions
                    ? 'visible translate-y-0 opacity-100'
                    : 'invisible pointer-events-none translate-y-1 opacity-0'
                }`}
              >
                {searchSuggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    role="option"
                    aria-selected="false"
                    tabIndex={showSearchSuggestions ? 0 : -1}
                    disabled={!showSearchSuggestions}
                    onClick={() => {
                      setSearchState({ setId, value: name });
                      setSearchSuggestionsOpen(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-200 transition hover:bg-neutral-800 hover:text-neutral-100"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div
              role="group"
              aria-label="Filter cards by ownership"
              className="flex items-center rounded-xl border border-neutral-800 bg-neutral-900 p-1"
            >
              {([
                ['all', 'All'],
                ['owned', 'Owned'],
                ['not-owned', 'Not Owned'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={ownershipFilter === value}
                  onClick={() => setOwnershipFilter(value)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                    ownershipFilter === value
                      ? 'bg-neutral-800 text-neutral-100'
                      : 'text-neutral-400 hover:text-neutral-100'
                  }`}
                >
                  {label}
                  {value !== 'all' && (
                    <span className="ml-1.5 rounded-full bg-neutral-800 px-1.5 py-0.5 text-xs text-amber-300">
                      {value === 'owned' ? ownedCount : notOwnedCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <label>
              <span className="sr-only">Filter cards by category</span>
              <span className="relative block w-full">
                <select
                  aria-label="Filter cards by category"
                  value={activeCategoryFilter}
                  disabled={!categoriesLoaded}
                  onChange={(event) => {
                    if (event.target.value === '' || event.target.value === 'All') {
                      setCategoryFilter(event.target.value);
                    } else {
                      const selectedCategory = cardCategories.find(
                        (category) => category === event.target.value
                      );
                      if (selectedCategory) setCategoryFilter(selectedCategory);
                    }
                  }}
                  className="w-full appearance-none rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-3 pr-9 text-sm text-neutral-100 outline-none focus:border-amber-400 disabled:cursor-wait disabled:opacity-60"
                >
                  <option value="" disabled>Category</option>
                  <option value="All">All</option>
                  {availableCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <ListFilter
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  aria-hidden="true"
                />
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-400">
              <span className="sr-only">Sort cards</span>
              <span className="relative block w-full">
                <select
                  value={sortOption}
                  onChange={(event) => {
                    if (event.target.value === '') {
                      setSortOption('');
                    } else if (
                      event.target.value === 'name-asc' ||
                      event.target.value === 'name-desc' ||
                      event.target.value === 'id-asc' ||
                      event.target.value === 'id-desc'
                    ) {
                      setSortOption(event.target.value);
                    }
                  }}
                  className="w-full appearance-none rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-3 pr-9 text-sm text-neutral-100 outline-none focus:border-amber-400"
                >
                  <option value="" disabled>Sort by</option>
                  <option value="id-asc"># (a - z)</option>
                  <option value="id-desc"># (z - a)</option>
                  <option value="name-asc">Name (a - z)</option>
                  <option value="name-desc">Name (z - a)</option>
                </select>
                <ArrowDownWideNarrow
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  aria-hidden="true"
                />
              </span>
            </label>
            <label className="hidden md:block">
              <span className="sr-only">Cards per row</span>
              <span className="relative block w-full">
                <select
                  aria-label="Cards per row"
                  value={gridColumns ?? ''}
                  onChange={(event) => {
                    if (event.target.value === '3') {
                      setGridColumns(3);
                    } else if (event.target.value === '4') {
                      setGridColumns(4);
                    } else if (event.target.value === '5') {
                      setGridColumns(5);
                    } else if (event.target.value === '6') {
                      setGridColumns(6);
                    }
                  }}
                  className="w-full appearance-none rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-3 pr-9 text-sm text-neutral-100 outline-none focus:border-amber-400"
                >
                  <option value="" disabled>Per row</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                </select>
                <Grid2X2
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                  aria-hidden="true"
                />
              </span>
            </label>
          </div>
        )}
      </div>

      {categoryData?.setId === setId && categoryData.error && (
        <div className="mb-5">
          <ErrorMessage message={categoryData.error} />
        </div>
      )}
      {!current ? (
        <LoadingMessage message="Loading cards in this set..." />
      ) : current.error ? (
        <ErrorMessage message={current.error} />
      ) : current.set ? (
        <CardGrid
          cards={filteredCards ?? []}
          binderIds={binderIds}
          setBinderIds={setBinderIds}
          columns={gridColumns ?? undefined}
        />
      ) : null}
    </section>
  );
}
