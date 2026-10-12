import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CardBrief } from '../types/pokemon';

interface CardGridProps {
  cards: CardBrief[];
  binderIds: string[];
  setBinderIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function CardGrid({ cards, binderIds, setBinderIds }: CardGridProps) {
  const toggleBinderCard = (id: string) => {
    if (binderIds.includes(id)) {
      setBinderIds(binderIds.filter(item => item !== id));
    } else {
      setBinderIds([...binderIds, id]);
    }
  };

  if (cards.length === 0) {
    return (
      <div className="w-full text-center py-16 border border-dashed border-neutral-800 rounded-xl bg-neutral-900/30">
        <p className="text-neutral-500 font-medium">No cards were found in this set.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
      {cards.map(card => {
        const isSaved = binderIds.includes(card.id);
        return (
          <div 
            key={card.id} 
            className={`group bg-neutral-900 border rounded-xl p-3 flex flex-col justify-between transition-all duration-300 ${isSaved ? 'border-amber-400/50 ring-1 ring-amber-400/20 bg-neutral-900/80' : 'border-neutral-800 hover:border-neutral-700'}`}
          >
            <Link
              to={`/cards/${encodeURIComponent(card.id)}`}
              aria-label={`View ${card.name} card details`}
              className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-neutral-950"
            >
              {card.image && (
                <img
                  src={`${card.image}/low.webp`}
                  alt={card.name}
                  loading="lazy"
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              )}
            </Link>
            
            <div className="mt-3 space-y-2">
              <Link
                to={`/cards/${encodeURIComponent(card.id)}`}
                className="block truncate text-xs font-semibold text-neutral-200 hover:text-white"
                title={card.name}
              >
                {card.name}
              </Link>
              <button 
                onClick={() => toggleBinderCard(card.id)}
                className={`w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${isSaved ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {isSaved ? (
                  <>
                    <Trash2 size={12} /> Remove
                  </>
                ) : (
                  <>
                    <Plus size={12} /> Add to Binder
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
