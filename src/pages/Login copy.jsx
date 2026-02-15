import { useState, useEffect, useRef } from "react";
import Logo from "../features/Logo";
import { useAuthApi } from "../features/auth/authApi";
import { useNavigate } from "react-router-dom";
import { useMe } from "../hooks/useMe";
import { loginWithPasskey } from "../features/auth/passkey";
import { supabase } from "../lib/supabase";
import backendUrlV1 from "../urls/backendUrl";


function Spinner({ className = "h-4 w-4 mr-2" }) {
    // Simple tailwind-friendly spinner SVG
    return (
        <svg
            className={`animate-spin ${className}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
    );
}

function Login() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [challengeId, setChallengeId] = useState(null);
    const [maskedEmail, setMaskedEmail] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    // granular loading flags so only the relevant button shows spinner
    const [loadingPassword, setLoadingPassword] = useState(false);
    const [loadingOtp, setLoadingOtp] = useState(false);
    const [loadingPasskey, setLoadingPasskey] = useState(false);

    const anyLoading = loadingPassword || loadingOtp || loadingPasskey;

    const navigate = useNavigate();
    const { loginWithPassword, verifyLoginOtp } = useAuthApi();
    const { data: me } = useMe();

    const handleGoogleLogin = async () => {
        sessionStorage.removeItem("oauth_email");
        sessionStorage.removeItem("oauth_challenge");
        sessionStorage.removeItem("oauth_token");
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: import.meta.env.VITE_SUPABASE_REDIRECT_URI,
                queryParams: { prompt: "select_account" }
            },
        });
    };

    async function handleOAuth() {
        try {
            sessionStorage.setItem("oauth_in_progress", "1");
            let access_token;
            if (!window.location.search.includes("registered=1")) {
                const { data } = await supabase.auth.getSession();
                const session = data?.session;
                if (!session) return;

                access_token = session.access_token;
                email = session.user.email;

                sessionStorage.setItem("oauth_token", access_token);
                sessionStorage.setItem("oauth_email", email);
            } else {
                access_token = sessionStorage.getItem("oauth_token");
                email = sessionStorage.getItem("oauth_email");
            }

            const fingerprint = window.localStorage.getItem("device_fp") || null;

            const res = await fetch(`${backendUrlV1}/auth/oauth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${access_token}`,
                },
                credentials: "include",
                body: JSON.stringify({ fingerprint }),
            });

            const body = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(body.detail || "OAuth login failed");
                return;
            }

            if (body.ok && !body.needs_registration) {
                sessionStorage.removeItem("oauth_email");
                sessionStorage.removeItem("oauth_challenge");
                sessionStorage.removeItem("oauth_token");
                window.history.replaceState({}, "", "/login");
                window.location.replace("/");
                return;
            }

            if (body.challenge === "otp_required") {
                sessionStorage.setItem("oauth_email", body.email);
                sessionStorage.setItem("oauth_challenge", body.challenge_id);
                sessionStorage.setItem("oauth_masked_email", body.masked_email);
            }

            if (body.needs_registration) {
                sessionStorage.setItem("oauth_email", body.email);
                sessionStorage.setItem("oauth_challenge", body.challenge_id);
                window.history.replaceState({}, "", "/login");
                navigate("/register?oauth=1");
                return;
            }
        } finally {
            sessionStorage.removeItem("oauth_in_progress");
        }
    }

    useEffect(() => {
        sessionStorage.clear();
        if (sessionStorage.getItem("oauth_in_progress")) {
            return;
        }
        const params = new URLSearchParams(window.location.search);
        const oauth = params.get("oauth");
        const registered = params.get("registered");

        if (!oauth && !registered) return;

        window.history.replaceState({}, "", "/login");

        handleOAuth();
    }, []);


    useEffect(() => {
        if (me) {
            const redirect = localStorage.getItem("redirectAfterLogin");
            navigate(redirect || "/");
            localStorage.removeItem("redirectAfterLogin");
        }
    }, [me, navigate]);

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        if (anyLoading) return;
        setError("");
        setLoadingPassword(true);

        try {
            const res = await loginWithPassword(identifier, password);

            if (res?.challenge === "otp_required") {
                setChallengeId(res.challenge_id);
                setMaskedEmail(res.masked_email);
            }
        } catch (err) {
            setError(err?.message || "Invalid credentials.");
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (anyLoading) return;
        setError("");
        setLoadingOtp(true);

        try {
            await verifyLoginOtp({
                identifier: identifier || sessionStorage.getItem("oauth_email"),
                challenge_id: challengeId || sessionStorage.getItem("oauth_challenge"),
                code: otp
            });
        } catch (err) {
            setError(err?.response?.data?.message || "Invalid OTP");
        } finally {
            setLoadingOtp(false);
        }
    };

    const handlePasskey = async () => {
        if (!identifier) {
            setError("Enter your email or username first.");
            return;
        }
        if (anyLoading) return;

        setError("");
        setLoadingPasskey(true);
        try {
            await loginWithPasskey(identifier);
            // loginWithPasskey probably redirects; keep the redirect fallback
            window.location.replace(localStorage.getItem("redirectAfterLogin") || "/");
        } catch (err) {
            setError(err?.message || "Passkey login failed");
        } finally {
            setLoadingPasskey(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-full sm:max-w-[500px] max-w-[90%] rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-xl p-8">

                <div className="flex justify-center mb-6">
                    <Logo width={140} />
                </div>

                <h1 className="text-xl font-semibold text-white text-center">
                    Sign in to Forkit
                </h1>
                <p className="text-sm text-gray-400 text-center mt-1">
                    Use your password or a passkey.
                </p>

                {error && (
                    <div className="mt-4 text-sm text-red-400 text-center">{error}</div>
                )}

                <div className="space-y-4 mt-6">
                    <div className="flex flex-col justify-evenly">
                        {/* Identifier */}
                        <div className="space-y-4 w-full">
                            <input
                                type="text"
                                placeholder="Email or Username"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                autoFocus
                                disabled={anyLoading}
                                aria-disabled={anyLoading}
                                className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-gray-700 text-white disabled:opacity-50"
                            />

                            {/* Password */}
                            <form onSubmit={handlePasswordLogin} className="space-y-3">
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={anyLoading}
                                        aria-disabled={anyLoading}
                                        className="w-full px-4 py-2.5 pr-12 rounded-lg bg-neutral-900 border border-gray-700 text-white disabled:opacity-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        disabled={anyLoading}
                                        aria-disabled={anyLoading}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm disabled:opacity-50"
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={anyLoading || !identifier}
                                    aria-busy={loadingPassword}
                                    className={`w-full py-2.5 rounded-lg flex items-center justify-center ${(anyLoading || !identifier) ? "bg-orange-600/70 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-500"
                                        } text-white disabled:opacity-50`}
                                >
                                    {loadingPassword ? (
                                        <>
                                            <Spinner />
                                            <span>Signing in…</span>
                                        </>
                                    ) : (
                                        <span>Continue with Password</span>
                                    )}
                                </button>
                            </form>
                            <div className="flex items-center gap-3 w-full my-5 text-gray-500 text-sm">
                                <div className="flex-1 h-px bg-gray-700" />
                                OR
                                <div className="flex-1 h-px bg-gray-700" />
                            </div>

                        </div>

                        <div className="flex flex-col md:flex-row gap-3 w-full items-center justify-center">
                            {/* Passkey */}
                            <button
                                onClick={() => {
                                    if (!identifier) {
                                        setError("Enter your email or username first.");
                                    } else {
                                        handlePasskey();
                                    }
                                }}
                                disabled={anyLoading || !identifier}
                                aria-busy={loadingPasskey}
                                className={`w-full py-2.5 rounded-lg border border-gray-600 flex items-center justify-center text-white hover:bg-white/5 disabled:opacity-50 ${(anyLoading || !identifier) ? "cursor-not-allowed" : ""
                                    }`}
                            >
                                {loadingPasskey ? (
                                    <>
                                        <Spinner />
                                        <span>Continuing with Passkey…</span>
                                    </>
                                ) : (
                                    <span>Continue with Passkey</span>
                                )}
                            </button>
                            <div className="space-y-3 w-full">
                                <button
                                    onClick={handleGoogleLogin}
                                    className={`w-full gap-x-2 py-2.5 rounded-lg border border-gray-600 flex items-center justify-center text-white hover:bg-white/5 disabled:opacity-50 ${(anyLoading) ? "cursor-not-allowed" : ""
                                        }`}
                                >
                                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" className="block w-5">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                                        <path fill="none" d="M0 0h48v48H0z"></path>
                                    </svg>
                                    Continue with Google
                                </button>

                                {/* <button
                                    onClick={() => startOAuthLogin("windowslive")}
                                    className="w-full py-2.5 rounded-lg bg-neutral-700/40 hover:bg-neutral-700/90 text-white flex items-center justify-center gap-3"
                                >
                                    <img src="/ms-logo-oauth.svg" alt="Microsoft" className="w-5 h-5" />
                                    Continue with Microsoft
                                </button> */}
                            </div>
                        </div>
                    </div>

                    {challengeId || sessionStorage.getItem("oauth_challenge") && (
                        <form onSubmit={handleVerifyOtp} className="w-full flex pt-4 border-t justify-center border-gray-700 space-y-3">
                            <div className="w-fit space-y-3">
                                <p className="text-sm text-gray-400 text-center">
                                    Enter the code sent to {maskedEmail || sessionStorage.getItem("oauth_masked_email")}
                                </p>

                                <input
                                    type="text"
                                    placeholder="6-digit code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                    disabled={anyLoading}
                                    aria-disabled={anyLoading}
                                    className="w-full px-4 py-2.5 text-center tracking-widest rounded-lg bg-neutral-900 border border-gray-700 text-white disabled:opacity-50"
                                />

                                <button
                                    type="submit"
                                    disabled={anyLoading}
                                    aria-busy={loadingOtp}
                                    className={`w-full py-2.5 rounded-lg flex items-center justify-center ${anyLoading ? "bg-orange-600/70 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-500"
                                        } text-white disabled:opacity-50`}
                                >
                                    {loadingOtp ? (
                                        <>
                                            <Spinner />
                                            <span>Verifying…</span>
                                        </>
                                    ) : (
                                        <span>Verify & Continue</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                    <div className="pt-4 border-t border-gray-700 space-y-3">
                        <p className="text-sm text-gray-400 text-center">
                            Don&apos;t have an account?{" "}
                            <a href="/register" className="text-orange-400 hover:underline">
                                Sign up
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
