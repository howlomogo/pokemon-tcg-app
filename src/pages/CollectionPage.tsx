import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CardGrid from '../components/CardGrid';
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

export default function CollectionPage({ binderIds, setBinderIds }: CollectionPageProps) {
  const [result, setResult] = useState<CollectionResult | null>(null);
  const current = result?.ids.join('|') === binderIds.join('|') ? result : null;

  useEffect(() => {
    if (binderIds.length === 0) return;

    let isMounted = true;
    const ids = [...binderIds];

    const loadCards = async () => {
      try {
        const cards = await Promise.all(ids.map((id) => getCard(id)));
        if (!isMounted) return;

        const missingCard = cards.find((card) => !card);
        if (missingCard === null) {
          setResult({
            ids,
            error: 'One or more saved cards could not be found. Remove the unavailable cards and try again.',
          });
          return;
        }

        setResult({ ids, cards: cards.filter((card): card is CardWithDetails => card !== null) });
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
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
          Your saved cards
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Collection</h1>
        <p className="mt-2 text-sm text-neutral-400">
          {binderIds.length} {binderIds.length === 1 ? 'card' : 'cards'} in your collection
        </p>
      </div>

      {binderIds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 px-6 py-16 text-center">
          <p className="font-semibold text-neutral-300">Your collection is empty.</p>
          <p className="mt-1 text-sm text-neutral-500">
            Add cards from a set or card details page to see them here.
          </p>
          <Link
            to="/series"
            className="mt-5 inline-flex rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-neutral-950 transition hover:bg-amber-300"
          >
            Browse series
          </Link>
        </div>
      ) : !current ? (
        <LoadingMessage message="Loading your collection..." />
      ) : current.error ? (
        <ErrorMessage message={current.error} />
      ) : current.cards ? (
        <CardGrid cards={current.cards} binderIds={binderIds} setBinderIds={setBinderIds} />
      ) : null}
    </section>
  );
}
