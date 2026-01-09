import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    GitFork,
    Lock,
    Heart,
    Eye,
    ChevronRight,
} from "lucide-react";
import { useContextManager } from "../features/ContextProvider";

/* ───────────────────────── Page ───────────────────────── */

export default function RecipeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthorized } = useContextManager();

    const recipe = mockRecipesDetailed.find((r) => r.id === id);
    if (!recipe) return null;

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-10">
                <LeftColumn recipe={recipe} isAuthorized={isAuthorized} />
                <RightColumn recipe={recipe} isAuthorized={isAuthorized} />
            </div>
        </div>
    );
}

/* ───────────────────────── Left Column ───────────────────────── */

function LeftColumn({ recipe, isAuthorized }) {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            {/* Hero Image */}
            <div className="relative rounded-2xl overflow-hidden">
                <img
                    src={recipe.media.hero_image}
                    alt={recipe.title}
                    className="w-full h-[320px] object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
            </div>

            {/* Evolution Card */}
            <div className="bg-[#111] rounded-2xl p-5 space-y-4 border border-white/5">
                <h3 className="text-sm font-semibold text-white tracking-wide">
                    This Recipe Has Evolved
                </h3>

                <EvolutionRow label="Original" value="12 times" />
                <EvolutionRow label="Improved" value="4 times" />

                {!isAuthorized && (
                    <button
                        onClick={() => navigate("/login")}
                        className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-orange-400 bg-black/40 py-2 rounded-lg"
                    >
                        <Lock size={14} />
                        Sign in to see all forks
                    </button>
                )}
            </div>
        </div>
    );
}

function EvolutionRow({ label, value }) {
    return (
        <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-black/40 hover:bg-black/60 transition">
            <span className="text-neutral-300">{label}</span>
            <span className="text-xs text-neutral-400">{value}</span>
        </div>
    );
}

/* ───────────────────────── Right Column ───────────────────────── */

