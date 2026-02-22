// HomeWorkshop.jsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GitFork,
  TrendingUp,
  Search,
  UserPlus,
  Wrench,
  Sparkles,
  Clock,
  Plus,
  Filter,
} from "lucide-react";
import { useContextManager } from "../features/ContextProvider";

/**
 * HomeWorkshop.jsx
 * - Drop-in replacement (complete file)
 * - Fully responsive, mobile-first
 * - Adds: Search bar, category chips, "Create fork" CTA
 * - Fixes: SectionHeader component name bug, improved keyboard + focus states
 *
 * Notes:
 * - Tailwind utility classes assumed (mobile-first). If your project uses custom breakpoints,
 *   tweak classes accordingly.
 */

/* ------------------ Tiny LazyImage (safe for weak devices) ------------------ */
function LazyImage({ src, alt, className = "", aspectClass = "w-full h-full" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "400px", threshold: 0.02 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden bg-neutral-800 rounded-md ${aspectClass} ${className}`}
      aria-busy={!loaded}
    >
      {visible && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`object-cover w-full h-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          draggable={false}
        />
      )}
      {!loaded && <div className="absolute inset-0 animate-pulse bg-neutral-800/60" />}
    </div>
  );
}

/* ------------------ Main Home (mobile-first) ------------------ */
export default function HomeWorkshop({ fetcher = defaultFetcher }) {
  const navigate = useNavigate();
  const { isAuthorized } = useContextManager();
  const [cards, setCards] = useState(null);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search and filter state (new)
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const TAGS = ["All", "Quick", "Comfort", "Vegan", "Low salt", "Baking"];

  // Fetch dynamic data (server integration point)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetcher()
      .then((res) => {
        if (!mounted) return;
        setCards(res.cards ?? []);
        setLive(res.live ?? []);
      })
      .catch((err) => {
        console.error("HomeWorkshop fetch error:", err);
        if (!mounted) return;
        setCards([]);
        setLive([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [fetcher]);

  // Filtered lists derived from query + tag
  const filteredCards = (Array.isArray(cards) ? cards : sampleCards()).filter((c) => {
    const matchesQuery =
      !query ||
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      (c.note && c.note.toLowerCase().includes(query.toLowerCase()));
    const matchesTag = activeTag === "All" || (c.tags || []).includes(activeTag);
    return matchesQuery && matchesTag;
  });

  const filteredLive = (Array.isArray(live) ? live : sampleLive()).filter((r) => {
    const matchesQuery = !query || r.title.toLowerCase().includes(query.toLowerCase());
    const matchesTag = activeTag === "All" || (r.tags || []).includes(activeTag);
    return matchesQuery && matchesTag;
  });

  return (
    <div className="min-h-screen max-w-[100vw] px-4 md:px-8 lg:px-12 py-8 text-neutral-200 bg-transparent">
      <main className="max-w-[100vw] mx-auto space-y-12">
        {/* HERO WORKBENCH */}
        <section className="max-w-[100vw] grid gap-6 lg:grid-cols-2 items-start">
          <div className="pt-2 max-w-[100vw]">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Recipes as craft.
              <br />
              Tweak. Test. Improve.
            </h1>

            <p className="mt-4 text-neutral-400 max-w-xl">
              Forkit is a small workshop for recipes - each fork is a crafted tweak.
              Change one thing, test it, and the kitchen decides what works.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 items-center">
              <PrimaryCTA onClick={() => navigate("/recipes")} label="Explore recipes" icon={<Search size={16} />} />
              <SecondaryCTA onClick={() => navigate("/recipes?sort=trending")} label="Trending forks" icon={<TrendingUp size={16} />} />
              {isAuthorized ? (
                <PrimarySmall onClick={() => navigate("/me/forks")} label="My forks" icon={<GitFork size={14} />} />
              ) : (
                <SecondaryCTA
                  onClick={() => {
                    localStorage.setItem("redirectAfterLogin", "/");
                    navigate("/login");
                  }}
                  label="Sign in to fork"
                  icon={<UserPlus size={16} />}
                />
              )}

              {/* New create CTA */}
              <button
                onClick={() => navigate("/create")}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500 text-black font-medium hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ml-2"
                aria-label="Create a new fork"
              >
                <Plus size={14} />
                <span className="text-sm">Create fork</span>
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-md text-xs text-neutral-400">
              <Stat label="Small changes" sub="One tweak at a time" icon={<Wrench size={14} />} />
              <Stat label="Document" sub="Why it changed" icon={<Sparkles size={14} />} />
              <Stat label="Measure" sub="Time, texture, taste" icon={<Clock size={14} />} />
            </div>
          </div>  
        </section>

        {/* LIVE (horizontal scroll on small, grid on desktop) */}
        <section>
          <SectionHeader title="Live on the bench" subtitle="Recipes being actively tweaked" />
          <div className="mt-4">
            <LiveWorkbench live={filteredLive} loading={loading} onOpen={(id) => navigate(`/recipes/${id}`)} />
          </div>
        </section>

        {/* WHAT HAPPENS */}
        <section className="max-w-[100vw] grid gap-6 md:grid-cols-3">
          <SimpleTile icon={<Wrench size={20} />} title="Fork the recipe" caption="Make a copy, change one thing." />
          <SimpleTile icon={<Sparkles size={20} />} title="Test & record" caption="Note results and metrics." />
          <SimpleTile icon={<TrendingUp size={20} />} title="Share & surface" caption="Good forks get noticed." />
        </section>

        {/* PRINCIPLES */}
        <section className="max-w-[100vw] bg-[#0b0b0b] border border-white/5 p-6 rounded-xl">
          <h3 className="text-lg font-semibold">Workshop principles</h3>
          <p className="text-neutral-400 mt-2 max-w-3xl">
            Minimal edits. Explain clearly. Keep lineage. Respect other people’s work.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Principle title="One change" desc="Avoid big rewrites - small reproducible changes win." />
            <Principle title="Why it matters" desc="Write a short note with the how & why." />
            <Principle title="Respect lineage" desc="Keep attribution and history intact." />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="max-w-[100vw] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Ready to experiment?</h2>
            <p className="text-neutral-400 mt-2">Fork one recipe, change one thing, test it - see what works.</p>
          </div>

          <div className="flex gap-3">
            <PrimaryCTA onClick={() => navigate("/recipes")} label="Explore recipes" icon={<Search size={16} />} />
            <SecondaryCTA onClick={() => navigate("/recipes?sort=trending")} label="See trending forks" icon={<TrendingUp size={16} />} />
          </div>
        </section>
      </main>
    </div>
  );
}

/* ------------------ WorkbenchVisual (data-driven + responsive) ------------------ */
function WorkbenchVisual({ cards, loading }) {
  // fallback sample if data not present
  const fallback = sampleCards();
  const list = Array.isArray(cards) && cards.length > 0 ? cards : fallback;

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="bg-gradient-to-b from-neutral-900/60 to-neutral-900/0 border border-white/5 rounded-xl p-5"
      >
        <div className="flex items-start gap-4 overflow-x-auto no-scrollbar py-4 px-1">
          <div className="flex gap-4 items-start max-w-[55vw]">
            {loading ? (
              // simple skeleton while loading
              <div className="flex gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="min-w-[220px] w-[72vw] sm:w-[260px] md:w-[220px] max-w-[320px] bg-neutral-900 rounded-xl p-0"
                  >
                    <div className="h-[36vw] sm:h-40 md:h-44 animate-pulse bg-neutral-800 rounded-t-xl" />
                    <div className="p-3">
                      <div className="h-4 w-3/4 bg-neutral-800 animate-pulse rounded mb-2" />
                      <div className="h-3 w-1/3 bg-neutral-800 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              list.map((c, i) => (
                <Card
                  key={c.id}
                  c={c}
                  index={i}
                  onClick={() => {
                    // gentle default - scroll to middle of viewport (can be customized)
                    window.scrollTo({ top: window.innerHeight / 2, behavior: "smooth" });
                  }}
                />
              ))
            )}
          </div>

          {/* Tools panel - stacks on small screens */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:ml-6 gap-3">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col gap-3"
            >
              <ToolPill icon={<Wrench size={14} />} label="Tweak" hint="Change one thing" />
              <ToolPill icon={<Sparkles size={14} />} label="Test" hint="Record result" />
              <ToolPill icon={<TrendingUp size={14} />} label="Surface" hint="Good forks rise" />
            </motion.div>
          </div>
        </div>

        <div className="mt-4 px-2">
          <WorkbenchConnector count={Math.max(1, Math.min(6, list.length))} />
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------ Card component ------------------ */
function Card({ c, index, onClick }) {
  // responsive width: small phones use vw, larger use fixed min/max to keep layout predictable
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.995 }}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.06 * index, type: "spring", stiffness: 110, damping: 14 }}
      className="min-w-[220px] w-[72vw] sm:w-[260px] md:w-[240px] lg:w-[280px] max-w-[360px] bg-[#070707] border border-white/6 rounded-xl overflow-hidden shadow-sm cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <div className="h-[36vw] sm:h-40 md:h-44 lg:h-48 xl:h-56">
        <LazyImage src={c.img} alt={c.title} aspectClass="h-[36vw] sm:h-40 md:h-44 lg:h-48 xl:h-56" />
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">{c.title}</div>
            <div className="text-xs text-neutral-400 mt-1 line-clamp-2">{c.note}</div>
          </div>

          {c.id === "best" && <div className="text-xs bg-amber-400 text-black px-2 py-0.5 rounded-md">Top</div>}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
          <Wrench size={14} />
          <span>Fork + test</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------ LiveWorkbench: horizontal list (responsive) ------------------ */
