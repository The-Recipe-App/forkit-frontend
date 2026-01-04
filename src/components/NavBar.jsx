import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
    Home,
    BookOpen,
    Flame,
    Tags,
    Search,
    Sparkles,
    Timer,
    Leaf,
    Drumstick,
    Vegan,
    AlertCircle,
    Soup,
} from "lucide-react";
import { useContextManager } from "../features/ContextProvider";

/* ───────────────────────── NavBar ───────────────────────── */

export default function NavBar({
    setNavOpen,
    isOpen,
    isOverlay,
    navRef,
}) {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [sidebarMeta, setSideBarMeta ] = useState({});
    const { isAuthorized, recipes = [] } = useContextManager();

    const isRecipesPage = location.pathname === "/recipes";

    /* ───────────────────────── State ───────────────────────── */

    const [tagQuery, setTagQuery] = useState("");

    /* ───────────────────────── Active filters ───────────────────────── */

    const activeDifficulty = searchParams.get("difficulty");
    const activeDiet = searchParams.get("tag"); // NEW

    const activeTags = useMemo(() => {
        const raw = searchParams.get("tag");
        return raw ? raw.split(",") : [];
    }, [searchParams]);

    /* ───────────────────────── URL helpers ───────────────────────── */

    const updateParams = (updater) => {
        const params = new URLSearchParams(searchParams);
        updater(params);
        navigate(`/recipes?${params.toString()}`);
        if (isOverlay) setNavOpen(false);
    };

    const toggleTag = (tag) => {
        updateParams(params => {
            const current = new Set(activeTags);
            current.has(tag) ? current.delete(tag) : current.add(tag);
            current.size
                ? params.set("tag", [...current].join(","))
                : params.delete("tag");
        });
    };

    const setDifficulty = (d) => {
        updateParams(params => params.set("difficulty", d));
    };

    const setDiet = (diet) => {
        updateParams(params => {
            if (params.get("diet") === diet) {
                params.delete("tag");
            } else {
                params.set("tag", diet);
            }
        });
    };

    const clearFilters = () => navigate("/recipes");

    /* ───────────────────────── Filtered recipes (single source of truth) ───────────────────────── */

    const filteredRecipes = useMemo(() => {
        return recipes.filter(r => {
            if (activeDifficulty && r.meta?.difficulty !== activeDifficulty) {
                return false;
            }

            if (activeDiet && !r.tags?.includes(activeDiet)) {
                return false;
            }

            if (activeTags.length && !activeTags.every(t => r.tags?.includes(t))) {
                return false;
            }

            return true;
        });
    }, [recipes, activeDifficulty, activeDiet, activeTags]);

    const matchingCount = filteredRecipes.length;

    /* ───────────────────────── Context-aware derived filters ───────────────────────── */

    
    const derived = useMemo(() => {
        if (!filteredRecipes.length) return null;

        const difficulties = new Set();
        const tags = new Map();
        const diets = new Set();

        filteredRecipes.forEach(r => {
            if (r.meta?.difficulty) difficulties.add(r.meta.difficulty);

            r.tags?.forEach(t => {
                const key = t.toLowerCase();
                tags.set(key, (tags.get(key) || 0) + 1);

                if (["vegetarian", "vegan", "non-vegetarian"].includes(key)) {
                    diets.add(key);
                }
            });
        });

        return {
            difficulties: [...difficulties],
            tags: [...tags.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([tag]) => tag),
            diets: [...diets],
        };
    }, [filteredRecipes]);

    const globalSidebarMeta = useMemo(() => {
        if (!recipes.length) {
            return { recipeCount: 0, tagCount: 0 };
        }
    
        const tags = new Set();
    
        recipes.forEach(r => {
            r.tags?.forEach(t => tags.add(t.toLowerCase()));
        });
    
        return {
            recipeCount: recipes.length,
            tagCount: tags.size,
        };
    }, [recipes]);

    useEffect(() => {
        setSideBarMeta(globalSidebarMeta);
    }, [globalSidebarMeta]);
    

    const filteredTags = useMemo(() => {
        if (!derived) return [];
        if (!tagQuery) return derived.tags;
        return derived.tags.filter(t =>
            t.toLowerCase().includes(tagQuery.toLowerCase())
        );
    }, [derived, tagQuery]);

    const prettify = (v) =>
        v.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");

    /* ───────────────────────── UI ───────────────────────── */

    return (
        <aside
            ref={navRef}
            className={`
                z-[90] w-64 bg-[#0f0f0f] text-white flex flex-col
                transition-transform duration-300
                ${isOpen ? "translate-x-0" : "-translate-x-full"}
                fixed top-[3.875rem] h-[calc(100vh-3.875rem)]
            `}
        >
            <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">

                {/* Primary */}
                <div className="space-y-1">
                    <NavItem icon={Home} label="Home" to="/" onClick={() => navigate("/")} />
                    <NavItem icon={BookOpen} label="Recipes" to="/recipes" onClick={() => navigate("/recipes")} />
                </div>
                {/* Ambient sidebar content (non-recipes pages) */}
                {!isRecipesPage && sidebarMeta && (
                    <div className="
                        space-y-3
                        rounded-lg
                        border border-neutral-800
                        bg-neutral-900/40
                        p-3
                        text-xs text-neutral-400
                    ">
                        <div className="flex items-center gap-2 text-neutral-300">
                            <Sparkles size={14} />
                            <span className="font-medium">Forkit</span>
                        </div>

                        <p>
                            Recipes evolve here.
                            Fork, tweak, improve.
                        </p>

                        <div className="space-y-1">
                            <p>{sidebarMeta.recipeCount} recipes available</p>
                            <p>{sidebarMeta.tagCount} tags to explore</p>
                        </div>

                        <button
                            onClick={() => navigate("/recipes")}
                            className="
                                text-left text-orange-400
                                hover:text-orange-300
                                font-medium
                            "
                        >
                            Explore recipes →
                        </button>
                    </div>
                )}

                {/* Filters */}
                {isRecipesPage && (
                    <div className="space-y-5 border-y border-neutral-800 py-4">

                        {/* Status */}
                        <div className="space-y-1">
                            {matchingCount === 0 ? (
                                <div className="flex items-start gap-2 text-xs text-neutral-500">
                                    <AlertCircle size={14} />
                                    <div>
                                        <p>No recipes match these filters.</p>
                                        <button
                                            onClick={clearFilters}
                                            className="text-orange-400 hover:text-orange-300 font-medium mt-1"
                                        >
                                            Reset filters →
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {(activeDifficulty || activeTags.length || activeDiet) && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-xs p-0 text-neutral-500 hover:text-neutral-300"
                                        >
                                            Clear all filters
                                        </button>
                                    )}
                                    <p className="text-xs text-neutral-400">
                                        Showing{" "}
                                        <span className="text-orange-400 font-medium">
                                            {matchingCount}
                                        </span>{" "}
                                        recipes
                                    </p>
                                </>
                            )}
                            <p className="text-[10px] uppercase tracking-wider text-neutral-600">
                                Refine your cooking session
                            </p>
                        </div>
                        {/* Presets (progressive disclosure) */}
                        {matchingCount > 3 && (
                            <div className="grid grid-cols-auto gap-2">
                                <FilterSection title="Presets" className="col-span-auto">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Preset icon={Timer} label="Weeknight" hint="Quick & simple" />
                                        <Preset icon={Soup} label="Experiment" hint="Try something new" />
                                    </div>
                                </FilterSection>
                            </div>
                        )}

                        {/* Difficulty */}
                        {derived?.difficulties.length > 0 && (
                            <FilterSection title="Difficulty">
                                {derived.difficulties.map(d => (
                                    <Pill
                                        key={d}
                                        active={activeDifficulty === d}
                                        onClick={() => setDifficulty(d)}
                                    >
                                        {prettify(d)}
                                    </Pill>
                                ))}
                            </FilterSection>
                        )}

                        {/* Diet Traits (FIXED & CLICKABLE) */}
                        {derived?.diets.length > 0 && (
                            <FilterSection title="Diet">
                                {derived.diets.includes("vegetarian") && (
                                    <TraitPill
                                        icon={Leaf}
                                        active={activeDiet === "vegetarian"}
                                        onClick={() => setDiet("vegetarian")}
                                    >
                                        Vegetarian
                                    </TraitPill>
                                )}
                                {derived.diets.includes("vegan") && (
                                    <TraitPill
                                        icon={Vegan}
                                        active={activeDiet === "vegan"}
                                        onClick={() => setDiet("vegan")}
                                    >
                                        Vegan
                                    </TraitPill>
                                )}
                                {derived.diets.includes("non-vegetarian") && (
                                    <TraitPill
                                        icon={Drumstick}
                                        active={activeDiet === "non-vegetarian"}
                                        onClick={() => setDiet("non-vegetarian")}
                                    >
                                        Non-veg
                                    </TraitPill>
                                )}
                            </FilterSection>
                        )}

                        {/* Tags */}
                        {filteredTags.length > 0 && (
                            <FilterSection title="Explore tags">
                                <div className="relative w-full">
                                    <Search size={14} className="absolute left-2 top-2.5 text-neutral-500" />
                                    <input
                                        value={tagQuery}
                                        onChange={(e) => setTagQuery(e.target.value)}
                                        placeholder="Search tags…"
                                        className="w-full pl-7 pr-2 py-1.5 text-xs rounded-md bg-neutral-900 border border-neutral-800 focus:outline-none focus:border-neutral-600"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {filteredTags.map(tag => (
                                        <TagChip
                                            key={tag}
                                            active={activeTags.includes(tag)}
                                            onClick={() => toggleTag(tag)}
                                        >
                                            {prettify(tag)}
                                        </TagChip>
                                    ))}
                                </div>
                            </FilterSection>
                        )}
                    </div>
                )}

                {!isAuthorized && (
                    <div className="mt-auto p-3 rounded-lg bg-neutral-900/80 text-xs text-neutral-400">
                        Fork recipes to customize them.
                        <button
                            onClick={() => navigate("/login")}
                            className="block mt-2 text-orange-400 hover:text-orange-300 font-medium"
                        >
                            Sign in →
                        </button>
                    </div>
                )}
            </nav>
        </aside>
    );
}

