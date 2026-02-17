import { useCallback, useEffect, useReducer, useState } from "react";
import Logo from "../features/Logo";
import { useAuthApi } from "../features/auth/authApi";
import { useNavigate } from "react-router-dom";
import { useMe } from "../hooks/useMe";
import { loginWithPasskey } from "../features/auth/passkey";
import { supabase } from "../lib/supabase";
import backendUrlV1 from "../urls/backendUrl";
import Modal from "../components/popUpModal";

/* ----------------------------- Storage ----------------------------- */

const OAUTH_KEYS = {
  IN_PROGRESS: "oauth_in_progress",
  TOKEN: "oauth_token",
  EMAIL: "oauth_email",
  CHALLENGE: "oauth_challenge",
  MASKED_EMAIL: "oauth_masked_email",
  REQUIRES_OTP: "oauth_requires_otp",
  REQUIRES_REGISTRATION: "oauth_requires_registration",
};

const storage = {
  set(key, val) {
    if (!val) localStorage.removeItem(key);
    else localStorage.setItem(key, val);
  },
  get(key) {
    return localStorage.getItem(key);
  },
  clear() {
    Object.values(OAUTH_KEYS).forEach((k) => localStorage.removeItem(k));
  },
};

/* ----------------------------- UI State ----------------------------- */

const initialState = {
  identifier: "",
  password: "",
  otp: "",
  challengeId: null,
  maskedEmail: "",
  showPassword: false,
  error: "",
  loading: { password: false, otp: false, passkey: false },
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
      return initialState;
    default:
      return state;
  }
}

/* ----------------------------- Component ----------------------------- */

