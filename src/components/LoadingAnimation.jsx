import { motion, AnimatePresence } from "framer-motion";
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
    const [width, setWidth] = useState(window.innerWidth);
    

    /* Resize awareness */
    useEffect(() => {
        const onResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    /* Phase logic */
    useEffect(() => {
        if (phase >= PHASES.length - 1) return;
        const t = setTimeout(() => setPhase(p => p + 1), 2200);
        return () => clearTimeout(t);
    }, [phase]);

    useEffect(() => {
        if (phase !== PHASES.length - 1 || !isLoading) return;
    
        const t = setInterval(
            () => setStall(s => (s + 1) % STALL_MESSAGES.length),
            4200
        );
    
        return () => clearInterval(t);
    }, [phase, isLoading]);

    useEffect(() => {
        if (!isLoading) {
            const t = setTimeout(() => {
                setShouldExit(true);
            }, 2500);
    
            return () => clearTimeout(t);
        }
    }, [isLoading]);


    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;

    const orbits = isMobile ? [90] : isTablet ? [110, 160] : [140, 220, 300];

    return (
        <AnimatePresence>
            {!shouldExit && (
                <motion.div
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}

                    className="w-full h-full flex items-center justify-center relative overflow-hidden"
                >
                    {/* Core flame (scaled) */}
                    <motion.div
                        className="absolute rounded-full z-20"
                        style={{
                            width: isMobile ? 18 : 28,
                            height: isMobile ? 18 : 28,
                        }}
                        animate={{
                            scale: [1, 1.6, 1],
                            backgroundColor: [
                                "#F97316",
                                "#F59E0B",
                                "#EF4444",
                                "#B75EFC",
                            ],
                            boxShadow: [
                                "0 0 0 rgba(0,0,0,0)",
                                "0 0 30px rgba(249,115,22,0.9)",
                                "0 0 0 rgba(0,0,0,0)",
                            ],
                        }}
                        transition={{
                            duration: 1.3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />

                    {/* Orbits */}
                    {orbits.map((size, i) => (
                        <Orbit
                            key={size}
                            size={size}
                            duration={10 + i * 8}
                            reverse={i % 2 === 1}
                            dotSize={isMobile ? 4 : 6}
                        />
                    ))}

                    {/* Text */}
                    <div className="absolute bottom-16 px-6 text-center max-w-sm">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={isLoading ? phase : "final"}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.4 }}
                                className="text-sm tracking-widest text-gray-200 uppercase"
                            >
                                {isLoading ? PHASES[phase] : FINAL_MESSAGE}
                            </motion.p>
                        </AnimatePresence>



                        {isLoading && phase === PHASES.length - 1 && (
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={stall}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.6 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="mt-2 text-xs text-gray-500"
                                >
                                    {STALL_MESSAGES[stall]}
                                </motion.p>
                            </AnimatePresence>
                        )}


                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* ───────── ORBIT ───────── */

function Orbit({ size, duration, reverse, dotSize }) {
    const colors = ["#F59E0B", "#22C55E", "#F97316", "#B75EFC"];

    return (
        <motion.div
            className="absolute"
            style={{ width: size, height: size }}
            animate={{ rotate: reverse ? -360 : 360 }}
            transition={{
                duration,
                repeat: Infinity,
                ease: "linear",
            }}
        >
            {colors.map((c, i) => (
                <span
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        width: dotSize,
                        height: dotSize,
                        top: "50%",
                        left: "50%",
                        transform: `rotate(${(360 / colors.length) * i}deg) translate(${size / 2}px)`,
                        backgroundColor: c,
                        boxShadow: `0 0 10px ${c}`,
                    }}
                />
            ))}
        </motion.div>
    );
}
