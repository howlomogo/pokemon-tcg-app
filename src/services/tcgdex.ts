import TCGdex, { Query } from '@tcgdex/sdk';

const tcgdex = new TCGdex('en');

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

// Fetch a Single Card
export const getCard = async (card_id: string) => {
  try {
    return await tcgdex.card.get(card_id);
  } catch (error) {
    handleServiceError(error, "Failed to load card data.");
  }
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

  return await tcgdex.card.list(cardQuery);
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

  // Returns: Object array containing set details i.e
  // {
  //     "id": "base1",
  //     "name": "Base Set",
  //     "logo": "https://assets.tcgdex.net/en/base/base1/logo",
  //     "cardCount": {
  //         "total": 102,
  //         "official": 102
  //     }
  // }
  const sets = await tcgdex.fetch('sets');

  // Returns: ['Common', 'Uncommon', 'Rare', 'Ultra Rare', ...]
  const rarities = await tcgdex.fetch('rarities');

  // Returns: ['Basic', 'Stage 1', 'Stage 2', 'MEGA', ...]
  const stages = await tcgdex.fetch('stages');

  // Returns: [30, 40, 50, 60, ..., 340]
  const hpTiers = await tcgdex.fetch('hp');

  return { types, categories, rarities, hpTiers };

  } catch (error) {
    handleServiceError(error, "Failed to filter properties.");
  }
}