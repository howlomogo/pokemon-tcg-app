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

const hydrateCards = async (
  briefs: Awaited<ReturnType<typeof tcgdex.card.list>>
) => Promise.all(briefs.map((brief) => brief.getCard()));

// ==========================================
// EXPORTED API FUNCTIONS
// ==========================================

// Fetch All Cards
export const getAll = async (pageNumber: number, perPage: number) => {
  try {
    return await tcgdex.card.list(
      Query.create().paginate(pageNumber, perPage)
    );
  } catch (error) {
    handleServiceError(error, "Failed to load all card data.");
  }
};

// Fetch All Series
export const getAllSeries = async () => {
  try {
    return await tcgdex.fetch('series');
  } catch (error) {
    handleServiceError(error, "Failed to retrieve the series directory.");
  }
};

// Fetch All Sets
export const getAllSets = async () => {
  try {
    return await tcgdex.fetchSets();
  } catch (error) {
    handleServiceError(error, "Failed to load the sets directory.");
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



// ==========================================
// CUSTOM QUERY FUNCTIONS
// ==========================================

// Fetch from filters set
export const getFilteredCards = async (
  name: string,
  category: string,
  rarity: string
) => {
  try {
    console.log('--Filter triggered')
    let cardQuery = Query.create()
      .sort('localId', 'ASC')
      .paginate(1, 30);

    if (name) {
      cardQuery = cardQuery.contains('name', name.trim());
    }

    if (category && category !== 'All') {
      cardQuery = cardQuery.equal('category', category);
    }

    if (rarity && rarity.length > 0) {
      cardQuery = cardQuery.equal('rarity', rarity); 
    }

    return await tcgdex.card.list(cardQuery);

  } catch (error) {
    handleServiceError(error, "Failed to load card data.");
  }
};

export type CardSearchOptions = {
  name?: string;
  categories?: string;
  rarities?: string[];
  page?: number;
  limit?: number;
};

// 2. Create a clean utility wrapper
export const searchCards = async (options: CardSearchOptions) => {
  try {
    let cardQuery = Query.create()
      .sort('localId', 'ASC')
      .paginate(options.page || 1, options.limit || 30);

    if (options.name?.trim()) {
      cardQuery = cardQuery.contains('name', options.name.trim());
    }

    // If the category is All we don't want to add this filter to the query
    if (options.categories && options.categories !== "All") {
      cardQuery = cardQuery.equal('category', options.categories);
    }

    if (options.rarities && options.rarities.length > 0) {
      cardQuery = cardQuery.equal('rarity', options.rarities.join('|'));
    }

    const briefs = await tcgdex.card.list(cardQuery);
    return await hydrateCards(briefs);
  } catch (error) {
    handleServiceError(error, "Failed to search card data.");
  }
}

export const fetchTcgdexCards = async(page = 1, itemsPerPage = 20) => {
// 1. Get total count of ALL cards from the summary list length
  const allCardsList = await tcgdex.card.list();
  const totalCount = allCardsList.length;

  // 2. Fetch paginated card summaries for the requested page
  const paginatedBriefs = await tcgdex.card.list(
    Query.create().paginate(page, itemsPerPage)
  );

  // 3. Hydrate each brief card on this page to get full pricing details
  const detailedCards = await hydrateCards(paginatedBriefs);

  return {
    totalCount,
    totalPages: Math.ceil(totalCount / itemsPerPage),
    currentPage: page,
    cards: detailedCards // Each card object includes pricing data (e.g., card.pricing)
  };
}

// ==========================================
// FILTER PROPERTIES
// ==========================================

export const getFilterProperties = async () => {
  try {
  // Returns: ['Colorless', 'Darkness', 'Dragon', 'Fairy', 'Fighting', ...]
  const types = await tcgdex.fetch('types');
  
  // Returns: ['Energy', 'Trainer', 'Pokemon']
  const categories = await tcgdex.fetch('categories');

  // Returns: ['Common', 'Uncommon', 'Rare', 'Ultra Rare', ...]
  const rarities = await tcgdex.fetch('rarities');

  // Returns: [30, 40, 50, 60, ..., 340]
  const hpTiers = await tcgdex.fetch('hp');

  return { types, categories, rarities, hpTiers };

  } catch (error) {
    handleServiceError(error, "Failed to filter properties.");
  }
}