import { useEffect } from "react";
import { useContextManager } from "../ContextProvider";
import { useAuthApi } from "./authApi";

/**
 * AuthorityManager
 *
 * - Runs once on app load
 * - Hydrates auth state from backend
 * - Updates global context
 */
export default function AuthorityManager() {
    const {
        setIsAuthorized,
        setRole,
        setIsLoading,
    } = useContextManager();

    const { logout, getCurrentUser } = useAuthApi();

    useEffect(() => {
        let cancelled = false;

        const bootstrapAuth = async () => {
            //setIsLoading(true);

            try {
                const user = await getCurrentUser();

                if (cancelled) return;

                if (user) {
                    setIsAuthorized(true);

                    // For now role is derived simply
                    // Later: admin/moderator/etc
                    setRole(user.plan || null);
                } else {
                    setIsAuthorized(false);
                    setRole(null);
                }
            } catch (err) {
                console.error("Auth bootstrap failed", err);
                logout();
                setIsAuthorized(false);
                setRole(null);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        bootstrapAuth();

        return () => {
            cancelled = true;
        };
    }, [setIsAuthorized, setRole, setIsLoading]);

    return null; // Headless manager
}
