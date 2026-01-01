import { useState, useCallback } from "react";
import Logo from "../features/Logo";
import { useGoogleAuth } from "../features/auth/useGoogleAuth";

function Login({ setWantsToLogIn }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");

    /* ─────────────────────────
       Email / Password Login
    ───────────────────────── */

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // TODO: replace with real API call
            // await login(email, password);

            setWantsToLogIn(false);
        } catch (err) {
            setError("Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    /* ─────────────────────────
       Google OAuth Success
    ───────────────────────── */

    const handleGoogleSuccess = useCallback(async (response) => {
        if (!response?.credential) {
            setError("Google authentication failed.");
            setGoogleLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_token: response.credential }),
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error("Backend rejected Google login");
            }

            // TODO: update auth context here
            setWantsToLogIn(false);
        } catch (err) {
            console.error(err);
            setError("Google login failed. Please try again.");
        } finally {
            setGoogleLoading(false);
        }
    }, [setWantsToLogIn]);

    /* ─────────────────────────
       Google OAuth Init
    ───────────────────────── */

    const { prompt } = useGoogleAuth({
        onSuccess: handleGoogleSuccess,
    });

    const handleGoogleClick = () => {
        if (googleLoading) return;
        setError("");
        setGoogleLoading(true);
        prompt();
    };

    /* ─────────────────────────
       Render
    ───────────────────────── */

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
            <div
                className="
                    w-full sm:max-w-md max-w-[80%]
                    rounded-2xl
                    bg-white/5 backdrop-blur
                    border border-white/10
                    shadow-xl
                    p-8
                "
            >
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <Logo width={140} />
                </div>

                <h1 className="text-xl font-semibold text-white text-center">
                    Welcome back to Forkit
                </h1>
                <p className="text-sm text-gray-400 text-center mt-1">
                    Cook. Share. Evolve — together.
                </p>

                {/* Error */}
                {error && (
                    <div className="mt-4 text-sm text-red-400 text-center">
                        {error}
                    </div>
                )}

                {/* Google OAuth */}
                <button
                    onClick={handleGoogleClick}
                    disabled={googleLoading}
                    className="
                        mt-6 w-full
                        flex items-center justify-center gap-3
                        py-2.5 rounded-lg
                        bg-neutral-800 hover:bg-neutral-700
                        text-white
                        transition
                        disabled:opacity-50
                    "
                >
                    {googleLoading ? "Connecting to Google…" : "Continue with Google"}
                </button>

                <div className="flex items-center gap-3 my-6 text-gray-500 text-sm">
                    <div className="flex-1 h-px bg-gray-700" />
                    or
                    <div className="flex-1 h-px bg-gray-700" />
                </div>

                {/* Email / Password Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="
                            w-full px-4 py-2.5
                            rounded-lg
                            bg-neutral-900
                            border border-gray-700
                            text-white
                            placeholder-gray-500
                            focus:outline-none
                            focus:border-orange-500
                        "
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="
                            w-full px-4 py-2.5
                            rounded-lg
                            bg-neutral-900
                            border border-gray-700
                            text-white
                            placeholder-gray-500
                            focus:outline-none
                            focus:border-orange-500
                        "
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="
                            w-full py-2.5
                            rounded-lg
                            bg-orange-600 hover:bg-orange-500
                            text-white font-medium
                            transition
                            disabled:opacity-50
                        "
                    >
                        {loading ? "Logging in…" : "Log in"}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-sm text-center text-gray-400">
                    New to Forkit?{" "}
                    <a href="/signup" className="text-orange-400 hover:underline">
                        Create an account
                    </a>
                </div>

                <div className="mt-2 text-xs text-center">
                    <a href="/forgot-password" className="text-gray-500 hover:underline">
                        Forgot password?
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Login;
