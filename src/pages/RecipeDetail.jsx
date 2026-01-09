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
    const { isAuthorized } = useContextManager();
    const recipe = mockRecipesDetailed.find((r) => r.id === id);

    if (!recipe) return null;

    return (
        <div className="max-w-[1200px] mx-auto px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
                <MainColumn recipe={recipe} isAuthorized={isAuthorized} />
                <SideColumn isAuthorized={isAuthorized} />
            </div>
        </div>
    );
}

/* ───────────────────────── Main Column ───────────────────────── */

function MainColumn({ recipe, isAuthorized }) {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className="rounded-xl overflow-hidden">
                <img
                    src={recipe.media.hero_image}
                    alt={recipe.title}
                    className="w-full h-[360px] object-cover"
                />
            </div>

            {/* Title */}
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-white">
                    {recipe.title}
                </h1>
                <p className="text-sm text-neutral-400">
                    Crispy-edged, juicy burgers perfect for quick bite.
                </p>
            </div>

            {/* Author + stats */}
            <div className="flex items-center gap-4 text-sm text-neutral-400">
                <div className="flex items-center gap-2">
                    <img
                        src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${recipe.author.username}`}
                        className="w-6 h-6 rounded-full"
                        alt=""
                    />
                    <span className="text-neutral-300">
                        {recipe.author.username}
                    </span>
                </div>

                <span className="flex items-center gap-1">
                    <GitFork size={14} /> {recipe.stats.forks} forks
                </span>

                <span className="flex items-center gap-1">
                    <Eye size={14} /> 4.3k views
                </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                    disabled={!isAuthorized}
                    onClick={() =>
                        navigate(`/recipes/${recipe.id}/fork`)
                    }
                    className="disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-medium hover:bg-orange-600"
                >
                    <GitFork size={16} />
                    Fork this recipe
                </button>

                {!isAuthorized && (
                    <span className="text-sm text-neutral-400 flex items-center gap-2">
                        <Lock size={14} />
                        Sign in to save
                    </span>
                )}

                <button className="p-2 rounded-lg bg-[#141414] hover:bg-black/60">
                    <Heart size={16} className="text-neutral-400" />
                </button>
            </div>

            {/* Evolution */}
            <Section title="This Recipe Has Evolved">
                <p className="text-sm text-neutral-400 mb-3">
                    Original → 12 times → Improved 4 times
                </p>

                <EvolutionCard author="MicheelForks" text="added secret sauce" />
                <EvolutionCard author="GrillMaster" text="added caramelized onions" />
                <EvolutionCard author="BettyBuns" text="used brioche buns instead" />

                {!isAuthorized && (
                    <div className="mt-3 text-sm text-neutral-400 flex items-center gap-2">
                        <Lock size={14} />
                        Sign in to see all forks
                    </div>
                )}
            </Section>

            {/* Ingredients */}
            <Section title="Ingredients">
                <div className="bg-[#141414] rounded-xl divide-y divide-white/5">
                    {recipe.ingredients.map((item, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between px-4 py-3 text-sm"
                        >
                            <span className="text-neutral-300 flex items-center gap-2">
                                <span className="text-orange-400">•</span>
                                {item}
                            </span>
                            <ChevronRight size={14} className="text-neutral-600" />
                        </div>
                    ))}
                </div>
            </Section>

            {/* Steps */}
            <Section title="Steps">
                {!isAuthorized ? (
                    <div className="text-sm text-neutral-400 flex items-center gap-2">
                        <Lock size={14} />
                        Want to adjust things or techniques? Fork it.
                    </div>
                ) : (
                    recipe.steps.map((step, i) => (
                        <div key={i} className="text-sm text-neutral-300 py-1">
                            {i + 1}. {step}
                        </div>
                    ))
                )}
            </Section>
        </div>
    );
}

/* ───────────────────────── Side Column ───────────────────────── */

function SideColumn({ isAuthorized }) {
    return (
        <div className="bg-[#141414] rounded-xl p-5 h-fit">
            <h3 className="text-xl font-semibold text-white mb-2">
                Forkit
            </h3>

            <p className="text-sm text-neutral-400 mb-4">
                Recipes don’t evolve alone.
                <br />
                Fork it. Break it. Make it yours.
            </p>

            {!isAuthorized && (
                <>
                    <input
                        placeholder="Email"
                        className="w-full mb-2 bg-black/40 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    />
                    <input
                        placeholder="Password"
                        type="password"
                        className="w-full mb-4 bg-black/40 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    />

                    <button className="w-full bg-orange-500 text-black py-2 rounded-lg text-sm font-medium hover:bg-orange-600">
                        Continue
                    </button>

                    <p className="text-xs text-neutral-500 mt-3">
                        Don’t have an account? Sign up.
                    </p>
                </>
            )}
        </div>
    );
}

/* ───────────────────────── Small Components ───────────────────────── */

function Section({ title, children }) {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">{title}</h3>
            {children}
        </div>
    );
}

function EvolutionCard({ author, text }) {
    return (
        <div className="flex items-center justify-between bg-black/40 px-4 py-3 rounded-lg mb-2">
            <span className="text-sm text-neutral-300">
                <strong>{author}</strong> {text}
            </span>
            <span className="text-xs text-neutral-500">★★★★☆</span>
        </div>
    );
}

/* ───────────────────────── Mock Data (UNCHANGED) ───────────────────────── */

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