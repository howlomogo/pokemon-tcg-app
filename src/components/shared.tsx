import { useState } from 'react';
import { Layers3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CardPricing } from '../services/tcgdex';
import { formatFieldLabel, formatTimestamp } from '../utils/format';
import { getTypeColorClass } from '../utils/typeColors';

const setBackgrounds = import.meta.glob<string>('../assets/sets/*', {
  eager: true,
  query: '?url',
  import: 'default',
});

const normalizeSetId = (value: string) => value.toLocaleLowerCase().replace(/[^a-z0-9]/g, '');

const getSetBackgroundUrl = (setId: string) => {
  const normalizedSetId = normalizeSetId(setId);
  const matchingAsset = Object.entries(setBackgrounds).find(([path]) => {
    const filename = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? '';
    return normalizeSetId(filename) === normalizedSetId;
  });

  return matchingAsset?.[1];
};

export function SetBackground({
  setId,
  variant = 'card',
}: {
  setId: string;
  variant?: 'card' | 'title';
}) {
  const imageUrl = getSetBackgroundUrl(setId);
  if (!imageUrl) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-cover bg-center transition-opacity duration-300 ${
          variant === 'title' ? 'opacity-45' : 'opacity-40 group-hover/set:opacity-55'
        }`}
        style={{ backgroundImage: `url("${imageUrl}")` }}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${
          variant === 'title'
            ? 'from-slate-950/80 via-slate-950/50 to-slate-900/30'
            : 'from-slate-950/85 via-slate-950/55 to-slate-900/35'
        }`}
      />
      {variant === 'title' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-55"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.16) 2.5px, transparent 3px)',
            backgroundSize: '15px 15px',
          }}
        />
      )}
    </>
  );
}

export function MatchupDetails({
  title,
  matchups,
}: {
  title: string;
  matchups: Array<{ type: string; value?: string }>;
}) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="font-bold">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {matchups.map((matchup) => (
          <InfoPill key={`${matchup.type}-${matchup.value ?? ''}`} className={getTypeColorClass(matchup.type)}>
            {`${matchup.type}${matchup.value ? ` ${matchup.value}` : ''}`}
          </InfoPill>
        ))}
      </div>
    </section>
  );
}

