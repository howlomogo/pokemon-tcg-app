import { useState, useEffect } from 'react';
import type { SetList, SerieList, Set } from '@tcgdex/sdk';
import type { CardBrief } from './types/pokemon';
import CardGrid from './components/CardGrid';
import StorageActions from './components/StorageActions';
import { getAll, getSerie, getFilteredCards } from './services/tcgdex';
import { Filters, type FilterState } from './components/Filters';

export default function App() {
  const [binderIds, setBinderIds] = useState<string[]>([]);
  const [allCards, setAllCards] = useState<CardBrief[]>([]);
  
  const [view, setView] = useState<'search' | 'binder'>('search');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [allSets, setAllSets] = useState<SetList | null>(null);
  const [allSeries, setAllSeries] = useState<SerieList | null>(null);


  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [setData, setSetData] = useState<Set | null>(null);

  // Filters
  const [cardName, setCardName] = useState<string>('');
  const [cardCategory, setCardCategory] = useState<string>('');
  const [cardRarity, setCardRarity] = useState<string>('');


  const [filterState, setFilterState] = useState<FilterState>({
    search: '',
    category: 'All',
    rarity: 'Common',
  });

  // 
  useEffect(() => {
    const fetchFilteredPokemon = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await getFilteredCards(
          filterState.search,
          filterState.category,
          filterState.rarity
        );

      if(data?.length) {
          setAllCards(data);
      }


      console.log('---fetchFilteredPokemon')
      console.log(data)
        
        // Handle your API state updates here...
        console.log('Filtered Cards:', data);
      } catch (err: unknown) {
        handleServiceError(err);
      } finally {
        setLoading(false)
      }
    };

    // Optional: You could wrap this function in a debounce hook 
    // so rapid keystrokes on the search text-field don't flood your server.
    fetchFilteredPokemon();
  }, [filterState]);

  // Test fetching all cards from a series
  // const handleGetFilteredCards = async () => {
  //   setLoading(true);
  //   setError(null);

  //   try {
  //     const data = await getFilteredCards('Charmander', 'Pokemon', 'Common');

  //     if(data?.length) {
  //         setAllCards(data);
  //     }

  //     console.log('---handleFetchFromSeries')
  //     console.log(data)

  //   } catch (err: unknown) {
  //     handleServiceError(err);
  //   } finally {
  //     setLoading(false);
  //   }
  // }





  const handleServiceError = (err: unknown) => {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("An unexpected interface error occurred.");
    }
  }

  // Initial Data Fetching: Load All Cards on App Mount
  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError(null);

    // declare the data fetching function
    const fetchData = async () => {
      try {
        const data = await getAll(1, 20);
        if (!isMounted) return; 
        if (!data || (Array.isArray(data) && data.length === 0)) {
          setError("No Pokémon cards found in the database.");
        } else {
          setAllCards(data);
          console.log(data)
        }
      } catch (err: unknown) {
        handleServiceError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Test fetching all cards from a series
  const handleFetchFromSeries = async (seriesId: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getSerie(seriesId);

      console.log('---handleFetchFromSeries')
      console.log(data?.sets)

    } catch (err: unknown) {
      handleServiceError(err);
    } finally {
      setLoading(false);
    }
  }

  // Test fetching all cards from a series
  const handleGetFilteredCards = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getFilteredCards('Charmander', 'Pokemon', 'Common');

      if(data?.length) {
          setAllCards(data);
      }

      console.log('---handleFetchFromSeries')
      console.log(data)

    } catch (err: unknown) {
      handleServiceError(err);
    } finally {
      setLoading(false);
    }
  }

  const binderCards = allCards.filter(card => binderIds.includes(card.id));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 pb-6 border-b border-neutral-800">
        <div>
          {error && (
            
           <h1>ERROR</h1>
        )}
          <h1></h1>
          <h1 className="text-3xl font-extrabold tracking-tight text-amber-400">
            ⚡ PokéBinder <span className="text-white font-medium text-2xl">Studio</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Manage your collection using TS + Client Storage.</p>
        </div>
        <StorageActions binderIds={binderIds} setBinderIds={setBinderIds} />
      </header>

      <nav className="flex gap-2 my-6 bg-neutral-900 p-1.5 rounded-lg max-w-sm">
        <button 
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${view === 'search' ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`} 
          onClick={() => setView('search')}
        >
          Explore Registry
        </button>
        <button 
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${view === 'binder' ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`} 
          onClick={() => setView('binder')}
        >
          My Binder ({binderIds.length})
        </button>
      </nav>

      <Filters 
        filters={filterState} 
        onFilterChange={setFilterState} 
      />

              <button onClick={async () => {
                await handleGetFilteredCards();
              }}>Show cards from series</button>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
          <p className="text-neutral-400 text-sm font-medium animate-pulse">Syncing complete Pokémon database...</p>
        </div>
      ) : (
        <>
          {view === 'search' ? (
            <>
              <CardGrid 
                cards={allCards} 
                binderIds={binderIds} 
                setBinderIds={setBinderIds} 
              />
            </>
          ) : (
            <CardGrid 
              cards={binderCards} 
              binderIds={binderIds} 
              setBinderIds={setBinderIds} 
            />
          )}
        </>
      )}
    </div>
  );
}
