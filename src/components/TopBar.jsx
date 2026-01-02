import { useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
    Home,
    Search,
    PlusCircle,
    Heart,
    Bell,
    User,
    Lock,
    Book,
    LogOut
} from "lucide-react";
import { AlignJustify } from "lucide-react";
import Logo from "../features/Logo";
import { set } from "date-fns";
import backendUrlV1 from "../urls/backendUrl";
import { logout } from "../features/auth/authApi";


const TopBar = ({ setIsAuthorized, isAuthorized, windowWidth, footerVisible, setSidebarMode, setWantsToLogIn }) => {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [avatarUrl, setAvatarUrl] = useState(null);

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

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setMobileOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* Fetch current user (cookie-based auth) */
    useEffect(() => {
        if (!isAuthorized) {
            setAvatarUrl(null);
            return;
        }

        fetch(`${backendUrlV1}auth/me`, {
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) throw new Error("Not authenticated");
                return res.json();
            }) 
            .then((data) => {
                console.log(data.avatar_url);
                setAvatarUrl(data?.avatar_url);
            })
            .catch(() => {
                setAvatarUrl(null);
            });
    }, [isAuthorized]);

    return (
        <header
            className={`
                border-b fixed w-full border-gray-700
                bg-[#393939] bg-opacity-[31%] text-white
                px-4 py-2 shadow-lg z-50 min-h-[62px]
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
                        <ProfileButton isAuthorized={isAuthorized} avatarUrl={avatarUrl} />
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

const ProfileButton = ({ isAuthorized, avatarUrl, onLogout }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!isAuthorized) {
        return (
            <div className="flex items-center gap-2">
                <button
                    className="flex items-center gap-1 text-gray-300 hover:text-white transition"
                    onClick={() => (window.location.href = "/login")}
                >
                    <User size={20} />
                    <span className="text-sm">Login</span>
                </button>
                <button
                    className="flex items-center gap-1 text-gray-300 hover:text-white transition"
                    onClick={() => (window.location.href = "/register")}
                >
                    <Book size={20} />
                    <span className="text-sm">Register</span>
                </button>
            </div>
        );
    }

    return (
        <div ref={ref} className="relative">
            {/* Avatar button */}
            <div
                role="button"
                tabIndex={0}
                onClick={() => setOpen((o) => !o)}
                className="
                    w-10 h-10 rounded-full cursor-pointer
                    overflow-hidden flex items-center justify-center
                    bg-gray-700 hover:ring-2 hover:ring-orange-500
                    transition
                "
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="Profile avatar"
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                    />
                ) : (
                    <User size={18} className="text-gray-300" />
                )}
            </div>

            {/* Dropdown */}
            {open && (
                <div
                    className="
                        absolute right-0 mt-2 w-40
                        bg-gray-900 border border-gray-700
                        rounded-lg shadow-lg z-50
                        overflow-hidden
                    "
                >
                    <button
                        className="
                            w-full px-4 py-2 text-left text-sm
                            text-gray-200 hover:bg-gray-800
                            transition
                        "
                        onClick={() => {
                            setOpen(false);
                        }}
                    >
                        Profile
                    </button>

                    <button
                        className="
                            w-full px-4 py-2 text-left text-sm
                            text-red-400 hover:bg-gray-800
                            transition flex items-center gap-2
                        "
                        onClick={() => {
                            setOpen(false);
                            logout();
                        }}
                    >
                        <LogOut size={14} />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};
