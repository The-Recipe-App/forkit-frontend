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
} from "lucide-react";
import { useContextManager } from "../features/ContextProvider";

/**
 * HomeWorkshop.jsx
 * - Mobile-first responsive layout
 * - Data-driven: accepts optional `fetcher` prop (returns { cards, live })
 * - Drop-in replacement for your previous file
 *
 * Usage:
 *  <HomeWorkshop />
 * or
 *  <HomeWorkshop fetcher={myFetchFunction} />
 *
 * myFetchFunction should return a promise resolving to:
 * {
 *   cards: [{ id, title, note, img }],
 *   live: [{ id, title, img }]
 * }
 *
 * If no fetcher is provided, sample data is used.
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
          className={`object-cover w-full h-full transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
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

  return (
    <div className="min-h-screen max-w-[85vw] text-neutral-200 px-4 md:px-8 lg:px-12 py-8">
      <main className="max-w-[100vw] mx-auto space-y-12">
        {/* HERO WORKBENCH - stacked on small, 2-col only at xl */}
        <section className="grid gap-6 xl:grid-cols-2 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Recipes as craft.
              <br />
              Tweak. Test. Improve.
            </h1>

            <p className="mt-4 text-neutral-400 max-w-xl">
              Forkit is a small workshop for recipes — each fork is a crafted tweak.
              Change one thing, test it, and the kitchen decides what works.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryCTA onClick={() => navigate("/recipes")} label="Explore recipes" icon={<Search size={16} />} />
              <SecondaryCTA onClick={() => navigate("/recipes?sort=trending")} label="Trending forks" icon={<TrendingUp size={16} />} />
              {isAuthorized ? (
                <PrimarySmall onClick={() => navigate("/me/forks")} label="My forks" icon={<GitFork size={14} />} />
              ) : (
                <SecondaryCTA onClick={() => { localStorage.setItem("redirectAfterLogin", "/"); navigate("/login"); }} label="Sign in to fork" icon={<UserPlus size={16} />} />
              )}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 max-w-md text-xs text-neutral-400">
              <Stat label="Small changes" sub="One tweak at a time" icon={<Wrench size={14} />} />
              <Stat label="Document" sub="Why it changed" icon={<Sparkles size={14} />} />
              <Stat label="Measure" sub="Time, texture, taste" icon={<Clock size={14} />} />
            </div>
          </div>

          {/* Animated workbench visual */}
          <div className="relative w-full py-6">
            <WorkbenchVisual cards={cards} loading={loading} />
          </div>
        </section>

        {/* WHAT HAPPENS */}
        <section className="grid gap-6 md:grid-cols-3">
          <SimpleTile icon={<Wrench size={20} />} title="Fork the recipe" caption="Make a copy, change one thing." />
          <SimpleTile icon={<Sparkles size={20} />} title="Test & record" caption="Note results and metrics." />
          <SimpleTile icon={<TrendingUp size={20} />} title="Share & surface" caption="Good forks get noticed." />
        </section>

        {/* LIVE (horizontal scroll on mobile) */}
        <section>
          <sectionHeader title="Live on the bench" subtitle="Recipes being actively tweaked" />
          <div className="mt-4">
            <LiveWorkbench live={live} loading={loading} onOpen={(id) => navigate(`/recipes/${id}`)} />
          </div>
        </section>

        {/* PRINCIPLES */}
        <section className="bg-[#0b0b0b] border border-white/5 p-6 rounded-xl">
          <h3 className="text-lg font-semibold">Workshop principles</h3>
          <p className="text-neutral-400 mt-2 max-w-3xl">
            Minimal edits. Explain clearly. Keep lineage. Respect other people’s work.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Principle title="One change" desc="Avoid big rewrites — small reproducible changes win." />
            <Principle title="Why it matters" desc="Write a short note with the how & why." />
            <Principle title="Respect lineage" desc="Keep attribution and history intact." />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Ready to experiment?</h2>
            <p className="text-neutral-400 mt-2">Fork one recipe, change one thing, test it — see what works.</p>
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
  // fallback sample if data not present, but we keep small to avoid breaking layout
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
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-4 px-1">
          <div className="flex gap-4 items-start">
            {loading ? (
              // simple skeleton while loading
              <div className="flex gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-[72vw] sm:w-[260px] md:w-[220px] max-w-[320px] bg-neutral-900 rounded-xl p-0">
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
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.995 }}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.06 * index, type: "spring", stiffness: 110, damping: 14 }}
      className="w-[72vw] sm:w-[260px] md:w-[220px] max-w-[320px] bg-[#070707] border border-white/6 rounded-xl overflow-hidden shadow-sm cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <div className="h-[36vw] sm:h-40 md:h-44">
        <LazyImage src={c.img} alt={c.title} aspectClass="h-[36vw] sm:h-40 md:h-44" />
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">{c.title}</div>
            <div className="text-xs text-neutral-400 mt-1">{c.note}</div>
          </div>

          {c.id === "best" && (
            <div className="text-xs bg-amber-400 text-black px-2 py-0.5 rounded-md">Top</div>
          )}
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
  const list = Array.isArray(live) && live.length > 0 ? live : sampleLive();

  return (
    <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
      <div className="flex gap-4 py-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <article key={i} className="min-w-[72vw] sm:w-[260px] md:w-[220px] bg-[#0b0b0b] border border-white/5 rounded-lg p-3 cursor-pointer flex-shrink-0">
              <div className="h-[36vw] sm:h-40 md:h-36 overflow-hidden rounded-md animate-pulse bg-neutral-800" />
              <div className="mt-3">
                <div className="h-4 w-3/4 bg-neutral-800 rounded mb-2 animate-pulse" />
                <div className="h-3 w-1/4 bg-neutral-800 rounded animate-pulse" />
              </div>
            </article>
          ))
        ) : (
          list.map((r) => (
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
          ))
        )}
      </div>
    </div>
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

function sectionHeader({ title, subtitle }) {
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

/* ------------------ Helpers & default fetcher ------------------ */
function sampleCards() {
  return [
    {
      id: "orig",
      title: "Original",
      note: "Baseline",
      img: "https://images.unsplash.com/photo-1546069901-eacef0df6022?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "fork1",
      title: "Fork: crisp edge",
      note: "+ sear 30s",
      img: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "fork2",
      title: "Fork: less salt",
      note: "- 20% salt",
      img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "best",
      title: "Rising",
      note: "Most used",
      img: "https://images.unsplash.com/photo-1512058564366-c9e3b6f7b0bd?q=80&w=1200&auto=format&fit=crop",
    },
  ];
}

function sampleLive() {
  return [
    { id: "r1", title: "Smash Burger — sear tweak", img: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop" },
    { id: "r4", title: "Ramen — chili oil ratio", img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=800&auto=format&fit=crop" },
    { id: "r2", title: "Garlic pasta — low heat", img: "https://images.unsplash.com/photo-1525755662778-989d0524087e?q=80&w=800&auto=format&fit=crop" },
    { id: "r5", title: "Buddha bowl — roast nuance", img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop" },
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

/* ------------------ styles: hide native scrollbar for horizontal lists ------------------ */
/* inject once (keeps tiny fallback) */
if (typeof document !== "undefined" && !document.head.querySelector("[data-workbench-style]")) {
  const styleTag = document.createElement("style");
  styleTag.setAttribute("data-workbench-style", "true");
  styleTag.innerHTML = `
    .no-scrollbar::-webkit-scrollbar { height: 8px; }
    .no-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.04); border-radius: 8px; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: thin; }
  `;
  document.head.appendChild(styleTag);
}
