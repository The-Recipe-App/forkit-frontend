import { useState, useEffect, useRef } from "react";
import Logo from "../features/Logo";
import backendUrlV1 from "../urls/backendUrl";
import { useUsernameAvailabilitySimple } from "./ProfileDashboard";
import Modal from "../components/popUpModal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DOMPurify from "dompurify";

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

export default function Register() {
  const [stage, setStage] = useState("email");
  const [email, setEmail] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [userName, setUserName] = useState("");


  const [showConsentModal, setShowConsentModal] = useState(false);
  const [policiesMeta, setPoliciesMeta] = useState([]);
  const [policiesFull, setPoliciesFull] = useState({});
  const [policyLoadingKey, setPolicyLoadingKey] = useState(null);
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentError, setConsentError] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {

    if (resendCooldown <= 0) {
      clearInterval(cooldownRef.current);
      return;
    }
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [resendCooldown]);

  const passwordRules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    match: password && password === confirmPassword,
  };

  const isPasswordStrong = Object.values(passwordRules).every(Boolean);

  const strengthScore = [
    passwordRules.length,
    passwordRules.upper,
    passwordRules.lower,
    passwordRules.number,
  ].filter(Boolean).length;

  const strengthPct = (strengthScore / 4) * 100;

  const Rule = ({ ok, text }) => (
    <div
      className={`flex items-center gap-2 transition-all duration-200 ${password ? (ok ? "text-green-400 scale-[1.02]" : "text-red-400 scale-[1.02]") : "text-neutral-500"
        }`}
    >
      <span className="w-4 text-center">{ok ? "✓" : "•"}</span>
      <span>{text}</span>
    </div>
  );


  const REGISTER_BASE = `${backendUrlV1}/auth/registration`;
  const LEGAL_BASE = `/api/legal`;
  const AGREEMENT_VERSION = "2026-01";


  function buildFileUrl(fileUrl) {
    if (!fileUrl) return null;

    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;

    try {

      return `${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
    } catch (e) {

      return `${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
    }
  }



  async function handleRequestOtp(e) {
    e?.preventDefault();
    setError("");
    if (!email) {
      setError("Enter an email");
      return;
    }
    setLoading(true);
    try {
      const fingerprint = window.localStorage.getItem("device_fp") || null;
      const payload = { email, fingerprint };
      console.log("Requesting OTP with payload:", payload);
      const res = await fetch(`${REGISTER_BASE}/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      console.log("request-otp response", res.status, body);
      if (!res.ok) {
        throw new Error(body.detail || "Failed to request OTP");
      }
      setChallengeId(body.challenge_id);
      setResendCooldown(body.resend_cooldown || 30);
      setStage("otp");
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${REGISTER_BASE}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, challenge_id: challengeId }),
      });
      const body = await res.json().catch(() => ({}));
      console.log("resend-otp response", res.status, body);
      if (!res.ok) {
        throw new Error(body.detail || "Failed to resend OTP");
      }
      setResendCooldown(body.resend_cooldown || 30);
    } catch (err) {
      setOtpError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }


  async function handleVerifyOtp(e) {
    e?.preventDefault();
    setOtpError("");
    if (!otp || !challengeId) {
      setOtpError("Enter the code");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${REGISTER_BASE}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, challenge_id: challengeId, code: otp }),
      });
      const resBody = await res.json().catch(() => null);
      console.log("verify-otp response", res.status, resBody);
      if (!res.ok) {
        throw new Error((resBody && resBody.detail) || `OTP verification failed (status ${res.status})`);
      }


      let metaBody = null;
      try {
        const metaRes = await fetch(`${LEGAL_BASE}/active?meta_only=1`);
        metaBody = await metaRes.json().catch(() => null);
        console.log("meta_res (meta_only) ->", metaRes.status, metaBody);
        if (!metaRes.ok || !metaBody) {
          const fallback = await fetch(`${LEGAL_BASE}/active`);
          metaBody = await fallback.json().catch(() => null);
          console.log("meta_res (fallback) ->", fallback.status, metaBody);
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

      console.log("Normalized policiesMeta ->", normals);
      setPoliciesMeta(normals);


      setShowConsentModal(true);
      setStage("consent");
    } catch (err) {
      setOtpError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }


  async function loadPolicyFull(key) {

    if (policiesFull[key]) {
      setPoliciesFull((s) => {
        const copy = { ...s };
        delete copy[key];
        return copy;
      });
      return;
    }


    const meta = policiesMeta.find((p) => p.key === key || p.id === key || p.slug === key);
    if (!meta) {

      console.warn("Policy meta not found for key:", key, "— falling back to API endpoints.");
      try {
        setPolicyLoadingKey(key);
        const tryUrls = [
          `${LEGAL_BASE}/${encodeURIComponent(key)}/versions`,
          `${LEGAL_BASE}/${encodeURIComponent(key)}`,
          `${LEGAL_BASE}/${encodeURIComponent(key)}/latest`,
        ];

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
          setPoliciesFull((s) => ({ ...s, [key]: body.versions[0] }));
          return;
        }
        if (Array.isArray(body) && body.length) {
          setPoliciesFull((s) => ({ ...s, [key]: body[0] }));
          return;
        }
        setPoliciesFull((s) => ({ ...s, [key]: body }));
        return;
      } catch (err) {
        setConsentError(err.message || String(err));
        setPolicyLoadingKey(null);
        return;
      } finally {
        setPolicyLoadingKey(null);
      }
    }


    if (!meta.file_url) {
      setConsentError("Policy metadata missing file_url");
      return;
    }

    const fileUrlAbsolute = buildFileUrl(meta.file_url);
    setPolicyLoadingKey(key);

    try {
      const res = await fetch(fileUrlAbsolute);
      if (!res.ok) {
        throw new Error(`Failed to fetch policy file: ${res.status}`);
      }

      const text = await res.text();

      const fmt = (meta.file_format || meta.format || "markdown").toLowerCase();

      if (fmt === "html") {

        setPoliciesFull((s) => ({ ...s, [key]: { html: text, text_hash: meta.text_hash, file_url: meta.file_url, file_format: fmt } }));
      } else {

        setPoliciesFull((s) => ({ ...s, [key]: { markdown: text, text_hash: meta.text_hash, file_url: meta.file_url, file_format: fmt } }));
      }
    } catch (err) {
      setConsentError(err.message || String(err));
    } finally {
      setPolicyLoadingKey(null);
    }
  }


  async function handlePreRegisterConsent() {
    setConsentError("");
    setConsentLoading(true);
    try {
      if (!challengeId) throw new Error("Missing registration challenge id");


      const agreements = policiesMeta.map((p) => ({
        key: p.key,
        version: p.version,
        text_hash: p.text_hash,
      }));

      const payload = {
        challenge_id: challengeId,
        agreements,
        meta: {
          flow: "registration",
          ui: "modal_v1",
          locale: "en",
        },
      };

      console.log("pre-register consent payload:", payload);
      const res = await fetch(`${LEGAL_BASE}/consent/pre-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      console.log("pre-register response", res.status, body);
      if (!res.ok) {
        throw new Error(body.detail || "Failed to record consent");
      }


      setShowConsentModal(false);
      setStage("final");
    } catch (err) {
      setConsentError(err.message || String(err));
    } finally {
      setConsentLoading(false);
    }
  }

  async function handleRegister(e) {
    e?.preventDefault();
    setError("");
    const pwdErr = validatePassword(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }


    setLoading(true);
    try {
      const consents = policiesMeta.map((p) => ({
        agreement_key: p.key,
        version: p.version,
        text_hash: p.text_hash,
      }));

      const payload = {
        email,
        password,
        username: userName || null,
        challenge_id: challengeId,
        consents,
        age_verified: true,
        age_verification_method: "self_asserted",
      };

      console.log("register payload:", payload);
      const res = await fetch(`${REGISTER_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      console.log("register response", res.status, body);
      if (!res.ok) {
        throw new Error(body.detail || "Registration failed");
      }

      setStage("activation_sent");
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const usernameStatus = useUsernameAvailabilitySimple(userName, Boolean(userName));
  const isUsernameValid = !userName || usernameStatus === "available";

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full sm:max-w-md max-w-[88%] rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-xl p-8">
        <div className="flex justify-center mb-6"><Logo width={140} /></div>
        <h1 className="text-xl font-semibold text-white text-center">Create your Forkit account</h1>
        <p className="text-sm text-gray-400 text-center mt-1">Join the community. Evolve recipes together.</p>

        {/* top-level errors */}
        {error && <div className="mt-4 text-sm text-red-400 text-center">{error}</div>}

        {stage === "email" && (
          <form onSubmit={handleRequestOtp} className="space-y-4 mt-6">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition disabled:opacity-50">
              {loading ? "Requesting…" : "Request OTP"}
            </button>
            <div className="mt-6 text-sm text-center text-gray-400">
              Already have an account? <a href="/login" className="text-orange-400 hover:underline">Log in</a>
            </div>
          </form>
        )}

        {stage === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 mt-6">
            <div className="text-sm text-gray-300 text-center">We sent a code to <strong>{email}</strong></div>

            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
            {otpError && <div className="text-sm text-red-400 text-center">{otpError}</div>}

            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition disabled:opacity-50">
                Verify
              </button>
              <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0 || loading} className="px-4 py-2.5 rounded-lg bg-neutral-800 border border-gray-700 text-white text-sm disabled:opacity-50">
                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend"}
              </button>
            </div>
            <div className="mt-6 text-sm text-center text-gray-400">
              Didn't get a code? Wait 30s between resends. Too many bad attempts may block the email.
            </div>
          </form>
        )}

        {stage === "final" && (
          <form onSubmit={handleRegister} className="space-y-4 mt-6">
            <div className="text-sm text-green-300 text-center">Email verified – finish set up</div>

            {/* Username (optional) */}
            <div>
              <input
                type="text"
                placeholder="Username (optional)"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-neutral-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
              <div className="mt-1 h-4 text-xs">
                {!userName && <span className="text-neutral-500">Leave empty to get an auto-generated username</span>}
                {userName && usernameStatus === "checking" && <span className="text-neutral-400">Checking availability…</span>}
                {userName && usernameStatus === "available" && <span className="text-green-400">Available ✓</span>}
                {userName && usernameStatus === "taken" && <span className="text-red-400">Already taken</span>}
                {userName && usernameStatus === "invalid" && <span className="text-yellow-400">3–30 chars, letters, numbers, underscore</span>}
              </div>
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className={`w-full px-4 py-2.5 pr-10 rounded-lg bg-neutral-900 border ${password ? (isPasswordStrong ? "border-green-500" : "border-red-500") : "border-gray-700"} text-white placeholder-gray-500 focus:outline-none`}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Confirm */}
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className={`w-full px-4 py-2.5 pr-10 rounded-lg bg-neutral-900 border ${confirmPassword ? (passwordRules.match ? "border-green-500" : "border-red-500") : "border-gray-700"} text-white placeholder-gray-500 focus:outline-none`}
              />
              <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="text-xs text-neutral-400">Password strength</div>
            <div className="h-1 w-full bg-neutral-800 rounded overflow-hidden">
              <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${strengthPct}%` }} />
            </div>

            <div className="flex items-center flex-col text-xs space-y-1 mt-2">
              <div className="flex w-full justify-between gap-2">
                <div>
                  <Rule ok={passwordRules.length} text="At least 8 characters" />
                  <Rule ok={passwordRules.upper} text="One uppercase letter" />
                </div>
                <div>
                  <Rule ok={passwordRules.lower} text="One lowercase letter" />
                  <Rule ok={passwordRules.number} text="One number" />
                </div>
              </div>
              <div className="flex w-full items-center">
                <Rule ok={passwordRules.match} text="Passwords match" />
              </div>
            </div>

            <button type="submit" disabled={loading || !isUsernameValid || !isPasswordStrong} className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition disabled:opacity-50">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}

        {stage === "activation_sent" && (
          <div className="mt-6 text-center space-y-4">
            <div className="text-lg text-white font-semibold">Now, just one last step...</div>
            <div className="text-sm text-gray-400 leading-relaxed">
              We've sent an activation link to <strong>{email}</strong>.<br />
              Click the link to activate your account and you'll be logged in automatically.
            </div>
            <div className="text-xs text-neutral-500">The link is valid for 48 hours and can be used once.</div>
            <div className="pt-4 text-sm space-x-1">
              <span className="text-neutral-400">Already activated?</span>
              <a href="/login" className="text-orange-400 hover:underline text-sm">Log in</a>
            </div>
          </div>
        )}
      </div>

      {/* Consent Modal (uses your Modal component) */}
      <Modal
        isOpen={showConsentModal}
        onClose={() => {

          setShowConsentModal(false);

          setStage("consent");
        }}
        mode="consent"
        title="Before you continue"
        description="You must read and accept all policies."
        requireScroll
        consents={policiesMeta.map(p => ({
          id: p.key || p.id || p.slug,
          label: `${p.title || p.name || p.display_name || p.key} ${p.version ? `(${p.version})` : ""}`,
          required: true,
        }))}
        onAgree={handlePreRegisterConsent}
        onDisagree={() => setConsentError("You must accept all policies.")}
        lock={false}
      >
        <div className="space-y-4">
          {policiesMeta.length === 0 && (
            <div className="text-sm text-neutral-400">No policies loaded. If this persists, check the Network tab for `{LEGAL_BASE}/active` response.</div>
          )}

          {policiesMeta.map(p => (
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
                    {policiesFull[p.key] || policiesFull[p.id] ? "Hide" : (policyLoadingKey === (p.key || p.id || p.slug) ? "Loading…" : "Read")}
                  </button>
                </div>
              </div>

              {<PolicyContent markdown={policiesFull[p.key] || policiesFull[p.id]} />}
            </div>
          ))}

          {consentError && <div className="text-red-400">{consentError}</div>}
        </div>
      </Modal>
    </div>
  );
}
