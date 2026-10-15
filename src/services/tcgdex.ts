import MemoryCache from '@cachex/memory';
import TCGdex, { Query } from '@tcgdex/sdk';
import type { Card, Set as TCGSet } from '@tcgdex/sdk';

const tcgdex = new TCGdex('en');
tcgdex.setCache(new MemoryCache());

// Exclude sets with minimal or no information
const excludedSeriesIds = new Set(['misc', 'tk', 'mc', 'tcgp']);
const excludedSetRoutes = new Set([
  'base:wp',
  'ecard:sp',
  'ecard:bog',
  'ex:ex5.5',
  'ex:exu',
  'bw:rc',
  'xy:xya',
  'sv:sve',
  'sv:mfb',
  'me:mee',
]);

const isExcludedSet = (seriesId: string, setId: string) =>
  excludedSetRoutes.has(`${seriesId}:${setId}`);

export interface CardPricing {
  [key: string]: string | number | boolean | null | CardPricing;
}

export interface CardVariantWithPricing {
  type: string;
  subtype?: string;
  size?: string;
  stamp?: string[];
  foil?: string;
  thirdParty?: {
    cardmarket?: number;
    tcgplayer?: number;
  };
  variantId: string;
  pricing?: CardPricing | null;
}

export type CardWithDetails = Card & {
  updated?: string;
  pricing?: CardPricing | null;
  variantsDetailed?: CardVariantWithPricing[];
};

const setRequests = new Map<string, Promise<TCGSet | null>>();

const fetchSetDetails = (setId: string) => {
  const existingRequest = setRequests.get(setId);
  if (existingRequest) return existingRequest;

  const request = tcgdex.set.get(setId);
  setRequests.set(setId, request);
  void request.then(
    () => {
      if (setRequests.get(setId) === request) setRequests.delete(setId);
    },
    () => {
      if (setRequests.get(setId) === request) setRequests.delete(setId);
    }
  );

  return request;
};

/**
 * Reusable Centralized Error Handler
 * Safely logs the error and normalises the message for the front end
 */
const handleServiceError = (error: unknown, fallbackMessage: string): never => {
  console.error("Critical Network/API Error Details:", error);
  
  const systemMessage = error instanceof Error ? error.message : fallbackMessage;
  throw new Error(`Unable to connect to the Pokémon TCG database: ${systemMessage}`);
};

// ==========================================
// EXPORTED API FUNCTIONS
// ==========================================

// Fetch All Series
export const getAllSeries = async () => {
  try {
    const series = await tcgdex.fetch('series');
    return series?.filter((serie) => !excludedSeriesIds.has(serie.id));
  } catch (error) {
    handleServiceError(error, "Failed to retrieve the series directory.");
  }
};

// Fetch a Single Series
export const getSerie = async (serie_id: string) => {
  try {
    if (excludedSeriesIds.has(serie_id)) return null;
    const series = await tcgdex.serie.get(serie_id);
    return series
      ? { ...series, sets: series.sets.filter((set) => !isExcludedSet(series.id, set.id)) }
      : series;
  } catch (error) {
    handleServiceError(error, "Failed to load set data.");
  }
};

// Fetch a Single Set
export const getSet = async (set_id: string, series_id: string) => {
  try {
    if (isExcludedSet(series_id, set_id)) return null;
    return await fetchSetDetails(set_id);
  } catch (error) {
    handleServiceError(error, "Failed to load set data.");
  }
};

export const getSetDirectoryData = async (set_id: string, series_id: string) => {
  try {
    if (isExcludedSet(series_id, set_id)) return null;
    const set = await fetchSetDetails(set_id);
    return set
      ? {
          releaseDate: set.releaseDate ?? null,
          cardIds: set.cards.map((card) => card.id),
        }
      : null;
  } catch (error) {
    handleServiceError(error, "Failed to load set details.");
  }
};

const setCategoryRequests = new Map<string, Promise<string[]>>();

export const getSetCardIdsByCategory = (setId: string, category: string) => {
  const requestKey = `${setId}:${category}`;
  const existingRequest = setCategoryRequests.get(requestKey);
  if (existingRequest) return existingRequest;

  const request = (async () => {
    try {
      const cards = await tcgdex.card.list(
        Query.create().equal('set', setId).equal('category', category)
      );
      return cards.map((card) => card.id);
    } catch (error) {
      return handleServiceError(error, "Failed to filter cards by set and category.");
    }
  })();

  setCategoryRequests.set(requestKey, request);
  void request.catch(() => {
    if (setCategoryRequests.get(requestKey) === request) {
      setCategoryRequests.delete(requestKey);
    }
  });

  return request;
};

// Fetch a Single Card
const cardRequests = new Map<string, Promise<CardWithDetails | null>>();

export const getCard = (card_id: string) => {
  const existingRequest = cardRequests.get(card_id);
  if (existingRequest) return existingRequest;

  const request = (async () => {
    try {
      const card = await tcgdex.card.get(card_id);
      return card as CardWithDetails | null;
    } catch (error) {
      return handleServiceError(error, "Failed to load card data.");
    }
  })();

  cardRequests.set(card_id, request);
  void request.then(
    () => {
      if (cardRequests.get(card_id) === request) cardRequests.delete(card_id);
    },
    () => {
      if (cardRequests.get(card_id) === request) cardRequests.delete(card_id);
    }
  );

  return request;
};
