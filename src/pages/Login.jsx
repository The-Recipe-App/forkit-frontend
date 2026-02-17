import { useCallback, useEffect, useReducer } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../features/Logo";
import { useAuthApi } from "../features/auth/authApi";
import { useMe } from "../hooks/useMe";
import { loginWithPasskey } from "../features/auth/passkey";
import { supabase } from "../lib/supabase";
import backendUrlV1 from "../urls/backendUrl";
import Modal from "../components/popUpModal";

/* ------------------------------------------------ */
/* BASE64 STATE HELPERS */
/* ------------------------------------------------ */

function encodeState(obj) {
  try {
    return btoa(encodeURIComponent(JSON.stringify(obj)));
  } catch {
    return "";
  }
}

function decodeState(str) {
  if (!str) return {};
  try {
    return JSON.parse(decodeURIComponent(atob(str)));
  } catch {
    return {};
  }
}

function setUrlState(navigate, stateObj) {
  navigate(`/login?state=${encodeState(stateObj)}`, { replace: true });
}

/* ------------------------------------------------ */
/* UI STATE */
/* ------------------------------------------------ */

const initialState = {
  identifier: "",
  password: "",
  otp: "",
  showPassword: false,
  error: "",
  loading: { password: false, otp: false, passkey: false },
};

function reducer(state, action) {
  switch (action.type) {
    case "SET":
      return { ...state, [action.key]: action.value };
    case "SET_LOADING":
      return { ...state, loading: { ...state.loading, ...action.payload } };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

/* ------------------------------------------------ */
/* COMPONENT */
/* ------------------------------------------------ */

function Login() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { loginWithPassword, verifyLoginOtp } = useAuthApi();
  const { data: me } = useMe();

  const urlState = decodeState(searchParams.get("state"));

  const step = urlState.step || "login";
  const challengeId = urlState.challenge || null;
  const maskedEmail = urlState.maskedEmail || null;
  const email = urlState.email || null;

  const anyLoading =
    state.loading.password || state.loading.otp || state.loading.passkey;

  /* ------------------------------------------------ */
  /* LOGIN SUCCESS REDIRECT */
  /* ------------------------------------------------ */

  useEffect(() => {
    if (me) navigate("/", { replace: true });
  }, [me, navigate]);

  /* ------------------------------------------------ */
  /* GOOGLE LOGIN START */
  /* ------------------------------------------------ */

  const handleGoogleLogin = async () => {
    const redirectTo = `${window.location.origin}/login?state=${encodeState({
      step: "oauth",
    })}`;

    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });
    } catch (err) {
      dispatch({
        type: "SET",
        key: "error",
        value: err?.message || "OAuth start failed",
      });
    }
  };

  /* ------------------------------------------------ */
  /* OAUTH EXCHANGE AFTER REDIRECT */
  /* ------------------------------------------------ */

  const handleOAuthExchange = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      const session = data?.session;
      if (!session) return;

      const access_token =
        session?.access_token || session?.provider_token || null;

      if (!access_token) return;

      const res = await fetch(`${backendUrlV1}/auth/oauth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        credentials: "include",
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
        navigate("/", { replace: true });
        return;
      }

      /* OTP required */
      if (body.challenge === "otp_required") {
        setUrlState(navigate, {
          step: "otp",
          challenge: body.challenge_id,
          maskedEmail: body.masked_email,
          email: session.user.email,
        });
        return;
      }

      /* registration required */
      if (body.needs_registration) {
        setUrlState(navigate, {
          step: "register",
          email: body.email,
        });
      }
    } catch (err) {
      dispatch({
        type: "SET",
        key: "error",
        value: err?.message || "OAuth failed",
      });
    }
  }, [navigate]);

  /* run oauth exchange if redirected */
  useEffect(() => {
    if (step === "oauth") handleOAuthExchange();
  }, [step, handleOAuthExchange]);

  /* ------------------------------------------------ */
  /* PASSWORD LOGIN */
  /* ------------------------------------------------ */

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (anyLoading) return;

    dispatch({ type: "SET_LOADING", payload: { password: true } });

    try {
      const res = await loginWithPassword(state.identifier, state.password);

      if (res?.challenge === "otp_required") {
        setUrlState(navigate, {
          step: "otp",
          challenge: res.challenge_id,
          maskedEmail: res.masked_email,
          email: state.identifier,
        });
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

  /* ------------------------------------------------ */
  /* OTP VERIFY */
  /* ------------------------------------------------ */

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (anyLoading) return;

    dispatch({ type: "SET_LOADING", payload: { otp: true } });

    try {
      await verifyLoginOtp({
        identifier: email,
        challenge_id: challengeId,
        code: state.otp,
      });

      navigate("/", { replace: true });
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

  /* ------------------------------------------------ */
  /* PASSKEY */
  /* ------------------------------------------------ */

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
      navigate("/", { replace: true });
    } catch (err) {
      dispatch({
        type: "SET",
        key: "error",
        value: err?.message || "Passkey failed",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: { passkey: false } });
    }
  };

  /* ------------------------------------------------ */
  /* UI */
/* ------------------------------------------------ */

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full sm:max-w-[500px] max-w-[90%] p-8">

        <Logo width={140} />

        {state.error && (
          <div className="text-red-400 mt-4">{state.error}</div>
        )}

        {/* LOGIN */}
        {step === "login" && (
          <div className="space-y-4">
            <input
              value={state.identifier}
              onChange={(e) =>
                dispatch({ type: "SET", key: "identifier", value: e.target.value })
              }
              placeholder="Email or Username"
            />

            <form onSubmit={handlePasswordLogin}>
              <input
                type="password"
                value={state.password}
                onChange={(e) =>
                  dispatch({ type: "SET", key: "password", value: e.target.value })
                }
                placeholder="Password"
              />
              <button>Continue with Password</button>
            </form>

            <button onClick={handlePasskey}>Passkey</button>
            <button onClick={handleGoogleLogin}>Google</button>
          </div>
        )}

        {/* OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp}>
            <p>Enter code sent to {maskedEmail}</p>
            <input
              value={state.otp}
              onChange={(e) =>
                dispatch({ type: "SET", key: "otp", value: e.target.value })
              }
            />
            <button>Verify</button>
          </form>
        )}

        {/* REGISTER */}
        <Modal
          isOpen={step === "register"}
          title="No account found"
          description={`No account for ${email}`}
          primaryAction={{
            label: "Register",
            onClick: () => navigate("/register"),
          }}
          secondaryAction={{
            label: "Cancel",
            onClick: () => navigate("/login"),
          }}
        />
      </div>
    </div>
  );
}

export default Login;
