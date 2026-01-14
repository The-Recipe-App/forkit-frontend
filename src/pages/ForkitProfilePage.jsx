import { useEffect, useState } from "react";
import backendUrlV1 from "../urls/backendUrl";
import { LucidePencil } from "lucide-react";

export default function ForkitProfilePage() {
    const [profile, setProfile] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    const [isEditingName, setIsEditingName] = useState(false);
    const [newUsername, setNewUsername] = useState(profile?.username || "");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) setNewUsername(profile.username);
    }, [profile]);


    useEffect(() => {
        fetch(`${backendUrlV1}/profile/me`, { credentials: "include" })
            .then((res) => res.json())
            .then(setProfile);
    }, []);

    if (!profile)
        return <div className="p-12 text-center text-gray-400 animate-pulse">Loading…</div>;

    const reputationScore = profile.reputation?.score ?? profile.reputation ?? 0;
    const reputationLevel = profile.reputation?.level ?? "NEW";

    return (
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 text-gray-200">

            {/* Flame Glass Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-zinc-900/80 backdrop-blur border border-white/5 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r" />
                <div className="relative p-8 flex items-center gap-6">

                    <div className="relative">
                        <div className="absolute -inset-1 rounded-full " />
                        <img
                            src={profile.avatar_url}
                            className="relative w-28 h-28 rounded-full ring-4 ring-neutral-200/30 shadow-2xl transition-transform duration-300 hover:scale-105"
                            alt="avatar"
                        />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            {!isEditingName ? (
                                <>
                                    <h1 className="text-3xl font-bold tracking-tight text-orange-400">
                                        {profile.username}
                                    </h1>
                                    <button
                                        className="p-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 transition"
                                        onClick={() => setIsEditingName(true)}
                                    >
                                        <LucidePencil size={16} />
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <input
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="bg-zinc-900 border border-orange-500/30 rounded px-2 py-1 text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                                        autoFocus
                                    />

                                    <button
                                        disabled={saving}
                                        className="px-2 py-1 text-xs rounded bg-orange-500 text-black hover:bg-orange-400 transition"
                                        onClick={async () => {
                                            setSaving(true);
                                            const res = await fetch(`${backendUrlV1}/auth/me/username?username=${newUsername}`, {
                                                method: "PATCH",
                                                credentials: "include",
                                            });

                                            if (res.ok) {
                                                setProfile({ ...profile, username: newUsername });
                                                setIsEditingName(false);
                                            }

                                            setSaving(false);
                                        }}
                                    >
                                        Save
                                    </button>

                                    <button
                                        className="px-2 py-1 text-xs rounded border border-gray-500/30 text-gray-400 hover:bg-gray-800 transition"
                                        onClick={() => {
                                            setNewUsername(profile.username);
                                            setIsEditingName(false);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        <p className="text-gray-400 mt-1 max-w-xl">
                            {profile.bio || "No bio yet"}
                        </p>

                        <div className="flex gap-2 mt-3">
                            <span className="px-3 py-1 text-xs rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                {profile.plan}
                            </span>
                            <span className="px-3 py-1 text-xs rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {reputationLevel}
                            </span>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="text-4xl font-bold text-yellow-300 drop-shadow">
                            {reputationScore}
                        </div>
                        <div className="text-xs text-gray-400 tracking-wide">REPUTATION</div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    ["Recipes", profile.stats?.recipes ?? 0],
                    ["Forks", profile.stats?.forks ?? 0],
                    ["Comments", profile.stats?.comments ?? 0],
                    ["Votes", profile.stats?.votes_received ?? 0],
                ].map(([label, value]) => (
                    <div
                        key={label}
                        className="bg-zinc-900/70 backdrop-blur border border-white/5 rounded-xl p-4 text-center shadow hover:shadow-orange-500/20 hover:-translate-y-1 transition-all"
                    >
                        <div className="text-2xl font-semibold text-orange-300">{value}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-widest">{label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="bg-zinc-900/70 backdrop-blur border border-white/5 rounded-2xl shadow overflow-hidden">
                <div className="flex relative">
                    {["overview", "recipes", "badges", "security"].map((key) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === key
                                ? "text-orange-400"
                                : "text-gray-400 hover:text-orange-300"
                                }`}
                        >
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                        </button>
                    ))}

                    {/* Flame underline */}
                    <div
                        className="absolute bottom-0 h-0.5 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 transition-all duration-300"
                        style={{
                            width: "25%",
                            left:
                                activeTab === "overview"
                                    ? "0%"
                                    : activeTab === "recipes"
                                        ? "25%"
                                        : activeTab === "badges"
                                            ? "50%"
                                            : "75%",
                        }}
                    />
                </div>

                <div className="p-6 animate-fade-in">
                    {activeTab === "overview" && (
                        <div className="space-y-3 text-sm animate-slide-up">
                            <div><span className="text-gray-400">Location:</span> {profile.location || "Not set"}</div>
                            <div><span className="text-gray-400">Website:</span> {profile.website || "Not set"}</div>
                            <div><span className="text-gray-400">Twitter:</span> {profile.twitter || "Not set"}</div>
                            <div><span className="text-gray-400">Member since:</span> {new Date(profile.created_at).toDateString()}</div>
                        </div>
                    )}

                    {activeTab === "badges" && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
                            {profile.badges?.length ? (
                                profile.badges.map((b) => (
                                    <div
                                        key={b.code}
                                        className="bg-zinc-800/70 border border-white/5 rounded-lg p-4 text-center hover:scale-105 hover:shadow-orange-500/20 transition-all"
                                    >
                                        <div className="text-3xl">{b.icon}</div>
                                        <div className="mt-2 font-medium text-orange-300">{b.title}</div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-500">No badges yet.</div>
                            )}
                        </div>
                    )}

                    {activeTab === "security" && profile.security && (
                        <div className="space-y-2 text-sm animate-slide-up">
                            <div>Email verified: {profile.security.email_verified ? "Yes" : "No"}</div>
                            <div>2FA enabled: {profile.security.two_factor ? "Yes" : "No"}</div>
                            <div>Last login: {new Date(profile.security.last_login).toLocaleString()}</div>
                        </div>
                    )}

                    {activeTab === "recipes" && (
                        <div className="text-gray-500 animate-slide-up">Recipe list coming soon…</div>
                    )}
                </div>
            </div>

            {/* Animations */}
            <style>
                {`
          .animate-heat {
            animation: heat 8s ease-in-out infinite;
          }
          @keyframes heat {
            0% { transform: translateX(0%); }
            50% { transform: translateX(20%); }
            100% { transform: translateX(0%); }
          }
          .animate-fade-in {
            animation: fadeIn 0.4s ease;
          }
          .animate-slide-up {
            animation: slideUp 0.4s ease;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
            </style>
        </div>
    );
}
