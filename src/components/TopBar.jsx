import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
    Home,
    Search,
    PlusCircle,
    Heart,
    Bell,
    User,
    LogOut,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Logo from "../features/Logo";
import { useMe } from "../hooks/useMe";
import { logout } from "../features/auth/authApi";
import Modal from "./popUpModal";

/* ───────────────────────── TopBar ───────────────────────── */

const TopBar = ({ isAuthorized, windowWidth, setSidebarMode }) => {
    const { data: me } = useMe(isAuthorized);
    const navigate = useNavigate();
    const reduce = useReducedMotion();

    const [showLogout, setShowLogout] = useState(false);
    const [showAuthGate, setShowAuthGate] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showCreateHint, setShowCreateHint] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);

    return (
        <header className="fixed z-50 w-full min-h-[67px] max-h-[67px] border-b border-gray-700 bg-black/65 backdrop-blur-md px-4 py-2 text-white shadow-lg">
            {/* ───────── MODALS ───────── */}
            <Modal
                isOpen={showLogout}
                lock
                type="warning"
                title="Log out?"
                description="You'll need to sign in again to access your account."
                primaryAction={{
                    label: "Log out",
                    onClick: async () => {
                        localStorage.setItem("redirectAfterLogin", window.location.pathname);
                        await logout();
                        setShowLogout(false);
                    },
                }}
                secondaryAction={{ label: "Cancel", onClick: () => setShowLogout(false) }}
            />

            <Modal
                isOpen={showAuthGate}
                showCloseButton
                type="info"
                title="Sign in required"
                description="You need an account to use this feature."
                primaryAction={{ label: "Sign in", onClick: () => navigate("/login") }}
                secondaryAction={{ label: "Create account", onClick: () => navigate("/register") }}
            />

            <Modal
                isOpen={showNotifications}
                type="info"
                title="Notifications"
                description="You're all caught up 🎉"
                primaryAction={{ label: "Close", onClick: () => setShowNotifications(false) }}
            />

            <Modal
                isOpen={showCreateHint}
                type="success"
                title="Create a recipe"
                description="Start from scratch or build on someone else's idea."
                primaryAction={{ label: "Start cooking", onClick: () => navigate("/create") }}
                secondaryAction={{ label: "Cancel", onClick: () => setShowCreateHint(false) }}
            />

            <Modal
                isOpen={sessionExpired}
                lock
                type="error"
                title="Session expired"
                description="Please sign in again to continue."
                primaryAction={{ label: "Sign in", onClick: () => navigate("/login") }}
            />
            {/* ───────── MODALS ───────── */}

            <div className="flex items-center justify-between gap-4">
                {/* LEFT */}
                <div className="flex items-center gap-2">
                    <motion.button
                        whileTap={reduce ? {} : { scale: 0.95 }}
                        onClick={() => setSidebarMode((o) => !o)}
                        className="w-10 h-10 rounded-md border border-gray-600 hover:bg-gray-700 transition"
                    >
                        ☰
                    </motion.button>
                    <Logo width={120} />
                </div>

                {/* CENTER SEARCH */}
                {windowWidth >= 600 && (
                    <div className="relative w-[45%] max-w-[400px]">
                        <Search size={18} className="absolute left-4 top-3 text-gray-400" />
                        <input
                            type="search"
                            placeholder="Search recipes, techniques, cooks…"
                            className="w-full pl-12 pr-4 py-2.5 rounded-full bg-neutral-800/70 border border-gray-600 placeholder-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                        />
                    </div>
                )}

                {/* RIGHT */}
                <div className="flex items-center gap-4">
                    {windowWidth > 1024 && (
                        <nav className="flex items-center gap-4">
                            <IconButton icon={Home} label="Home" onClick={() => navigate("/")} />
                            <IconButton
                                icon={Heart}
                                label="Favorites"
                                onClick={() => {
                                    if (!isAuthorized) return setShowAuthGate(true);
                                    setShowCreateHint(true);
                                }}
                            />
                        </nav>
                    )}

                    {isAuthorized && (
                        <IconButton icon={Bell} onClick={() => setShowNotifications(true)} />
                    )}

                    <ProfileButton
                        isAuthorized={isAuthorized}
                        me={me}
                        windowWidth={windowWidth}
                        setShowLogout={setShowLogout}
                    />
                </div>
            </div>
        </header>
    );
};

export default TopBar;

/* ───────────────────────── Helpers ───────────────────────── */