/* ───────────────────────── Components ───────────────────────── */

const NavItem = ({ icon: Icon, label, to, onClick }) => {
    const location = useLocation();
    const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

    return (
        <button
            onClick={onClick}
            className={`
                group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-[15px] font-medium transition-colors
                ${isActive
                    ? "bg-neutral-800/80 text-white"
                    : "text-neutral-300 hover:bg-neutral-800/80 hover:text-white"}
            `}
        >
            <Icon size={18} className="opacity-80 group-hover:opacity-100" />
            {label}
        </button>
    );
};

const FilterSection = ({ title, children }) => (
    <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-neutral-600">
            {title}
        </p>
        <div className="flex flex-wrap gap-2">
            {children}
        </div>
    </div>
);

const Pill = ({ active, children, onClick }) => (
    <button
        onClick={onClick}
        className={`
            px-3 py-1 text-xs rounded-full border transition-colors
            ${active
                ? "bg-orange-400/10 border-orange-400 text-orange-400"
                : "border-neutral-700 text-neutral-400 hover:text-white"}
        `}
    >
        {children}
    </button>
);

const TraitPill = ({ icon: Icon, active, children, onClick }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition-colors
            ${active
                ? "bg-orange-400/10 border-orange-400 text-orange-400"
                : "border-neutral-700 text-neutral-400 hover:text-white"}
        `}
    >
        <Icon size={12} />
        {children}
    </button>
);

const Preset = ({ icon: Icon, label, hint }) => (
    <div className="flex flex-col items-center text-center gap-2 px-3 py-2 rounded-md bg-neutral-900 text-xs text-neutral-400 hover:text-white cursor-pointer">
        <Icon size={14} />
        <div>
            <p className="font-medium">{label}</p>
            <p className="text-[10px] opacity-60">{hint}</p>
        </div>
    </div>
);

const TagChip = ({ active, children, onClick }) => (
    <button
        onClick={onClick}
        className={`
            text-xs px-2 py-1 rounded-md
            ${active
                ? "bg-orange-400/10 text-orange-400"
                : "bg-neutral-900 text-neutral-400 hover:text-white"}
        `}
    >
        {children}
    </button>
);