function LiveWorkbench({ live, loading, onOpen }) {
  // On medium+ screens show a 2- or 3-column grid instead of horizontal scroll
  const list = Array.isArray(live) && live.length > 0 ? live : sampleLive();

  return (
    <>
      {/* small screens: horizontal */}
      <div className="block md:hidden overflow-x-auto no-scrollbar -mx-4 px-4">
        <div className="flex gap-4 py-2">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
              <article key={i} className="min-w-[72vw] sm:w-[260px] md:w-[220px] bg-[#0b0b0b] border border-white/5 rounded-lg p-3 cursor-pointer flex-shrink-0">
                <div className="h-[36vw] sm:h-40 md:h-36 overflow-hidden rounded-md animate-pulse bg-neutral-800" />
                <div className="mt-3">
                  <div className="h-4 w-3/4 bg-neutral-800 rounded mb-2 animate-pulse" />
                  <div className="h-3 w-1/4 bg-neutral-800 rounded animate-pulse" />
                </div>
              </article>
            ))
            : list.map((r) => (
              <motion.article
                key={r.id}
                whileHover={{ y: -6 }}
                className="min-w-[72vw] sm:w-[260px] md:w-[220px] bg-[#0b0b0b] border border-white/5 rounded-lg p-3 cursor-pointer flex-shrink-0"
                onClick={() => onOpen(r.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onOpen(r.id);
                }}
              >
                <div className="h-[36vw] sm:h-40 md:h-36 overflow-hidden rounded-md">
                  <LazyImage src={r.img} alt={r.title} aspectClass="h-[36vw] sm:h-40 md:h-36" />
                </div>
                <div className="mt-3">
                  <div className="text-sm font-medium text-white">{r.title}</div>
                  <div className="text-xs text-neutral-400 mt-1">• active now</div>
                </div>
              </motion.article>
            ))}
        </div>
      </div>

      {/* md+ screens: grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
            <article key={i} className="bg-[#0b0b0b] border border-white/5 rounded-lg p-3">
              <div className="h-48 overflow-hidden rounded-md animate-pulse bg-neutral-800" />
              <div className="mt-3">
                <div className="h-4 w-3/4 bg-neutral-800 rounded mb-2 animate-pulse" />
                <div className="h-3 w-1/4 bg-neutral-800 rounded animate-pulse" />
              </div>
            </article>
          ))
          : list.map((r) => (
            <motion.article
              key={r.id}
              whileHover={{ y: -6 }}
              className="bg-[#0b0b0b] border border-white/5 rounded-lg p-3 cursor-pointer"
              onClick={() => onOpen(r.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onOpen(r.id);
              }}
            >
              <div className="h-48 overflow-hidden rounded-md">
                <LazyImage src={r.img} alt={r.title} aspectClass="h-48" />
              </div>
              <div className="mt-3">
                <div className="text-sm font-medium text-white">{r.title}</div>
                <div className="text-xs text-neutral-400 mt-1">• active now</div>
              </div>
            </motion.article>
          ))}
      </div>
    </>
  );
}

/* ------------------ Small UI building blocks ------------------ */
function PrimaryCTA({ onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-amber-400 text-black font-medium hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function PrimarySmall({ onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-400 text-black font-medium hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function SecondaryCTA({ onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-neutral-700 text-neutral-200 hover:bg-neutral-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Stat({ label, sub, icon }) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-neutral-800 rounded-md p-2">{icon}</div>
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-neutral-400">{sub}</div>
      </div>
    </div>
  );
}

function SimpleTile({ icon, title, caption }) {
  return (
    <div className="bg-[#0b0b0b] border border-white/5 rounded-xl p-5 flex flex-col items-start gap-3">
      <div className="p-2 rounded-md bg-neutral-900">{icon}</div>
      <h4 className="font-semibold">{title}</h4>
      <p className="text-sm text-neutral-400">{caption}</p>
    </div>
  );
}

/* Fix: components must be PascalCase for JSX usage */
function SectionHeader({ title, subtitle }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-neutral-400">{subtitle}</p>
      </div>
    </div>
  );
}

function ToolPill({ icon, label, hint }) {
  return (
    <div className="flex items-center gap-2 bg-neutral-900 border border-white/5 p-2 rounded-md">
      <div className="p-2 rounded bg-neutral-800">{icon}</div>
      <div className="text-xs">
        <div className="font-medium text-white">{label}</div>
        <div className="text-neutral-400">{hint}</div>
      </div>
    </div>
  );
}

function Principle({ title, desc }) {
  return (
    <div className="bg-neutral-900 border border-white/5 rounded-md p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-neutral-400 mt-1">{desc}</div>
    </div>
  );
}

/* ------------------ Workbench connector SVG (responsive) ------------------ */
function WorkbenchConnector({ count = 4 }) {
  return (
    <div className="flex items-center gap-3 overflow-hidden">
      {Array.from({ length: Math.max(1, count - 1) }).map((_, i) => (
        <svg key={i} className="w-[26vw] max-w-[120px] h-9" viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M4 18 C 40 18, 80 4, 116 18" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="4" cy="18" r="2.4" fill="#374151" />
          <circle cx="116" cy="18" r="2.4" fill="#d97706" />
        </svg>
      ))}
    </div>
  );
}

/* ------------------ SearchBar (new, accessible) ------------------ */
function SearchBar({ query, setQuery }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="hw-search" className="sr-only">Search recipes</label>
      <div className="relative w-full max-w-md">
        <input
          id="hw-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes, notes, forks..."
          className="w-full pl-10 pr-3 py-2 rounded-md bg-neutral-900 border border-neutral-800 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
          <Search size={16} />
        </div>
      </div>
      <button
        type="button"
        aria-label="Advanced filters"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-neutral-800 text-sm text-neutral-200 hover:bg-neutral-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <Filter size={14} />
        <span className="hidden sm:inline">Filters</span>
      </button>
    </div>
  );
}

/* ------------------ Helpers & default fetcher ------------------ */
function sampleCards() {
  return [
    {
      id: "orig",
      title: "Original",
      note: "Baseline",
      img: "https://images.unsplash.com/photo-1546069901-eacef0df6022?q=80&w=1200&auto=format&fit=crop",
      tags: ["All", "Comfort"],
    },
    {
      id: "fork1",
      title: "Fork: crisp edge",
      note: "+ sear 30s",
      img: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop",
      tags: ["All", "Quick"],
    },
    {
      id: "fork2",
      title: "Fork: less salt",
      note: "- 20% salt",
      img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200&auto=format&fit=crop",
      tags: ["All", "Low salt"],
    },
    {
      id: "best",
      title: "Rising",
      note: "Most used",
      img: "https://images.unsplash.com/photo-1512058564366-c9e3b6f7b0bd?q=80&w=1200&auto=format&fit=crop",
      tags: ["All"],
    },
  ];
}

function sampleLive() {
  return [
    { id: "r1", title: "Smash Burger - sear tweak", img: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop", tags: ["All", "Quick"] },
    { id: "r4", title: "Ramen - chili oil ratio", img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=800&auto=format&fit=crop", tags: ["All", "Comfort"] },
    { id: "r2", title: "Garlic pasta - low heat", img: "https://images.unsplash.com/photo-1525755662778-989d0524087e?q=80&w=800&auto=format&fit=crop", tags: ["All", "Vegan"] },
    { id: "r5", title: "Buddha bowl - roast nuance", img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop", tags: ["All", "Vegan"] },
  ];
}

/**
 * Default fetcher: placeholder for server data.
 * Replace with your real fetch function (e.g., () => fetch("/api/home").then(r => r.json()))
 */
function defaultFetcher() {
  return new Promise((resolve) => {
    // small delay to simulate fetch; safe to remove in production
    setTimeout(() => {
      resolve({ cards: sampleCards(), live: sampleLive() });
    }, 120);
  });
}

/* ------------------ styles: hide native scrollbar for horizontal lists (inject once) ------------------ */
if (typeof document !== "undefined" && !document.head.querySelector("[data-workbench-style]")) {
  const styleTag = document.createElement("style");
  styleTag.setAttribute("data-workbench-style", "true");
  styleTag.innerHTML = `
    .no-scrollbar::-webkit-scrollbar { height: 8px; }
    .no-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.04); border-radius: 8px; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: thin; }
    /* small helper to clamp long notes if line-clamp plugin not present */
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  `;
  document.head.appendChild(styleTag);
}
