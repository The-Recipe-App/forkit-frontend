import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Clock,
    Flame,
    GitFork,
    PlayCircle,
    BadgeCheck,
    TrendingUp,
} from "lucide-react";
import { useContextManager } from "../features/ContextProvider";

/* ───────────────────────── Lazy Image ───────────────────────── */

function LazyImage({ src, alt, className }) {
    const [isVisible, setIsVisible] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "200px" }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className="w-full h-full bg-neutral-800 relative overflow-hidden">
            {isVisible && (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                    className={`
                        w-full h-full object-cover transition-opacity duration-500
                        ${loaded ? "opacity-100" : "opacity-0"}
                        ${className || ""}
                    `}
                />
            )}

            {!loaded && (
                <div className="absolute inset-0 animate-pulse bg-neutral-800" />
            )}
        </div>
    );
}

/* ───────────────────────── Recipe Surface ───────────────────────── */

export default function Recipes() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { isAuthorized, recipes, setRecipes } = useContextManager();
    const [loading, setLoading] = useState(true);

    const filters = useMemo(() => ({
        difficulty: params.get("difficulty"),
        tag: params.get("tag"),
    }), [params]);

    const filteredRecipes = useMemo(() => {
        return recipes.filter(recipe => {
            if (filters.difficulty && recipe.meta.difficulty !== filters.difficulty) return false;
            if (filters.tag && !recipe.tags.includes(filters.tag)) return false;
            return true;
        });
    }, [recipes, filters]);

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setRecipes(mockRecipes);
            setLoading(false);
        }, 500);
    }, [params]);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center text-neutral-400">
                Loading recipes…
            </div>
        );
    }

    return (
        <div className="px-6 py-6 max-w-[1500px] mx-auto">
            <SurfaceHeader />

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRecipes.map((recipe) => (
                    <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        isAuthorized={isAuthorized}
                        onOpen={() => navigate(`/recipes/${recipe.id}`)}
                    />
                ))}

                {filteredRecipes.length === 0 && (
                    <div className="col-span-full text-center text-neutral-500 py-16">
                        No recipes match these filters.
                    </div>
                )}
            </section>
        </div>
    );
}

/* ───────────────────────── Header ───────────────────────── */

function SurfaceHeader() {
    return (
        <header className="mb-6">
            <h1 className="text-3xl font-semibold text-white">Recipes</h1>
            <p className="text-neutral-400 mt-1 max-w-2xl">
                Recipes evolve here. Fork ideas, improve techniques,
                and discover what the community is cooking next.
            </p>
        </header>
    );
}

/* ───────────────────────── Recipe Card ───────────────────────── */

function RecipeCard({ recipe, isAuthorized, onOpen }) {
    return (
        <article
            onClick={onOpen}
            className="bg-black/40 rounded-xl overflow-hidden cursor-pointer hover:bg-neutral-700/20 transition group relative"
        >
            <div className="relative aspect-[4/3] overflow-hidden">
                <LazyImage
                    src={recipe.media.hero_image}
                    alt={recipe.title}
                    className="group-hover:translate-y-[-2px] transition-transform"
                />

                {recipe.media.has_video && (
                    <PlayCircle className="absolute inset-0 m-auto text-white/80" size={42} />
                )}

                <RecipeBadges recipe={recipe} />
            </div>

            <div className="p-4 space-y-3">
                <TitleBlock recipe={recipe} />
                <StatsRow recipe={recipe} />
                <TagRow tags={recipe.tags} />

                {!isAuthorized && (
                    <div className="pt-1 text-xs text-neutral-500">
                        🔒 Fork to customize & evolve
                    </div>
                )}
            </div>
        </article>
    );
}

/* ───────────────────────── Subcomponents ───────────────────────── */

function RecipeBadges({ recipe }) {
    return (
        <div className="absolute top-2 left-2 flex gap-2">
            {recipe.status.is_trending && <Badge icon={TrendingUp} label="Trending" />}
            {recipe.status.is_verified && <Badge icon={BadgeCheck} label="Verified" />}
        </div>
    );
}

function Badge({ icon: Icon, label }) {
    return (
        <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-black/60 text-white">
            <Icon size={12} />
            {label}
        </span>
    );
}

function TitleBlock({ recipe }) {
    return (
        <div>
            <h3 className="text-lg font-medium text-white line-clamp-1">{recipe.title}</h3>
            <p className="text-sm text-neutral-400">
                by {recipe.author.username}
                {recipe.lineage.is_fork && (
                    <span className="ml-2 text-xs text-neutral-500">· Forked</span>
                )}
            </p>
        </div>
    );
}

