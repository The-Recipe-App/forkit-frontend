import { useEffect, useState } from "react";
import { useOAuthAuth } from "../features/auth/useOAuthAuth";
import { useNavigate } from "react-router-dom";

function OAuthCallback() {
    const navigate = useNavigate();
    const { handleOAuthRedirect, completeOAuthLogin } = useOAuthAuth();
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log("OAuth callback mounted");
        console.log("URL:", window.location.href);

        async function run() {
            try {
                console.log("Handling redirect...");
                await handleOAuthRedirect();
                console.log("Redirect handled");

                console.log("Calling backend...");
                const res = await completeOAuthLogin();
                console.log("Backend response:", res);
            } catch (err) {
                console.error("OAuth error:", err);
            }
        }

        run();
    }, []);


    useEffect(() => {
        async function processOAuth() {
            try {
                await handleOAuthRedirect();

                const res = await completeOAuthLogin();

                if (res?.needs_registration) {
                    navigate("/register?oauth=1");
                    return;
                }

                if (res?.challenge === "otp_required") {
                    navigate("/login?otp=1", {
                        state: {
                            challenge_id: res.challenge_id,
                            masked_email: res.masked_email,
                        },
                    });
                    return;
                }

                //navigate("/");
            } catch (err) {
                setError(err.message);
            }
        }

        processOAuth();
    }, []);

    if (error) {
        return <div className="p-6 text-red-400">{error}</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center text-white">
            Completing secure sign-in...
        </div>
    );
}

export default OAuthCallback;
