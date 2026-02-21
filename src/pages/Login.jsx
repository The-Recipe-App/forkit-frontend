// Login.jsx
import { useCallback, useEffect, useRef, useReducer, useState } from "react";
import Logo from "../features/Logo";
import { useAuthApi } from "../features/auth/authApi";
import { useNavigate } from "react-router-dom";
import { useMe } from "../hooks/useMe";
import { loginWithPasskey } from "../features/auth/passkey";
import { supabase } from "../lib/supabase";
import backendUrlV1 from "../urls/backendUrl";
import Modal from "../components/popUpModal";

function Spinner({ className = "h-4 w-4 mr-2" }) {
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

const OAUTH_KEYS = {
    IN_PROGRESS: "oauth_in_progress",
    TOKEN: "oauth_token",
    EMAIL: "oauth_email",
    CHALLENGE: "oauth_challenge",
    REQUIRES_OTP: "oauth_requires_otp",
    MASKED_EMAIL: "oauth_masked_email",
    REQUIRES_REGISTRATION: "oauth_requires_registration",
};

function setOAuthKey(key, value) {
    if (value === undefined || value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
}
function getOAuthKey(key) {
    return sessionStorage.getItem(key);
}
function clearOAuthKeys() {
    Object.values(OAUTH_KEYS).forEach((k) => sessionStorage.removeItem(k));
}

// --- window.name per-tab persistence helpers ---
// uses a single JSON object stored in window.name (safe per-tab across navigations)
const WINDOW_NAME_KEY = "forkit_oauth_state_v1";
function readWindowState() {
    try {
        if (!window?.name) return null;
        const raw = window.name;
        // window.name may contain other content; expect our JSON under a prefixed object
        // Try parse as JSON: we support either entire window.name is the JSON or contains JSON under our key
        try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed[WINDOW_NAME_KEY]) return parsed[WINDOW_NAME_KEY];
            // maybe the whole parsed object is our state
            if (parsed && (parsed.in_progress !== undefined || parsed.challenge_id !== undefined)) return parsed;
        } catch {
            // try to find our JSON substring
            const idx = raw.indexOf(WINDOW_NAME_KEY + ":");
            if (idx >= 0) {
                const substr = raw.slice(idx + WINDOW_NAME_KEY.length + 1);
                try {
                    return JSON.parse(substr);
                } catch { /* ignore */ }
            }
        }
    } catch (e) { /* ignore */ }
    return null;
}
function writeWindowState(obj) {
    try {
        // preserve existing window.name content if it's not ours
        let base = {};
        try {
            base = JSON.parse(window.name || "{}");
        } catch {
            // non-json content: keep it under __unsafe_other
            base = { __unsafe_other: window.name || "" };
        }
        base[WINDOW_NAME_KEY] = { ...(base[WINDOW_NAME_KEY] || {}), ...obj };
        window.name = JSON.stringify(base);
    } catch (e) {
        // best-effort; ignore errors
    }
}
function clearWindowState() {
    try {
        let base = {};
        try {
            base = JSON.parse(window.name || "{}");
        } catch {
            // if not json, just clear entire window.name to be safe
            window.name = "";
            return;
        }
        if (base && base[WINDOW_NAME_KEY]) {
            delete base[WINDOW_NAME_KEY];
        }
        // if base has no other keys, clear
        if (Object.keys(base).length === 0) {
            window.name = "";
        } else {
            window.name = JSON.stringify(base);
        }
    } catch { /* ignore */ }
}

const initialState = {
    identifier: "",
    password: "",
    otp: "",
    challengeId: null,
    maskedEmail: "",
    showPassword: false,
    error: "",
    loading: {
        password: false,
        otp: false,
        passkey: false,
        oauth: false, // small internal flag to disable buttons during oauth start (no UI change)
    },
};

function reducer(state, action) {
    switch (action.type) {
        case "SET":
            return { ...state, [action.key]: action.value };
        case "SET_MANY":
            return { ...state, ...action.payload };
        case "SET_LOADING":
            return { ...state, loading: { ...state.loading, ...action.payload } };
        case "RESET":
            return { ...initialState, loading: { password: false, otp: false, passkey: false, oauth: false } };
        default:
            return state;
    }
}

