import { useQueryClient } from "@tanstack/react-query";
import backendUrlV1 from "../../urls/backendUrl";
import { useContextManager } from "../ContextProvider";

/* -------------------------
   Helpers
------------------------- */

function jsonHeaders() {
    return { "Content-Type": "application/json" };
}

async function parseJsonSafe(res) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

function extractErrorMessage(data, fallback) {
    if (!data) return fallback;
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) return data.detail.map(d => d.msg).join(", ");
    return fallback;
}

/* -------------------------
   Central Auth Hook
------------------------- */

export function useAuthApi() {
    const { setIsLoading } = useContextManager();

    const queryClient = useQueryClient();

    async function withLoading(fn) {
        try {
            setIsLoading(true);
            return await fn();
        } finally {
            setIsLoading(false);
        }
    }

    function loginWithPassword(email, password) {
        return withLoading(async () => {
            try {
                const res = await fetch(`${backendUrlV1}/auth/login`, {
                    method: "POST",
                    credentials: "include",
                    headers: jsonHeaders(),
                    body: JSON.stringify({ email, password }),
                });

                const data = await parseJsonSafe(res);
                if (!res.ok) throw new Error(extractErrorMessage(data, "Invalid credentials"));
                window.location.replace(localStorage.getItem("redirectAfterLogin") || "/");
            } catch (err) {
                throw err;
            }
        });
    }

    function registerWithPassword(email, password, username = null) {
        return withLoading(async () => {
            const res = await fetch(`${backendUrlV1}/auth/register`, {
                method: "POST",
                credentials: "include",
                headers: jsonHeaders(),
                body: JSON.stringify({ email, password, username }),
            });

            const data = await parseJsonSafe(res);
            if (!res.ok) throw new Error(extractErrorMessage(data, "Registration failed"));
            return data;
        });
    }

    function getCurrentUser() {
        return withLoading(async () => {
            const res = await fetch(`${backendUrlV1}/auth/me`, {
                credentials: "include",
            });

            if (!res.ok) return null;
            return res.json();
        });
    }

    function logout() {
        return withLoading(async () => {
            const res = await fetch(`${backendUrlV1}/auth/logout`, {
                method: "POST",
                credentials: "include",
            });

            if (!res.ok) throw new Error("Logout failed");
            queryClient.removeQueries({ queryKey: ["profile", "me"] });
            queryClient.clear();
            window.location.reload();
        });
    }

    return {
        loginWithPassword,
        registerWithPassword,
        getCurrentUser,
        logout,
    };
}