function Login() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const { loginWithPassword, verifyLoginOtp } = useAuthApi();
  const { data: me } = useMe();

  const anyLoading =
    state.loading.password || state.loading.otp || state.loading.passkey;

  const [needsReg, setNeedsReg] = useState(false);
  const [hasOTPChallenge, setHasOTPChallenge] = useState(false);

  /* ----------------------------- Auth Redirect ----------------------------- */

  useEffect(() => {
    if (!me) return;

    const redirect = localStorage.getItem("redirectAfterLogin");
    navigate(redirect || "/");
    localStorage.removeItem("redirectAfterLogin");
  }, [me, navigate]);

  /* ----------------------------- Rehydrate OAuth ----------------------------- */

  useEffect(() => {
    const challenge = storage.get(OAUTH_KEYS.CHALLENGE);
    const masked = storage.get(OAUTH_KEYS.MASKED_EMAIL);
    const requiresOtp = storage.get(OAUTH_KEYS.REQUIRES_OTP) === "1";
    const requiresReg = storage.get(OAUTH_KEYS.REQUIRES_REGISTRATION) === "1";

    if (challenge) {
      dispatch({
        type: "SET_MANY",
        payload: { challengeId: challenge, maskedEmail: masked || "" },
      });
    }

    setHasOTPChallenge(Boolean(challenge && requiresOtp));
    setNeedsReg(requiresReg);
  }, []);

  /* ----------------------------- Google OAuth Start ----------------------------- */

  const handleGoogleLogin = useCallback(async () => {
    storage.clear();
    storage.set(OAUTH_KEYS.IN_PROGRESS, "1");

    const redirectTo = `${window.location.origin}/login?oauth=1`;

    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });
    } catch (err) {
      storage.clear();
      dispatch({
        type: "SET",
        key: "error",
        value: err?.message || "OAuth initiation failed",
      });
    }
  }, []);

  /* ----------------------------- OAuth Exchange ----------------------------- */

  const handleOAuthExchange = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      const session = data?.session;
      if (!session) return;

      const access_token =
        session?.access_token || session?.provider_token || null;
      const email = session?.user?.email;

      if (!access_token) return;

      storage.set(OAUTH_KEYS.TOKEN, access_token);
      storage.set(OAUTH_KEYS.EMAIL, email);

      const fingerprint = localStorage.getItem("device_fp") || null;

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
        dispatch({
          type: "SET",
          key: "error",
          value: body.detail || "OAuth login failed",
        });
        return;
      }

      /* fully logged in */
      if (body.ok && !body.needs_registration) {
        storage.clear();
        window.location.replace("/");
        return;
      }

      /* OTP required */
      if (body.challenge === "otp_required") {
        storage.set(OAUTH_KEYS.CHALLENGE, body.challenge_id);
        storage.set(OAUTH_KEYS.MASKED_EMAIL, body.masked_email);
        storage.set(OAUTH_KEYS.REQUIRES_OTP, "1");

        dispatch({
          type: "SET_MANY",
          payload: {
            challengeId: body.challenge_id,
            maskedEmail: body.masked_email,
          },
        });

        setHasOTPChallenge(true);
      }

      /* Registration required */
      if (body.needs_registration) {
        storage.set(OAUTH_KEYS.EMAIL, body.email);
        storage.set(OAUTH_KEYS.CHALLENGE, body.challenge_id);
        storage.set(OAUTH_KEYS.REQUIRES_REGISTRATION, "1");
        setNeedsReg(true);
      }
    } catch (err) {
      dispatch({
        type: "SET",
        key: "error",
        value: err?.message || "OAuth flow failed",
      });
    } finally {
      storage.set(OAUTH_KEYS.IN_PROGRESS, null);
    }
  }, []);

  /* ----------------------------- OAuth Redirect Handler ----------------------------- */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("oauth")) return;

    window.history.replaceState({}, "", "/login");
    handleOAuthExchange();
  }, [handleOAuthExchange]);

  /* ----------------------------- Password Login ----------------------------- */

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (anyLoading) return;

    dispatch({ type: "SET", key: "error", value: "" });
    dispatch({ type: "SET_LOADING", payload: { password: true } });

    try {
      const res = await loginWithPassword(state.identifier, state.password);

      if (res?.challenge === "otp_required") {
        storage.set(OAUTH_KEYS.CHALLENGE, res.challenge_id);
        storage.set(OAUTH_KEYS.MASKED_EMAIL, res.masked_email);

        dispatch({
          type: "SET_MANY",
          payload: {
            challengeId: res.challenge_id,
            maskedEmail: res.masked_email || "",
          },
        });

        setHasOTPChallenge(true);
      }
    } catch (err) {
      dispatch({
        type: "SET",
        key: "error",
        value: err?.message || "Invalid credentials",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: { password: false } });
    }
  };

  /* ----------------------------- OTP Verify ----------------------------- */

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (anyLoading) return;

    dispatch({ type: "SET_LOADING", payload: { otp: true } });

    try {
      await verifyLoginOtp({
        identifier: state.identifier || storage.get(OAUTH_KEYS.EMAIL),
        challenge_id: state.challengeId,
        code: state.otp,
      });

      storage.clear();
    } catch (err) {
      dispatch({
        type: "SET",
        key: "error",
        value: err?.message || "Invalid OTP",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: { otp: false } });
    }
  };

  /* ----------------------------- Passkey ----------------------------- */

  const handlePasskey = async () => {
    if (!state.identifier) {
      dispatch({
        type: "SET",
        key: "error",
        value: "Enter email or username first",
      });
      return;
    }

    dispatch({ type: "SET_LOADING", payload: { passkey: true } });

    try {
      await loginWithPasskey(state.identifier);
      window.location.replace(localStorage.getItem("redirectAfterLogin") || "/");
    } catch (err) {
      dispatch({
        type: "SET",
        key: "error",
        value: err?.message || "Passkey login failed",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: { passkey: false } });
    }
  };

  /* ----------------------------- Registration Modal ----------------------------- */

  function registerHandler() {
    navigate("/register?oauth=1");
    storage.set(OAUTH_KEYS.REQUIRES_REGISTRATION, null);
  }

  function cancelRegisterHandler() {
    storage.clear();
    setNeedsReg(false);
  }

  /* ----------------------------- UI ----------------------------- */

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full sm:max-w-[500px] max-w-[90%] rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <Logo width={140} />
        </div>

        <h1 className="text-xl font-semibold text-white text-center">
          Sign in to Forkit
        </h1>

        {state.error && (
          <div className="mt-4 text-sm text-red-400 text-center">
            {state.error}
          </div>
        )}

        {/* Normal login */}
        {!hasOTPChallenge && (
          <div className="space-y-4 mt-6">
            <input
              type="text"
              placeholder="Email or Username"
              value={state.identifier}
              onChange={(e) =>
                dispatch({
                  type: "SET",
                  key: "identifier",
                  value: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-gray-700 text-white"
            />

            <form onSubmit={handlePasswordLogin}>
              <input
                type="password"
                placeholder="Password"
                value={state.password}
                onChange={(e) =>
                  dispatch({
                    type: "SET",
                    key: "password",
                    value: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-gray-700 text-white"
              />

              <button className="w-full mt-3 py-2.5 bg-orange-600 text-white rounded-lg">
                Continue with Password
              </button>
            </form>

            <button
              onClick={handlePasskey}
              className="w-full py-2.5 border border-gray-600 text-white rounded-lg"
            >
              Continue with Passkey
            </button>

            <button
              onClick={handleGoogleLogin}
              className="w-full py-2.5 border border-gray-600 text-white rounded-lg"
            >
              Continue with Google
            </button>
          </div>
        )}

        {/* OTP */}
        {hasOTPChallenge && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 mt-6">
            <p className="text-gray-400 text-center">
              Enter the code sent to {state.maskedEmail}
            </p>

            <input
              type="text"
              value={state.otp}
              onChange={(e) =>
                dispatch({ type: "SET", key: "otp", value: e.target.value })
              }
              className="w-full px-4 py-2.5 text-center rounded-lg bg-neutral-900 border border-gray-700 text-white"
            />

            <button className="w-full py-2.5 bg-orange-600 text-white rounded-lg">
              Verify & Continue
            </button>
          </form>
        )}
      </div>

      <Modal
        isOpen={needsReg}
        lock
        type="warning"
        title="No account found"
        description={`No account found for ${
          storage.get(OAUTH_KEYS.EMAIL) || "this email"
        }`}
        primaryAction={{
          label: "Register",
          onClick: registerHandler,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: cancelRegisterHandler,
        }}
      />
    </div>
  );
}

export default Login;
