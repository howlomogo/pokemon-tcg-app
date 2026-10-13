import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Circle,
  Diamond,
  FileText,
  Heart,
  Layers3,
  Sparkles,
  Star,
  Swords,
  TrendingUp,
} from 'lucide-react';
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
import { getTypeColorClass } from '../utils/typeColors';
import { getCard, type CardWithDetails } from '../services/tcgdex';

type CardDetailsProps = {
  binderIds: string[];
  setBinderIds: React.Dispatch<React.SetStateAction<string[]>>;
};

function RarityIcon({ rarity }: { rarity: string }) {
  const normalizedRarity = rarity.toLocaleLowerCase();
  const iconProps = { size: 12, 'aria-hidden': true as const };

  if (normalizedRarity.includes('uncommon')) return <Diamond {...iconProps} />;
  if (normalizedRarity === 'common') return <Circle {...iconProps} />;
  if (normalizedRarity.includes('rare')) return <Star {...iconProps} />;
  return <Sparkles {...iconProps} />;
}

export default function CardDetails({ binderIds, setBinderIds }: CardDetailsProps) {
  const { cardId = '' } = useParams();
  const [result, setResult] = useState<{ id: string; card?: CardWithDetails; error?: string } | null>(null);
  const [activeInfoTab, setActiveInfoTab] = useState<'card' | 'gameplay' | 'market' | 'print'>('card');

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
        <div className="mx-auto h-fit w-full max-w-sm rounded-3xl border border-neutral-800 bg-neutral-900 p-5 lg:sticky lg:top-6 lg:mx-0 lg:max-w-none">
          <div className="flex h-[min(65svh,32rem)] items-center justify-center overflow-hidden rounded-2xl bg-neutral-950 lg:aspect-[3/4] lg:h-auto">
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
          <div className="relative">
            <p className="pr-36 text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
              {card.set.name} · {card.localId}
            </p>
            <button
              type="button"
              onClick={toggleBinderCard}
              aria-label={isSaved ? `Remove ${card.name} from collection` : `Add ${card.name} to collection`}
              aria-pressed={isSaved}
              className={`absolute right-0 top-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                isSaved
                  ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-rose-500/10 hover:text-rose-300'
              }`}
            >
              <Heart size={14} fill={isSaved ? 'currentColor' : 'none'} />
              {isSaved ? 'In collection' : 'Add to collection'}
            </button>
          </div>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{card.name}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <InfoPill>{card.category}</InfoPill>
            {card.rarity && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs font-medium text-neutral-300">
                <RarityIcon rarity={card.rarity} />
                {card.rarity}
              </span>
            )}
            {card.stage && <InfoPill>{card.stage}</InfoPill>}
            {card.suffix && <InfoPill>{card.suffix}</InfoPill>}
          </div>

          {card.description && (
            <p className="mt-7 max-w-3xl leading-relaxed text-neutral-300">{card.description}</p>
          )}

          <section className="mt-8">
            <div
              role="tablist"
              aria-label="Card details"
              className="flex gap-1 border-b border-neutral-800"
            >
              <button
                type="button"
                role="tab"
                id="card-information-tab"
                aria-selected={activeInfoTab === 'card'}
                aria-controls="card-information-panel"
                onClick={() => setActiveInfoTab('card')}
                className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  activeInfoTab === 'card'
                    ? 'border-amber-400 text-white'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <FileText size={16} aria-hidden="true" />
                Card information
              </button>
              <button
                type="button"
                role="tab"
                id="gameplay-stats-tab"
                aria-selected={activeInfoTab === 'gameplay'}
                aria-controls="gameplay-stats-panel"
                onClick={() => setActiveInfoTab('gameplay')}
                className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  activeInfoTab === 'gameplay'
                    ? 'border-amber-400 text-white'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Swords size={16} aria-hidden="true" />
                Gameplay stats
              </button>
              <button
                type="button"
                role="tab"
                id="market-information-tab"
                aria-selected={activeInfoTab === 'market'}
                aria-controls="market-information-panel"
                onClick={() => setActiveInfoTab('market')}
                className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  activeInfoTab === 'market'
                    ? 'border-amber-400 text-white'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <TrendingUp size={16} aria-hidden="true" />
                Market Information
              </button>
              <button
                type="button"
                role="tab"
                id="print-versions-tab"
                aria-selected={activeInfoTab === 'print'}
                aria-controls="print-versions-panel"
                onClick={() => setActiveInfoTab('print')}
                className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  activeInfoTab === 'print'
                    ? 'border-amber-400 text-white'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Layers3 size={16} aria-hidden="true" />
                Print versions
              </button>
            </div>

            {activeInfoTab === 'card' ? (
              <div
                role="tabpanel"
                id="card-information-panel"
                aria-labelledby="card-information-tab"
                className="pt-4"
              >
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
                  {card.dexId?.length ? <DetailFact label="Pokédex number" value={card.dexId.join(', ')} /> : null}
                  {card.weight && <DetailFact label="Weight" value={card.weight} />}
                  {card.illustrator && <DetailFact label="Illustrator" value={card.illustrator} />}
                  {card.trainerType && <DetailFact label="Trainer type" value={card.trainerType} />}
                  {card.energyType && <DetailFact label="Energy type" value={card.energyType} />}
                  {card.regulationMark && <DetailFact label="Regulation mark" value={card.regulationMark} />}
                  {card.updated && <DetailFact label="Card data updated" value={formatTimestamp(card.updated)} />}
                </div>
              </div>
            ) : activeInfoTab === 'gameplay' ? (
              <div
                role="tabpanel"
                id="gameplay-stats-panel"
                aria-labelledby="gameplay-stats-tab"
                className="space-y-8 pt-4"
              >
                {(card.hp !== undefined || card.types?.length || card.retreat !== undefined) && (
                  <section>
                    <h2 className="mb-3 text-lg font-bold">Stats</h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {card.hp !== undefined && <DetailFact label="HP" value={String(card.hp)} />}
                      {card.types?.length ? <DetailFact label="Type" value={card.types.join(' / ')} /> : null}
                      {card.retreat !== undefined && (
                        <DetailFact label="Retreat cost" value={String(card.retreat)} />
                      )}
                    </div>
                  </section>
                )}

                {card.item && (
                  <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">Held item</p>
                    <h2 className="mt-1 text-lg font-bold">{card.item.name}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-400">{card.item.effect}</p>
                  </section>
                )}

                {!!card.attacks?.length && (
                  <section className="space-y-3">
                    <h2 className="text-lg font-bold">Attacks</h2>
                    {card.attacks.map((attack) => (
                      <div
                        key={attack.name}
                        className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-bold">{attack.name}</h3>
                          {attack.damage !== undefined && attack.damage !== '' && (
                            <span className="font-bold text-amber-300">{attack.damage}</span>
                          )}
                        </div>
                        {!!attack.cost?.length && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {attack.cost.map((energyType, index) => (
                              <InfoPill
                                key={`${energyType}-${index}`}
                                className={getTypeColorClass(energyType)}
                              >
                                {energyType}
                              </InfoPill>
                            ))}
                          </div>
                        )}
                        {attack.effect && (
                          <p className="mt-2 text-sm leading-relaxed text-neutral-400">{attack.effect}</p>
                        )}
                      </div>
                    ))}
                  </section>
                )}

                {(card.weaknesses?.length || card.resistances?.length) && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {card.weaknesses?.length ? (
                      <MatchupDetails title="Weaknesses" matchups={card.weaknesses} />
                    ) : null}
                    {card.resistances?.length ? (
                      <MatchupDetails title="Resistances" matchups={card.resistances} />
                    ) : null}
                  </div>
                )}

                {!!card.abilities?.length && (
                  <section className="space-y-3">
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

                {card.effect && (
                  <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
                    <h2 className="font-bold">Effect</h2>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-400">{card.effect}</p>
                  </section>
                )}

                {card.legal && (
                  <section>
                    <h2 className="mb-3 text-lg font-bold">Tournament legality</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <DetailFact label="Standard format" value={card.legal.standard ? 'Legal' : 'Not legal'} />
                      <DetailFact label="Expanded format" value={card.legal.expanded ? 'Legal' : 'Not legal'} />
                    </div>
                  </section>
                )}
              </div>
            ) : activeInfoTab === 'market' ? (
              <div
                role="tabpanel"
                id="market-information-panel"
                aria-labelledby="market-information-tab"
                className="pt-4"
              >
                {card.pricing ? (
                  <PricingDetails pricing={card.pricing} title="Market prices" />
                ) : (
                  <p className="text-sm text-neutral-400">Market information is not available for this card.</p>
                )}
              </div>
            ) : (
              <div
                role="tabpanel"
                id="print-versions-panel"
                aria-labelledby="print-versions-tab"
                className="space-y-8 pt-4"
              >
                {card.variants && (
                  <section>
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
                  <section className="space-y-3">
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
              </div>
            )}
          </section>

        </div>
      </div>
    </section>
  );
}
