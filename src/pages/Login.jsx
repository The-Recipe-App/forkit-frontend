import { useState } from "react";
import Logo from "../features/Logo";
import { useAuth } from "../features/auth/useAuth";
import {loginWithPassword, getCurrentUser} from "../features/auth/authApi";
import { useNavigate } from "react-router-dom";
import { useContextManager } from "../features/ContextProvider";

function Login({ setIsAuthorized, setIsLoading }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    /* ─────────────────────────
       Email / Password Login
    ───────────────────────── */

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        //setIsLoading(true);
        setLoading(true);
    
        try {
            // ✅ correct function
            await loginWithPassword(email, password);
    
            // ✅ verify session from backend
            const me = await getCurrentUser();
            if (!me) {
                throw new Error("Session verification failed");
            }
    
            setIsAuthorized(true);
            if (localStorage.getItem("redirectAfterLogin")) {
                navigate(localStorage.getItem("redirectAfterLogin"));
                localStorage.removeItem("redirectAfterLogin");
            } else navigate("/");
        } catch (err) {
            setError(err.message || "Invalid email or password.");
        } finally {
            setIsLoading(false);
            setLoading(false);
        }
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
                    Log in to continue evolving recipes together.
                </p>

                {/* Error */}
                {error && (
                    <div className="mt-4 text-sm text-red-400 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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

                <div className="mt-6 text-sm text-center text-gray-400">
                    New to Forkit?{" "}
                    <a href="/register" className="text-orange-400 hover:underline">
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
