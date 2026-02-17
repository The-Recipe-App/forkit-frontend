// Register.jsx
import { useEffect, useRef, useReducer } from "react";
import Logo from "../features/Logo";
import backendUrlV1 from "../urls/backendUrl";
import { useUsernameAvailabilitySimple } from "../features/userNameAvailability";
import Modal from "../components/popUpModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DOMPurify from "dompurify";
import { Info } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

/* ---------------- URL STATE HELPERS ---------------- */

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

/* ---------------- POLICY CONTENT ---------------- */

function PolicyContent({ markdown }) {
  const mdObj = markdown || {};
  const hasHtml = typeof mdObj.html === "string" && mdObj.html.length > 0;
  const hasMd = typeof mdObj.markdown === "string" && mdObj.markdown.length > 0;
  const contentMd = hasMd ? mdObj.markdown : hasHtml ? mdObj.html : "";

  if (hasHtml && !hasMd) {
    const sanitized = DOMPurify.sanitize(mdObj.html, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"],
    });
    return (
      <div
        className="prose prose-invert max-w-none text-sm"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  if (!contentMd) {
    return <div className="text-sm text-neutral-400">Click on "Read" to view the policy</div>;
  }

  return (
    <div className="prose prose-invert max-w-none text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {contentMd}
      </ReactMarkdown>
    </div>
  );
}

/* ---------------- CONFIG ---------------- */

const LEGAL_BASE = `/api/legal`;
const REGISTER_BASE = `${backendUrlV1}/auth/registration`;

/* ---------------- STATE ---------------- */

const initialState = {
  stage: "email",
  email: "",
  challengeId: "",
  otp: "",
  otpError: "",
  resendCooldown: 0,
  password: "",
  confirmPassword: "",
  showPassword: false,
  showConfirmPassword: false,
  userName: "",
  showConsentModal: false,
  policiesMeta: [],
  policiesFull: {},
  policyLoadingKey: null,
  consentLoading: false,
  consentError: "",
  emailUnacceptable: false,
  whyEmailUnacceptable: "",
  showEmailBlockedModal: false,
  loading: false,
  error: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "SET":
      return { ...state, [action.key]: action.value };
    case "SET_MANY":
      return { ...state, ...action.payload };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

/* ---------------- COMPONENT ---------------- */

export default function Register() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const cooldownRef = useRef(null);
  const navigate = useNavigate();

  /* -------- URL STATE -------- */

  const [searchParams] = useSearchParams();
  const urlState = decodeState(searchParams.get("state"));

  // OAuth register detection
  const isOAuth = urlState?.step === "oauth_register";

  /* -------- OAuth URL rehydration -------- */

  useEffect(() => {
    if (!isOAuth) return;

    if (!urlState.email || !urlState.challenge) {
      navigate("/login");
      return;
    }

    dispatch({
      type: "SET_MANY",
      payload: {
        email: urlState.email,
        challengeId: urlState.challenge,
        stage: "consent",
      },
    });

    handlePolicyStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOAuth]);

  /* -------- cooldown timer -------- */

  useEffect(() => {
    if (state.resendCooldown <= 0) {
      clearInterval(cooldownRef.current);
      return;
    }

    cooldownRef.current = setInterval(() => {
      dispatch({
        type: "SET",
        key: "resendCooldown",
        value: Math.max(0, state.resendCooldown - 1),
      });
    }, 1000);

    return () => clearInterval(cooldownRef.current);
  }, [state.resendCooldown]);

  /* ---------------- POLICIES ---------------- */

  async function handlePolicyStep() {
    try {
      const res = await fetch(`${LEGAL_BASE}/active`);
      const body = await res.json();
      const normals = body?.policies || body || [];
      dispatch({
        type: "SET_MANY",
        payload: { policiesMeta: normals, showConsentModal: true, stage: "consent" },
      });
    } catch (err) {
      dispatch({ type: "SET", key: "error", value: "Failed to load policies" });
    }
  }

  /* ---------------- REGISTRATION ---------------- */

  async function performRegistration() {
    dispatch({ type: "SET", key: "loading", value: true });

    try {
      const consents = state.policiesMeta.map((p) => ({
        agreement_key: p.key,
        agreement_version: p.version,
        text_hash: p.text_hash,
      }));

      let res;

      if (isOAuth) {
        dispatch({ type: "SET", key: "stage", value: "oauthfinal" });

        // 🔥 OAuth token now comes from Supabase session
        const { data } = await supabase.auth.getSession();
        const accessToken = data?.session?.access_token;

        if (!accessToken) throw new Error("OAuth session expired");

        res = await fetch(`${backendUrlV1}/auth/oauth/registration/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
          body: JSON.stringify({
            username: state.userName || null,
            challenge_id: state.challengeId,
            consents,
            age_verified: true,
          }),
        });
      } else {
        res = await fetch(`${REGISTER_BASE}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: state.email,
            password: state.password,
            username: state.userName || null,
            challenge_id: state.challengeId,
            consents,
            age_verified: true,
          }),
        });
      }

      const body = await res.json();

      if (!res.ok) throw new Error(body.detail || "Registration failed");

      if (body.activation_required) {
        dispatch({ type: "SET", key: "stage", value: "activation_sent" });
      } else {
        navigate("/login?registered=1");
      }
    } catch (err) {
      dispatch({ type: "SET", key: "error", value: err.message });
    } finally {
      dispatch({ type: "SET", key: "loading", value: false });
    }
  }

  const usernameStatus = useUsernameAvailabilitySimple(
    state.userName,
    Boolean(state.userName)
  );

  const isUsernameValid =
    !state.userName || usernameStatus === "available";

  /* ---------------- UI (unchanged from your original) ---------------- */

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full sm:max-w-md max-w-[88%] rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <Logo width={140} />
        </div>

        <h1 className="text-xl font-semibold text-white text-center">
          Create your Forkit account
        </h1>

        {state.stage === "consent" && (
          <div className="mt-6 text-center space-y-4">
            <div className="text-lg text-white font-semibold">
              Almost there...
            </div>
            <div className="text-sm text-gray-400">
              Before creating your account, review and accept our policies.
            </div>
          </div>
        )}

        {state.stage === "oauthfinal" && (
          <div className="py-10 text-center text-gray-400">
            Finalizing OAuth login…
          </div>
        )}
      </div>

      {/* EMAIL BLOCKED MODAL */}
      <Modal
        isOpen={state.showEmailBlockedModal}
        onClose={() =>
          dispatch({
            type: "SET",
            key: "showEmailBlockedModal",
            value: false,
          })
        }
        title="This email address can't be used"
      >
        <p>{state.whyEmailUnacceptable}</p>
      </Modal>

      {/* CONSENT MODAL */}
      <Modal
        isOpen={state.showConsentModal}
        title="Before you continue"
        onAgree={performRegistration}
      >
        <div className="space-y-4">
          {state.policiesMeta.map((p) => (
            <PolicyContent key={p.key} markdown={state.policiesFull[p.key]} />
          ))}
        </div>
      </Modal>
    </div>
  );
}
