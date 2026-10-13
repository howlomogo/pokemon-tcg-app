import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import Footer from './components/Footer';
import StorageActions from './components/StorageActions';
import { NotFound } from './components/shared';
import CardDetails from './pages/CardDetails';
import CollectionPage from './pages/CollectionPage';
import HomePage from './pages/HomePage';
import SeriesDirectory from './pages/SeriesDirectory';
import SeriesPage from './pages/SeriesPage';
import SetPage from './pages/SetPage';
import { getAllSeries } from './services/tcgdex';
import type { SerieList } from '@tcgdex/sdk';

export default function App() {
  const { pathname } = useLocation();
  const [binderIds, setBinderIds] = useState<string[]>([]);
  const [series, setSeries] = useState<SerieList>([]);
  const [seriesLoading, setSeriesLoading] = useState(true);
  const [seriesError, setSeriesError] = useState<string | null>(null);

  useEffect(() => {
    if ((pathname !== '/' && pathname !== '/series') || series.length > 0) return;

    let isMounted = true;

    const loadSeries = async () => {
      try {
        const data = await getAllSeries();
        if (!isMounted) return;

        if (!data?.length) {
          setSeries([]);
          setSeriesError('No series were found. Please try again later.');
          return;
        }

        setSeries(data);
      } catch (error) {
        if (isMounted) {
          setSeriesError(error instanceof Error ? error.message : 'Unable to load series.');
        }
      } finally {
        if (isMounted) setSeriesLoading(false);
      }
    };

    void loadSeries();

    return () => {
      isMounted = false;
    };
  }, [pathname, series.length]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-neutral-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <Link to="/" className="flex items-center gap-3" aria-label="PokéBinder Studio home">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-neutral-950">
                <Sparkles size={22} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xl font-extrabold tracking-tight">
                  PokéBinder <span className="font-medium text-neutral-400">Studio</span>
                </p>
                <p className="mt-0.5 text-sm text-neutral-400">Explore the Pokémon TCG collection</p>
              </div>
            </Link>
            <nav aria-label="Main navigation" className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/series"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                  }`
                }
              >
                Series
              </NavLink>
              <NavLink
                to="/collection"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                  }`
                }
              >
                <span>Collection</span>
                <span className="ml-1.5 rounded-full bg-neutral-800 px-1.5 py-0.5 text-xs text-amber-300">
                  {binderIds.length}
                </span>
              </NavLink>
            </nav>
          </div>
          <StorageActions binderIds={binderIds} setBinderIds={setBinderIds} />
        </header>

        <main className="py-8 sm:py-10">
          <Routes>
            <Route path="/" element={<HomePage seriesCount={series.length} />} />
            <Route
              path="/series"
              element={<SeriesDirectory series={series} loading={seriesLoading} error={seriesError} />}
            />
            <Route path="/sets/:seriesId" element={<SeriesPage />} />
            <Route
              path="/sets/:seriesId/:setId"
              element={<SetPage binderIds={binderIds} setBinderIds={setBinderIds} />}
            />
            <Route
              path="/cards/:cardId"
              element={<CardDetails binderIds={binderIds} setBinderIds={setBinderIds} />}
            />
            <Route
              path="/collection"
              element={<CollectionPage binderIds={binderIds} setBinderIds={setBinderIds} />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  );
}
