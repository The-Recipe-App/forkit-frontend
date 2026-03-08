// NavBar.jsx
// Filter logic entirely removed — now delegated to <RecipeFilters />.
// NavBar just handles navigation, the ambient sidebar widget, and the
// login prompt.  All filter state lives in the URL via RecipeFilters.

import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Home,
    BookOpen,
    Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useContextManager } from "../features/ContextProvider";
import RecipeFilters from "../components/recipe/RecipeFilters";

export default function NavBar({ setNavOpen, isOpen, isOverlay, navRef }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthorized, recipes = [] } = useContextManager();
    const reduce = useReducedMotion();

    const isRecipesPage = location.pathname === "/recipes";

    const showFiltersOnNavbar = useMemo(() => {
        return isRecipesPage && !isOverlay;
    }, [isRecipesPage, isOverlay]);

    // Ambient sidebar meta (non-recipes pages)
    const sidebarMeta = useMemo(() => {
        if (!recipes.length) return { recipeCount: 0, tagCount: 0 };
        const tags = new Set();
        recipes.forEach((r) => r.tags?.forEach((t) => tags.add(t.toLowerCase())));
        return { recipeCount: recipes.length, tagCount: tags.size };
    }, [recipes]);

    const sidebarVariants = {
        open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
        closed: { x: "-100%", transition: { duration: 0.18 } },
    };

    function nav(to) {
        navigate(to);
        if (isOverlay) setNavOpen(false);
    }

    return (
        <motion.aside
            ref={navRef}
            role="navigation"
            aria-label="Main sidebar"
            className={`z-[50] w-64 border-r border-gray-700 bg-black/65 ${isOverlay && "backdrop-blur-md"} text-white flex flex-col fixed bottom-0 top-[66.79px]`}
            initial={false}
            animate={isOpen ? "open" : "closed"}
            variants={reduce ? { open: { x: 0 }, closed: { x: 0 } } : sidebarVariants}
            aria-hidden={!isOpen && isOverlay}
        >
            <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">

                {/* Primary nav */}
                <div className="space-y-1">
                    <NavItem icon={Home} label="Home" to="/" onClick={() => nav("/")} />
                    <NavItem icon={BookOpen} label="Recipes" to="/recipes" onClick={() => nav("/recipes")} />
                </div>

                {/* Ambient widget on non-recipes pages */}
                {!isRecipesPage && (
                    <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 text-xs text-neutral-400">
                        <div className="flex items-center gap-2 text-neutral-300">
                            <Sparkles size={14} />
                            <span className="font-medium">Forkit</span>
                        </div>
                        <p>Recipes evolve here. Fork, tweak, improve.</p>
                        <div className="space-y-1">
                            <p>{sidebarMeta.recipeCount} recipes available</p>
                            <p>{sidebarMeta.tagCount} tags to explore</p>
                        </div>
                        <button
                            onClick={() => nav("/recipes")}
                            className="text-left text-orange-400 hover:text-orange-300 font-medium"
                        >
                            Explore recipes →
                        </button>
                    </div>
                )}

                {/* Filters — only on recipes page */}
                {showFiltersOnNavbar && (
                    <RecipeFilters collapsed={false} />
                )}

                {/* Login prompt */}
                {!isAuthorized && (
                    <div className="mt-auto p-3 rounded-lg border border-neutral-800 text-xs text-neutral-400">
                        Fork recipes to customize them.
                        <button
                            onClick={() => nav("/login")}
                            className="block mt-2 text-orange-400 hover:text-orange-300 font-medium"
                        >
                            Sign in →
                        </button>
                    </div>
                )}
            </nav>
        </motion.aside>
    );
}

/* ── NavItem ── */

const NavItem = ({ icon: Icon, label, to, onClick }) => {
    const location = useLocation();
    const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

    return (
        <button
            onClick={onClick}
            aria-current={isActive ? "page" : undefined}
            className={`
        group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
        text-[15px] font-medium transition-colors
        ${isActive ? "bg-neutral-800/80 text-white" : "text-neutral-300 hover:bg-neutral-800/80 hover:text-white"}
      `}
        >
            <Icon size={18} className="opacity-80 group-hover:opacity-100" />
            {label}
        </button>
    );
};