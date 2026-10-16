import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownWideNarrow, Grid2X2, ListFilter, Search, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import CardGrid from '../components/CardGrid';
import StorageActions from '../components/StorageActions';
import { ErrorMessage, LoadingMessage } from '../components/shared';
import { getCard } from '../services/tcgdex';
import type { CardWithDetails } from '../services/tcgdex';

type CollectionPageProps = {
  binderIds: string[];
  setBinderIds: React.Dispatch<React.SetStateAction<string[]>>;
};

type CollectionResult = {
  ids: string[];
  cards?: CardWithDetails[];
  error?: string;
};

type PriceSort = 'id-asc' | 'id-desc' | 'name-asc' | 'name-desc' | 'cardmarket-asc' | 'cardmarket-desc';

const getCardmarketPrice = (card: CardWithDetails) => {
  const prices = card.pricing?.cardmarket;
  if (!prices || typeof prices !== 'object' || Array.isArray(prices)) return null;

  const average = ['avg', 'avg7', 'avg30', 'avg1', 'avg-holo', 'avg1-holo', 'avg7-holo', 'avg30-holo']
    .map((key) => prices[key])
    .find((value): value is number => typeof value === 'number');
  return average ?? null;
};

export default function CollectionPage({ binderIds, setBinderIds }: CollectionPageProps) {
  const [result, setResult] = useState<CollectionResult | null>(null);
  const [search, setSearch] = useState('');
  const [suggestionSearch, setSuggestionSearch] = useState('');
  const [searchSuggestionsOpen, setSearchSuggestionsOpen] = useState(false);
  const [activePricePoint, setActivePricePoint] = useState<{ label: string; value: number; x: number; y: number } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [selectedRarities, setSelectedRarities] = useState<string[]>([]);
  const setFilterRef = useRef<HTMLDetailsElement>(null);
  const rarityFilterRef = useRef<HTMLDetailsElement>(null);
  const [sortOption, setSortOption] = useState<PriceSort>('id-asc');
  const [gridColumns, setGridColumns] = useState<3 | 4 | 5 | 6 | null>(null);
  const current = result?.ids.join('|') === binderIds.join('|') ? result : null;

  useEffect(() => {
    const timer = window.setTimeout(() => setSuggestionSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const searchSuggestions = suggestionSearch
    ? [...new Set((current?.cards ?? []).map((card) => card.name).filter((name) =>
        name.toLocaleLowerCase().startsWith(suggestionSearch.toLocaleLowerCase()) &&
        name.toLocaleLowerCase() !== suggestionSearch.toLocaleLowerCase()
      ))]
        .sort((first, second) => first.localeCompare(second, undefined, { sensitivity: 'base' }))
        .slice(0, 8)
    : [];
  const showSearchSuggestions = searchSuggestionsOpen && suggestionSearch === search.trim() && searchSuggestions.length > 0;

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node) {
        if (!setFilterRef.current?.contains(event.target)) setFilterRef.current?.removeAttribute('open');
        if (!rarityFilterRef.current?.contains(event.target)) rarityFilterRef.current?.removeAttribute('open');
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFilterRef.current?.removeAttribute('open');
        rarityFilterRef.current?.removeAttribute('open');
      }
    };

    document.addEventListener('click', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('click', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);
  const categories = useMemo(
    () => [...new Set((current?.cards ?? []).map((card) => card.category).filter(Boolean))].sort(),
    [current?.cards]
  );
  const collectionSets = useMemo(() => {
    const sets = new Map<string, { name: string; count: number }>();
    for (const card of current?.cards ?? []) {
      const id = card.set.id;
      const existing = sets.get(id);
      sets.set(id, { name: card.set.name, count: (existing?.count ?? 0) + 1 });
    }
    return [...sets.entries()]
      .map(([id, set]) => ({ id, ...set }))
      .sort((first, second) => first.name.localeCompare(second.name, undefined, { sensitivity: 'base' }));
  }, [current?.cards]);
  const maxSetCount = Math.max(1, ...collectionSets.map(({ count }) => count));
  const raritySummary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const card of current?.cards ?? []) {
      const rarity = card.rarity?.trim() || 'Unknown';
      counts.set(rarity, (counts.get(rarity) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([rarity, count]) => ({ rarity, count }))
      .sort((first, second) => first.rarity.localeCompare(second.rarity, undefined, { sensitivity: 'base' }));
  }, [current?.cards]);
  const maxRarityCount = Math.max(1, ...raritySummary.map(({ count }) => count));
  const filteredCards = useMemo(() => (current?.cards ?? [])
    .filter((card) => card.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    .filter((card) => categoryFilter === 'All' || card.category === categoryFilter)
    .filter((card) => selectedSets.length === 0 || selectedSets.includes(card.set.id))
    .filter((card) => selectedRarities.length === 0 || selectedRarities.includes(card.rarity?.trim() || 'Unknown'))
    .sort((first, second) => {
      const sortByPrice = sortOption.startsWith('cardmarket');
      if (sortByPrice) {
        const firstPrice = getCardmarketPrice(first);
        const secondPrice = getCardmarketPrice(second);
        if (firstPrice === null && secondPrice !== null) return 1;
        if (secondPrice === null && firstPrice !== null) return -1;
        if (firstPrice !== null && secondPrice !== null) {
          const comparison = firstPrice - secondPrice;
          return sortOption.endsWith('asc') ? comparison : -comparison;
        }
        return first.name.localeCompare(second.name, undefined, { sensitivity: 'base' });
      }
      const comparison = (sortOption.startsWith('name') ? first.name : first.localId).localeCompare(
            sortOption.startsWith('name') ? second.name : second.localId,
            undefined,
            { numeric: true, sensitivity: 'base' }
          );
      return sortOption.endsWith('asc') ? comparison : -comparison;
    }), [categoryFilter, current?.cards, search, selectedRarities, selectedSets, sortOption]);
  const valueSummary = useMemo(() => {
    const cards = current?.cards ?? [];
    const cardmarketTotal = cards.reduce((total, card) => total + (getCardmarketPrice(card) ?? 0), 0);
    const historicalAverages = ([['30d avg', 'avg30'], ['7d avg', 'avg7'], ['1d avg', 'avg1']] as const)
      .map(([label, key]) => ({
        label,
        value: cards.reduce((total, card) => {
          const market = card.pricing?.cardmarket;
          return market && typeof market === 'object' && !Array.isArray(market) && typeof market[key] === 'number'
            ? total + market[key]
            : total;
        }, 0),
        hasPrices: cards.some((card) => {
          const market = card.pricing?.cardmarket;
          return Boolean(market && typeof market === 'object' && !Array.isArray(market) && typeof market[key] === 'number');
        }),
      }))
      .filter((point) => point.hasPrices);
    const priceHistory: { label: string; value: number; hasPrices: boolean }[] = [
      ...historicalAverages,
      { label: 'Today', value: cardmarketTotal, hasPrices: true },
    ];
    const periodChanges = ([['1 day', 'avg1'], ['7 days', 'avg7'], ['30 days', 'avg30']] as const)
      .map(([label, key]) => {
        const periodTotal = cards.reduce((total, card) => {
          const market = card.pricing?.cardmarket;
          if (!market || typeof market !== 'object' || Array.isArray(market)) return total;
          const average = market[key];
          return typeof average === 'number' ? total + average : total;
        }, 0);
        const currentTotal = cardmarketTotal;
        const change = currentTotal - periodTotal;
        return {
          label,
          periodTotal,
          change,
          percentChange: periodTotal > 0 ? (change / periodTotal) * 100 : null,
          hasPrices: cards.some((card) => {
            const market = card.pricing?.cardmarket;
            return Boolean(market && typeof market === 'object' && !Array.isArray(market) && typeof market[key] === 'number');
          }),
        };
      });
    const mostValuableCard = cards
      .map((card) => ({ card, price: getCardmarketPrice(card) }))
      .filter((item): item is { card: CardWithDetails; price: number } => item.price !== null)
      .sort((first, second) => second.price - first.price)[0];
    return { cardmarketTotal, periodChanges, mostValuableCard, priceHistory };
  }, [current?.cards]);

  useEffect(() => {
    if (binderIds.length === 0) return;

    let isMounted = true;
    const ids = [...binderIds];

    const loadCards = async () => {
      try {
        const cards = await Promise.all(ids.map((id) => getCard(id)));
        if (!isMounted) return;

        if (cards.some((card) => card === null)) {
          setResult({
            ids,
            error: 'One or more saved cards could not be found. Remove the unavailable cards and try again.',
          });
          return;
        }

        setResult({
          ids,
          cards: cards.filter((card): card is CardWithDetails => card !== null),
        });
      } catch (error) {
        if (isMounted) {
          setResult({
            ids,
            error: error instanceof Error ? error.message : 'Unable to load your collection.',
          });
        }
      }
    };

    void loadCards();

    return () => {
      isMounted = false;
    };
  }, [binderIds]);

  return (
    <section>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
            Your saved cards
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Collection</h1>
          <p className="mt-2 text-sm text-neutral-400">
            {binderIds.length} {binderIds.length === 1 ? 'card' : 'cards'} in your collection
          </p>
        </div>
        <StorageActions binderIds={binderIds} setBinderIds={setBinderIds} />
      </div>

      {binderIds.length === 0 ? (
        <>
          <section aria-label="Collection value" className="relative isolate mb-7 overflow-hidden rounded-3xl bg-white p-5 sm:p-7">
            <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(17rem,0.8fr)] sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-100">Collection value</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-100">Your collection at a glance</h2>
                <p className="mt-2 text-sm text-neutral-400">Add cards to your collection to see their estimated total value and your most valuable card here.</p>
              </div>
            </div>
          </section>
          <div className="w-full rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30 py-16 text-center">
            <p className="font-medium text-neutral-500">Your collection is empty.</p>
            <p className="mt-1 text-sm text-neutral-500">
              Add cards from a set or card details page to see them here.
            </p>
            <Link
              to="/series"
              className="mt-5 inline-flex rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
            >
              Browse series
            </Link>
          </div>
        </>
      ) : !current ? (
        <LoadingMessage message="Loading your collection..." />
      ) : current.error ? (
        <ErrorMessage message={current.error} />
      ) : current.cards ? (
        <>
          <div className="mb-7 grid gap-4 sm:grid-cols-2">
              <section aria-label="Estimated collection total" className="rounded-3xl bg-white p-5 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-100">Collection value</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-100">Estimated total</h2>
                <p className="mt-1 text-4xl font-bold text-neutral-100">{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(valueSummary.cardmarketTotal)}</p>
                <div className="mt-5 border-t border-neutral-800 pt-4">
                  <p className="text-sm font-bold text-neutral-100">Recent price history</p>
                  {valueSummary.priceHistory.length > 1 ? (() => {
                    const values = valueSummary.priceHistory.map((point) => point.value);
                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    const range = max - min || 1;
                    const points = valueSummary.priceHistory.map((point, index) => ({
                      ...point,
                      x: 12 + (index / (valueSummary.priceHistory.length - 1)) * 276,
                      y: 62 - ((point.value - min) / range) * 48,
                    }));
                    return (
                      <>
                        <div className="relative mt-3">
                          <svg viewBox="0 0 300 80" role="group" aria-label={`Collection price history: ${points.map((point) => `${point.label} ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(point.value)}`).join(', ')}`} className="h-24 w-full overflow-visible">
                            <polyline points={points.map(({ x, y }) => `${x},${y}`).join(' ')} fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            {points.map((point) => (
                              <circle
                                key={point.label}
                                cx={point.x}
                                cy={point.y}
                                r="5"
                                fill="#fbbf24"
                                className="cursor-pointer outline-none focus:stroke-white focus:stroke-2"
                                tabIndex={0}
                                role="button"
                                aria-label={`${point.label}: ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(point.value)}`}
                                onMouseEnter={() => setActivePricePoint(point)}
                                onMouseLeave={() => setActivePricePoint(null)}
                                onFocus={() => setActivePricePoint(point)}
                                onBlur={() => setActivePricePoint(null)}
                              />
                            ))}
                          </svg>
                          {activePricePoint && (
                            <div
                              role="status"
                              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-100 shadow-xl"
                              style={{ left: `${(activePricePoint.x / 300) * 100}%`, top: `${(activePricePoint.y / 80) * 100}%` }}
                            >
                              <span className="font-semibold">{activePricePoint.label}</span>
                              <span className="ml-2">{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(activePricePoint.value)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between text-xs text-neutral-400">
                          {points.map((point) => <span key={point.label}>{point.label}</span>)}
                        </div>
                        <p className="mt-4 text-xs text-neutral-400">Based on available Cardmarket rolling averages; values are estimates.</p>
                      </>
                    );
                  })() : <p className="mt-2 text-sm text-neutral-400">Not enough historical price data yet.</p>}
                </div>
              </section>
              <section aria-label="Most valuable card" className="flex min-w-0 items-center justify-between gap-6 rounded-3xl bg-white p-5 sm:p-7">
                {valueSummary.mostValuableCard ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-100">Top card · Cardmarket</p>
                      <Link to={`/cards/${encodeURIComponent(valueSummary.mostValuableCard.card.id)}`} className="mt-2 block truncate text-lg font-bold text-neutral-100 transition hover:text-neutral-300">{valueSummary.mostValuableCard.card.name}</Link>
                      <p className="mt-2 text-2xl font-black tracking-tight text-neutral-100">{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(valueSummary.mostValuableCard.price)}</p>
                      <p className="mt-1 text-xs text-neutral-400">Highest average price in your collection</p>
                    </div>
                    <Link to={`/cards/${encodeURIComponent(valueSummary.mostValuableCard.card.id)}`} className="h-64 w-44 shrink-0 overflow-hidden rounded-xl sm:h-80 sm:w-56" aria-label={`View ${valueSummary.mostValuableCard.card.name}`}>
                      {valueSummary.mostValuableCard.card.image && <img src={`${valueSummary.mostValuableCard.card.image}/high.webp`} alt={valueSummary.mostValuableCard.card.name} className="h-full w-full object-contain drop-shadow-xl" loading="lazy" />}
                    </Link>
                  </>
                ) : <p className="text-sm text-neutral-400">Cardmarket values are unavailable.</p>}
              </section>
            <section aria-label="Collection price changes" className="rounded-3xl bg-white p-5 sm:col-span-2 sm:p-7">
              <p className="text-xs font-semibold text-neutral-100">Period averages compared with today’s Cardmarket total</p>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {valueSummary.periodChanges.map((period) => (
                  <div key={period.label} className="flex items-center gap-3 rounded-xl border-2 border-neutral-800 bg-slate-50 p-3">
                    <div
                      role="img"
                      aria-label={`${period.label} collection value ${period.change > 0 ? 'up' : period.change < 0 ? 'down' : 'unchanged'}`}
                      className={`shrink-0 ${period.change > 0 ? 'text-emerald-800' : period.change < 0 ? 'text-rose-800' : 'text-neutral-500'}`}
                    >
                      {period.change > 0 ? <TrendingUp size={24} aria-hidden="true" /> : period.change < 0 ? <TrendingDown size={24} aria-hidden="true" /> : <Minus size={24} aria-hidden="true" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold capitalize text-neutral-400">{period.label} change</p>
                      {period.hasPrices && period.percentChange !== null ? (
                        <>
                          <p className={`mt-1 text-3xl font-extrabold ${period.change > 0 ? 'text-emerald-800' : period.change < 0 ? 'text-rose-800' : 'text-neutral-500'}`}>
                            {period.change > 0 ? '+' : period.change < 0 ? '-' : ''}{Math.abs(period.percentChange).toFixed(1)}%
                          </p>
                          <p className="text-md text-neutral-400">
                            {period.change > 0 ? '+' : period.change < 0 ? '-' : ''}{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', signDisplay: 'never' }).format(Math.abs(period.change))}
                          </p>
                        </>
                      ) : <p className="mt-0.5 text-sm text-neutral-500">Unavailable</p>}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-neutral-400">Cards without reported prices are excluded. Values are estimates.</p>
            </section>
            <section aria-label="Collection rarities" className="rounded-3xl bg-white p-5 sm:p-7">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-neutral-100">Rarities in your collection</h2>
                  <p className="mt-1 text-sm text-neutral-400">Card count by rarity</p>
                </div>
                <span className="shrink-0 pt-1 text-sm tabular-nums text-neutral-400">{current.cards.length} total</span>
              </div>
              <ul className="grid gap-y-4">
                {raritySummary.map(({ rarity, count }) => (
                  <li key={rarity} className="grid grid-cols-[minmax(0,1fr)_minmax(2rem,1.5fr)_2rem] items-center gap-3 text-sm">
                    <span className="truncate font-medium text-neutral-100" title={rarity}>{rarity}</span>
                    <div
                      role="progressbar"
                      aria-label={`${rarity} cards`}
                      aria-valuemin={0}
                      aria-valuemax={maxRarityCount}
                      aria-valuenow={count}
                      className="h-2.5 overflow-hidden rounded-full bg-neutral-800"
                    >
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${(count / maxRarityCount) * 100}%` }} />
                    </div>
                    <span className="text-right tabular-nums text-neutral-400">{count}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="Collection sets" className="rounded-3xl bg-white p-5 sm:p-7">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-neutral-100">Sets in your collection</h2>
                  <p className="mt-1 text-sm text-neutral-400">Card count by set</p>
                </div>
                <span className="shrink-0 pt-1 text-sm tabular-nums text-neutral-400">{current.cards.length} total</span>
              </div>
              <ul className="grid gap-y-4">
                {collectionSets.map(({ id, name, count }) => (
                  <li key={id} className="grid grid-cols-[minmax(0,1fr)_minmax(2rem,1.5fr)_2rem] items-center gap-3 text-sm">
                    <span className="truncate font-medium text-neutral-100" title={name}>{name}</span>
                    <div
                      role="progressbar"
                      aria-label={`${name} cards`}
                      aria-valuemin={0}
                      aria-valuemax={maxSetCount}
                      aria-valuenow={count}
                      className="h-2.5 overflow-hidden rounded-full bg-neutral-800"
                    >
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${(count / maxSetCount) * 100}%` }} />
                    </div>
                    <span className="text-right tabular-nums text-neutral-400">{count}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <div className="mb-4">
            <h2 className="text-xl font-bold">Cards in your collection</h2>
            <p className="mt-1 text-sm text-neutral-400">{filteredCards.length} of {current.cards.length} cards</p>
          </div>
          <div className="relative z-30 mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_repeat(5,auto)]">
            <div className="relative" onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setSearchSuggestionsOpen(false);
            }}>
              <label>
                <span className="sr-only">Search cards by name</span>
                <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                <input
                  type="search"
                  value={search}
                  aria-autocomplete="list"
                  aria-expanded={showSearchSuggestions}
                  aria-controls="collection-card-name-suggestions"
                  onFocus={() => setSearchSuggestionsOpen(true)}
                  onKeyDown={(event) => { if (event.key === 'Escape') setSearchSuggestionsOpen(false); }}
                  onChange={(event) => { setSearch(event.target.value); setSearchSuggestionsOpen(true); }}
                  placeholder="Search cards..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-3 pl-10 pr-4 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-amber-400"
                />
              </label>
              <div
                id="collection-card-name-suggestions"
                role="listbox"
                aria-label="Matching card names"
                aria-hidden={!showSearchSuggestions}
                className={`absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-900 p-1 shadow-xl transition-all duration-200 ease-out ${showSearchSuggestions ? 'visible translate-y-0 opacity-100' : 'invisible pointer-events-none translate-y-1 opacity-0'}`}
              >
                {searchSuggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    role="option"
                    aria-selected="false"
                    tabIndex={showSearchSuggestions ? 0 : -1}
                    disabled={!showSearchSuggestions}
                    onClick={() => { setSearch(name); setSearchSuggestionsOpen(false); }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-200 transition hover:bg-neutral-800 hover:text-neutral-100"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <label className="relative block">
              <span className="sr-only">Filter cards by category</span>
              <select aria-label="Filter cards by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-full appearance-none rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-3 pr-9 text-sm text-neutral-100 outline-none focus:border-amber-400">
                <option value="All">All categories</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <ListFilter size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            </label>
            <details ref={setFilterRef} className="group relative w-full min-w-0 xl:w-36">
              <summary aria-label="Filter cards by set" className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-3 text-sm text-neutral-100 outline-none focus:border-amber-400 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 truncate">{selectedSets.length === 0 ? `All sets (${current.cards.length})` : `${selectedSets.length} sets selected`}</span>
                <ListFilter size={16} className="shrink-0 text-neutral-400" aria-hidden="true" />
              </summary>
              <fieldset className="absolute left-0 top-full z-20 mt-2 max-h-64 w-full min-w-56 overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-900 p-3 shadow-xl">
                <legend className="sr-only">Filter cards by set</legend>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-300 hover:bg-neutral-800">
                  <input type="checkbox" checked={selectedSets.length === 0} onChange={() => setSelectedSets([])} className="accent-amber-400" />
                  All sets ({current.cards.length})
                </label>
                {collectionSets.map((set) => (
                  <label key={set.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-300 hover:bg-neutral-800">
                    <input
                      type="checkbox"
                      checked={selectedSets.includes(set.id)}
                      onChange={(event) => setSelectedSets((selected) => event.target.checked ? [...selected, set.id] : selected.filter((id) => id !== set.id))}
                      className="accent-amber-400"
                    />
                    <span className="min-w-0 flex-1 truncate">{set.name}</span>
                    <span className="tabular-nums text-neutral-500">{set.count}</span>
                  </label>
                ))}
              </fieldset>
            </details>
            <details ref={rarityFilterRef} className="group relative w-full min-w-0 xl:w-36">
              <summary aria-label="Filter cards by rarity" className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-3 text-sm text-neutral-100 outline-none focus:border-amber-400 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 truncate">{selectedRarities.length === 0 ? `All rarities (${current.cards.length})` : `${selectedRarities.length} rarities selected`}</span>
                <ListFilter size={16} className="shrink-0 text-neutral-400" aria-hidden="true" />
              </summary>
              <fieldset className="absolute left-0 top-full z-20 mt-2 max-h-64 w-full min-w-56 overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-900 p-3 shadow-xl">
                <legend className="sr-only">Filter cards by rarity</legend>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-300 hover:bg-neutral-800">
                  <input type="checkbox" checked={selectedRarities.length === 0} onChange={() => setSelectedRarities([])} className="accent-amber-400" />
                  All rarities ({current.cards.length})
                </label>
                {raritySummary.map(({ rarity, count }) => (
                  <label key={rarity} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-300 hover:bg-neutral-800">
                    <input
                      type="checkbox"
                      checked={selectedRarities.includes(rarity)}
                      onChange={(event) => setSelectedRarities((selected) => event.target.checked ? [...selected, rarity] : selected.filter((item) => item !== rarity))}
                      className="accent-amber-400"
                    />
                    <span className="min-w-0 flex-1 truncate">{rarity}</span>
                    <span className="tabular-nums text-neutral-500">{count}</span>
                  </label>
                ))}
              </fieldset>
            </details>
            <label className="relative block">
              <span className="sr-only">Sort cards</span>
              <select aria-label="Sort cards" value={sortOption} onChange={(event) => setSortOption(event.target.value as typeof sortOption)} className="w-full appearance-none rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-3 pr-9 text-sm text-neutral-100 outline-none focus:border-amber-400">
                <option value="id-asc"># (a - z)</option><option value="id-desc"># (z - a)</option>
                <option value="name-asc">Name (a - z)</option><option value="name-desc">Name (z - a)</option>
                <option value="cardmarket-asc">Price (low to high)</option><option value="cardmarket-desc">Price (high to low)</option>
              </select>
              <ArrowDownWideNarrow size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            </label>
            <label className="relative hidden md:block">
              <span className="sr-only">Cards per row</span>
              <select aria-label="Cards per row" value={gridColumns ?? ''} onChange={(event) => setGridColumns(Number(event.target.value) as 3 | 4 | 5 | 6)} className="w-full appearance-none rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-3 pr-9 text-sm text-neutral-100 outline-none focus:border-amber-400">
                <option value="" disabled>Per row</option>
                {[3, 4, 5, 6].map((columns) => <option key={columns} value={columns}>{columns}</option>)}
              </select>
              <Grid2X2 size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            </label>
          </div>
          <CardGrid cards={filteredCards} binderIds={binderIds} setBinderIds={setBinderIds} columns={gridColumns ?? undefined} showPrices priceSource="cardmarket" />
        </>
      ) : null}
    </section>
  );
}
