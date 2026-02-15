import { createAuth0Client } from "@auth0/auth0-spa-js";
import backendUrlV1 from "../../urls/backendUrl";

let auth0Client;

async function getAuth0() {
    if (!auth0Client) {
        auth0Client = await createAuth0Client({
            domain: import.meta.env.VITE_AUTH0_DOMAIN,
            clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
            authorizationParams: {
                redirect_uri: "http://localhost:5173/login",
                scope: "openid email profile",
            },
            cacheLocation: "localstorage", // easier for debugging
        });
    }
    return auth0Client;
}

export function useOAuthAuth() {

    const startOAuthLogin = async (provider) => {
        const auth0 = await getAuth0();
        await auth0.loginWithRedirect({
            authorizationParams: {
                connection: provider,
                screen_hint: "login",
            },
        });
    };

    const handleOAuthIfPresent = async () => {
        const auth0 = await getAuth0();

        const query = window.location.search;

        if (!query.includes("code=")) {
            return null;
        }

        console.log("OAuth code detected in URL");

        // Let SDK parse & exchange code
        await auth0.handleRedirectCallback();

        const claims = await auth0.getIdTokenClaims();
        const idToken = claims?.__raw;

        if (!idToken) {
            throw new Error("Missing OAuth token");
        }

        console.log("Calling backend...");

        const res = await fetch(`${backendUrlV1}/auth/oauth/login`, {
            method: "POST",
            credentials: "include",
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            throw new Error(data?.detail || "OAuth login failed");
        }

        // Clean URL AFTER everything
        window.history.replaceState({}, document.title, "/login");

        return data;
    };

    return {
        startOAuthLogin,
        handleOAuthIfPresent,
    };
}
