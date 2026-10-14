import MemoryCache from '@cachex/memory';
import TCGdex, { Query } from '@tcgdex/sdk';
import type { Card } from '@tcgdex/sdk';

const tcgdex = new TCGdex('en');
tcgdex.setCache(new MemoryCache());

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
    return await tcgdex.fetch('series');
  } catch (error) {
    handleServiceError(error, "Failed to retrieve the series directory.");
  }
};

// Fetch a Single Series
export const getSerie = async (serie_id: string) => {
  try {
    return await tcgdex.serie.get(serie_id);
  } catch (error) {
    handleServiceError(error, "Failed to load set data.");
  }
};

// Fetch a Single Set
export const getSet = async (set_id: string) => {
  try {
    return await tcgdex.set.get(set_id);
  } catch (error) {
    handleServiceError(error, "Failed to load set data.");
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
