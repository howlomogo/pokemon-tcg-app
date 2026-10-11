import React, { useEffect, useState, type ChangeEvent } from 'react';
import { getFilterProperties, searchCards } from '../services/tcgdex';

// Export types so your parent component can reuse them safely
// export type PokemonCategory = 'All' | 'Pokemon' | 'Energy' | 'Trainer';
// export type PokemonRarity = 'None' | 'Common' | 'Uncommon' | 'Rare' | 'Ultra Rare' | 'Secret Rare';

export interface FilterState {
  search: string;
  category: string;
  rarity: string[];
}

// Define the Props interface for state synchronization
interface PokemonFilterProps {
  filters: FilterState;
  onFilterChange: (updatedFilters: FilterState) => void;
}

interface CardSearchOptions {
  types: string[];
  categories: string[];
  rarities: string[];
  hpTiers: string[];
}

const defaultFilterProperties: CardSearchOptions = {
  types: [],
  categories: [],
  rarities: [],
  hpTiers: [],
};

export const Filters: React.FC<PokemonFilterProps> = ({ filters, onFilterChange }) => {
  const [filterProperties, setFilterProperties] = useState<CardSearchOptions>(defaultFilterProperties);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRarities, setSelectedRarities] = useState<string[]>(filters.rarity);

  const [isLoading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    setLoading(true);

    const fetchFilterProperties = async () => {
      try {
        const data = await getFilterProperties();

        setFilterProperties({
          types: data?.types ?? [],
          categories: data?.categories ?? [],
          rarities: data?.rarities ?? [],
          hpTiers: data?.hpTiers ?? [],
        });
      } catch (err: unknown) {
        // Handle the error
        setFilterProperties(defaultFilterProperties);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterProperties();
  }, []);

  useEffect(() => {
    // console.log('---filterProperties');
    // console.log(filterProperties);
  }, [filterProperties]);

  useEffect(() => {
    setSelectedRarities(filters.rarity);
  }, [filters.rarity]);

  // Input field debounce and set
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onFilterChange({ ...filters, search: searchTerm });
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleCategoryChange = (category: any): void => {
    onFilterChange({ ...filters, category });
  };

  const handleRarityChange = (rarity: string): void => {
    const nextSelectedRarities = selectedRarities.includes(rarity)
      ? selectedRarities.filter((selectedRarity) => selectedRarity !== rarity)
      : [...selectedRarities, rarity];

    setSelectedRarities(nextSelectedRarities);
    onFilterChange({ ...filters, rarity: nextSelectedRarities });
  };

  const handleClearAll = (): void => {
    onFilterChange({
      search: '',
      category: 'All',
      rarity: ['Common'],
    });
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {isLoading ? (
        <div>Filters Loading</div>
      ) : (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Filters</h3>
            <button 
              type="button" 
              onClick={handleClearAll}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Clear all
            </button>
          </div>
          

          {/* Main Responsive Grid Layout */}
          <form className="grid grid-cols-1 gap-6 md:grid-cols-3" onSubmit={(e) => e.preventDefault()}>
            
            {/* Column 1: Text Search */}
            <div className="space-y-2">
              <label htmlFor="search" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Search Card
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  id="search" 
                  name="search" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g., Charizard, Double Colorless..." 
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Column 2: Category Selector */}
            <div className="space-y-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category</span>
              <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                {(['All', 'Pokemon', 'Energy', 'Trainer'] as any[]).map((cat) => (
                  <label 
                    key={cat}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-colors
                      ${filters.category === cat 
                        ? 'border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/30' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800'
                      }`}
                  >
                    <input 
                      type="radio" 
                      name="category" 
                      checked={filters.category === cat}
                      onChange={() => handleCategoryChange(cat)}
                      className="sr-only" 
                    />
                    <span className={`text-xs font-bold capitalize
                      ${filters.category === cat 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {cat}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Rarity</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                {filterProperties.rarities.map((rarity) => {
                  // Safe array check to determine if this specific checkbox should be ticked
                  const isChecked = selectedRarities.includes(rarity);

                  return (
                    <label key={rarity} className="flex items-center space-x-2.5 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        name="rarity" 
                        value={rarity}
                        checked={isChecked} // Fixed: Checks if the array includes this rarity
                        onChange={() => handleRarityChange(rarity)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800" 
                      />
                      <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white capitalize whitespace-nowrap">
                        {rarity}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
