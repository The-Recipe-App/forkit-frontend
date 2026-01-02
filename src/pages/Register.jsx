import { useState } from "react";
import Logo from "../features/Logo";
import { registerWithPassword } from "../features/auth/authApi";

function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /* ─────────────────────────
       Password rules (UX only)
    ───────────────────────── */

    const validatePassword = (pwd) => {
        if (pwd.length < 8) {
            return "Password must be at least 8 characters.";
        }
        if (pwd.length > 72) {
            return "Password is too long.";
        }
        if (!/[A-Za-z]/.test(pwd)) {
            return "Password must contain at least one letter.";
        }
        if (!/\d/.test(pwd)) {
            return "Password must contain at least one number.";
        }
        return null;
    };

    /* ─────────────────────────
       Email / Password Register
    ───────────────────────── */

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const pwdError = validatePassword(password);
        if (pwdError) {
            setError(pwdError);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const data = await registerWithPassword(email, password);
            window.location.href = "/login";
        } catch (err) {
            console.log(err.message);
            setError(err.message);
        } finally {
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
                    Create your Forkit account
                </h1>
                <p className="text-sm text-gray-400 text-center mt-1">
                    Join the community. Evolve recipes together.
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

                    {/* Password */}
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="
                                w-full px-4 py-2.5 pr-10
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
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                        >
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="
                                w-full px-4 py-2.5 pr-10
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
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword((v) => !v)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                        >
                            {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                    </div>

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
                        {loading ? "Creating account…" : "Create account"}
                    </button>
                </form>

                <div className="mt-6 text-sm text-center text-gray-400">
                    Already have an account?{" "}
                    <a href="/login" className="text-orange-400 hover:underline">
                        Log in
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Register;
