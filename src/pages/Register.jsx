import { useState, useEffect, useRef } from "react";
import Logo from "../features/Logo";
import backendUrlV1 from "../urls/backendUrl";


function validatePassword(pwd) {
  if (pwd.length < 8) return "Password must be at least 8 characters.";
  if (pwd.length > 72) return "Password is too long.";
  if (!/[A-Za-z]/.test(pwd)) return "Password must contain at least one letter.";
  if (!/\d/.test(pwd)) return "Password must contain at least one number.";
  return null;
}

export default function Register() {
  const [stage, setStage] = useState("email"); // email -> otp -> password
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
  useEffect(() => {
    setPasswordError(validatePassword(password));
  }, [password]);

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
      setStage("password");
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
          username: undefined, // you may add username field if you collect it
          challenge_id: challengeId
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Registration failed");
      }
      // go to logged in / redirect to /login as before
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
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
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0,6))}
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

        {stage === "password" && (
          <form onSubmit={handleRegister} className="space-y-4 mt-6">
            <div className="text-sm text-green-300 text-center">Email verified - finish set up</div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 pr-10 rounded-lg bg-neutral-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 pr-10 rounded-lg bg-neutral-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
              <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>

            {passwordError && <div className="mt-2 text-sm text-red-400">{passwordError}</div>}

            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition disabled:opacity-50">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
