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
    // let cardQuery = Query.create()
    //   .sort('localId', 'ASC')
    //   .paginate(1, 20);

    // if (name) {
    //   cardQuery = cardQuery.contains('name', name.trim());
    // }

    // if (category && category !== 'all') {
    //   cardQuery = cardQuery.equal('category', category);
    // }

    // if (rarity && rarity.length > 0) {
    //   cardQuery = cardQuery.equal('rarity', rarity); 
    // }

    // return await tcgdex.card.list(cardQuery);

    console.log('---rarity')
    console.log(rarity)


    return await tcgdex.card.list(
      Query.create()
        .contains('name', name)
        .equal('category', category)
        .equal('rarity', rarity)
        .sort('localId', 'ASC')
        .paginate(1,20)
    );
  } catch (error) {
    handleServiceError(error, "Failed to load card data.");
  }
};



// Fetch all PickachuCards
export const getPikachuCards = async () => {
  try {
    return await tcgdex.card.list(
      Query.create()
        .equal('name', 'Pikachu')
        .greaterOrEqualThan('hp', 60)
        .lesserThan('hp', 70)
        .sort('localId', 'ASC')
        .paginate(1,50)
    );

  } catch (error) {
    handleServiceError(error, "Failed to load card data.");
  }
};
