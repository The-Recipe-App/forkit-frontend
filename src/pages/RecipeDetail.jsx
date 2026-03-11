// RecipeDetail.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Single recipe detail page.
//
// Error handling strategy
//   • 404              → NotFoundCard with suggestions
//   • Any other error  → PageError with retry
//   • Missing image    → LazyImage fallback
//   • Recommendations fail → silently hidden (non-critical)
//
// Data
//   useRecipe(id)            — detail data
//   useRecommendations(id)   — sidebar / related (gracefully degraded)
//   Falls back to MOCK_RECIPES when API is unavailable.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    GitFork,
    Clock,
    Flame,
    ChevronRight,
    Lock,
    Heart,
    Eye,
    HandPlatter,
    Flag,
    ListOrdered,
    Leaf,
    AlertTriangle,
    Upload,
} from "lucide-react";
import { useContextManager } from "../features/ContextProvider";
import { useRecipe, useRecommendations, MOCK_RECIPES, normalizeRecipe, favoriteRecipe } from "../components/recipe/recipeData";
import { LazyImage, PageError, CardSkeleton } from "../components/recipe/recipeUI";
import backendUrlV1 from "../urls/backendUrl";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getWikipediaSlug(ingredient) {
    let text = ingredient.toLowerCase()
        .replace(/\(.*?\)|\[.*?\]|\{.*?\}/g, "")
        .replace(/\d+\/\d+|\d+/g, "")
        .replace(
            /\b(grams?|kg|g|ml|l|tbsp?|tsp?|tablespoons?|teaspoons?|cups?|fl_oz|oz|pounds?|lb|pinch|pieces?|of|and|or|to|for|a|an|fresh|chopped|sliced|diced|minced|finely|coarsely)\b/gi,
            "",
        )
        .replace(/[.,;:]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const words = text.split(" ");
    const core = words.length > 3 ? words.slice(-2).join(" ") : text;
    return core.replace(/\s+/g, "_");
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function RecipeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthorized } = useContextManager();

    const { data: recipe, loading, error, reload } = useRecipe(id);

    // Scroll to top when recipe id changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [id]);

    // ── Loading ──
    if (loading) {
        return (
            <div className="max-w-[1200px] mx-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
                    {/* Left skeleton */}
                    <div className="space-y-4">
                        <div className="aspect-[4/3] rounded-xl animate-pulse bg-neutral-800" />
                        <div className="bg-neutral-900 rounded-xl p-4 space-y-3">
                            <div className="h-4 w-2/3 bg-neutral-800 rounded animate-pulse" />
                            <div className="h-8 bg-neutral-800 rounded animate-pulse" />
                            <div className="h-8 bg-neutral-800 rounded animate-pulse" />
                        </div>
                    </div>
                    {/* Right skeleton */}
                    <div className="space-y-4">
                        <div className="h-8 w-3/4 bg-neutral-800 rounded animate-pulse" />
                        <div className="h-4 w-1/2 bg-neutral-800 rounded animate-pulse" />
                        <div className="flex gap-3">
                            <div className="h-10 w-32 bg-neutral-800 rounded-lg animate-pulse" />
                            <div className="h-10 w-10 bg-neutral-800 rounded-lg animate-pulse" />
                        </div>
                        <div className="space-y-2 mt-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-11 bg-neutral-900 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── 404 — recipe not in API, try mock fallback ──
    if (error?.status === 404 || (!loading && !recipe)) {
        const fallback = MOCK_RECIPES.find((r) => r.id === id);
        if (fallback) {
            return <RecipeDetailContent recipe={fallback} isAuthorized={isAuthorized} navigate={navigate} />;
        }
        return (
            <div className="max-w-[1000px] mx-auto px-6 py-12">
                <NotFoundCard id={id} navigate={navigate} isAuthorized={isAuthorized} />
            </div>
        );
    }

    // ── Other error ──
    if (error) {
        return (
            <div className="max-w-[1200px] mx-auto px-6 py-6">
                <PageError error={error} onRetry={reload} className="min-h-[60vh]" />
            </div>
        );
    }

    return <RecipeDetailContent recipe={recipe} isAuthorized={isAuthorized} navigate={navigate} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail content (shared by live + mock paths)
// ─────────────────────────────────────────────────────────────────────────────

function RecipeDetailContent({ recipe, isAuthorized, navigate }) {
    return (
        <div className="max-w-[1200px] mx-auto px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
                <LeftColumn recipe={recipe} isAuthorized={isAuthorized} navigate={navigate} />
                <RightColumn recipe={recipe} isAuthorized={isAuthorized} navigate={navigate} />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Left column
// ─────────────────────────────────────────────────────────────────────────────

function LeftColumn({ recipe, isAuthorized, navigate }) {
    const timesForked = recipe.lineage?.forksCount ?? recipe.stats?.forks ?? 0;

    return (
        <div className="space-y-6">
            <div className="rounded-xl overflow-hidden shadow-sm">
                <LazyImage
                    src={recipe.media.imageUrl}
                    alt={recipe.title}
                    aspectClass="w-full h-[260px]"
                />
            </div>

            <div className="bg-[#0f0f0f] rounded-xl p-4 space-y-3 border border-white/5">
                <h3 className="text-sm font-medium text-white">This Recipe Has Evolved</h3>
                <div className="space-y-2 text-sm">
                    <EvolutionRow label="Forked" value={`${timesForked} times`} />
                    <EvolutionRow label="Improved" value={`${recipe.lineage?.improvementsCount ?? 0} times`} />
                </div>

                {!isAuthorized && (
                    <button
                        onClick={() => navigate("/login")}
                        className="w-full mt-3 text-sm text-neutral-200 hover:text-white flex items-center justify-center gap-2 bg-black/30 py-2 rounded-lg border border-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                    >
                        <Lock size={14} />
                        Sign in to see all ingredients
                    </button>
                )}
            </div>
        </div>
    );
}

function EvolutionRow({ label, value }) {
    return (
        <div className="flex items-center justify-between bg-black/20 px-3 py-2 rounded-lg">
            <span className="text-neutral-300">{label}</span>
            <span className="text-neutral-400 text-xs">{value}</span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Right column
// ─────────────────────────────────────────────────────────────────────────────

function RightColumn({ recipe, isAuthorized, navigate }) {
    const [isFavoriteRecipe, setFavoriteRecipe] = useState(false);
    console.log(recipe);
    const toggleFavorite = () => {
        if (isAuthorized) {
            if (favoriteRecipe(recipe.id)) {
                setFavoriteRecipe(!isFavoriteRecipe);
            };
        }
    }
    useEffect(() => {
        setFavoriteRecipe(recipe.status.isFavorited)
    }, [recipe]);
    return (
        <div className="space-y-6">
            {/* Title */}
            <div>
                <h1 className="text-2xl font-semibold text-white">{recipe.title}</h1>
                {recipe.body && (
                    <p className="text-neutral-400 text-sm mt-1">{recipe.body}</p>
                )}
            </div>

            {/* Author + stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => { window.open(`/profile/${recipe.author.username}`, "_blank") }}>
                    <img
                        src={recipe.author?.avatar_url || `https://api.dicebear.com/7.x/thumbs/svg?seed=${recipe.author.username}`}
                        className="w-6 h-6 rounded-full bg-neutral-800"
                        alt={`${recipe.author.username} avatar`}
                        loading="lazy"
                    />
                    <span className="text-neutral-300">{recipe.author.username}</span>
                </div>

                <StatBadge icon={GitFork} value={`${recipe.lineage.forksCount} forks`} />
                <StatBadge icon={Eye} value={`${recipe.stats.views.toLocaleString()} views`} />

                {recipe.meta?.timeMinutes != null && (
                    <StatBadge icon={Clock} value={`${recipe.meta.timeMinutes} min`} />
                )}
                {recipe.meta?.difficulty && (
                    <StatBadge icon={Flame} value={recipe.meta.difficulty} className="capitalize" />
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    disabled={!isAuthorized}
                    aria-disabled={!isAuthorized}
                    onClick={() => navigate(`/recipes/${recipe.id}/fork`)}
                    className="disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-medium hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                >
                    <GitFork size={14} />
                    Fork this recipe
                </button>

                {!isAuthorized && (
                    <button
                        onClick={() => {
                            localStorage.setItem("redirectAfterLogin", window.location.pathname);
                            navigate("/login");
                        }}
                        className="text-sm text-orange-400 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                    >
                        <Lock size={14} />
                        Sign in to fork
                    </button>
                )}

                <button
                    aria-label="Like this recipe"
                    className="p-2 rounded-lg bg-[#141414] hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                    onClick={() => { toggleFavorite() }}
                >
                    <Heart size={16} className={`${isFavoriteRecipe ? "fill-red-600 text-red-600 " : "text-neutral-400 "}`} />
                </button>
            </div>

            {recipe.status.isDraft && (
                <div className="flex flex-col gap-3">
                    <p className="text-sm text-neutral-400">This recipe is a draft</p>
                    <button
                        disabled={!isAuthorized}
                        aria-disabled={!isAuthorized}
                        onClick={() => {
                            fetch(`${backendUrlV1}/recipes/${recipe.id}/publish`, { method: "POST", credentials: "include" });
                        }}
                        className="disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-medium hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 w-fit"
                    >
                        <Upload size={14} />
                        Publish this draft
                    </button>
                </div>
            )}

            {/* Moderation banner — shown to any viewer who reported, or moderators */}
            {recipe.moderation && (recipe.moderation.viewerReported || recipe.moderation.recentReports) && (
                <ModerationBanner moderation={recipe.moderation} />
            )}

            {/* Ingredients */}
            {recipe.ingredients?.length > 0 ? (
                <Ingredients ingredients={recipe.ingredients} />
            ) : (
                <p className="text-sm text-neutral-500 italic">Ingredients not available.</p>
            )}

            {/* Steps */}
            {recipe.steps?.length > 0 && (
                <Steps steps={recipe.steps} />
            )}
        </div>
    );
}

function StatBadge({ icon: Icon, value, className = "" }) {
    return (
        <span className={`flex items-center gap-1 text-neutral-300 ${className}`}>
            <Icon size={14} className="text-neutral-500" />
            <span className="text-neutral-400">{value}</span>
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Ingredients list
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ingredients
 * Accepts NormalizedIngredient[] = { id, name, isAnimal, isAllergen }
 * or legacy string[] (mock data already normalized by normalizeRecipe).
 */
function Ingredients({ ingredients }) {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">Ingredients</h3>
            <ul className="bg-[#141414] rounded-xl divide-y divide-white/5 overflow-hidden">
                {ingredients.map((item, i) => {
                    const name = typeof item === "string" ? item : item.name;
                    const slug = getWikipediaSlug(name);
                    const wikiUrl = `https://en.wikipedia.org/wiki/${slug}`;
                    const isAnimal = item?.isAnimal ?? false;
                    const isAllergen = item?.isAllergen ?? false;

                    return (
                        <li key={item?.id ?? i}>
                            <a
                                href={wikiUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-black/40 transition focus:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-orange-400"
                            >
                                <span className="text-neutral-300 flex items-center gap-2">
                                    <span className="text-orange-400" aria-hidden>•</span>
                                    {name}
                                    {/* Dietary / allergen badges */}
                                    {isAnimal && (
                                        <span title="Contains animal products" className="text-amber-500/70">
                                            <Leaf size={11} />
                                        </span>
                                    )}
                                    {isAllergen && (
                                        <span title="Common allergen" className="text-red-500/70">
                                            <AlertTriangle size={11} />
                                        </span>
                                    )}
                                </span>
                                <ChevronRight size={14} className="text-neutral-600 flex-none" aria-hidden />
                            </a>
                        </li>
                    );
                })}
            </ul>
            {/* Legend — only shown if any badge is used */}
            {ingredients.some((i) => i?.isAnimal || i?.isAllergen) && (
                <div className="flex items-center gap-4 text-xs text-neutral-500 px-1">
                    <span className="flex items-center gap-1"><Leaf size={11} className="text-amber-500/70" /> animal-derived</span>
                    <span className="flex items-center gap-1"><AlertTriangle size={11} className="text-red-500/70" /> allergen</span>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Steps
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Steps
 * Accepts NormalizedStep[] = { stepNumber, instruction, technique, estimatedMinutes }
 */
function Steps({ steps }) {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <ListOrdered size={18} className="text-neutral-500" />
                Steps
            </h3>
            <ol className="space-y-3">
                {steps.map((step, i) => (
                    <li
                        key={step.stepNumber ?? i}
                        className="flex gap-4 bg-[#141414] rounded-xl px-4 py-3"
                    >
                        {/* Step number bubble */}
                        <div className="flex-none w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 text-xs font-semibold flex items-center justify-center mt-0.5">
                            {step.stepNumber ?? i + 1}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm text-neutral-200 leading-relaxed">
                                {step.instruction}
                            </p>

                            <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                                {step.technique && (
                                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 capitalize">
                                        {step.technique}
                                    </span>
                                )}
                                {step.estimatedMinutes != null && (
                                    <span className="flex items-center gap-1">
                                        <Clock size={11} />
                                        {step.estimatedMinutes} min
                                    </span>
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Moderation Banner
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shown when:
 *   - The current viewer has filed a report (viewerReported = true)
 *   - The viewer is a moderator (recentReports present)
 *
 * Deliberately low-key — doesn't alarm other readers.
 */
function ModerationBanner({ moderation }) {
    const isMod = moderation.recentReports !== null;

    return (
        <div
            role="status"
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${isMod
                ? "bg-red-950/20 border-red-900/30 text-red-300"
                : "bg-amber-950/20 border-amber-900/30 text-amber-300"
                }`}
        >
            <Flag size={16} className="flex-none mt-0.5 opacity-70" />
            <div className="flex-1 min-w-0">
                {moderation.viewerReported ? (
                    <p>
                        You reported this recipe
                        {moderation.viewerReportReason && (
                            <span className="text-xs opacity-70 ml-1">· {moderation.viewerReportReason}</span>
                        )}
                    </p>
                ) : null}

                {/* Moderator summary */}
                {isMod && (
                    <>
                        <p className="font-medium">
                            {moderation.reportsCount} report{moderation.reportsCount !== 1 ? "s" : ""} filed
                        </p>
                        {moderation.recentReports?.length > 0 && (
                            <ul className="mt-2 space-y-1 text-xs opacity-80">
                                {moderation.recentReports.map((r) => (
                                    <li key={r.id} className="flex items-start gap-2">
                                        <span className="opacity-50">#{r.id}</span>
                                        <span className="font-medium capitalize">{r.reason}</span>
                                        {r.details && <span className="opacity-70 truncate">{r.details}</span>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Not found
// ─────────────────────────────────────────────────────────────────────────────

function NotFoundCard({ id, navigate, isAuthorized }) {
    const suggestions = MOCK_RECIPES.filter((r) => r.id !== id).slice(0, 3);

    return (
        <div>
            <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-none w-28 h-28 rounded-lg bg-gradient-to-br from-orange-600/30 to-orange-400/10 flex items-center justify-center text-orange-400">
                    <HandPlatter size={48} />
                </div>

                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-semibold text-white">Recipe not found</h2>
                    <p className="text-neutral-400 mt-1">
                        We couldn't find that recipe — it may have been removed or the link is incorrect.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                        <button
                            onClick={() => navigate("/recipes")}
                            className="px-4 py-2 rounded-lg bg-white text-black font-medium hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                        >
                            Browse Recipes
                        </button>
                        <button
                            onClick={() => navigate("/")}
                            className="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                        >
                            Home
                        </button>
                        {isAuthorized && (
                            <button
                                onClick={() => navigate("/recipes/create")}
                                className="px-4 py-2 rounded-lg bg-orange-500 text-black font-medium hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                            >
                                Create a Recipe
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {suggestions.length > 0 && (
                <div className="mt-8">
                    <h4 className="text-sm text-neutral-300 mb-3">You might like</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {suggestions.map((r) => (
                            <SuggestedCard key={r.id} recipe={r} onOpen={() => navigate(`/recipes/${r.id}`)} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function SuggestedCard({ recipe, onOpen }) {
    return (
        <article
            onClick={onOpen}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onOpen()}
            aria-label={`Open ${recipe.title}`}
            className="bg-black/30 rounded-lg overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
            <div className="h-32">
                <LazyImage src={recipe.media.imageUrl} alt={recipe.title} aspectClass="h-32" />
            </div>
            <div className="p-3">
                <h5 className="text-sm font-medium text-white line-clamp-2">{recipe.title}</h5>
                <p className="text-xs text-neutral-400 mt-1">
                    {recipe.author.username} · {recipe.meta?.timeMinutes ?? "?"} min
                </p>
            </div>
        </article>
    );
}