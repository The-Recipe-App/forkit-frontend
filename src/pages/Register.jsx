// Register.jsx
import { useEffect, useRef, useReducer, useCallback } from "react";
import Logo from "../features/Logo";
import backendUrlV1 from "../urls/backendUrl";
import { useUsernameAvailabilitySimple } from "../features/userNameAvailability";
import Modal from "../components/popUpModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DOMPurify from "dompurify";
import { Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

function PolicyContent({ markdown }) {
  const mdObj = markdown || {};
  const hasHtml = typeof mdObj.html === "string" && mdObj.html.length > 0;
  const hasMd = typeof mdObj.markdown === "string" && mdObj.markdown.length > 0;
  const contentMd = hasMd ? mdObj.markdown : hasHtml ? mdObj.html : "";

  if (hasHtml && !hasMd) {
    const sanitized = DOMPurify.sanitize(mdObj.html, { ADD_TAGS: ["iframe"], ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"] });
    return (
      <div
        className="
          prose prose-invert max-w-none
          prose-p:leading-relaxed
          prose-li:my-1
          prose-ul:pl-6
          prose-ol:pl-6
          prose-headings:text-orange-300
          prose-a:text-orange-400
          prose-a:underline
          prose-strong:text-white
          text-sm
        "
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }
  if (!contentMd) {
    return <div className="text-sm text-neutral-400">Click on "Read" to view the policy</div>;
  }
  return (
    <div
      className="
        prose prose-invert max-w-none
        prose-p:leading-relaxed
        prose-li:my-1
        prose-ul:pl-6
        prose-ol:pl-6
        prose-headings:text-orange-300
        prose-a:text-orange-400
        prose-a:underline
        prose-strong:text-white
        text-sm
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{

          pre: ({ node, ...props }) => (

            <pre
              {...props}
              className="whitespace-pre rounded-md bg-neutral-900 p-3 overflow-auto text-xs"
              style={{ tabSize: 4 }}
            />
          ),

          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {

              return (
                <code
                  {...props}
                  className={`px-1 py-0.5 rounded text-sm bg-neutral-800 ${className || ""}`}
                >
                  {children}
                </code>
              );
            }

            return (
              <code
                {...props}
                className={`whitespace-pre block rounded-md bg-neutral-900 p-3 overflow-auto text-xs ${className || ""}`}
                style={{ tabSize: 4 }}
              >
                {children}
              </code>
            );
          },

          p: ({ node, ...props }) => <p {...props} className="leading-relaxed" />,
          li: ({ node, ...props }) => <li {...props} className="my-1" />,
        }}
      >
        {contentMd}
      </ReactMarkdown>
    </div>
  );
}

function validatePassword(pwd) {
  if (pwd.length < 8) return "Password must be at least 8 characters.";
  if (pwd.length > 72) return "Password is too long.";
  if (!/[A-Za-z]/.test(pwd)) return "Password must contain at least one letter.";
  if (!/\d/.test(pwd)) return "Password must contain at least one number.";
  return null;
}

const LEGAL_BASE = `/api/legal`;
const REGISTER_BASE = `${backendUrlV1}/auth/registration`;
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

export default function Register() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const cooldownRef = useRef(null);
  const navigate = useNavigate();
  const isOAuth = new URLSearchParams(window.location.search).get("oauth") === "1";

  // cooldown timer
  useEffect(() => {
    if (state.resendCooldown <= 0) {
      clearInterval(cooldownRef.current);
      return;
    }
    cooldownRef.current = setInterval(() => {
      dispatch({ type: "SET", key: "resendCooldown", value: Math.max(0, state.resendCooldown - 1) });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [state.resendCooldown]);

  const passwordRules = {
    length: state.password.length >= 8,
    upper: /[A-Z]/.test(state.password),
    lower: /[a-z]/.test(state.password),
    number: /[0-9]/.test(state.password),
    match: state.password && state.password === state.confirmPassword,
  };

  const isPasswordStrong = Object.values(passwordRules).every(Boolean);
  const strengthScore = [passwordRules.length, passwordRules.upper, passwordRules.lower, passwordRules.number].filter(Boolean).length;
  const strengthPct = (strengthScore / 4) * 100;

  async function handleRequestOtp(e) {
    e?.preventDefault();
    dispatch({ type: "SET", key: "error", value: "" });
    if (!state.email) {
      dispatch({ type: "SET", key: "error", value: "Enter an email" });
      return;
    }
    dispatch({ type: "SET", key: "loading", value: true });
    try {
      const fingerprint = window.localStorage.getItem("device_fp") || null;
      const payload = { email: state.email, fingerprint };
      const res = await fetch(`${REGISTER_BASE}/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.status_code === 406) {
          dispatch({ type: "SET", key: "whyEmailUnacceptable", value: body.message || "This email domain is not allowed." });
          dispatch({ type: "SET", key: "emailUnacceptable", value: true });
        }
        throw new Error(body.detail || "Failed to request OTP");
      }
      dispatch({ type: "SET_MANY", payload: { challengeId: body.challenge_id, resendCooldown: body.resend_cooldown || 30, stage: "otp", whyEmailUnacceptable: "", emailUnacceptable: false } });
    } catch (err) {
      dispatch({ type: "SET", key: "error", value: err.message || String(err) });
    } finally {
      dispatch({ type: "SET", key: "loading", value: false });
    }
  }

  async function handleResendOtp() {
    if (state.resendCooldown > 0) return;
    dispatch({ type: "SET", key: "loading", value: true });
    try {
      const res = await fetch(`${REGISTER_BASE}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: state.email, challenge_id: state.challengeId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.status_code === 406) {
          dispatch({ type: "SET", key: "whyEmailUnacceptable", value: body.message || "This email domain is not allowed." });
          dispatch({ type: "SET", key: "emailUnacceptable", value: true });
        }
        throw new Error(body.detail || "Failed to resend OTP");
      }
      dispatch({ type: "SET", key: "resendCooldown", value: body.resend_cooldown || 30 });
    } catch (err) {
      dispatch({ type: "SET", key: "otpError", value: err.message || String(err) });
    } finally {
      dispatch({ type: "SET", key: "loading", value: false });
    }
  }

  async function handlePolicyStep() {
    let metaBody = null;
    try {
      const metaRes = await fetch(`${LEGAL_BASE}/active?meta_only=1`, {
        cache: "no-store",
      });
      
      metaBody = await metaRes.json().catch(() => null);
      if (!metaRes.ok || !metaBody) {
        const fallback = await fetch(`${LEGAL_BASE}/active`, {
          cache: "no-store",
        });
        
        metaBody = await fallback.json().catch(() => null);
        if (!fallback.ok) throw new Error("Failed to load policies (both meta and fallback failed)");
      }
    } catch (err) {
      console.warn("policy meta fetch error:", err);
      throw err;
    }

    let normals = [];
    if (!metaBody) {
      normals = [];
    } else if (Array.isArray(metaBody)) {
      normals = metaBody;
    } else if (Array.isArray(metaBody.policies)) {
      normals = metaBody.policies;
    } else if (Array.isArray(metaBody.data)) {
      normals = metaBody.data;
    } else {
      const arr = Object.values(metaBody).find((v) => Array.isArray(v));
      normals = arr || [];
    }
    dispatch({ type: "SET_MANY", payload: { policiesMeta: normals, showConsentModal: true, stage: "consent" } });
  }

  async function handleVerifyOtp(e) {
    e?.preventDefault();
    dispatch({ type: "SET", key: "otpError", value: "" });
    if (!state.otp || !state.challengeId) {
      dispatch({ type: "SET", key: "otpError", value: "Enter the code" });
      return;
    }
    dispatch({ type: "SET", key: "loading", value: true });
    try {
      const res = await fetch(`${REGISTER_BASE}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: state.email, challenge_id: state.challengeId, code: state.otp }),
      });
      const resBody = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((resBody && resBody.detail) || `OTP verification failed (status ${res.status})`);
      }
      dispatch({ type: "SET", key: "stage", value: "consent" });
      await handlePolicyStep();
    } catch (err) {
      dispatch({ type: "SET", key: "otpError", value: err.message || String(err) });
    } finally {
      dispatch({ type: "SET", key: "loading", value: false });
    }
  }

  async function loadPolicyFull(key) {
    console.log(key);
    // toggle hide if already loaded
    if (state.policiesFull[key]) {
      const copy = { ...state.policiesFull };
      delete copy[key];
      dispatch({ type: "SET", key: "policiesFull", value: copy });
      return;
    }

    const meta = state.policiesMeta.find((p) => p.key === key || p.id === key || p.slug === key);
    if (!meta) {

      console.warn("Policy meta not found for key:", key, "— falling back to API endpoints.");
      try {
        setPolicyLoadingKey(key);
        const tryUrls = [
          `${LEGAL_BASE}/${encodeURIComponent(key)}/versions`,
          `${LEGAL_BASE}/${encodeURIComponent(key)}`,
          `${LEGAL_BASE}/${encodeURIComponent(key)}/latest`,
        ];
        console.log("Trying policy URLs:", tryUrls);

        let body = null;
        let ok = false;
        for (const url of tryUrls) {
          try {
            const res = await fetch(url);
            body = await res.json().catch(() => null);
            console.log("policy fetch", url, res.status, body);
            if (res.ok && body) {
              ok = true;
              break;
            }
          } catch (err) {
            console.warn("policy fetch error for", url, err);
          }
        }

        if (!ok || !body) throw new Error("Failed to load policy (all endpoints failed)");

        if (Array.isArray(body.versions) && body.versions.length) {
          dispatch({ type: "SET", key: "policiesFull", value: { ...state.policiesFull, [key]: body.versions[0] } });
          return;
        }
        if (Array.isArray(body) && body.length) {
          dispatch({ type: "SET", key: "policiesFull", value: { ...state.policiesFull, [key]: body[0] } });
          return;
        }
        dispatch({ type: "SET", key: "policiesFull", value: { ...state.policiesFull, [key]: body } });
        return;
      } catch (err) {
        dispatch({ type: "SET", key: "consentError", value: err.message || String(err) });
        dispatch({ type: "SET", key: "policyLoadingKey", value: null });
        return;
      } finally {
        dispatch({ type: "SET", key: "policyLoadingKey", value: null });
      }
    }

    if (!meta.file_url) {
      dispatch({ type: "SET", key: "consentError", value: "Policy metadata missing file_url" });
      return;
    }

    const fileUrlAbsolute = ((fileUrl) => {
      if (!fileUrl) return null;
      if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
      return fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
    })(meta.file_url);
    
    

    dispatch({ type: "SET", key: "policyLoadingKey", value: key });
    try {
      const res = await fetch(fileUrlAbsolute);
      if (!res.ok) {
        throw new Error(`Failed to fetch policy file: ${res.status}`);
      }
      const text = await res.text();
      const fmt = (meta.file_format || meta.format || "markdown").toLowerCase();
      if (fmt === "html") {
        dispatch({ type: "SET", key: "policiesFull", value: { ...state.policiesFull, [key]: { html: text, text_hash: meta.text_hash, file_url: meta.file_url, file_format: fmt } } });
      } else {
        dispatch({ type: "SET", key: "policiesFull", value: { ...state.policiesFull, [key]: { markdown: text, text_hash: meta.text_hash, file_url: meta.file_url, file_format: fmt } } });
      }
    } catch (err) {
      dispatch({ type: "SET", key: "consentError", value: err.message || String(err) });
    } finally {
      dispatch({ type: "SET", key: "policyLoadingKey", value: null });
    }
  }

  async function handlePreRegisterConsent() {
    dispatch({ type: "SET", key: "consentError", value: "" });
    dispatch({ type: "SET", key: "consentLoading", value: true });
    try {
      if (!state.challengeId) throw new Error("Missing registration challenge id");
      const agreements = state.policiesMeta.map((p) => ({
        key: p.key,
        version: p.version,
        text_hash: p.text_hash,
      }));

      const payload = {
        challenge_id: state.challengeId,
        agreements,
        meta: { flow: "registration", ui: "modal_v1", locale: "en" },
      };

      const res = await fetch(`${LEGAL_BASE}/consent/pre-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.detail || "Failed to record consent");
      }

      dispatch({ type: "SET", key: "showConsentModal", value: false });
      if (isOAuth) {
        await performRegistration();
      } else {
        dispatch({ type: "SET", key: "stage", value: "final" });
      }
    } catch (err) {
      dispatch({ type: "SET", key: "consentError", value: err.message || String(err) });
    } finally {
      dispatch({ type: "SET", key: "consentLoading", value: false });
    }
  }

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
        const accessToken = sessionStorage.getItem("oauth_token");

        if (!accessToken) {
          throw new Error("OAuth session expired. Please login again.");
        }
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
            age_verification_method: "self_asserted",
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
            age_verification_method: "self_asserted",
          }),
        });
      }

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.detail || "Registration failed");
      }

      if (body.activation_required) {
        dispatch({ type: "SET", key: "stage", value: "activation_sent" });
      } else {
        navigate("/login?registered=1");
      }
    } catch (err) {
      dispatch({ type: "SET", key: "error", value: err.message || String(err) });
    } finally {
      dispatch({ type: "SET", key: "loading", value: false });
    }
  }

  async function handleRegister(e) {
    e?.preventDefault();

    if (!isOAuth) {
      const pwdErr = validatePassword(state.password);
      if (pwdErr) {
        dispatch({ type: "SET", key: "error", value: pwdErr });
        return;
      }
      if (state.password !== state.confirmPassword) {
        dispatch({ type: "SET", key: "error", value: "Passwords do not match." });
        return;
      }
    }

    await performRegistration();
  }

  const usernameStatus = useUsernameAvailabilitySimple(state.userName, Boolean(state.userName));
  const isUsernameValid = !state.userName || usernameStatus === "available";

  useEffect(() => {
    if (!isOAuth) return;

    const storedEmail = sessionStorage.getItem("oauth_email");
    const storedChallenge = sessionStorage.getItem("oauth_challenge");

    if (!storedEmail && !storedChallenge) {
      navigate("/register");
      return;
    }

    dispatch({ type: "SET_MANY", payload: { email: storedEmail, challengeId: storedChallenge, stage: "consent" } });
    handlePolicyStep();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOAuth, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full sm:max-w-md max-w-[88%] rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-xl p-8">
        <div className="flex justify-center mb-6"><Logo width={140} /></div>
        <h1 className="text-xl font-semibold text-white text-center">Create your Forkit account</h1>
        <p className="text-sm text-gray-400 text-center mt-1">Join the community. Evolve recipes together.</p>

        {!isOAuth && (
          <>
            {state.error && (
              <div className="mt-4 text-sm text-red-400 text-center">{state.error}</div>
            )}
            {state.emailUnacceptable && (
              <div className="mt-2 text-sm text-red-400 text-center space-y-1">
                <div>This email can't be used. Please try another address.</div>

                <button type="button" onClick={() => dispatch({ type: "SET", key: "showEmailBlockedModal", value: true })} className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 underline underline-offset-2 transition">
                  Why is this blocked?
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {state.stage === "email" && (
              <form onSubmit={handleRequestOtp} className="space-y-4 mt-6">
                <input type="email" placeholder="Email" value={state.email} onChange={e => dispatch({ type: "SET", key: "email", value: e.target.value })} required className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
                <button type="submit" disabled={state.loading} className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition disabled:opacity-50">
                  {state.loading ? "Requesting…" : "Request OTP"}
                </button>
                <div className="mt-6 text-sm text-center text-gray-400">
                  Already have an account? <a href="/login" className="text-orange-400 hover:underline">Log in</a>
                </div>
              </form>
            )}

            {state.stage === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4 mt-6">
                <div className="text-sm text-gray-300 text-center">We sent a code to <strong>{state.email}</strong></div>

                <input type="text" placeholder="Enter 6-digit code" value={state.otp} onChange={e => dispatch({ type: "SET", key: "otp", value: e.target.value.replace(/\D/g, "").slice(0, 6) })} required className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
                {state.otpError && <div className="text-sm text-red-400 text-center">{state.otpError}</div>}

                <div className="flex gap-2">
                  <button type="submit" disabled={state.loading} className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition disabled:opacity-50">Verify</button>
                  <button type="button" onClick={handleResendOtp} disabled={state.resendCooldown > 0 || state.loading} className="px-4 py-2.5 rounded-lg bg-neutral-800 border border-gray-700 text-white text-sm disabled:opacity-50">
                    {state.resendCooldown > 0 ? `Resend (${state.resendCooldown}s)` : "Resend"}
                  </button>
                </div>
                <div className="mt-6 text-sm text-center text-gray-400">Didn't get a code? Wait 30s between resends. Too many bad attempts may block the email.</div>
              </form>
            )}

            {state.stage === "final" && (
              <form onSubmit={handleRegister} className="space-y-4 mt-6">
                <div className="text-sm text-green-300 text-center">Email verified – finish set up</div>

                <div>
                  <input type="text" placeholder="Username (optional)" value={state.userName} onChange={e => dispatch({ type: "SET", key: "userName", value: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
                  <div className="mt-1 h-4 text-xs">
                    {!state.userName && <span className="text-neutral-500">Leave empty to get an auto-generated username</span>}
                    {state.userName && usernameStatus === "checking" && <span className="text-neutral-400">Checking availability…</span>}
                    {state.userName && usernameStatus === "available" && <span className="text-green-400">Available ✓</span>}
                    {state.userName && usernameStatus === "taken" && <span className="text-red-400">Already taken</span>}
                    {state.userName && usernameStatus === "invalid" && <span className="text-yellow-400">3–30 chars, letters, numbers, underscore</span>}
                  </div>
                </div>

                <div className="relative">
                  <input type={state.showPassword ? "text" : "password"} placeholder="Password" value={state.password} onChange={e => dispatch({ type: "SET", key: "password", value: e.target.value })} required className={`w-full px-4 py-2.5 pr-10 rounded-lg bg-neutral-900 border ${state.password ? (isPasswordStrong ? "border-green-500" : "border-red-500") : "border-gray-700"} text-white placeholder-gray-500 focus:outline-none`} />
                  <button type="button" onClick={() => dispatch({ type: "SET", key: "showPassword", value: !state.showPassword })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    {state.showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <div className="relative">
                  <input type={state.showConfirmPassword ? "text" : "password"} placeholder="Confirm password" value={state.confirmPassword} onChange={e => dispatch({ type: "SET", key: "confirmPassword", value: e.target.value })} required className={`w-full px-4 py-2.5 pr-10 rounded-lg bg-neutral-900 border ${state.confirmPassword ? (passwordRules.match ? "border-green-500" : "border-red-500") : "border-gray-700"} text-white placeholder-gray-500 focus:outline-none`} />
                  <button type="button" onClick={() => dispatch({ type: "SET", key: "showConfirmPassword", value: !state.showConfirmPassword })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    {state.showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <div className="text-xs text-neutral-400">Password strength</div>
                <div className="h-1 w-full bg-neutral-800 rounded overflow-hidden">
                  <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${strengthPct}%` }} />
                </div>

                <div className="flex items-center flex-col text-xs space-y-1 mt-2">
                  <div className="flex w-full justify-between gap-2">
                    <div>
                      <div className={`flex items-center gap-2 transition-all duration-200 ${state.password ? (passwordRules.length ? "text-green-400 scale-[1.02]" : "text-red-400 scale-[1.02]") : "text-neutral-500"}`}><span className="w-4 text-center">{passwordRules.length ? "✓" : "•"}</span><span>At least 8 characters</span></div>
                      <div className={`flex items-center gap-2 transition-all duration-200 ${state.password ? (passwordRules.upper ? "text-green-400 scale-[1.02]" : "text-red-400 scale-[1.02]") : "text-neutral-500"}`}><span className="w-4 text-center">{passwordRules.upper ? "✓" : "•"}</span><span>One uppercase letter</span></div>
                    </div>
                    <div>
                      <div className={`flex items-center gap-2 transition-all duration-200 ${state.password ? (passwordRules.lower ? "text-green-400 scale-[1.02]" : "text-red-400 scale-[1.02]") : "text-neutral-500"}`}><span className="w-4 text-center">{passwordRules.lower ? "✓" : "•"}</span><span>One lowercase letter</span></div>
                      <div className={`flex items-center gap-2 transition-all duration-200 ${state.password ? (passwordRules.number ? "text-green-400 scale-[1.02]" : "text-red-400 scale-[1.02]") : "text-neutral-500"}`}><span className="w-4 text-center">{passwordRules.number ? "✓" : "•"}</span><span>One number</span></div>
                    </div>
                  </div>
                  <div className="flex w-full items-center">
                    <div className={`flex items-center gap-2 transition-all duration-200 ${state.password ? (passwordRules.match ? "text-green-400 scale-[1.02]" : "text-red-400 scale-[1.02]") : "text-neutral-500"}`}><span className="w-4 text-center">{passwordRules.match ? "✓" : "•"}</span><span>Passwords match</span></div>
                  </div>
                </div>

                <button type="submit" disabled={state.loading || !isUsernameValid || !isPasswordStrong} className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition disabled:opacity-50">
                  {state.loading ? "Creating account…" : "Create account"}
                </button>
              </form>
            )}
          </>
        )}

        {state.stage === "consent" && (
          <div className="mt-6 text-center space-y-4">
            <div className="text-lg text-white font-semibold">Almost there...</div>
            <div className="text-sm text-gray-400 leading-relaxed">Before creating your account, we need you to review and accept our policies.</div>
          </div>
        )}

        {state.stage === "oauthfinal" && (
          <div className="w-full flex flex-col items-center justify-center py-10 space-y-4">
            <div className="h-8 w-8 border-4 border-gray-700 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Finalizing OAuth login…</p>
          </div>
        )}

        {state.stage === "activation_sent" && (
          <div className="mt-6 text-center space-y-4">
            <div className="text-lg text-white font-semibold">Now, just one last step...</div>
            <div className="text-sm text-gray-400 leading-relaxed">We've sent an activation link to <strong>{state.email}</strong>.<br />Click the link to activate your account and you'll be logged in automatically.</div>
            <div className="text-xs text-neutral-500">The link is valid for 48 hours and can be used once.</div>
            <div className="pt-4 text-sm space-x-1">
              <span className="text-neutral-400">Already activated?</span>
              {isOAuth ? <a href="/login?registered=1" className="text-orange-400 hover:underline text-sm">Log in</a> : <a href="/login" className="text-orange-400 hover:underline text-sm">Log in</a>}
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={state.showEmailBlockedModal} onClose={() => dispatch({ type: "SET", key: "showEmailBlockedModal", value: false })} title="This email address can't be used" type="warning">
        <div className="space-y-4 text-sm text-neutral-300 leading-relaxed">
          <p>{state.whyEmailUnacceptable || "We couldn't use this email address to create an account."}</p>

          <p className="text-neutral-400">To protect the platform and our community, we restrict sign-ups from certain email domains.</p>

          <div className="bg-neutral-900/60 border border-white/10 rounded-lg p-3 text-xs text-neutral-400">
            <strong className="block mb-1 text-neutral-200">This can happen if the email:</strong>
            <ul className="list-disc pl-4 space-y-1">
              <li>Is from a temporary or disposable email service</li>
              <li>Belongs to a domain with a history of abuse or spam</li>
            </ul>
          </div>

          <div className="bg-neutral-900/60 border border-white/10 rounded-lg p-3 text-xs text-neutral-400">
            <strong className="block mb-1 text-neutral-200">What you can do next:</strong>
            <ul className="list-disc pl-4 space-y-1">
              <li>Use a personal email (Gmail, Outlook, iCloud)</li>
              <li>Or use a verified work email address</li>
            </ul>
          </div>

          <button onClick={() => dispatch({ type: "SET", key: "showEmailBlockedModal", value: false })} className="w-full pt-2.5 pb-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition">Got it, I'll try another email</button>
        </div>
      </Modal>

      <Modal
        isOpen={state.showConsentModal}
        onClose={() => { dispatch({ type: "SET", key: "showConsentModal", value: false }); dispatch({ type: "SET", key: "stage", value: "consent" }); }}
        title="Before you continue"
        mode="consent"
        type="consent"
        description="You must read and accept all policies."
        requireScroll
        consents={state.policiesMeta.map(p => ({ id: p.key || p.id || p.slug, label: `${p.title || p.name || p.display_name || p.key} ${p.version ? `(${p.version})` : ""}`, required: true }))}
        onAgree={handlePreRegisterConsent}
        onDisagree={() => dispatch({ type: "SET", key: "consentError", value: "You must accept all policies." })}
        lock={false}
      >
        <div className="space-y-4">
          {state.policiesMeta.length === 0 && (
            <div className="text-sm text-neutral-400">No policies loaded. If this persists, check the Network tab for `{LEGAL_BASE}/active` response.</div>
          )}

          {state.policiesMeta.map(p => (
            <div key={p.key || p.id || p.slug} className="border border-white/10 rounded-lg p-3">
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="font-semibold">{p.title || p.name || p.display_name || p.key}</div>
                  {p.effective_at && <div className="text-xs text-neutral-400">Effective: {new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(p.effective_at))}</div>}
                  </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadPolicyFull(p.key || p.id || p.slug)}
                    className="text-xs text-orange-400"
                  >
                    {state.policiesFull[p.key] || state.policiesFull[p.id] ? "Hide" : (state.policyLoadingKey === (p.key || p.id || p.slug) ? "Loading…" : "Read")}
                  </button>
                </div>
              </div>

              {<PolicyContent markdown={state.policiesFull[p.key] || state.policiesFull[p.id]} />}
            </div>
          ))}

        </div>
      </Modal>
    </div>
  );
}
