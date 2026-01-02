import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOAuthAuth } from "../auth/useOAuthAuth";

export default function AuthCallback() {
    const { handleRedirectCallback } = useOAuthAuth();
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const { user, token } = await handleRedirectCallback();

                // 🔐 Send token to backend if needed
                // await fetch("/api/auth/auth0", { headers: { Authorization: `Bearer ${token.__raw}` }})

                navigate("/");
            } catch (e) {
                console.error("Auth error", e);
                navigate("/login");
            }
        })();
    }, []);

    return <div>Signing you in…</div>;
}
