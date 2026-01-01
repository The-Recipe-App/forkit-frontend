import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FileText, Package } from "lucide-react";
import { useContextProps } from "../features/Contexts";

export default function NavBar({
    isOpen,
    isOverlay,
    navRef,
    footerVisible,
    onNavigate,
    isLoading,
}) {
    const location = useLocation();
    const [contextProps = {}] = useContextProps() || [];
    const navigate = useNavigate();

    const safeNavigate = (path) => {
        try {
            navigate(path);
            isCollapsed?.(false);
        } catch (err) {
            console.warn("Navigation error:", err);
        }
    };

    const NavItem = ({ icon: Icon, label, onClick }) => (
        <button
            onClick={onClick}
            className="
                w-full flex items-center gap-3
                px-3 py-3 rounded-md
                hover:bg-neutral-800
                transition-colors
            "
            title={isOpen ? label : undefined}
        >
            <Icon size={18} />
            {isOpen && <span>{label}</span>}
        </button>
    );

    return (
        <aside
            ref={navRef}
            className={`
        z-[90] w-64 bg-[#0f0f0f] text-white flex flex-col
        transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        ${isOverlay
                    ? "fixed top-0 left-0 h-screen z-50"
                    : "sticky top-[3.875rem] h-[calc(100vh-3.875rem)]"}
        ${footerVisible && !isLoading ? "top-0 min-h-screen max-h-screen" : "top-[3.875rem] h-[calc(100vh-3.875rem)]"}
    `}
        >
            {/* Nav content */}
            <nav className="flex-1 px-3 py-6">
                <ul className="space-y-1">
                    <NavItem
                        to="/"
                        icon={FileText}
                        label="Home"
                    />
                    <NavItem
                        to="/recipes"
                        icon={Package}
                        label="Recipes"
                    />
                </ul>
            </nav>
        </aside>
    );
}
