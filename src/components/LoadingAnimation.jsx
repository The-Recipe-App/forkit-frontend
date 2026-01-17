// LoadingAnimation.jsx
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/* ───────── TEXT ───────── */
const PHASES = [
    "Igniting burners…",
    "Simmering ingredients…",
    "Seasoning flavors…",
    "Almost ready…",
];

const STALL_MESSAGES = [
    "Seems like the water is cold today…",
    "Giving the flavors a little extra time…",
    "Good things take patience…",
    "Letting it cook just right…",
];

const FINAL_MESSAGE = "Serving you a hot dish now!";

/* ───────── COMPONENT ───────── */
export default function LoadingScreen({ isLoading, shouldExit, setShouldExit }) {
    const [phase, setPhase] = useState(0);
    const [stall, setStall] = useState(0);
    const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
    const reduce = useReducedMotion();

    useEffect(() => {
        const onResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // Phase progression while loading
    useEffect(() => {
        if (phase >= PHASES.length - 1) return;
        const t = setTimeout(() => setPhase((p) => p + 1), 2000);
        return () => clearTimeout(t);
    }, [phase]);

    // Stall messages at final phase
    useEffect(() => {
        if (phase !== PHASES.length - 1 || !isLoading) return;
        const t = setInterval(() => setStall((s) => (s + 1) % STALL_MESSAGES.length), 4200);
        return () => clearInterval(t);
    }, [phase, isLoading]);

    // When loading finished, set shouldExit to begin loader exit animation
    useEffect(() => {
        if (!isLoading) {
            const t = setTimeout(() => setShouldExit(true), 700);
            return () => clearTimeout(t);
        }
    }, [isLoading, setShouldExit]);

    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;
    const orbits = isMobile ? [90] : isTablet ? [110, 160] : [140, 220, 300];

    // Motion variants
    const containerVariants = {
        initial: { opacity: 0 },
        enter: { opacity: 1, transition: { duration: 0.45 } },
        exit: { opacity: 0, transition: { duration: 0.45 } },
    };

    const flameAnimation = reduce
        ? {}
        : {
            scale: [1, 1.45, 1],
            backgroundColor: ["#F97316", "#F59E0B", "#EF4444", "#B75EFC"],
            boxShadow: ["0 0 0 rgba(0,0,0,0)", "0 0 30px rgba(249,115,22,0.9)", "0 0 0 rgba(0,0,0,0)"],
        };

    return (
        <AnimatePresence>
            {!shouldExit && (
                <motion.div
                    role="status"
                    aria-live="polite"
                    variants={containerVariants}
                    initial="initial"
                    animate="enter"
                    exit="exit"
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                >
                    {/* Core flame */}
                    <motion.div
                        className="relative z-20 rounded-full"
                        style={{
                            width: isMobile ? 18 : 28,
                            height: isMobile ? 18 : 28,
                        }}
                        animate={flameAnimation}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Orbits */}
                    {orbits.map((size, i) => {
                        const dur = 10 + i * 6;
                        const reverse = i % 2 === 1;
                        const dotSize = isMobile ? 4 : 6;
                        return (
                            <motion.div
                                key={size}
                                className="absolute pointer-events-none"
                                style={{
                                    width: size,
                                    height: size,
                                }}
                                animate={reduce ? {} : { rotate: reverse ? -360 : 360 }}
                                transition={reduce ? {} : { duration: dur, repeat: Infinity, ease: "linear" }}
                            >
                                {["#F59E0B", "#22C55E", "#F97316", "#B75EFC"].map((c, ii) => (
                                    <span
                                        key={ii}
                                        className="absolute rounded-full"
                                        style={{
                                            width: dotSize,
                                            height: dotSize,
                                            top: "50%",
                                            left: "50%",
                                            transform: `rotate(${(360 / 4) * ii}deg) translate(${size / 2}px)`,
                                            backgroundColor: c,
                                            boxShadow: `0 0 10px ${c}`,
                                        }}
                                    />
                                ))}
                            </motion.div>
                        );
                    })}

                    {/* Text */}
                    <div className="absolute bottom-16 px-6 text-center max-w-sm">
                        <motion.p
                            key={isLoading ? phase : "final"}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.35 }}
                            className="text-sm tracking-widest text-gray-200 uppercase"
                        >
                            {isLoading ? PHASES[phase] : FINAL_MESSAGE}
                        </motion.p>

                        {isLoading && phase === PHASES.length - 1 && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ duration: 0.3 }} className="mt-2 text-xs text-gray-400">
                                {STALL_MESSAGES[stall]}
                            </motion.p>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
