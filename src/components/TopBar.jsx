import { useLocation, useNavigate } from "react-router-dom";
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
import Modal from "./popUpModal";

const TopBar = ({ isAuthorized, windowWidth, setSidebarMode, setWantsToLogIn }) => {
    const location = useLocation();
    const [showLogout, setShowLogout] = useState(false);
    const [showAuthGate, setShowAuthGate] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showCreateHint, setShowCreateHint] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);

    const [mobileOpen, setMobileOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [avatarUrl, setAvatarUrl] = useState(null);

    const navigate = useNavigate();

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
        if (localStorage.getItem("avatarUrl")) {
            setAvatarUrl(localStorage.getItem("avatarUrl"));
            return;
        }

        fetch(`${backendUrlV1}/auth/me`, {
            credentials: "include",
        })
            .then((res) => {
                if (!res.ok) throw new Error("Not authenticated");
                return res.json();
            })
            .then((data) => {
                setAvatarUrl(data?.avatar_url);
                if (data?.avatar_url) {
                    localStorage.setItem("avatarUrl", data.avatar_url);
                }
            })
            .catch(() => {
                setAvatarUrl(null);
            });
    }, [isAuthorized]);

    return (
        <header
            className={`
                border-b w-full border-gray-700
                bg-[#393939] bg-opacity-[31%] text-white
                px-4 py-2 shadow-lg z-50 min-h-[62px]
                fixed
            `}
        >

            {/* MODALS */}
            <Modal
                isOpen={showLogout}
                lock
                type="warning"
                title="Log out?"
                description="You'll need to sign in again to access your account."
                primaryAction={{
                    label: "Log out",
                    onClick: async () => {
                        await logout();
                        setShowLogout(false);
                    },
                }}
                secondaryAction={{
                    label: "Cancel",
                    onClick: () => setShowLogout(false),
                }}
            >
                <p className="text-sm text-gray-400">
                    Unsaved changes may be lost.
                </p>
            </Modal>
            <Modal
                isOpen={showAuthGate}
                lock={false}
                showCloseButton
                onClose={() => setShowAuthGate(false)}
                type="info"
                title="Sign in required"
                description="You need an account to use this feature."
                primaryAction={{
                    label: "Sign in",
                    onClick: () => {
                        window.location.href = "/login";
                    },
                }}
                secondaryAction={{
                    label: "Create account",
                    onClick: () => {
                        window.location.href = "/register";
                    },
                }}
            >
                <p className="text-sm text-gray-400">
                    It's free and takes less than a minute.
                </p>
            </Modal>
            <Modal
                isOpen={showNotifications}
                lock={false}
                type="info"
                title="Notifications"
                description="You're all caught up 🎉"
                primaryAction={{
                    label: "Close",
                    onClick: () => setShowNotifications(false),
                }}
            >
                <div className="text-sm text-gray-400">
                    We'll notify you when something important happens.
                </div>
            </Modal>
            <Modal
                isOpen={showCreateHint}
                lock={false}
                type="success"
                title="Create a recipe"
                description="Start from scratch or build on someone else's idea."
                primaryAction={{
                    label: "Start cooking",
                    onClick: () => {
                        window.location.href = "/create";
                    },
                }}
                secondaryAction={{
                    label: "Cancel",
                    onClick: () => {
                        setShowCreateHint(false);
                    },
                }}

            >
                <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Write your own recipe</li>
                    <li>• Fork and improve others</li>
                    <li>• Track evolution over time</li>
                </ul>
            </Modal>
            <Modal
                isOpen={sessionExpired}
                lock
                type="error"
                title="Session expired"
                description="Please sign in again to continue."
                primaryAction={{
                    label: "Sign in",
                    onClick: () => {
                        window.location.href = "/login";
                    },
                }}
            />
            {/* MODALS */}

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
                        title="Toggle navigation menu"
                    >
                        ☰
                    </button>

                    <Logo width={120} />
                </div>
                {/* CENTER: Desktop Main Actions */}
                {windowWidth >= 600 && (
                    <div className="relative flex items-center w-[37.2452%] md:w-[45%] md:max-w-[400px]">
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
                        {windowWidth > 1024 && (
                            <nav className="flex items-center md:gap-1 lg:gap-6">
                                <IconButton onClick={() => navigate("/")} icon={Home} label="Home" />
                                <IconButton onClick={() => {
                                    if (!isAuthorized) {
                                        setShowAuthGate(true);
                                        return;
                                    } return setShowCreateHint(true);
                                }} icon={Heart} label="Favorites" />
                            </nav>
                        )}
                        {isAuthorized && <IconButton icon={Bell} />}
                        <ProfileButton dropdownRef={dropdownRef} windowWidth={windowWidth} isAuthorized={isAuthorized} avatarUrl={avatarUrl} setShowLogout={setShowLogout} />
                    </div>
                    {/* CENTER: Mobile Dropdown */}

                </div>

            </div>
        </header>
    );
};

export default TopBar;

/* ---------------- Components ---------------- */

const IconButton = ({ icon: Icon, label, onClick }) => (
    <button
        className="
            flex items-center gap-1
            text-gray-300 hover:text-white
            transition-colors
        "
        onClick={onClick}
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
            hover:bg-neutral-700
            transition-colorstext-left
            transition rounded-none
        "
    >
        <Icon size={18} />
        <span>{label}</span>
    </button>
);

const ProfileButton = ({ isAuthorized, avatarUrl, setShowLogout, dropdownRef, windowWidth }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();

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
                    <span className="text-sm">Sign In</span>
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
                absolute right-0 mt-2 w-44
                bg-neutral-900/95 backdrop-blur
                border border-neutral-700
                rounded-xl shadow-2xl z-50
                overflow-hidden
            "

                >
                    <button
                        className="
                            w-full px-4 py-2 text-left text-sm
                            text-gray-200 hover:bg-neutral-800
                            transition rounded-none
                        "
                        onClick={() => {
                            setOpen(false);
                            navigate("/profile");
                        }}
                    >
                        Profile
                    </button>
                    {windowWidth < 1024 && <div className="relative text-white" ref={dropdownRef}>
                        <div
                            className="
                                right-0 top-12
                                border-y border-neutral-700
                            "
                        >
                            <DropdownItem icon={Home} label="Home" />
                            {windowWidth <= 600 && <DropdownItem icon={Search} label="Search" />}
                            <DropdownItem icon={PlusCircle} label="Create" />
                            <DropdownItem icon={Heart} label="Favorites" />
                        </div>
                    </div>
                    }
                    <button
                        className="
                            w-full px-4 py-2 text-left text-sm
                            text-red-400 hover:bg-neutral-800
                            transition flex items-center gap-2 rounded-none
                        "
                        onClick={() => {
                            setOpen(false);
                            setShowLogout(true);
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
