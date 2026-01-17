import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import backendUrlV1 from "../urls/backendUrl";
import { Camera, Pencil, Check, X } from "lucide-react";

/* ============================================================
   ANIMATION HELPERS
============================================================ */

const sectionAnim =
    "animate-[fadeUp_.5s_ease-out_forwards] opacity-0";

const delay = (ms) => ({
    animationDelay: `${ms}ms`,
});

/* ============================================================
   MAIN PAGE
============================================================ */

export default function ForkitProfilePage({ viewUsername = "me" }) {
    const isMe = viewUsername === "me";
    const qc = useQueryClient();

    /* ---------------- Queries ---------------- */

    const profileQ = useQuery({
        queryKey: ["profile", viewUsername],
        queryFn: () =>
            fetch(
                isMe
                    ? `${backendUrlV1}/profile/me`
                    : `${backendUrlV1}/profile/${viewUsername}`,
                { credentials: "include" }
            ).then((r) => r.json()),
    });

    const badgesQ = useQuery({
        enabled: isMe,
        queryKey: ["badges"],
        queryFn: () =>
            fetch(`${backendUrlV1}/profile/me/badges`, {
                credentials: "include",
            }).then((r) => r.json()),
    });

    const securityQ = useQuery({
        enabled: isMe,
        queryKey: ["security"],
        queryFn: () =>
            fetch(`${backendUrlV1}/profile/me/security`, {
                credentials: "include",
            }).then((r) => r.json()),
    });

    /* ---------------- Mutations ---------------- */

    const changeEmail = useMutation({
        mutationFn: (email) =>
            fetch(`${backendUrlV1}/profile/me/email`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email }),
            }),
    });

    const changePassword = useMutation({
        mutationFn: (payload) =>
            fetch(`${backendUrlV1}/profile/me/password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            }),
    });

    if (profileQ.isLoading) return <Skeleton />;

    const p = profileQ.data;

    return (
        <div className="min-h-screen w-screen bg-black text-zinc-200 px-8 py-12">
            <div className="max-w-5xl mx-auto space-y-14">

                {/* ================= PROFILE HERO ================= */}
                <section className={`surface p-8 ${sectionAnim}`} style={delay(0)}>
                    <ProfileHero user={p} />
                </section>

                {/* ================= STATS ================= */}
                <section className={sectionAnim} style={delay(80)}>
                    <ProfileStats stats={p.stats} />
                </section>

                {/* ================= BADGES ================= */}
                {badgesQ.data?.length > 0 && (
                    <section className={sectionAnim} style={delay(160)}>
                        <BadgesStrip badges={badgesQ.data} />
                    </section>
                )}

                {/* ================= SECURITY ================= */}
                {isMe && (
                    <section className={sectionAnim} style={delay(240)}>
                        <SecurityVault
                            currentEmail={securityQ.data?.email}
                            identities={securityQ.data?.identities}
                            onEmailChange={changeEmail.mutate}
                            onPasswordChange={changePassword.mutate}
                        />
                    </section>
                )}

                {/* ================= DANGER ZONE ================= */}
                {isMe && (
                    <section className={sectionAnim} style={delay(320)}>
                        <DangerZone />
                    </section>
                )}
            </div>
        </div>
    );
}

/* ============================================================
   PROFILE HERO
============================================================ */


function ProfileHero({
    user,
    isMe = true,
    onUsernameSave,
    onAvatarSelect,
}) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user.username);

    return (
        <div className="relative overflow-hidden  max-w-[100%]">
            {/* ambient gradient tied to identity */}
            <div className="absolute inset-y-0 right-0 w-[60%] bg-gradient-to-l from-orange-500/10 to-transparent blur-3xl" />

            <div className="relative flex md:flex-row flex-col gap-6 items-center text-center md:text-start md:items-start">
                {/* AVATAR */}
                <div className="relative shrink-0 group">
                    <img
                        src={
                            user.avatar_url ||
                            `https://ui-avatars.com/api/?name=${user.username}&background=0f172a&color=fff`
                        }
                        alt="avatar"
                        className="w-28 h-28 rounded-2xl object-cover ring-2 ring-white/10"
                    />

                    {isMe && (
                        <label
                            className="
                absolute inset-0 rounded-2xl
                bg-black/50 opacity-0 group-hover:opacity-100
                flex items-center justify-center
                cursor-pointer transition
              "
                        >
                            <Camera size={18} className="text-white" />
                            <input
                                hidden
                                type="file"
                                accept="image/*"
                                onChange={onAvatarSelect}
                            />
                        </label>
                    )}
                </div>

                {/* IDENTITY */}
                <div className="flex-1 pt-1">
                    {/* NAME ROW */}
                    <div className="flex items-center gap-3">
                        {!editing ? (
                            <div className="flex-row">
                                <h1 className="text-3xl font-black tracking-tight leading-none">
                                    {user.username}
                                    <span className="text-orange-500">.</span>
                                </h1>

                                {isMe && (
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="text-zinc-500 hover:text-white transition"
                                        title="Edit username"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input-dark max-w-[220px]"
                                    autoFocus
                                />
                                <button
                                    onClick={() => {
                                        onUsernameSave(name);
                                        setEditing(false);
                                    }}
                                    className="btn-primary px-3 py-2"
                                >
                                    <Check size={14} />
                                </button>
                                <button
                                    onClick={() => {
                                        setName(user.username);
                                        setEditing(false);
                                    }}
                                    className="btn-ghost px-3 py-2"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* META */}
                    <div className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
                        <span>🔥 {user.reputation?.score ?? user.reputation} rep</span>
                        <span className="text-zinc-600">•</span>
                        <span className="uppercase tracking-wide">
                            {user.reputation?.level ?? user.level}
                        </span>
                    </div>

                    {/* BIO */}
                    <p className="mt-4 max-w-xl text-zinc-300 leading-relaxed">
                        {user.bio || "This chef lets the dishes do the talking."}
                    </p>

                    {/* FOOT NOTE */}
                    {isMe && (
                        <div className="mt-3 text-xs text-zinc-500">
                            Click avatar or name to edit • Username cooldown applies
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}



/* ============================================================
   STATS
============================================================ */

function ProfileStats({ stats }) {
    return (
        <div className="grid grid-cols-3 gap-6">
            {["recipes", "forks", "comments"].map((key) => (
                <div
                    key={key}
                    className="surface-soft p-6 text-center hover:-translate-y-1 transition"
                >
                    <div className="text-4xl font-black">{stats?.[key] ?? 0}</div>
                    <div className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
                        {key}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ============================================================
   BADGES
============================================================ */

function BadgesStrip({ badges }) {
    return (
        <div className="surface-soft p-6">
            <h3 className="text-sm font-semibold text-zinc-400 mb-4">
                Badges Earned
            </h3>

            <div className="flex gap-4 overflow-x-auto">
                {badges.map((b) => (
                    <div
                        key={b.code}
                        className="min-w-[96px] surface-soft p-4 text-center hover:bg-white/[0.05] transition"
                    >
                        <img src={b.icon} className="w-8 h-8 mx-auto mb-2" alt="" />
                        <div className="text-xs font-semibold">{b.title}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ============================================================
   SECURITY VAULT
============================================================ */

function SecurityVault({ currentEmail, identities, onEmailChange, onPasswordChange }) {
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState({
        current_password: "",
        new_password: "",
    });

    return (
        <div className="surface p-8 space-y-8">
            <header>
                <h2 className="text-xl font-bold">🔒 Security Center</h2>
                <p className="text-sm text-zinc-500">
                    Manage access and credentials
                </p>
            </header>

            <div className="surface-soft p-6">
                <h3 className="font-semibold mb-3">Active Identities</h3>
                <div className="space-y-1 text-sm text-zinc-400">
                    {identities?.map((i) => (
                        <div key={i.provider}>
                            {i.provider.charAt(0).toUpperCase() + i.provider.slice(1)} {i.is_primary && "(Primary)"}
                        </div>
                    ))}
                </div>
            </div>

            <div className="surface-soft p-6 space-y-3">
                <h3 className="font-semibold">Change Email</h3>
                <p>Current email: {currentEmail}</p>
                <input
                    className="input-dark"
                    placeholder="New email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <div className="text-right">
                    <button
                        onClick={() => onEmailChange(email)}
                        className="btn-primary"
                    >
                        Update Email
                    </button>
                </div>
            </div>

            <div className="surface-soft p-6 space-y-3">
                <h3 className="font-semibold">Change Password</h3>
                <input
                    type="password"
                    className="input-dark"
                    placeholder="Current password"
                    onChange={(e) =>
                        setPw({ ...pw, current_password: e.target.value })
                    }
                />
                <input
                    type="password"
                    className="input-dark"
                    placeholder="New password"
                    onChange={(e) =>
                        setPw({ ...pw, new_password: e.target.value })
                    }
                />
                <div className="text-right">
                    <button
                        onClick={() => onPasswordChange(pw)}
                        className="btn-primary"
                    >
                        Update Password
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   DANGER ZONE
============================================================ */

function DangerZone() {
    return (
        <div className="border border-red-500/30 bg-red-500/5 rounded-3xl p-8">
            <h2 className="text-red-400 font-bold mb-2">⚠ Danger Zone</h2>
            <p className="text-sm text-zinc-400 mb-4">
                These actions are irreversible.
            </p>

            <div className="flex gap-4">
                <button className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition">
                    Log out all sessions
                </button>
                <button className="px-4 py-2 rounded-xl bg-red-600 text-black hover:bg-red-500 transition">
                    Delete Account
                </button>
            </div>
        </div>
    );
}

/* ============================================================
   SKELETON
============================================================ */

function Skeleton() {
    return (
        <div className="max-w-5xl mx-auto p-10 space-y-6 animate-pulse">
            <div className="h-40 bg-white/5 rounded-3xl" />
            <div className="grid grid-cols-3 gap-6">
                <div className="h-24 bg-white/5 rounded-2xl" />
                <div className="h-24 bg-white/5 rounded-2xl" />
                <div className="h-24 bg-white/5 rounded-2xl" />
            </div>
        </div>
    );
}
