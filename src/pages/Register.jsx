import { useState, useEffect, useRef } from "react";
import Logo from "../features/Logo";
import backendUrlV1 from "../urls/backendUrl";
import { useUsernameAvailabilitySimple } from "./ProfileDashboard";


function validatePassword(pwd) {
  if (pwd.length < 8) return "Password must be at least 8 characters.";
  if (pwd.length > 72) return "Password is too long.";
  if (!/[A-Za-z]/.test(pwd)) return "Password must contain at least one letter.";
  if (!/\d/.test(pwd)) return "Password must contain at least one number.";
  return null;
}

export default function Register() {
  const [stage, setStage] = useState("email"); // email -> otp -> final -> activation_sent
  const [email, setEmail] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [userName, setUserName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // countdown for resend cooldown
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

  // Real-time password validation
  // useEffect(() => {
  //   setPasswordError(validatePassword(password));
  // }, [password]);


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
      className={`flex items-center gap-2 transition-all duration-200 ${password ? ok ? "text-green-400 scale-[1.02]" : "text-red-400 scale-[1.02]" : "text-neutral-500"
        }`}
    >
      <span className="w-4 text-center">{ok ? "✓" : "•"}</span>
      <span>{text}</span>
    </div>
  );

  async function handleRequestOtp(e) {
    e?.preventDefault();
    setError("");
    if (!email) {
      setError("Enter an email");
      return;
    }
    setLoading(true);
    try {
      // fingerprint: you should implement a deterministic device fingerprint on client (e.g. using localStorage)
      const fingerprint = window.localStorage.getItem("device_fp") || null;
      const payload = { email, fingerprint };
      const res = await fetch(`${backendUrlV1}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to request OTP");
      }
      const body = await res.json();
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
      const res = await fetch(`${backendUrlV1}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, challenge_id: challengeId })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to resend OTP");
      }
      const body = await res.json();
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
      const res = await fetch(`${backendUrlV1}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, challenge_id: challengeId, code: otp })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "OTP verification failed");
      }
      // success -> move to password stage
      setStage("final");
    } catch (err) {
      setOtpError(err.message || String(err));
    } finally {
      setLoading(false);
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
      const res = await fetch(`${backendUrlV1}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          username: userName || null,
          challenge_id: challengeId
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Registration failed");
      }
      // go to logged in / redirect to /login as before
      setStage("activation_sent");
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const usernameStatus = useUsernameAvailabilitySimple(userName, Boolean(userName));
  const isUsernameValid =
    !userName || usernameStatus === "available"; // empty = auto-generate

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full sm:max-w-md max-w-[80%] rounded-2xl bg-white/5 backdrop-blur border border-white/10 shadow-xl p-8">
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
            <div className="text-sm text-green-300 text-center">
              Email verified – finish set up
            </div>

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
                {!userName && (
                  <span className="text-neutral-500">
                    Leave empty to get an auto-generated username
                  </span>
                )}
                {userName && usernameStatus === "checking" && (
                  <span className="text-neutral-400">Checking availability…</span>
                )}
                {userName && usernameStatus === "available" && (
                  <span className="text-green-400">Available ✓</span>
                )}
                {userName && usernameStatus === "taken" && (
                  <span className="text-red-400">Already taken</span>
                )}
                {userName && usernameStatus === "invalid" && (
                  <span className="text-yellow-400">3–30 chars, letters, numbers, underscore</span>
                )}
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
                className={`w-full px-4 py-2.5 pr-10 rounded-lg bg-neutral-900 border 
                  ${password ? (isPasswordStrong ? "border-green-500" : "border-red-500") : "border-gray-700"}
                  text-white placeholder-gray-500 focus:outline-none`}

              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              >
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
                className={`w-full px-4 py-2.5 pr-10 rounded-lg bg-neutral-900 border 
                  ${confirmPassword
                    ? passwordRules.match
                      ? "border-green-500"
                      : "border-red-500"
                    : "border-gray-700"}
                  
                  text-white placeholder-gray-500 focus:outline-none`}

              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* {passwordError && <div className="mt-2 text-sm text-red-400">{passwordError}</div>} */}

            <div className="text-xs text-neutral-400">Password strength</div>
            <div className="h-1 w-full bg-neutral-800 rounded overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${strengthPct}%` }}
              />
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
            <button
              type="submit"
              disabled={loading || !isUsernameValid || !isPasswordStrong}
              className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}

        {stage === "activation_sent" && (
          <div className="mt-6 text-center space-y-4">
            <div className="text-lg text-white font-semibold">
              Now, just one last step...
            </div>

            <div className="text-sm text-gray-400 leading-relaxed">
              We've sent an activation link to <strong>{email}</strong>.<br />
              Click the link to activate your account and you'll be logged in automatically.
            </div>

            <div className="text-xs text-neutral-500">
              The link is valid for 48 hours and can be used once.
            </div>

            <div className="pt-4 text-sm space-x-1">
              <span className="text-neutral-400">Already activated?</span>
              <a
                href="/login"
                className="text-orange-400 hover:underline text-sm"
              >
                Log in
              </a>
            </div>
          </div>
        )}



      </div>
    </div>
  );
}
