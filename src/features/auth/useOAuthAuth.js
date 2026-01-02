import { createAuth0Client } from "@auth0/auth0-spa-js";

let auth0Client;

async function getAuth0() {
    if (!auth0Client) {
        auth0Client = await createAuth0Client({
            domain: import.meta.env.VITE_AUTH0_DOMAIN || "dev-o1rd15bagv6ygilt.us.auth0.com",
            clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || "aDDtZHU9VTRnDlK4R6LHqmnoZbmKEyc3",
            authorizationParams: {
                redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI,
                audience: import.meta.env.VITE_AUTH0_AUDIENCE,
                scope: "openid email profile",
            },
            cacheLocation: "localstorage", // optional
        });
    }
    return auth0Client;
}

export function useOAuthAuth() {
    const startOAuth = async () => {
        const auth0 = await getAuth0();
        await auth0.loginWithRedirect();
    };

    const handleRedirectCallback = async () => {
        const auth0 = await getAuth0();
        const result = await auth0.handleRedirectCallback();
        const user = await auth0.getUser();
        const token = await auth0.getIdTokenClaims();

        return { user, token, result };
    };

    const logout = async () => {
        const auth0 = await getAuth0();
        auth0.logout({
            logoutParams: {
                returnTo: window.location.origin,
            },
        });
    };

    return {
        startOAuth,
        handleRedirectCallback,
        logout,
    };
}