function RightColumn({ recipe, isAuthorized }) {
    const navigate = useNavigate();

    return (
        <div className="space-y-8">
            {/* Title */}
            <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-white leading-tight">
                    {recipe.title}
                </h1>
                <p className="text-sm text-neutral-400 max-w-xl">
                    Crispy-edged, juicy burgers perfect for a quick bite.
                </p>
            </div>

            {/* Author + Stats */}
            <div className="flex flex-wrap items-center gap-5 text-sm text-neutral-400">
                <div className="flex items-center gap-2">
                    <img
                        src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${recipe.author.username}`}
                        className="w-7 h-7 rounded-full"
                        alt=""
                    />
                    <span className="text-neutral-300 font-medium">
                        {recipe.author.username}
                    </span>
                </div>

                <Stat icon={GitFork} value="150 forks" />
                <Stat icon={Eye} value="4.3k views" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <button
                    disabled={!isAuthorized}
                    onClick={() => navigate(`/recipes/${recipe.id}/fork`)}
                    className="disabled:opacity-50 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-black text-sm font-semibold hover:bg-orange-600 transition"
                >
                    <GitFork size={16} />
                    Fork this recipe
                </button>

                {!isAuthorized && (
                    <button
                        onClick={() => navigate("/login")}
                        className="text-sm text-orange-400 flex items-center gap-2"
                    >
                        <Lock size={14} />
                        Sign in to fork
                    </button>
                )}

                <button className="p-2 rounded-xl bg-[#111] hover:bg-black/60">
                    <Heart size={16} className="text-neutral-400" />
                </button>
            </div>

            {/* Ingredients */}
            <Ingredients recipe={recipe} />

            {/* Steps */}
            <Steps recipe={recipe} isAuthorized={isAuthorized} />

            {/* Fork History */}
            <ForkHistory recipe={recipe} isAuthorized={isAuthorized} />
        </div>
    );
}

function Stat({ icon: Icon, value }) {
    return (
        <span className="flex items-center gap-1">
            <Icon size={14} />
            {value}
        </span>
    );
}

/* ───────────────────────── Ingredients ───────────────────────── */

function Ingredients({ recipe }) {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">Ingredients</h3>

            <div className="bg-[#111] rounded-2xl divide-y divide-white/5 border border-white/5">
                {recipe.ingredients.map((item, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between px-5 py-3 text-sm hover:bg-black/40 transition"
                    >
                        <span className="text-neutral-300 flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                            {item}
                        </span>
                        <ChevronRight size={14} className="text-neutral-600" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ───────────────────────── Steps ───────────────────────── */

function Steps({ recipe, isAuthorized }) {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">Steps</h3>

            <div className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
                {!isAuthorized ? (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-neutral-400">
                        <Lock size={14} />
                        Sign in to view steps
                    </div>
                ) : (
                    recipe.steps.map((step, i) => (
                        <div
                            key={i}
                            className="px-5 py-4 text-sm text-neutral-300 border-b border-white/5 last:border-none"
                        >
                            <span className="text-orange-400 font-medium mr-2">
                                {i + 1}.
                            </span>
                            {step}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

/* ───────────────────────── Fork History ───────────────────────── */

function ForkHistory({ recipe, isAuthorized }) {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">
                This Recipe Has Evolved
            </h3>

            <div className="space-y-2">
                {recipe.lineage.slice(0, 3).map((item, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between bg-[#111] px-4 py-3 rounded-xl border border-white/5"
                    >
                        <div className="text-sm text-neutral-300">
                            <span className="font-medium">{item.author}</span>{" "}
                            {item.change}
                        </div>
                        <span className="text-xs text-neutral-500">
                            ★★★★☆
                        </span>
                    </div>
                ))}

                {!isAuthorized && (
                    <div className="flex items-center justify-center gap-2 py-3 text-sm text-neutral-400 bg-black/40 rounded-xl">
                        <Lock size={14} />
                        Sign in to see all forks
                    </div>
                )}
            </div>
        </div>
    );
}

/* ───────────────────────── Mock Data ───────────────────────── */

const mockRecipesDetailed = [
    {
        id: "r1",
        slug: "juicy-smash-burgers",
        title: "Juicy Smash Burgers",
        media: {
            hero_image: "https://images.unsplash.com/photo-1550547660-d9450f859349",
            has_video: true,
        },
        author: { username: "BurgerDude" },
        meta: { time_minutes: 25, difficulty: "easy" },
        stats: { forks: 150 },
        ingredients: [
            "1 lb ground beef (80/20)",
            "Salt",
            "Pepper",
            "Burger buns",
            "American cheese",
        ],
        steps: [
            "Heat skillet until very hot.",
            "Divide beef into balls.",
            "Smash beef balls onto pan.",
            "Season generously.",
            "Flip and add cheese.",
            "Toast buns and assemble.",
        ],
        lineage: [
            { author: "BurgerDude", change: "Original recipe" },
            { author: "GrillMaster", change: "Added caramelized onions" },
            { author: "BettyBuns", change: "Used brioche buns" },
        ],
        forks: [
            { id: "f1", author: "GrillMaster", summary: "Sweeter onions" },
            { id: "f2", author: "SpiceLord", summary: "Added chili oil" },
        ],
    },

    {
        id: "r2",
        slug: "creamy-garlic-pasta",
        title: "Creamy Garlic Pasta",
        media: {
            hero_image: "https://images.unsplash.com/photo-1525755662778-989d0524087e",
            has_video: false,
        },
        author: { username: "PastaQueen" },
        meta: { time_minutes: 20, difficulty: "easy" },
        stats: { forks: 90 },
        ingredients: [
            "200g pasta",
            "4 cloves garlic",
            "1 cup cream",
            "Parmesan cheese",
            "Olive oil",
            "Salt",
        ],
        steps: [
            "Boil pasta until al dente.",
            "Sauté garlic in olive oil.",
            "Add cream and simmer.",
            "Toss pasta with sauce.",
            "Finish with parmesan.",
        ],
        lineage: [
            { author: "PastaQueen", change: "Original recipe" },
            { author: "CheesyLife", change: "Extra parmesan" },
        ],
        forks: [
            { id: "f3", author: "HerbAddict", summary: "Added basil and thyme" },
        ],
    },

    {
        id: "r3",
        slug: "crispy-chicken-tacos",
        title: "Crispy Chicken Tacos",
        media: {
            hero_image: "https://images.unsplash.com/photo-1719948515819-71265e1abb0d?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            has_video: true,
        },
        author: { username: "TacoMaster" },
        meta: { time_minutes: 30, difficulty: "medium" },
        stats: { forks: 200 },
        ingredients: [
            "Chicken thighs",
            "Taco seasoning",
            "Corn tortillas",
            "Oil for frying",
            "Lettuce",
            "Sour cream",
        ],
        steps: [
            "Season chicken generously.",
            "Fry until crispy.",
            "Warm tortillas.",
            "Assemble tacos with toppings.",
        ],
        lineage: [
            { author: "TacoMaster", change: "Original recipe" },
            { author: "CrunchKing", change: "Double-fried chicken" },
            { author: "FreshBite", change: "Added pickled onions" },
        ],
        forks: [
            { id: "f4", author: "CrunchKing", summary: "Extra crispy method" },
            { id: "f5", author: "HeatSeeker", summary: "Spicy chipotle sauce" },
        ],
    },

    {
        id: "r4",
        slug: "spicy-ramen-hack",
        title: "Spicy Ramen Hack",
        media: {
            hero_image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624",
            has_video: true,
        },
        author: { username: "NoodleNerd" },
        meta: { time_minutes: 10, difficulty: "easy" },
        stats: { forks: 45 },
        ingredients: [
            "Instant ramen",
            "Chili oil",
            "Soy sauce",
            "Soft-boiled egg",
            "Green onions",
        ],
        steps: [
            "Cook ramen noodles.",
            "Mix seasoning with chili oil.",
            "Add noodles and broth.",
            "Top with egg and onions.",
        ],
        lineage: [
            { author: "NoodleNerd", change: "Original hack" },
            { author: "Eggcellent", change: "Jammy egg technique" },
        ],
        forks: [
            { id: "f6", author: "FireTongue", summary: "Extra chili oil" },
        ],
    },

    {
        id: "r5",
        slug: "vegan-buddha-bowl",
        title: "Vegan Buddha Bowl",
        media: {
            hero_image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
            has_video: false,
        },
        author: { username: "PlantPowered" },
        meta: { time_minutes: 25, difficulty: "easy" },
        stats: { forks: 70 },
        ingredients: [
            "Quinoa",
            "Roasted chickpeas",
            "Sweet potato",
            "Avocado",
            "Tahini sauce",
        ],
        steps: [
            "Cook quinoa.",
            "Roast chickpeas and sweet potatoes.",
            "Slice avocado.",
            "Assemble bowl and drizzle sauce.",
        ],
        lineage: [
            { author: "PlantPowered", change: "Original recipe" },
            { author: "GreenChef", change: "Added kale" },
        ],
        forks: [
            { id: "f7", author: "SauceBoss", summary: "Spicy tahini sauce" },
        ],
    },
];
