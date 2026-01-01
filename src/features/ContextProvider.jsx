import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const AppContext = createContext();

export const ContextProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [role, setRole] = useState(null);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [wantsToLogIn, setWantsToLogIn] = useState(false);
    const location = useLocation();
    const[isNavOpen, setIsNavOpen] = useState(() => (typeof window !== "undefined" ? windowWidth > 1024 : true));
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 8000);
        return () => clearTimeout(timer);
    }, []);

    // const [pageTitle, setPageTitle] = useState("");

    // useEffect(() => {
    //     document.title = pageTitle;
    // }, [pageTitle]);

    useEffect(() => {
        if (location.pathname === "/login") {
            setWantsToLogIn(true);
        } else {
            setWantsToLogIn(false);
        }
    }, [location]);

    useEffect(() => {
        const handleResize = () => {
            const screenWidth = window.innerWidth;
            setWindowWidth(screenWidth);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);


    return (
        <AppContext.Provider value={{ isLoading, setIsLoading, /*setPageTitle,*/ isAuthorized, setIsAuthorized, role, setRole, windowWidth, wantsToLogIn, setWantsToLogIn }}>
            {children}
        </AppContext.Provider>
    );
};

export const useContextManager = () => useContext(AppContext);