function StatsRow({ recipe }) {
    return (
        <div className="flex items-center gap-4 text-sm text-neutral-400">
            <span className="flex items-center gap-1">
                <GitFork size={14} />
                {recipe.lineage.forks_count}
            </span>
            <span className="flex items-center gap-1">
                <Clock size={14} />
                {recipe.meta.time_minutes} min
            </span>
            <span className="flex items-center gap-1 capitalize">
                <Flame size={14} />
                {recipe.meta.difficulty}
            </span>
        </div>
    );
}

function TagRow({ tags }) {
    return (
        <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-xs rounded bg-neutral-800 text-neutral-300">
                    {tag}
                </span>
            ))}
        </div>
    );
}

/* ───────────────────────── Mock Data ───────────────────────── */


const mockRecipes = [
    {
        id: "r1",
        slug: "juicy-smash-burgers",
        title: "Juicy Smash Burgers",
        media: {
            hero_image: "https://images.unsplash.com/photo-1550547660-d9450f859349",
            has_video: true,
        },
        author: { id: "u1", username: "BurgerDude" },
        lineage: {
            is_fork: false,
            depth: 0,
            forks_count: 150,
            improvements_count: 12,
        },
        stats: {
            views: 4300,
            forks: 150,
            likes: 820,
            used_by: 300,
        },
        meta: {
            time_minutes: 25,
            difficulty: "easy",
        },
        tags: ["quick", "comfort"],
        status: {
            is_trending: true,
            is_verified: true,
            is_experimental: false,
        },
        timestamps: {},
    },
    {
        id: "r2",
        slug: "creamy-garlic-pasta",
        title: "Creamy Garlic Pasta",
        media: {
            hero_image: "https://images.unsplash.com/photo-1525755662778-989d0524087e",
            has_video: false,
        },
        author: { id: "u2", username: "PastaQueen" },
        lineage: {
            is_fork: false,
            depth: 0,
            forks_count: 90,
            improvements_count: 6,
        },
        stats: {
            views: 2800,
            forks: 90,
            likes: 560,
            used_by: 210,
        },
        meta: {
            time_minutes: 20,
            difficulty: "easy",
        },
        tags: ["vegetarian", "comfort", "quick"],
        status: {
            is_trending: true,
            is_verified: false,
            is_experimental: false,
        },
        timestamps: {},
    },
    {
        id: "r3",
        slug: "crispy-chicken-tacos",
        title: "Crispy Chicken Tacos",
        media: {
            hero_image: "https://images.unsplash.com/photo-1719948515819-71265e1abb0d?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            has_video: true,
        },
        author: { id: "u3", username: "TacoMaster" },
        lineage: {
            is_fork: false,
            depth: 0,
            forks_count: 200,
            improvements_count: 18,
        },
        stats: {
            views: 5200,
            forks: 200,
            likes: 1100,
            used_by: 450,
        },
        meta: {
            time_minutes: 30,
            difficulty: "medium",
        },
        tags: ["mexican", "street-food", "non-vegetarian"],
        status: {
            is_trending: true,
            is_verified: true,
            is_experimental: false,
        },
        timestamps: {},
    },
    {
        id: "r4",
        slug: "spicy-ramen-hack",
        title: "Spicy Ramen Hack",
        media: {
            hero_image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624",
            has_video: true,
        },
        author: { id: "u6", username: "NoodleNerd" },
        lineage: {
            is_fork: true,
            depth: 1,
            forks_count: 45,
            improvements_count: 3,
        },
        stats: {
            views: 1600,
            forks: 45,
            likes: 390,
            used_by: 120,
        },
        meta: {
            time_minutes: 10,
            difficulty: "easy",
        },
        tags: ["quick", "spicy", "experimental"],
        status: {
            is_trending: false,
            is_verified: false,
            is_experimental: true,
        },
        timestamps: {},
    },
    {
        id: "r5",
        slug: "vegan-buddha-bowl",
        title: "Vegan Buddha Bowl",
        media: {
            hero_image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
            has_video: false,
        },
        author: { id: "u8", username: "PlantPowered" },
        lineage: {
            is_fork: false,
            depth: 0,
            forks_count: 70,
            improvements_count: 5,
        },
        stats: {
            views: 2100,
            forks: 70,
            likes: 480,
            used_by: 180,
        },
        meta: {
            time_minutes: 25,
            difficulty: "easy",
        },
        tags: ["vegan", "healthy"],
        status: {
            is_trending: false,
            is_verified: true,
            is_experimental: false,
        },
        timestamps: {},
    },
];

