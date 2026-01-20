import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    GitFork,
    Clock,
    Flame,
    ChevronRight,
    Lock,
    Heart,
    Eye,
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
        <div className="max-w-[1200px] mx-auto px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
                {/* LEFT */}
                <LeftColumn recipe={recipe} isAuthorized={isAuthorized} />

                {/* RIGHT */}
                <RightColumn recipe={recipe} />
            </div>
        </div>
    );
}

/* ───────────────────────── Left Column ───────────────────────── */

function LeftColumn({ recipe, isAuthorized }) {
    return (
        <div className="space-y-6">
            {/* Image */}
            <div className="rounded-xl overflow-hidden">
                <img
                    src={recipe.media.hero_image}
                    alt={recipe.title}
                    className="w-full h-[260px] object-cover"
                />
            </div>

            {/* Evolution Card */}
            <div className="bg-[#141414] rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-medium text-white">
                    This Recipe Has Evolved
                </h3>

                <div className="space-y-2 text-sm">
                    <EvolutionRow label="Original" value="32 times" />
                    <EvolutionRow label="Improved" value="2 times" />
                </div>

                {!isAuthorized && (
                    <button
                        onClick={() => navigate("/login")}
                        className="w-full mt-3 text-sm text-neutral-400 hover:text-orange-400 flex items-center justify-center gap-2 bg-black/30 py-2 rounded-lg"
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
        <div className="flex items-center justify-between bg-black/30 px-3 py-2 rounded-lg">
            <span className="text-neutral-300">{label}</span>
            <span className="text-neutral-400 text-xs">{value}</span>
        </div>
    );
}

/* ───────────────────────── Right Column ───────────────────────── */

function RightColumn({ recipe }) {
    const { isAuthorized } = useContextManager();
    const navigate = useNavigate();
    return (
        <div className="space-y-6">
            {/* Title */}
            <div>
                <h1 className="text-2xl font-semibold text-white">
                    {recipe.title}
                </h1>
                <p className="text-neutral-400 text-sm mt-1">
                    Crispy-edged, juicy burgers perfect for a quick bite.
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

                <Stat icon={GitFork} value="150 forks" />
                <Stat icon={Eye} value="3.4k views" />
            </div>

            {/* Action row */}
            <div className="flex items-center gap-3">
                <button disabled={!isAuthorized} className="disabled:opacity-50 disabled:cursor-not-allowed  flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-black text-sm font-medium hover:bg-orange-600"
                    onClick={() => {
                        navigate('/recipes/' + recipe.id + '/fork');
                    }}
                >
                    Fork this recipe
                </button>
                {!isAuthorized && (
                    <button
                        onClick={() => {
                            localStorage.setItem("redirectAfterLogin", window.location.pathname);
                            navigate("/login");
                        }}
                        className="text-sm text-orange-400 flex items-center gap-2"
                    >
                        <Lock size={14} />
                        Sign in to fork
                    </button>
                )}

                <button className="p-2 rounded-lg bg-[#141414] hover:bg-black/60">
                    <Heart size={16} className="text-neutral-400" />
                </button>
            </div>

            {/* Ingredients */}
            <Ingredients recipe={recipe} />
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

function getWikipediaSlug(ingredient) {
    let text = ingredient.toLowerCase();

    // Remove anything inside brackets
    text = text.replace(/\(.*?\)|\[.*?\]|\{.*?\}/g, "");

    // Remove numbers & fractions
    text = text.replace(/\d+\/\d+|\d+/g, "");

    // Remove measurement units
    const units = [
        "grams", "gram", "kg", "g", "ml", "l", "tbsp", "tsp",
        "tablespoon", "teaspoon", "cup", "cups", "oz", "pound", "lb"
    ];
    const unitRegex = new RegExp(`\\b(${units.join("|")})\\b`, "gi");
    text = text.replace(unitRegex, "");

    // Remove filler words (but NOT descriptive ones like "ground")
    const fillers = [
        "of", "and", "or", "to", "for", "a", "an",
        "fresh", "chopped", "sliced", "diced", "minced",
        "finely", "coarsely"
    ];
    const fillerRegex = new RegExp(`\\b(${fillers.join("|")})\\b`, "gi");
    text = text.replace(fillerRegex, "");

    // Remove punctuation
    text = text.replace(/[.,;:]/g, "");

    // Normalize spaces
    text = text.replace(/\s+/g, " ").trim();

    // If phrase is long, take last 2–3 words (usually the actual ingredient)
    const words = text.split(" ");
    let core =
        words.length > 3
            ? words.slice(-2).join(" ")
            : text;

    // Convert to Wikipedia slug
    return core.replace(/\s+/g, "_");
}


/* ───────────────────────── Ingredients ───────────────────────── */

function Ingredients({ recipe }) {
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-medium text-white">
                Ingredients
            </h3>

            <div className="bg-[#141414] rounded-xl divide-y divide-white/5">
                {recipe.ingredients.map((item, i) => {
                    const slug = getWikipediaSlug(item);
                    const wikiUrl = `https://en.wikipedia.org/wiki/${slug}`;

                    return (
                        <a
                            key={i}
                            href={wikiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between px-4 py-3 text-sm hover:bg-black/40 transition"
                        >
                            <span className="text-neutral-300 flex items-center gap-2">
                                <span className="text-orange-400">•</span>
                                {item}
                            </span>

                            <ChevronRight size={14} className="text-neutral-600" />
                        </a>
                    );
                })}
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
