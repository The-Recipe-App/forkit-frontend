import React, { useState, useEffect, useRef } from "react";
import { Toaster } from "react-hot-toast";
import { Outlet } from "react-router-dom";

import TopBar from "../components/TopBar";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import LoadingScreen from "../components/LoadingAnimation";

import { useContextProps } from "../features/Contexts";
import { useContextManager } from "../features/ContextProvider";
import { motion, AnimatePresence } from "framer-motion";
import Login from "../pages/Login";

const MainAppLayout = () => {
    const [contextProps, setContextProps] = useContextProps();
    const [footerVisible, setFooterVisible] = useState(false);
    const [shouldExitAnimation, setShouldExitAnimation] = useState(false);

    const { isLoading, setIsLoading, isAuthorized, windowWidth, isNavOpen, setIsNavOpen, wantsToLogIn, setWantsToLogIn } =
        useContextManager();

    const isOverlay = windowWidth < 1024;
    const [navOpen, setNavOpen] = useState(windowWidth > 1024);
    const navRef = useRef(null);
    const toggleBtnRef = useRef(null);

    const TOPBAR_HEIGHT = "3.875rem";

    useEffect(() => {
        let observer;
        let sentinel;

        const attachObserver = () => {
            sentinel = document.getElementById("footer-sentinel");
            if (!sentinel) return;

            observer = new IntersectionObserver(
                ([entry]) => {
                    setFooterVisible(entry.isIntersecting);
                },
                {
                    root: null,
                    threshold: 0.5,
                    // helps detect earlier & survives layout shifts
                    rootMargin: "100px 0px 0px 0px",
                }
            );

            observer.observe(sentinel);
        };

        attachObserver();

        const onReflow = () => {
            if (!sentinel || !document.body.contains(sentinel)) {
                observer?.disconnect();
                attachObserver();
            }
        };

        window.addEventListener("resize", onReflow);
        window.addEventListener("scroll", onReflow, { passive: true });

        return () => {
            observer?.disconnect();
            window.removeEventListener("resize", onReflow);
            window.removeEventListener("scroll", onReflow);
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setNavOpen(window.innerWidth > 1024);
            if (window.innerWidth <= 1024);

        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);


    return (
        <div className="min-h-screen flex flex-col bg-transparent">
            {wantsToLogIn ?
                <Login setWantsToLogIn={setWantsToLogIn} />
                : (
                    <>
                        {/* Top Bar */}
                        {/* TopBar spacer – prevents layout shift */}
<div style={{ height: TOPBAR_HEIGHT }} />

                        <TopBar toggleBtnRef={toggleBtnRef} isAuthorized={isAuthorized} windowWidth={windowWidth} footerVisible={footerVisible && shouldExitAnimation} setSidebarMode={setNavOpen} />

                        {/* Main Content Area */}
                        <div className="flex flex-1 relative">
                            {/* BACKDROP (overlay only) */}
                            {isOverlay && navOpen && (
                                <div
                                    className="fixed inset-0 bg-black/50 z-40"
                                    onClick={() => setNavOpen(false)}
                                />
                            )}

                            {/* NAVBAR CONTAINER */}
                            <div
                                className={`
            transition-all duration-300 ease-in-out w-0
            ${isOverlay
                                        ? "fixed inset-y-0 left-0 z-50"
                                        : "relative"}
        `}
                            >
                                <NavBar
                                    isLoading={isLoading}
                                    isOpen={navOpen}
                                    isOverlay={isOverlay}
                                    navRef={navRef}
                                    footerVisible={footerVisible}
                                    onNavigate={() => isOverlay && setNavOpen(false)}
                                />
                            </div>

                            {/* MAIN CONTENT */}
                            <AnimatePresence>
                                <motion.div
                                    key="loader"
                                    className="
                            absolute inset-x-0 top-0
                            h-screen
                            z-40
                            pointer-events-none
                        "
                                >
                                    <LoadingScreen shouldExit={shouldExitAnimation} setShouldExit={setShouldExitAnimation} isLoading={isLoading} />
                                </motion.div>
                            </AnimatePresence>
                            {!shouldExitAnimation ? null : <main
                                className={`
            flex-1 transition-all duration-300
            ${!isOverlay && navOpen ? "ml-64" : "ml-0"}
        `}
                            >
                                <div className="p-4">
                                    <Outlet />
                                </div>
                            </main>}
                        </div>

                        {/* Toasts */}
                        <div className="absolute right-4 top-4 z-50">
                            <Toaster position="top-right" />
                        </div>

                        {/* Footer */}
                        {shouldExitAnimation && <Footer isAuthorized={isAuthorized} />}
                    </>
                )
            }
        </div>
    );
};

export default MainAppLayout;
