import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CardBrief } from '../types/pokemon';

interface CardGridProps {
  cards: CardBrief[];
  binderIds: string[];
  setBinderIds: React.Dispatch<React.SetStateAction<string[]>>;
  columns?: 3 | 4 | 5 | 6;
}

const gridColumnClasses: Record<NonNullable<CardGridProps['columns']>, string> = {
  3: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6',
};

export default function CardGrid({ cards, binderIds, setBinderIds, columns }: CardGridProps) {
  const [collectionNotice, setCollectionNotice] = useState<{
    cardId: string;
    action: 'added' | 'removed';
  } | null>(null);
  const [noticeVisible, setNoticeVisible] = useState(false);

  useEffect(() => {
    if (!collectionNotice) return;

    const animationFrameId = window.requestAnimationFrame(() => setNoticeVisible(true));
    const hideTimeoutId = window.setTimeout(() => setNoticeVisible(false), 1300);
    const clearTimeoutId = window.setTimeout(() => setCollectionNotice(null), 1650);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(hideTimeoutId);
      window.clearTimeout(clearTimeoutId);
    };
  }, [collectionNotice]);

  const toggleBinderCard = (id: string) => {
    const isSaved = binderIds.includes(id);
    setBinderIds((ids) =>
      isSaved ? ids.filter((item) => item !== id) : [...ids, id]
    );
    setNoticeVisible(false);
    setCollectionNotice({ cardId: id, action: isSaved ? 'removed' : 'added' });
  };

  if (cards.length === 0) {
    return (
      <div className="w-full text-center py-16 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/30">
        <p className="text-neutral-500 font-medium">No cards were found in this set.</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-5 ${columns ? gridColumnClasses[columns] : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'}`}>
      {cards.map(card => {
        const isSaved = binderIds.includes(card.id);
        const cardNumber = /^\d+$/.test(card.localId)
          ? card.localId.padStart(3, '0')
          : card.localId;

        return (
          <div 
            key={card.id} 
            className={`group relative bg-neutral-900 border rounded-xl p-3 flex flex-col justify-between transition-all duration-300 ease-in-out hover:z-10 hover:scale-105 ${isSaved ? 'border-amber-400/50 ring-1 ring-amber-400/20 bg-neutral-900/80' : 'border-neutral-800 hover:border-neutral-700'}`}
          >
            <div className="relative">
              <Link
                to={`/cards/${encodeURIComponent(card.id)}`}
                aria-label={`View ${card.name} card details`}
                className="relative flex aspect-[3/4] items-center justify-center rounded-lg bg-neutral-950"
              >
                {card.image && (
                  <img
                    src={`${card.image}/low.webp`}
                    alt={card.name}
                    loading="lazy"
                    className={`h-full w-full rounded-lg object-contain transition-opacity duration-300 ${
                      isSaved ? '' : 'opacity-60 group-hover:opacity-100'
                    }`}
                  />
                )}
              </Link>
              <div className="absolute right-1.5 top-1.5 z-20 flex items-start gap-2">
                {collectionNotice?.cardId === card.id && (
                  <span
                    role="status"
                    className={`pointer-events-none whitespace-nowrap rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-100 shadow-lg transition-opacity duration-300 ${
                      noticeVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {collectionNotice.action === 'added' ? 'Added' : 'Removed'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggleBinderCard(card.id)}
                  aria-label={isSaved ? `Remove ${card.name} from collection` : `Add ${card.name} to collection`}
                  aria-pressed={isSaved}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-colors ${
                    isSaved
                      ? 'bg-rose-500 text-white hover:bg-rose-600'
                      : 'bg-neutral-950/75 text-neutral-200 hover:bg-rose-500 hover:text-white'
                  }`}
                >
                  <Heart size={14} fill={isSaved ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
            
            <div className="mt-3 space-y-2">
              <Link
                to={`/cards/${encodeURIComponent(card.id)}`}
                className="flex min-w-0 items-baseline gap-1.5 text-xs font-semibold text-neutral-200 hover:text-neutral-100"
                title={card.name}
              >
                <span className="truncate">{card.name}</span>
                <span className="ml-auto shrink-0 text-[10px] font-medium text-neutral-500">#{cardNumber}</span>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
