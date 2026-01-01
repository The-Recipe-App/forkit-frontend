import { useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
    Home,
    Search,
    PlusCircle,
    Heart,
    Bell,
    User
} from "lucide-react";
import { AlignJustify } from "lucide-react";
import Logo from "../features/Logo";

const TopBar = ({ isAuthorized, windowWidth, footerVisible, setSidebarMode }) => {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const dropdownRef = useRef(null);

    /* Close dropdown on outside click */
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setMobileOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <header
            className={`
                border-b fixed w-full border-gray-700
                bg-[#393939] bg-opacity-[31%] text-white
                px-4 py-2 shadow-lg z-50
                ${footerVisible ? "relative" : "fixed top-0"}
            `}
        >
            <div className="flex items-center justify-between w-full gap-4">
                {/* LEFT: Logo */}
                <div
                    className="flex items-center gap-2"
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                >
                    <button
                            onClick={() => setSidebarMode(o => !o)}
                            className="
                        flex items-center justify-center
                        w-10 h-10 rounded-md
                        border border-gray-600
                        shadow-md
                        hover:bg-gray-700
                                transition-colors
                                "
                            title="Toggle sidebar (Ctrl+B)"
                        >
                            ☰
                        </button>
                    
                    <Logo width={120} />
                </div>
                {/* CENTER: Desktop Main Actions */}
                {/* {!isAuthorized && windowWidth > 1024 && (
                    <nav className="flex items-center md:gap-1 lg:gap-6">
                        <IconButton icon={Home} label="Home" />
                        <IconButton icon={PlusCircle} label="Create" />
                        <IconButton icon={Heart} label="Favorites" />
                    </nav>
                )} */}
                {!isAuthorized && windowWidth >= 600 && (
                    <div className="relative flex items-center w-full md:w-96">
                        {/* Search Icon */}
                        <div className="absolute left-4 pointer-events-none text-gray-400">
                            <Search size={18} />
                        </div>

                        {/* Input */}
                        <input
                            type="search"
                            placeholder="Search recipes, techniques, cooks…"
                            className="
                                w-full
                                pl-12 pr-4 py-2.5
                                rounded-full
                                bg-neutral-800/70
                                border border-gray-600
                                text-white placeholder-neutral-400
                                shadow-md

                                focus:outline-none
                                focus:border-orange-500
                                focus:ring-1/2 focus:ring-orange-500/90

                                transition
                            "
                        />
                    </div>
                )}


                {/* RIGHT: Notifications + Profile */}
                <div className="flex items-center justify-between">

                    <div className="flex items-center gap-4">
                        {isAuthorized && <IconButton icon={Bell} />}
                        <ProfileButton isAuthorized={isAuthorized} />
                    </div>
                    {/* CENTER: Mobile Dropdown */}
                    {!isAuthorized && windowWidth <= 1024 && (
                        <div className="relative text-white" ref={dropdownRef}>
                            <button
                                onClick={() => setMobileOpen(o => !o)}
                                className="flex items-center justify-center w-10 h-10 rounded-md shadow-md hover:bg-neutral-800 transition-colors"
                                title="Menu"
                            >
                                <div className="flex gap-1">
                                    <span className="w-1 h-1 rounded-full bg-white" />
                                    <span className="w-1 h-1 rounded-full bg-white" />
                                    <span className="w-1 h-1 rounded-full bg-white" />
                                </div>
                            </button>


                            {mobileOpen && (
                                <div
                                    className="
                                absolute right-0 top-12
                                w-52 rounded-lg
                                bg-[#2f2f2f]
                                border border-gray-700
                                shadow-xl overflow-hidden
                            "
                                >
                                    <DropdownItem icon={Home} label="Home" />
                                    {windowWidth <= 600 && <DropdownItem icon={Search} label="Search" />}
                                    <DropdownItem icon={PlusCircle} label="Create" />
                                    <DropdownItem icon={Heart} label="Favorites" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
};

export default TopBar;

/* ---------------- Components ---------------- */

const IconButton = ({ icon: Icon, label }) => (
    <button
        className="
            flex items-center gap-1
            text-gray-300 hover:text-white
            transition-colors
        "
        title={label}
    >
        <Icon size={20} />
        {label && <span className="text-sm">{label}</span>}
    </button>
);

const DropdownItem = ({ icon: Icon, label }) => (
    <button
        className="
            w-full flex items-center gap-3
            px-4 py-3 text-sm
            text-gray-300 hover:text-white
            hover:bg-gray-700
            transition-colors
        "
    >
        <Icon size={18} />
        <span>{label}</span>
    </button>
);

const ProfileButton = ({ isAuthorized }) => {
    return isAuthorized ? (
        <button
            className="
                w-9 h-9 flex items-center justify-center
                rounded-full bg-gray-700
                hover:bg-gray-600 transition-colors
            "
            title="Profile"
        >
            <User size={18} />
        </button>
    ) : (
        <button
            className="
                flex items-center gap-1
                text-gray-300 hover:text-white
                transition-colors
            "
            title="Login"
        >
            <User size={20} />
            <span className="text-sm">Login</span>
        </button>
    );
};
