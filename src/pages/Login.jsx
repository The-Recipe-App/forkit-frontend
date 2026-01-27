import { useState, useEffect } from "react";
import Logo from "../features/Logo";
import { useAuthApi } from "../features/auth/authApi";
import { useNavigate } from "react-router-dom";
import { useMe } from "../hooks/useMe";
import { loginWithPasskey } from "../features/auth/passkey";

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
            setError(err?.response?.data?.message || "Invalid credentials.");
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
                identifier,
                challenge_id: challengeId,
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
            <div className="w-full sm:max-w-md max-w-[90%] rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-xl p-8">

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

                    {/* Identifier */}
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
                            className={`w-full py-2.5 rounded-lg flex items-center justify-center ${
                                (anyLoading || !identifier) ? "bg-orange-600/70 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-500"
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

                    {/* Divider */}
                    <div className="flex items-center gap-3 text-gray-500 text-sm">
                        <div className="flex-1 h-px bg-gray-700" />
                        OR
                        <div className="flex-1 h-px bg-gray-700" />
                    </div>

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
                        className={`w-full py-2.5 rounded-lg border border-gray-600 flex items-center justify-center text-white hover:bg-white/5 disabled:opacity-50 ${
                            (anyLoading || !identifier) ? "cursor-not-allowed" : ""
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

                    {challengeId && (
                        <form onSubmit={handleVerifyOtp} className="pt-4 border-t border-gray-700 space-y-3">
                            <p className="text-sm text-gray-400 text-center">
                                Enter the code sent to {maskedEmail}
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
                                className={`w-full py-2.5 rounded-lg flex items-center justify-center ${
                                    anyLoading ? "bg-orange-600/70 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-500"
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
