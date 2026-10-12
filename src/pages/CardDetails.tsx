import { useEffect, useState } from 'react';
import { ArrowLeft, Layers3, Plus, Trash2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import {
  DetailFact,
  ErrorMessage,
  InfoPill,
  LoadingMessage,
  MatchupDetails,
  PricingDetails,
} from '../components/shared';
import { formatFieldLabel, formatTimestamp } from '../utils/format';
import { getCard, type CardWithDetails } from '../services/tcgdex';

type CardDetailsProps = {
  binderIds: string[];
  setBinderIds: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function CardDetails({ binderIds, setBinderIds }: CardDetailsProps) {
  const { cardId = '' } = useParams();
  const [result, setResult] = useState<{ id: string; card?: CardWithDetails; error?: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCard = async () => {
      try {
        const data = await getCard(cardId);
        if (!isMounted) return;

        if (!data) {
          setResult({ id: cardId, error: 'This card could not be found.' });
          return;
        }

        setResult({ id: cardId, card: data });
      } catch (error) {
        if (isMounted) {
          setResult({
            id: cardId,
            error: error instanceof Error ? error.message : 'Unable to load this card.',
          });
        }
      }
    };

    void loadCard();

    return () => {
      isMounted = false;
    };
  }, [cardId]);

  const current = result?.id === cardId ? result : null;

  if (!current) return <LoadingMessage message="Loading card details..." />;
  if (current.error) return <ErrorMessage message={current.error} />;
  if (!current.card) return null;

  const card = current.card;
  const isSaved = binderIds.includes(card.id);
  const toggleBinderCard = () => {
    setBinderIds((ids) =>
      ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id]
    );
  };

  return (
    <section>
      <Link
        to="/series"
        className="mb-7 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-neutral-400 transition hover:text-white"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        All series
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(280px,420px)_1fr] lg:gap-12">
        <div className="h-fit rounded-3xl border border-neutral-800 bg-neutral-900 p-5 lg:sticky lg:top-6">
          <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl bg-neutral-950">
            {card.image ? (
              <img
                src={`${card.image}/high.webp`}
                alt={card.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <Layers3 size={48} className="text-neutral-600" aria-hidden="true" />
            )}
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
            {card.set.name} · {card.localId}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{card.name}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <InfoPill>{card.category}</InfoPill>
            {card.rarity && <InfoPill>{card.rarity}</InfoPill>}
            {card.stage && <InfoPill>{card.stage}</InfoPill>}
            {card.suffix && <InfoPill>{card.suffix}</InfoPill>}
          </div>

          <button
            type="button"
            onClick={toggleBinderCard}
            className={`mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              isSaved
                ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSaved ? <Trash2 size={16} /> : <Plus size={16} />}
            {isSaved ? 'Remove from Binder' : 'Add to Binder'}
          </button>

          {card.description && (
            <p className="mt-7 max-w-3xl leading-relaxed text-neutral-300">{card.description}</p>
          )}

          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold">Card information</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <DetailFact label="Card ID" value={card.id} />
              <DetailFact label="Set" value={card.set.name} />
              <DetailFact label="Set ID" value={card.set.id} />
              <DetailFact label="Set cards" value={String(card.set.cardCount.total)} />
              <DetailFact label="Official set cards" value={String(card.set.cardCount.official)} />
              <DetailFact label="Category" value={card.category} />
              {card.rarity && <DetailFact label="Rarity" value={card.rarity} />}
              {card.stage && <DetailFact label="Stage" value={card.stage} />}
              {card.suffix && <DetailFact label="Suffix" value={card.suffix} />}
              {card.level !== undefined && <DetailFact label="Level" value={String(card.level)} />}
              {card.evolveFrom && <DetailFact label="Evolves from" value={card.evolveFrom} />}
              {card.hp !== undefined && <DetailFact label="HP" value={String(card.hp)} />}
              {card.types?.length ? <DetailFact label="Type" value={card.types.join(' / ')} /> : null}
              {card.dexId?.length ? <DetailFact label="Pokédex number" value={card.dexId.join(', ')} /> : null}
              {card.weight && <DetailFact label="Weight" value={card.weight} />}
              {card.illustrator && <DetailFact label="Illustrator" value={card.illustrator} />}
              {card.trainerType && <DetailFact label="Trainer type" value={card.trainerType} />}
              {card.energyType && <DetailFact label="Energy type" value={card.energyType} />}
              {card.retreat !== undefined && <DetailFact label="Retreat cost" value={String(card.retreat)} />}
              {card.regulationMark && <DetailFact label="Regulation mark" value={card.regulationMark} />}
              {card.updated && <DetailFact label="Card data updated" value={formatTimestamp(card.updated)} />}
            </div>
          </section>

          {card.item && (
            <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">Held item</p>
              <h2 className="mt-1 text-lg font-bold">{card.item.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">{card.item.effect}</p>
            </section>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {card.weaknesses?.length ? (
              <MatchupDetails title="Weaknesses" matchups={card.weaknesses} />
            ) : null}
            {card.resistances?.length ? (
              <MatchupDetails title="Resistances" matchups={card.resistances} />
            ) : null}
          </div>

          {!!card.abilities?.length && (
            <section className="mt-8 space-y-3">
              <h2 className="text-lg font-bold">Abilities</h2>
              {card.abilities.map((ability) => (
                <div key={`${ability.type}-${ability.name}`} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">{ability.type}</p>
                  <h3 className="mt-1 font-bold">{ability.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">{ability.effect}</p>
                </div>
              ))}
            </section>
          )}

          {!!card.attacks?.length && (
            <section className="mt-8 space-y-3">
              <h2 className="text-lg font-bold">Attacks</h2>
              {card.attacks.map((attack) => (
                <div key={attack.name} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold">{attack.name}</h3>
                    {attack.damage !== undefined && attack.damage !== '' && (
                      <span className="font-bold text-amber-300">{attack.damage}</span>
                    )}
                  </div>
                  {!!attack.cost?.length && (
                    <p className="mt-1 text-xs text-neutral-500">{attack.cost.join(' · ')}</p>
                  )}
                  {attack.effect && (
                    <p className="mt-2 text-sm leading-relaxed text-neutral-400">{attack.effect}</p>
                  )}
                </div>
              ))}
            </section>
          )}

          {card.effect && (
            <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
              <h2 className="font-bold">Effect</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">{card.effect}</p>
            </section>
          )}

          {card.variants && (
            <section className="mt-8">
              <h2 className="mb-3 text-lg font-bold">Available print variants</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Object.entries(card.variants).map(([variant, available]) => (
                  <DetailFact
                    key={variant}
                    label={formatFieldLabel(variant)}
                    value={available ? 'Available' : 'Not available'}
                  />
                ))}
              </div>
            </section>
          )}

          {!!card.variantsDetailed?.length && (
            <section className="mt-8 space-y-3">
              <h2 className="text-lg font-bold">Specific printings</h2>
              {card.variantsDetailed.map((variant) => (
                <div
                  key={variant.variantId}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <InfoPill>{formatFieldLabel(variant.type)}</InfoPill>
                    {variant.subtype && <InfoPill>{formatFieldLabel(variant.subtype)}</InfoPill>}
                    {variant.size && <InfoPill>{`${formatFieldLabel(variant.size)} size`}</InfoPill>}
                    {variant.foil && <InfoPill>{`${formatFieldLabel(variant.foil)} foil`}</InfoPill>}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <DetailFact label="Variant ID" value={variant.variantId} />
                    {variant.stamp?.length ? (
                      <DetailFact label="Stamps" value={variant.stamp.map(formatFieldLabel).join(', ')} />
                    ) : null}
                    {variant.thirdParty?.cardmarket && (
                      <DetailFact label="Cardmarket product ID" value={String(variant.thirdParty.cardmarket)} />
                    )}
                    {variant.thirdParty?.tcgplayer && (
                      <DetailFact label="TCGplayer product ID" value={String(variant.thirdParty.tcgplayer)} />
                    )}
                  </div>
                </div>
              ))}
            </section>
          )}

          {card.legal && (
            <section className="mt-8">
              <h2 className="mb-3 text-lg font-bold">Tournament legality</h2>
              <div className="grid grid-cols-2 gap-3">
                <DetailFact label="Standard format" value={card.legal.standard ? 'Legal' : 'Not legal'} />
                <DetailFact label="Expanded format" value={card.legal.expanded ? 'Legal' : 'Not legal'} />
              </div>
            </section>
          )}

          {card.pricing && <PricingDetails pricing={card.pricing} />}
        </div>
      </div>
    </section>
  );
}
