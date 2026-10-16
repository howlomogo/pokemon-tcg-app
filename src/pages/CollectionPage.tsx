import { useEffect, useMemo, useState } from 'react';
import { ArrowDownWideNarrow, ListFilter, Search, TrendingDown, TrendingUp, Minus } from 'lucide-react';
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
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOption, setSortOption] = useState<PriceSort>('id-asc');
  const [gridColumns, setGridColumns] = useState<3 | 4 | 5 | 6>(6);
  const current = result?.ids.join('|') === binderIds.join('|') ? result : null;
  const categories = useMemo(
    () => [...new Set((current?.cards ?? []).map((card) => card.category).filter(Boolean))].sort(),
    [current?.cards]
  );
  const filteredCards = useMemo(() => (current?.cards ?? [])
    .filter((card) => card.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
    .filter((card) => categoryFilter === 'All' || card.category === categoryFilter)
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
    }), [categoryFilter, current?.cards, search, sortOption]);
  const valueSummary = useMemo(() => {
    const cards = current?.cards ?? [];
    const cardmarketTotal = cards.reduce((total, card) => total + (getCardmarketPrice(card) ?? 0), 0);
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
    return { cardmarketTotal, periodChanges, mostValuableCard };
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
          <section aria-label="Collection value" className="relative isolate mb-7 overflow-hidden rounded-3xl bg-white p-5 sm:p-7">
            <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(17rem,0.8fr)] sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-100">Collection value</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-100">Estimated total</h2>
              <h1 className="mt-1 text-4xl font-bold text-neutral-100">{new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(valueSummary.cardmarketTotal)}</h1>
              <div className="mt-4 border-t border-neutral-200 pt-3">
                  <div>
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
                        {period.hasPrices ? (
                          <>
                            {period.percentChange !== null && (
                            <>
                              <p className={`mt-1 text-3xl font-extrabold ${period.change > 0 ? 'text-emerald-800' : period.change < 0 ? 'text-rose-800' : 'text-neutral-500'}`}>
                                {period.change > 0 ? '+' : period.change < 0 ? '-' : ''}{Math.abs(period.percentChange).toFixed(1)}%
                              </p>
                              <p className={`text-md text-neutral-400`}>
                                {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', signDisplay: 'never' }).format(Math.abs(period.change))}
                              </p>
                            </>
                            )}
                          </>
                        ) : <p className="mt-0.5 text-sm text-neutral-500">Unavailable</p>}
                      </div>
                    </div>
                  ))}
                  </div>
                  </div>
              </div>
              <p className="mt-3 text-xs text-neutral-400">Cards without reported prices are excluded. Values are estimates.</p>
            </div>
            <div className="flex min-w-0 items-center justify-between gap-6">
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
            </div>
            </div>
          </section>
          <div className="mb-4">
            <h2 className="text-xl font-bold">Cards in your collection</h2>
            <p className="mt-1 text-sm text-neutral-400">{filteredCards.length} of {current.cards.length} cards</p>
          </div>
          <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_auto_auto_auto]">
            <label className="relative">
              <span className="sr-only">Search cards by name</span>
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search cards..." className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-3 pl-10 pr-4 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-500 focus:border-amber-400" />
            </label>
            <label className="relative block">
              <span className="sr-only">Filter cards by category</span>
              <select aria-label="Filter cards by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="w-full appearance-none rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-3 pr-9 text-sm text-neutral-100 outline-none focus:border-amber-400">
                <option value="All">All categories</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <ListFilter size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            </label>
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
              <select aria-label="Cards per row" value={gridColumns} onChange={(event) => setGridColumns(Number(event.target.value) as typeof gridColumns)} className="w-full appearance-none rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-3 pr-9 text-sm text-neutral-100 outline-none focus:border-amber-400">
                {[3, 4, 5, 6].map((columns) => <option key={columns} value={columns}>{columns} per row</option>)}
              </select>
            </label>
          </div>
          <CardGrid cards={filteredCards} binderIds={binderIds} setBinderIds={setBinderIds} columns={gridColumns} showPrices priceSource="cardmarket" />
        </>
      ) : null}
    </section>
  );
}