function Login() {
    const [state, dispatch] = useReducer(reducer, initialState);
    // include oauth loading in aggregated loading check so UI buttons get disabled while oauth begins
    const anyLoading = state.loading.password || state.loading.otp || state.loading.passkey || state.loading.oauth;

    const navigate = useNavigate();
    const { loginWithPassword, verifyLoginOtp } = useAuthApi();
    const { data: me } = useMe();

    const isMountedRef = useRef(true);
    const oauthAbortRef = useRef(null);
    // initialize inProgressRef from sessionStorage OR window.name
    const initialInProgress = Boolean(getOAuthKey(OAUTH_KEYS.IN_PROGRESS)) || Boolean((readWindowState() || {}).in_progress);
    const inProgressRef = useRef(initialInProgress);

    const [needsReg, setNeedsReg] = useState(false);

    function safeDispatch(action) {
        if (isMountedRef.current) dispatch(action);
    }

    useEffect(() => {
        // Rehydrate OAuth state from sessionStorage so OTP UI survives redirects
        const storedChallenge = getOAuthKey(OAUTH_KEYS.CHALLENGE);
        const storedMasked = getOAuthKey(OAUTH_KEYS.MASKED_EMAIL);
        if (storedChallenge) safeDispatch({ type: "SET", key: "challengeId", value: storedChallenge });
        if (storedMasked) safeDispatch({ type: "SET", key: "maskedEmail", value: storedMasked });

        // Also rehydrate from window.name fallback if sessionStorage was wiped
        const winState = readWindowState();
        if (winState) {
            if (!storedChallenge && winState.challenge_id) safeDispatch({ type: "SET", key: "challengeId", value: winState.challenge_id });
            if (!storedMasked && winState.masked_email) safeDispatch({ type: "SET", key: "maskedEmail", value: winState.masked_email });
            if (winState.requires_registration && sessionStorage.getItem(OAUTH_KEYS.REQUIRES_REGISTRATION) !== "1") {
                // mirror into sessionStorage so other parts of your app that rely on it still work
                sessionStorage.setItem(OAUTH_KEYS.REQUIRES_REGISTRATION, "1");
                setNeedsReg(true);
            }
        }
    }, []);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (oauthAbortRef.current) {
                try {
                    oauthAbortRef.current.abort();
                } catch { }
            }
        };
    }, []);

    useEffect(() => {
        if (me) {
            const redirect = localStorage.getItem("redirectAfterLogin");
            navigate(redirect || "/");
            localStorage.removeItem("redirectAfterLogin");
        }
    }, [me, navigate]);

    useEffect(() => {
        if (sessionStorage.getItem(OAUTH_KEYS.REQUIRES_REGISTRATION) === "1") {
            setNeedsReg(true);
        }
    }, []);

    // cross-tab storage listener
    useEffect(() => {
        function onStorage(e) {
            if (!e.key) return;
            if (e.key === OAUTH_KEYS.IN_PROGRESS) {
                inProgressRef.current = Boolean(getOAuthKey(OAUTH_KEYS.IN_PROGRESS)) || Boolean((readWindowState() || {}).in_progress);
            }
            if (e.key === OAUTH_KEYS.CHALLENGE || e.key === OAUTH_KEYS.MASKED_EMAIL) {
                safeDispatch({ type: "SET", key: "challengeId", value: getOAuthKey(OAUTH_KEYS.CHALLENGE) });
                safeDispatch({ type: "SET", key: "maskedEmail", value: getOAuthKey(OAUTH_KEYS.MASKED_EMAIL) });
            }
            if (!getOAuthKey(OAUTH_KEYS.CHALLENGE)) {
                // only clear UI challenge if neither sessionStorage nor window.name claims it
                const win = readWindowState();
                if (!win || !win.challenge_id) {
                    safeDispatch({ type: "SET_MANY", payload: { challengeId: null, maskedEmail: "" } });
                }
            }
        }
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const oauth = params.get("oauth");
        const registered = params.get("registered");

        // check window.name fallback for in-progress flows so we don't clear during mobile suspends
        const winState = readWindowState();
        const winInProgress = Boolean(winState && winState.in_progress);

        const hasActiveOAuth =
            getOAuthKey(OAUTH_KEYS.IN_PROGRESS) ||
            getOAuthKey(OAUTH_KEYS.CHALLENGE) ||
            oauth ||
            registered ||
            winInProgress;

        if (!hasActiveOAuth) {
            console.log("No active OAuth flow detected on mount, clearing any stale state.");
            // This is a brand new login session
            resetLoginState({ clearOAuth: true });
        } else {
            console.log("Active OAuth flow detected on mount, rehydrating state from sessionStorage or window.name.");
            // If window.name has persisted values, ensure they are mirrored into sessionStorage so other flows (register) work
            if (winState) {
                if (winState.token) sessionStorage.setItem(OAUTH_KEYS.TOKEN, winState.token);
                if (winState.email) sessionStorage.setItem(OAUTH_KEYS.EMAIL, winState.email);
                if (winState.challenge_id) sessionStorage.setItem(OAUTH_KEYS.CHALLENGE, winState.challenge_id);
                if (winState.masked_email) sessionStorage.setItem(OAUTH_KEYS.MASKED_EMAIL, winState.masked_email);
                if (winState.requires_registration) sessionStorage.setItem(OAUTH_KEYS.REQUIRES_REGISTRATION, "1");
            }
        }
    }, []);

    // Start Google OAuth (triggers Supabase redirect)
    const handleGoogleLogin = useCallback(async () => {
        // set oauth loading so UI buttons get disabled (no visible UI change)
        safeDispatch({ type: "SET_LOADING", payload: { oauth: true } });

        // prevent double invocation across tabs
        setOAuthKey(OAUTH_KEYS.IN_PROGRESS, "1");
        inProgressRef.current = true;

        // clear transient oauth values before starting new flow (sessionStorage)
        sessionStorage.removeItem(OAUTH_KEYS.EMAIL);
        sessionStorage.removeItem(OAUTH_KEYS.CHALLENGE);
        sessionStorage.removeItem(OAUTH_KEYS.TOKEN);
        sessionStorage.removeItem(OAUTH_KEYS.MASKED_EMAIL);

        // persist minimal state into window.name so it survives navigations on mobile
        writeWindowState({ in_progress: true, started_at: Date.now() });

        const redirectTo = `${window.location.origin}/login?oauth=1`;

        try {
            await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo,
                    queryParams: { prompt: "select_account" },
                },
            });
            // Supabase will redirect — no further work here
        } catch (err) {
            inProgressRef.current = false;
            sessionStorage.removeItem(OAUTH_KEYS.IN_PROGRESS);
            clearWindowState();
            safeDispatch({ type: "SET", key: "error", value: err?.message || "OAuth initiation failed" });
        } finally {
            // stop showing oauth start-loading only when page hasn't navigated away
            // (if redirect happens, the unload will naturally replace JS context)
            safeDispatch({ type: "SET_LOADING", payload: { oauth: false } });
        }
    }, []);

    // backend exchange for oauth token -> site session
    const handleOAuth = useCallback(
        async ({ registered = false } = {}) => {
            try {
                sessionStorage.setItem(OAUTH_KEYS.IN_PROGRESS, "1");
                // reflect in window.name too (helps mobile)
                writeWindowState({ in_progress: true });

                inProgressRef.current = true;

                let access_token;
                let email;

                if (!registered) {
                    const { data, error } = await supabase.auth.getSession();
                    if (error) throw error;

                    const session = data?.session;
                    if (!session) return;

                    access_token = session?.access_token ?? session?.accessToken ?? session?.provider_token ?? null;
                    email = session?.user?.email;

                    if (!access_token) return;

                    sessionStorage.setItem(OAUTH_KEYS.TOKEN, access_token);
                    sessionStorage.setItem(OAUTH_KEYS.EMAIL, String(email));
                    // also mirror into window.name so it's robust
                    writeWindowState({ token: access_token, email: String(email) });
                } else {
                    access_token = sessionStorage.getItem(OAUTH_KEYS.TOKEN);
                    email = sessionStorage.getItem(OAUTH_KEYS.EMAIL);
                }

                const fingerprint = window.localStorage.getItem("device_fp") || null;

                // allow cancellation on unmount
                const ac = new AbortController();
                oauthAbortRef.current = ac;

                const res = await fetch(`${backendUrlV1}/auth/oauth/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${access_token}`,
                    },
                    credentials: "include",
                    body: JSON.stringify({ fingerprint }),
                    signal: ac.signal,
                });

                const body = await res.json().catch(() => ({}));

                if (!res.ok) {
                    safeDispatch({ type: "SET", key: "error", value: body.detail || "OAuth login failed" });
                    return;
                }

                // fully logged in
                if (body.ok && !body.needs_registration) {
                    // clean sessionStorage + window.name
                    sessionStorage.removeItem(OAUTH_KEYS.EMAIL);
                    sessionStorage.removeItem(OAUTH_KEYS.CHALLENGE);
                    sessionStorage.removeItem(OAUTH_KEYS.TOKEN);
                    sessionStorage.removeItem(OAUTH_KEYS.MASKED_EMAIL);
                    clearWindowState();
                    window.history.replaceState({}, "", "/login");
                    window.location.replace("/");
                    return;
                }

                if (body.challenge === "otp_required") {
                    sessionStorage.setItem(OAUTH_KEYS.CHALLENGE, body.challenge_id);
                    sessionStorage.setItem(OAUTH_KEYS.MASKED_EMAIL, body.masked_email);
                    sessionStorage.setItem(OAUTH_KEYS.REQUIRES_OTP, "1");
                    // mirror to window.name for robustness
                    writeWindowState({ challenge_id: body.challenge_id, masked_email: body.masked_email });
                }

                if (body.needs_registration) {
                    sessionStorage.setItem(OAUTH_KEYS.EMAIL, body.email);
                    sessionStorage.setItem(OAUTH_KEYS.CHALLENGE, body.challenge_id);
                    sessionStorage.setItem(OAUTH_KEYS.REQUIRES_REGISTRATION, "1");
                    // mirror to window.name for robustness
                    writeWindowState({ email: body.email, challenge_id: body.challenge_id, requires_registration: true });
                    // set UI flag
                    setNeedsReg(true);
                }
            } catch (err) {
                if (err?.name === "AbortError") {

                } else {
                    safeDispatch({ type: "SET", key: "error", value: err?.message || "OAuth flow failed" });
                }
            } finally {
                sessionStorage.removeItem(OAUTH_KEYS.IN_PROGRESS);
                // clear in-progress marker in window.name too
                // but only if flow completed or errored
                const win = readWindowState();
                if (win && !win.challenge_id && !win.requires_registration) {
                    clearWindowState();
                } else if (!win) {
                    clearWindowState();
                } else {
                    // keep some items (challenge etc) but remove in_progress flag
                    writeWindowState({ in_progress: false });
                }

                inProgressRef.current = false;
                oauthAbortRef.current = null;
            }
        },
        [navigate]
    );

    function registerHandler() {
        safeDispatch({ type: "SET_MANY", payload: { challengeId: sessionStorage.getItem(OAUTH_KEYS.CHALLENGE), maskedEmail: sessionStorage.getItem(OAUTH_KEYS.MASKED_EMAIL) || "" } });
        window.history.replaceState({}, "", "/login");
        sessionStorage.removeItem(OAUTH_KEYS.REQUIRES_REGISTRATION);
        // mirror: remove the requires_registration from window.name
        const ws = readWindowState();
        if (ws) {
            writeWindowState({ requires_registration: false });
        }
        navigate("/register?oauth=1");
    }

    function cancelRegisterHandler() {
        inProgressRef.current = false;
        oauthAbortRef.current = null;
        clearOAuthKeys();
        clearWindowState();
        window.history.replaceState({}, "", "/login");
        navigate("/login");
    }

    function resetLoginState({ clearOAuth = false } = {}) {
        dispatch({ type: "RESET" });

        if (clearOAuth) {
            sessionStorage.removeItem(OAUTH_KEYS.EMAIL);
            sessionStorage.removeItem(OAUTH_KEYS.CHALLENGE);
            sessionStorage.removeItem(OAUTH_KEYS.TOKEN);
            sessionStorage.removeItem(OAUTH_KEYS.MASKED_EMAIL);
            sessionStorage.removeItem(OAUTH_KEYS.IN_PROGRESS);
            clearWindowState();
        }
    }

    // mount logic: only start oauth if URL parameters indicate so
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const oauth = params.get("oauth");
        const registered = params.get("registered");

        if (!oauth && !registered) return;

        // avoid leaking query params
        window.history.replaceState({}, "", "/login");

        // set in-progress then run exchange
        sessionStorage.setItem(OAUTH_KEYS.IN_PROGRESS, "1");
        // mirror into window.name so mobile survives reload
        writeWindowState({ in_progress: true });

        inProgressRef.current = true;

        (async () => {
            try {
                await handleOAuth({ registered: Boolean(registered) });
            } finally {
                sessionStorage.removeItem(OAUTH_KEYS.IN_PROGRESS);
                // mark in_progress false in window.name (but keep challenge if present)
                writeWindowState({ in_progress: false });
                inProgressRef.current = false;
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleOAuth]);

    const handlePasswordLogin = useCallback(
        async (e) => {
            e.preventDefault();
            if (anyLoading) return;
            safeDispatch({ type: "SET", key: "error", value: "" });
            safeDispatch({ type: "SET_LOADING", payload: { password: true } });

            try {
                const res = await loginWithPassword(state.identifier, state.password);

                if (res?.challenge === "otp_required") {
                    safeDispatch({ type: "SET_MANY", payload: { challengeId: res.challenge_id, maskedEmail: res.masked_email || "" } });
                    if (res.challenge_id) sessionStorage.setItem(OAUTH_KEYS.CHALLENGE, res.challenge_id);
                    if (res.masked_email) sessionStorage.setItem(OAUTH_KEYS.MASKED_EMAIL, res.masked_email);
                    // mirror to window.name so it survives redirect
                    writeWindowState({ challenge_id: res.challenge_id, masked_email: res.masked_email || "" });
                }
            } catch (err) {
                safeDispatch({ type: "SET", key: "error", value: err?.message || "Invalid credentials." });
            } finally {
                safeDispatch({ type: "SET_LOADING", payload: { password: false } });
            }
        },
        [anyLoading, loginWithPassword, state.identifier, state.password]
    );

    const handleVerifyOtp = useCallback(
        async (e) => {
            e.preventDefault();
            if (anyLoading) return;
            safeDispatch({ type: "SET", key: "error", value: "" });
            safeDispatch({ type: "SET_LOADING", payload: { otp: true } });

            try {
                await verifyLoginOtp({
                    identifier: state.identifier || sessionStorage.getItem(OAUTH_KEYS.EMAIL),
                    challenge_id: state.challengeId || sessionStorage.getItem(OAUTH_KEYS.CHALLENGE),
                    code: state.otp,
                });
                clearOAuthKeys();
                clearWindowState();
            } catch (err) {
                safeDispatch({ type: "SET", key: "error", value: err?.response?.data?.message || "Invalid OTP" });
            } finally {
                safeDispatch({ type: "SET_LOADING", payload: { otp: false } });
            }
        },
        [anyLoading, verifyLoginOtp, state.identifier, state.challengeId, state.otp]
    );

    const handlePasskey = useCallback(async () => {
        if (!state.identifier) {
            dispatch({ type: "SET", key: "error", value: "Enter your email or username first." });
            return;
        }
        if (anyLoading) return;

        safeDispatch({ type: "SET", key: "error", value: "" });
        safeDispatch({ type: "SET_LOADING", payload: { passkey: true } });
        try {
            await loginWithPasskey(state.identifier);
            window.location.replace(localStorage.getItem("redirectAfterLogin") || "/");
        } catch (err) {
            safeDispatch({ type: "SET", key: "error", value: err?.message || "Passkey login failed" });
        } finally {
            safeDispatch({ type: "SET_LOADING", payload: { passkey: false } });
        }
    }, [anyLoading, state.identifier]);

    const hasChallenge = Boolean(state.challengeId && sessionStorage.getItem(OAUTH_KEYS.CHALLENGE));

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-full sm:max-w-[500px] max-w-[90%] rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-xl p-8">
                <div className="flex justify-center mb-6">
                    <Logo width={140} />
                </div>

                <h1 className="text-xl font-semibold text-white text-center">Sign in to Forkit</h1>
                <p className="text-sm text-gray-400 text-center mt-1">Use your password or a passkey.</p>

                {state.error && (
                    <div className="mt-4 text-sm text-red-400 text-center" role="alert" aria-live="assertive">
                        {state.error}
                    </div>
                )}

                <div className="space-y-4 mt-6">
                    {!hasChallenge ? (
                        <div className="flex flex-col justify-evenly">
                            <div className="space-y-4 w-full">
                                <input
                                    type="text"
                                    placeholder="Email or Username"
                                    value={state.identifier}
                                    onChange={(e) => dispatch({ type: "SET", key: "identifier", value: e.target.value })}
                                    autoFocus
                                    disabled={anyLoading}
                                    aria-disabled={anyLoading}
                                    className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-gray-700 text-white disabled:opacity-50"
                                />

                                <form onSubmit={handlePasswordLogin} className="space-y-3">
                                    <div className="relative">
                                        <input
                                            type={state.showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            value={state.password}
                                            onChange={(e) => dispatch({ type: "SET", key: "password", value: e.target.value })}
                                            disabled={anyLoading}
                                            aria-disabled={anyLoading}
                                            className="w-full px-4 py-2.5 pr-12 rounded-lg bg-neutral-900 border border-gray-700 text-white disabled:opacity-50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => dispatch({ type: "SET", key: "showPassword", value: !state.showPassword })}
                                            disabled={anyLoading}
                                            aria-disabled={anyLoading}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm disabled:opacity-50"
                                        >
                                            {state.showPassword ? "Hide" : "Show"}
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={anyLoading || !state.identifier}
                                        aria-busy={state.loading.password}
                                        className={`w-full py-2.5 rounded-lg flex items-center justify-center ${anyLoading || !state.identifier ? "bg-orange-600/70 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-500"
                                            } text-white disabled:opacity-50`}
                                    >
                                        {state.loading.password ? (
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
                                <button
                                    onClick={() => {
                                        if (!state.identifier) {
                                            dispatch({ type: "SET", key: "error", value: "Enter your email or username first." });
                                        } else {
                                            handlePasskey();
                                        }
                                    }}
                                    disabled={anyLoading || !state.identifier}
                                    aria-busy={state.loading.passkey}
                                    className={`w-full py-2.5 rounded-lg border border-gray-600 flex items-center justify-center text-white hover:bg-white/5 disabled:opacity-50 ${anyLoading || !state.identifier ? "cursor-not-allowed" : ""
                                        }`}
                                >
                                    {state.loading.passkey ? (
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
                                        className={`w-full gap-x-2 py-2.5 rounded-lg border border-gray-600 flex items-center justify-center text-white hover:bg-white/5 disabled:opacity-50 ${anyLoading ? "cursor-not-allowed" : ""
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
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="w-full flex pt-4 border-t justify-center border-gray-700 space-y-3">
                            <div className="w-fit space-y-3">
                                <p className="text-sm text-gray-400 text-center">
                                    Enter the code sent to {state.maskedEmail || sessionStorage.getItem(OAUTH_KEYS.MASKED_EMAIL)}
                                </p>

                                <input
                                    type="text"
                                    placeholder="6-digit code"
                                    value={state.otp}
                                    onChange={(e) => dispatch({ type: "SET", key: "otp", value: e.target.value })}
                                    maxLength={6}
                                    disabled={anyLoading}
                                    aria-disabled={anyLoading}
                                    className="w-full px-4 py-2.5 text-center tracking-widest rounded-lg bg-neutral-900 border border-gray-700 text-white disabled:opacity-50"
                                />

                                <button
                                    type="submit"
                                    disabled={anyLoading}
                                    aria-busy={state.loading.otp}
                                    className={`w-full py-2.5 rounded-lg flex items-center justify-center ${anyLoading ? "bg-orange-600/70 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-500"
                                        } text-white disabled:opacity-50`}
                                >
                                    {state.loading.otp ? (
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
                        <p className="text-sm text-gray-400 text-center">
                            Reset login credentials{" "}
                            <button
                                onClick={() => resetLoginState({ clearOAuth: true })}
                                className="text-orange-400 hover:underline"
                            >
                                here
                            </button>
                        </p>
                    </div>
                </div>
            </div>
            <Modal
                isOpen={needsReg}
                lock
                type="warning"
                title="No account found"
                description={`We couldn't find an account for ${sessionStorage.getItem(OAUTH_KEYS.EMAIL) || "this email"}. What would you like to do?`}
                primaryAction={{
                    label: "Register a new account",
                    onClick: registerHandler,
                }}
                secondaryAction={{
                    label: "Cancel",
                    onClick: cancelRegisterHandler,
                }}
            >
                <div className="p-3 text-sm text-zinc-300">
                    <p className="mb-2">
                        Registering will create a new site account for <strong>{sessionStorage.getItem(OAUTH_KEYS.EMAIL) || "this email"}</strong> with OAuth login.
                    </p>
                    <p className="mb-2">
                        If you wish, you can also register a password login from your account settings after registering, but it&apos;s not mandatory.
                    </p>
                </div>
            </Modal>
        </div>
    );
}

export default Login;