const IconButton = ({ icon: Icon, label, onClick }) => (
    <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="flex items-center gap-1 text-gray-300 hover:text-white transition"
    >
        <Icon size={20} />
        {label && <span className="text-sm">{label}</span>}
    </motion.button>
);

const DROPDOWN_VARIANTS = {
    default: {
        text: "text-gray-300 hover:text-white",
        icon: "text-gray-400",
    },
    danger: {
        text: "text-red-400 hover:text-red-300",
        icon: "text-red-400",
    },
};

const DropdownItem = ({ icon: Icon, label, variant = "default", rounded_top, rounded_bottom }) => {
    const styles = DROPDOWN_VARIANTS[variant];
    return (
        <div
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm ${styles.text} hover:bg-neutral-800 transition-colors ${rounded_top ? "rounded-t-lg" : ""
                } ${rounded_bottom ? "rounded-b-lg" : ""}`}
        >
            <Icon size={18} className={styles.icon} />
            <span>{label}</span>
        </div>
    );
};

const ProfileButton = ({ isAuthorized, me, windowWidth, setShowLogout }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();
    const reduce = useReducedMotion();

    const avatarSrc = me?.avatar_url
        ? `${me.avatar_url}?v=${me.avatar_changed_at}`
        : null;

    useEffect(() => {
        const click = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        const esc = (e) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", click);
        document.addEventListener("keydown", esc);
        return () => {
            document.removeEventListener("mousedown", click);
            document.removeEventListener("keydown", esc);
        };
    }, []);

    if (!isAuthorized) {
        return (
            <button
                className="flex items-center gap-1 text-gray-300 hover:text-white"
                onClick={() => { localStorage.setItem("redirectAfterLogin", window.location.pathname); navigate("/login"); }}
            >
                <User size={20} />
                <span className="text-sm">Sign In</span>
            </button>
        );
    }

    return (
        <div ref={ref} className="relative">
            <motion.button
                whileTap={reduce ? {} : { scale: 0.96 }}
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-3 rounded-full px-3 py-2 hover:bg-neutral-700/80 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
                <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-700">
                    {avatarSrc ? (
                        <img src={avatarSrc} className="w-full h-full object-cover" />
                    ) : (
                        <User size={16} className="m-auto text-gray-300" />
                    )}
                </div>

                {windowWidth > 1024 && (
                    <div className="text-left">
                        <div className="text-xs text-neutral-400">Signed in as</div>
                        <div className="text-sm font-semibold truncate max-w-[8rem]">
                            {me?.username}
                        </div>
                    </div>
                )}
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: reduce ? 0 : 0.18 }}
                        className="absolute right-0 mt-2 w-48 bg-black/95 border border-neutral-700 rounded-xl shadow-2xl z-50"
                    >
                        {windowWidth < 1024 && (
                            <div className="flex flex-row items-center gap-3 px-4 py-3 text-left border-b border-neutral-700 pointer-events-none">
                                <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-700">
                                    {avatarSrc ? (
                                        <img src={avatarSrc} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={16} className="m-auto text-gray-300" />
                                    )}
                                </div>
                                <div>
                                    <div className="text-xs text-neutral-400">Signed in as</div>
                                    <div className="text-sm font-semibold truncate max-w-[8rem]">
                                        {me?.username}
                                    </div>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => {
                                setOpen(false);
                                navigate("/profile");
                            }}
                            className="w-full text-left border-b border-neutral-700"
                        >
                            <DropdownItem icon={User} label="Profile" rounded_top />
                        </button>

                        {windowWidth < 1024 && (
                            <>
                                <button className="w-full text-left" onClick={() => navigate("/")}>
                                    <DropdownItem icon={Home} label="Home" />
                                </button>

                                {windowWidth <= 600 && (
                                    <button className="w-full text-left">
                                        <DropdownItem icon={Search} label="Search" />
                                    </button>
                                )}

                                <button className="w-full text-left">
                                    <DropdownItem icon={PlusCircle} label="Create" />
                                </button>

                                <button className="w-full text-left">
                                    <DropdownItem icon={Heart} label="Favorites" />
                                </button>
                            </>
                        )}

                        <button
                            onClick={() => {
                                setOpen(false);
                                setShowLogout(true);
                            }}
                            className="w-full text-left border-t border-neutral-700"
                        >
                            <DropdownItem
                                icon={LogOut}
                                label="Logout"
                                variant="danger"
                                rounded_bottom
                            />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