export function PricingDetails({ pricing, title = 'Market information' }: { pricing: CardPricing; title?: string }) {
  const sources = Object.entries(pricing).flatMap(([key, value]) =>
    isCardPricing(value) ? [[key, value] as const] : []
  );

  if (!sources.length) return null;

  return (
    <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">Prices and product data provided by TCGdex.</p>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {sources.map(([source, value]) => (
          <div key={source} className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
            <h3 className="mb-3 font-semibold capitalize text-amber-300">{source}</h3>
            <PricingFields
              values={preparePricing(source, value)}
              currency={getPricingCurrency(source)}
              source={source}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function PricingFields({
  values,
  currency,
  source,
  variant,
}: {
  values: CardPricing;
  currency?: 'EUR' | 'USD';
  source: string;
  variant?: string;
}) {
  const entries = Object.entries(values).filter(
    ([key, value]) => value !== null && key.toLowerCase() !== 'unit'
  );

  return (
    <div className="grid grid-cols-2 gap-2">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className={`min-w-0 rounded-lg border border-neutral-800/80 bg-neutral-900/70 p-2.5 ${
            isCardPricing(value) ? 'col-span-2' : ''
          }`}
        >
          {isCardPricing(value) ? (
            <>
              <h4 className="mb-2 text-xs font-semibold text-neutral-300">
                {formatPricingLabel(key, source)}
              </h4>
              <PricingFields
                values={value}
                currency={currency}
                source={source}
                variant={key}
              />
            </>
          ) : value !== null ? (
            <>
              <p className="text-[11px] text-neutral-500">
                {formatPricingLabel(key, source, variant)}
              </p>
              <p className="mt-1 break-words text-sm font-semibold text-neutral-200">
                {typeof value === 'boolean'
                  ? value ? 'Yes' : 'No'
                  : key.toLowerCase() === 'updated' && typeof value === 'string'
                    ? formatTimestamp(value)
                  : typeof value === 'number' && currency && !isProductIdField(key)
                    ? formatPrice(value, currency)
                    : String(value)}
              </p>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function preparePricing(source: string, pricing: CardPricing): CardPricing {
  switch (source.toLowerCase()) {
    case 'cardmarket':
      return groupCardmarketPricing(pricing);
    case 'tcgplayer':
      return moveTcgplayerProductIds(pricing);
    default:
      return pricing;
  }
}

function groupCardmarketPricing(pricing: CardPricing): CardPricing {
  const shared: CardPricing = {};
  const normal: CardPricing = {};
  const reverseHolo: CardPricing = {};

  for (const [key, value] of Object.entries(pricing)) {
    if (/-holo$/i.test(key)) {
      reverseHolo[key] = value;
    } else if (/^(avg|low|trend)(1|7|30)?$/i.test(key)) {
      normal[key] = value;
    } else {
      shared[key] = value;
    }
  }

  return {
    ...shared,
    ...(Object.keys(normal).length ? { normal } : {}),
    ...(Object.keys(reverseHolo).length ? { holo: reverseHolo } : {}),
  };
}

function moveTcgplayerProductIds(pricing: CardPricing): CardPricing {
  const productIds = new Set<string>();
  const metadata: CardPricing = {};
  const priceGroups: CardPricing = {};

  for (const [key, value] of Object.entries(pricing)) {
    if (!isCardPricing(value)) {
      metadata[key] = value;
      if (key.toLowerCase() === 'updated' && productIds.size > 0) {
        metadata.productId = [...productIds].join(', ');
      }
      continue;
    }

    const { productId, ...prices } = value;
    if (typeof productId === 'number' || typeof productId === 'string') {
      productIds.add(String(productId));
    }
    priceGroups[key] = prices;
  }

  if (productIds.size > 0 && !('productId' in metadata)) {
    metadata.productId = [...productIds].join(', ');
  }

  return { ...metadata, ...priceGroups };
}

function formatPricingLabel(key: string, source: string, variant?: string) {
  if (source.toLowerCase() === 'cardmarket') {
    if (key.toLowerCase() === 'idproduct') {
      return 'Product Id';
    }

    const isHoloVariant = variant === 'holo';
    const labelKey = isHoloVariant ? key.replace(/-holo$/i, '') : key;
    const averageMatch = /^avg(1|7|30)$/i.exec(labelKey);
    if (averageMatch) {
      return `${averageMatch[1]} Day Average${isHoloVariant ? ' (Holo)' : ''}`;
    }

    if (/^(avg|low|trend)-holo$/i.test(key) && variant === 'holo') {
      return `${formatFieldLabel(key.replace(/-holo$/i, ''))} (Holo)`;
    }
  }

  return formatFieldLabel(key);
}

function getPricingCurrency(source: string): 'EUR' | 'USD' | undefined {
  switch (source.toLowerCase()) {
    case 'cardmarket':
      return 'EUR';
    case 'tcgplayer':
      return 'USD';
    default:
      return undefined;
  }
}

function isProductIdField(key: string) {
  const normalizedKey = key.replace(/[^a-z\d]/gi, '').toLowerCase();
  return normalizedKey === 'idproduct' || normalizedKey === 'productid';
}

function formatPrice(value: number, currency: 'EUR' | 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).format(value);
}

function isCardPricing(value: unknown): value is CardPricing {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function InfoPill({ children, className = '' }: { children: string; className?: string }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium text-neutral-300 ${className || 'border-neutral-700 bg-neutral-900'}`}>
      {children}
    </span>
  );
}

export function DetailFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-200">{value}</p>
    </div>
  );
}

export function SetArtwork({
  set,
  className,
  imageClassName,
}: {
  set: { id: string; name: string; logo?: string; symbol?: string };
  className: string;
  imageClassName: string;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const imageUrls = [set.logo, set.symbol]
    .filter((url): url is string => Boolean(url))
    .flatMap((url) => {
      const baseUrl = url.replace(/\.(?:png|webp|jpg)$/i, '');
      return ['webp', 'png', 'jpg'].map((extension) => `${baseUrl}.${extension}`);
    });
  const imageUrl = imageUrls[imageIndex];

  return (
    <div className={className}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`${set.name} set artwork`}
          loading="lazy"
          onError={() => setImageIndex((index) => index + 1)}
          className={`object-contain ${imageClassName}`}
        />
      ) : (
        <Layers3 size={40} className="text-neutral-600" aria-hidden="true" />
      )}
    </div>
  );
}

export function LoadingMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-neutral-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-amber-400" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-900/70 bg-red-950/30 px-5 py-4 text-sm text-red-300">
      {message}
    </div>
  );
}

export function NotFound() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-3xl font-black">Page not found</h1>
      <p className="mt-2 text-neutral-400">The page you’re looking for doesn’t exist.</p>
      <Link to="/series" className="mt-6 inline-flex text-sm font-semibold text-amber-400 hover:text-amber-300">
        Browse all series
      </Link>
    </section>
  );
}
