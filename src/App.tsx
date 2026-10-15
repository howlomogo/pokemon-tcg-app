import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import Footer from './components/Footer';
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
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-50 w-full border-b border-[#38383d] bg-[#202023] text-[#f1f1f2] shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="PokéBinder Studio home">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-slate-950">
              <Sparkles size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-tight">
                PokéBinder <span className="font-medium text-[#c7c7cc]">Studio</span>
              </p>
              <p className="mt-0.5 text-sm text-[#b5b5bb]">Explore the Pokémon TCG collection</p>
            </div>
          </Link>
          <nav
            aria-label="Main navigation"
            className="flex w-fit items-center gap-1 rounded-xl border border-[#414146] bg-[#2b2b30] p-1 sm:ml-auto"
          >
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-[#414146] text-white' : 'text-[#c7c7cc] hover:text-white'
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/series"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-[#414146] text-white' : 'text-[#c7c7cc] hover:text-white'
                  }`
                }
              >
                Series
              </NavLink>
              <NavLink
                to="/collection"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-[#414146] text-white' : 'text-[#c7c7cc] hover:text-white'
                  }`
                }
              >
                <span>Collection</span>
                <span className="ml-1.5 rounded-full bg-[#505056] px-1.5 py-0.5 text-xs text-amber-300">
                  {binderIds.length}
                </span>
              </NavLink>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
        <main className="py-8 sm:py-10">
          <Routes>
            <Route path="/" element={<HomePage seriesCount={series.length} />} />
            <Route
              path="/series"
              element={
                <SeriesDirectory
                  series={series}
                  loading={seriesLoading}
                  error={seriesError}
                  binderIds={binderIds}
                />
              }
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
      </div>
      <Footer />
    </div>
  );
}
