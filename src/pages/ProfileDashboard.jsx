
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import backendUrlV1 from "../urls/backendUrl";
import { useMe } from "../hooks/useMe";
import Cropper from "react-easy-crop";

/* ------------------------- Utility: debounce hook ------------------------- */
function useDebounced(value, ms = 400) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return v;
}

/* ------------------------- Username availability (debounced, robust) ------------------------- */
/*
  NOTE: server snippet you provided doesn't include a /profile/username/check endpoint.
  This implementation uses GET /profile/{username}: 404 => available, 200 => taken.
  It also enforces client-side format validation that matches the server regex:
  /^[a-zA-Z0-9_]{3,30}$/
*/
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

export function useUsernameAvailabilitySimple(username, enabled = true) {
    const debounced = useDebounced(username, 400);
    const [status, setStatus] = useState(null);
    const controller = useRef(null);

    useEffect(() => {
        if (!enabled) return;
        if (!debounced) {
            setStatus(null);
            return;
        }

        
        if (!USERNAME_RE.test(debounced)) {
            setStatus("invalid");
            return;
        }

        
        controller.current?.abort();
        const ctrl = new AbortController();
        controller.current = ctrl;

        let mounted = true;
        setStatus("checking");

        
        fetch(`${backendUrlV1}/profile/${encodeURIComponent(debounced)}`, {
            method: "GET",
            credentials: "include",
            signal: ctrl.signal,
        })
            .then(async (res) => {
                if (!mounted) return;
                if (res.status === 404) {
                    setStatus("available");
                    return;
                }
                if (res.ok) {
                    setStatus("taken");
                    return;
                }
                
                setStatus(null);
            })
            .catch((err) => {
                if (err.name === "AbortError") return;
                
                setStatus(null);
            });

        return () => {
            mounted = false;
            ctrl.abort();
        };
    }, [debounced, enabled]);

    return status;
}

/* ------------------------- Small UI atoms ------------------------- */
function LoadingBox({ children }) {
    return <div className="p-8 bg-white/5 rounded-xl text-center">{children}</div>;
}

function InlineLabel({ children }) {
    return <div className="text-xs text-zinc-400 uppercase">{children}</div>;
}

/* ------------------------- Badges list ------------------------- */
function BadgesList({ badges = [] }) {
    if (!badges || !badges.length) return <div className="text-sm text-zinc-500">No badges yet</div>;
    return (
        <div className="flex gap-2 flex-wrap">
            {badges.map((b) => (
                <div key={b.code} className="px-3 py-1 rounded-full bg-white/5 text-sm">
                    <strong className="mr-2">{b.title}</strong>
                    <span className="text-xs text-zinc-400">{b.awarded_at ? new Date(b.awarded_at).toLocaleDateString() : ""}</span>
                </div>
            ))}
        </div>
    );
}

/* ------------------------- Reputation bar ------------------------- */
function ReputationBar({ rep = {} }) {
    
    const pct = Math.max(0, Math.min(100, rep.progress_pct ?? 0));
    return (
        <div className="bg-white/5 p-4 rounded-xl">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm">Reputation</div>
                    <div className="font-bold text-lg">{(rep.score ?? 0).toLocaleString()} -- {rep.level ?? "--"}</div>
                </div>
                <div className="text-sm text-zinc-400">Next: {rep.next_level ?? "--"}</div>
            </div>

            <div className="mt-4 bg-white/10 h-3 rounded-full overflow-hidden">
                <div style={{ width: `${pct}%` }} className="h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-400" />
            </div>
            <div className="mt-2 text-xs text-zinc-400">Progress: {Math.round(pct * 100) / 100}%</div>
        </div>
    );
}

/* ------------------------- Activity feed (safe) ------------------------- */
function ActivityFeed({ username }) {
    const q = useQuery({
        queryKey: ["profile", username, "activity"],
        enabled: Boolean(username),
        queryFn: async () => {
            const res = await fetch(`${backendUrlV1}/profile/${encodeURIComponent(username)}/activity`, { credentials: "include" });
            
            if (!res.ok) return [];
            return res.json();
        },
        retry: false,
        staleTime: 1000 * 60 * 5,
    });

    if (q.isLoading) return <LoadingBox>Loading activity…</LoadingBox>;
    if (q.isError) return <div className="text-sm text-zinc-500">Activity not available</div>;

    const items = q.data || [];
    if (!items.length) return <div className="text-sm text-zinc-500">No recent activity</div>;

    return (
        <div className="space-y-3">
            {items.map((it, idx) => (
                <div key={idx} className="p-3 bg-white/3 rounded-lg">
                    <div className="text-sm font-semibold">{it.title}</div>
                    <div className="text-xs text-zinc-400">{it.when ? new Date(it.when).toLocaleString() : ""}</div>
                </div>
            ))}
        </div>
    );
}

/* ------------------------- Edit Profile Modal ------------------------- */
const TWITTER_RE = /^[A-Za-z0-9_]{0,15}$/;

function EditProfileModal({ open, onClose, user }) {
    const qc = useQueryClient();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: user.username,
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        twitter: user.twitter || "",
    });
    const [serverError, setServerError] = useState(null);

    const originalUsername = user.username;

    useEffect(() => {
        if (!open) return;
        setForm({
            username: user.username,
            bio: user.bio || "",
            location: user.location || "",
            website: user.website || "",
            twitter: user.twitter || "",
        });
        setServerError(null);
    }, [open, user.username, user.bio, user.location, user.website, user.twitter]);

    const usernameStatus = useUsernameAvailabilitySimple(form.username, open);

    const isUsernameChanged = form.username !== (user.username ?? "");
    const canSave = !(!open) && (!isUsernameChanged || usernameStatus === "available");

    const mutation = useMutation(
        async (payload) => {
            const res = await fetch(`${backendUrlV1}/profile/me`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg = data.detail || data.message || `Save failed (${res.status})`;
                const err = new Error(msg);
                err.status = res.status;
                throw err;
            }
            return data;
        },
        {
            onSuccess: () => {
                qc.invalidateQueries({ queryKey: ["profile", "me"] });
                qc.invalidateQueries({ queryKey: ["profile"] });

                
                if (form.username && form.username !== originalUsername) {
                    navigate(`/profile/${encodeURIComponent(form.username)}`, { replace: true });
                }

                onClose();
            },
        }
    );

    async function save() {
        setServerError(null);
        try {
            await mutation.mutateAsync(form);
        } catch (err) {
            if (err.status === 409) setServerError("Username already taken.");
            else if (err.status === 429) setServerError("Username cooldown active. Try again later.");
            else setServerError(err.message || "Failed to save");
        }
    }

    if (!open) return null;


    return (
        <div className="fixed inset-0 grid place-items-center z-50 mx-4 bg-black/60" role="dialog" aria-modal="true">
            <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-lg">
                <h3 className="text-lg font-bold mb-3">Edit Profile</h3>

                {serverError && <div className="mb-3 text-sm bg-red-500/10 p-2 rounded text-red-400">{serverError}</div>}

                <label className="text-sm mb-1 block">Username</label>
                <input
                    aria-label="username"
                    className="input-dark w-full"
                    value={form.username}
                    onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                />
                <div className="mt-2">
                    {isUsernameChanged && usernameStatus === "checking" && <div className="text-xs text-zinc-400">Checking…</div>}
                    {isUsernameChanged && usernameStatus === "available" && <div className="text-xs text-green-400">Available ✓</div>}
                    {isUsernameChanged && usernameStatus === "taken" && <div className="text-xs text-red-400">Taken ✕</div>}
                    {isUsernameChanged && usernameStatus === "invalid" && <div className="text-xs text-yellow-300">Invalid format (3–30 chars: letters, numbers, underscore)</div>}
                </div>

                <label className="text-sm mt-4 mb-1 block">Bio</label>
                <textarea className="input-dark w-full h-28" value={form.bio} onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))} />

                <div className="grid md:grid-cols-2 gap-3 mt-4">
                    <div>
                        <label className="text-sm mb-1 block">Location</label>
                        <input className="input-dark w-full" value={form.location} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} />
                    </div>
                    <div>
                        <label className="text-sm mb-1 block">Website</label>
                        <input className="input-dark w-full" value={form.website} onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="flex flex-col text-sm mb-2">
                            Twitter
                            <span className="text-xs text-zinc-400">(You can paste your full Twitter/X profile URL, we'll save just the username)</span>
                        </label>

                        <input
                            className="input-dark w-full"
                            value={form.twitter}
                            onChange={(e) => {
                                let raw = e.target.value;

                                
                                try {
                                    if (raw.includes("twitter.com") || raw.includes("x.com")) {
                                        const url = new URL(raw.startsWith("http") ? raw : "https://" + raw);
                                        const parts = url.pathname.split("/").filter(Boolean);
                                        if (parts.length > 0) raw = parts[0];
                                        else raw = ""; 
                                    }
                                } catch {
                                    
                                }

                                
                                raw = raw.replace(/^@+/, "").trim();

                                
                                raw = raw.toLowerCase();

                                
                                const filtered = raw.replace(/[^a-z0-9_]/g, "");

                                
                                const sliced = filtered.slice(0, 15);

                                
                                setForm((s) => ({ ...s, twitter: sliced }));
                            }}
                            placeholder="username, @username, or x.com/username"
                        />

                    </div>

                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={onClose} className="btn-ghost" disabled={mutation.isLoading}>Cancel</button>
                    <button onClick={save} disabled={!canSave || mutation.isLoading} className="btn-primary">
                        {mutation.isLoading ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------- Avatar Editor (production-ready) ------------------------- */

function getCroppedImage(imageSrc, crop) {
    return new Promise((resolve) => {
        const image = new Image();
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = crop.width;
            canvas.height = crop.height;
            const ctx = canvas.getContext("2d");

            ctx.drawImage(
                image,
                crop.x,
                crop.y,
                crop.width,
                crop.height,
                0,
                0,
                crop.width,
                crop.height
            );

            canvas.toBlob((blob) => resolve(blob), "image/png");
        };
    });
}


function AvatarEditorModal({ open, onClose, username }) {
    const qc = useQueryClient();
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open) {
            setImageSrc(null);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
            setError(null);
        }
    }, [open]);

    const onCropComplete = useCallback((_, croppedPixels) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const uploadMutation = useMutation(async (blob) => {
        const form = new FormData();
        form.append("file", blob, "avatar.png");

        const res = await fetch(`${backendUrlV1}/profile/me/avatar`, {
            method: "POST",
            credentials: "include",
            body: form,
        });

        if (!res.ok) throw new Error("Upload failed");
        return res.json();
    }, {
        onSuccess: (data) => {
            
            
            qc.setQueryData(["profile", "me"], (old) =>
                old ? { ...old, avatar_url: data.avatar_url, avatar_changed_at: data.avatar_changed_at } : old
            );

            
            if (username) {
                qc.setQueryData(["profile", username], (old) =>
                    old ? { ...old, avatar_url: data.avatar_url, avatar_changed_at: data.avatar_changed_at } : old
                );
            }

            
            qc.invalidateQueries({ queryKey: ["profile", "me"] });
            qc.invalidateQueries({ queryKey: ["profile"] });
            if (username) qc.invalidateQueries({ queryKey: ["profile", username] });

            onClose();
        }
    });

    async function handleSave() {
        try {
            const blob = await getCroppedImage(imageSrc, croppedAreaPixels);
            await uploadMutation.mutateAsync(blob);
        } catch (e) {
            setError("Failed to process image");
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/70 grid place-items-center z-50">
            <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-md">
                <h3 className="font-bold mb-3">Edit Avatar</h3>

                {error && <div className="text-red-400 text-sm mb-2">{error}</div>}

                {!imageSrc && (
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => setImageSrc(reader.result);
                            reader.readAsDataURL(file);
                        }}
                    />
                )}

                {imageSrc && (
                    <>
                        <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        </div>

                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.01}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full mt-3"
                        />

                        <div className="flex justify-end gap-2 mt-4">
                            <button className="btn-ghost" onClick={onClose}>Cancel</button>
                            <button className="btn-primary" onClick={handleSave} disabled={uploadMutation.isLoading}>
                                {uploadMutation.isLoading ? "Saving…" : "Save Avatar"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}


/* ------------------------- Security center (expanded) ------------------------- */
function SecurityCenterExpanded({ me }) {
    const [emailOpen, setEmailOpen] = useState(false);
    const [pwOpen, setPwOpen] = useState(false);

    return (
        <section className="rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="text-lg font-bold">Security</h3>
            <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                    <div className="font-semibold">Primary email</div>
                    <div className="text-sm text-zinc-400">{me?.email ?? "--"}</div>
                    <div className="mt-3 flex gap-2">
                        <button className="btn-primary" onClick={() => setEmailOpen(true)}>Change</button>
                    </div>
                </div>

                <div className="p-4 bg-white/5 rounded-lg">
                    <div className="font-semibold">Password</div>
                    <div className="text-sm text-zinc-400">Managed by our auth system</div>
                    <div className="mt-3">
                        <button className="btn-primary" onClick={() => setPwOpen(true)}>Change Password</button>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ------------------------- Main Profile Dashboard ------------------------- */
export default function ProfileDashboard() {
    const { username } = useParams();
    const navigate = useNavigate();
    const me = useMe(); 

    
    useEffect(() => {
        if (!username && me.data?.username) {
            navigate(`/profile/${encodeURIComponent(me.data.username)}`, { replace: true });
        }
    }, [username, me.data, navigate]);

    
    const profileQuery = useQuery({
        queryKey: ["profile", username],
        enabled: Boolean(username),
        queryFn: async () => {
            const url = `${backendUrlV1}/profile/${encodeURIComponent(username)}`;
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) throw new Error("Profile fetch failed");
            return res.json();
        },
        retry: false,
        staleTime: 1000 * 60 * 2,
    });

    
    const canEdit = Boolean(me.data?.username && username && me.data.username === username);

    const reputationQuery = useQuery({
        queryKey: ["profile", username, "reputation"],
        enabled: canEdit,
        queryFn: async () => {
            const res = await fetch(`${backendUrlV1}/profile/me/reputation`, { credentials: "include" });
            if (!res.ok) throw new Error("Reputation fetch failed");
            return res.json();
        },
        retry: false,
        staleTime: 1000 * 60 * 2,
    });

    const [editOpen, setEditOpen] = useState(false);
    const [avatarOpen, setAvatarOpen] = useState(false);

    
    if (!username && me.isLoading) return <div className="p-10">Loading profile…</div>;

    
    if (!username && !me.data) return <div className="p-10 text-center">Profile not found</div>;

    
    if (Boolean(username) && profileQuery.isLoading) return <div className="p-10">Loading profile…</div>;
    if (Boolean(username) && (profileQuery.isError || !profileQuery.data)) return <div className="p-10 text-center">Profile not found</div>;

    
    const raw = profileQuery.data || {};
    
    let reputationObj = {};
    if (raw.reputation == null) {
        reputationObj = { score: 0, level: "--", progress_pct: 0 };
    } else if (typeof raw.reputation === "object") {
        reputationObj = {
            score: raw.reputation.score ?? 0,
            level: raw.reputation.level ?? "--",
            next_level: raw.reputation.next_level ?? null,
            progress_pct: raw.reputation.progress_pct ?? 0,
        };
    } else {
        
        reputationObj = { score: Number(raw.reputation) || 0, level: "--", progress_pct: 0 };
    }

    
    const effectiveReputation = reputationQuery.data ? {
        score: reputationQuery.data.score ?? reputationObj.score,
        level: reputationQuery.data.level ?? reputationObj.level,
        next_level: reputationQuery.data.next_level ?? reputationObj.next_level,
        progress_pct: reputationQuery.data.progress_pct ?? reputationObj.progress_pct,
    } : reputationObj;

    const user = {
        ...raw,
        reputation_score: effectiveReputation.score,
        reputation_level: effectiveReputation.level,
        reputation_obj: effectiveReputation,
    };

    const twitter = user?.twitter?.replace(/^@/, "");

    return (
        <div className="min-h-screen px-6 py-10 text-neutral-200">
            <div className="max-w-6xl mx-auto space-y-8 ">
                {/* Identity header */}
                <div className="flex md:flex-row flex-col items-start gap-6 ">
                    <div className="relative ">
                        <img
                            src={
                                user.avatar_url
                                    ? `${user.avatar_url}?v=${user.avatar_changed_at ?? ""}`
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username ?? "User")}`
                            }
                            alt={user.username}
                            className="w-28 h-28 rounded-3xl object-cover"
                        />
                        {canEdit && (
                            <button
                                onClick={() => setAvatarOpen(true)}
                                className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition flex items-center justify-center rounded-3xl"
                                aria-label="Change avatar"
                            >
                                Change
                            </button>
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-semibold">{user.username}
                                    <span className="ml-2 font-bold text-9xl text-orange-400 inline-block w-2 h-2 rounded-full bg-orange-400"></span>
                                </h1>
                                {user.bio && <p className="text-sm text-zinc-400 mt-1 max-w-xl">{user.bio}</p>}
                            </div>

                            <div>
                                {canEdit ? (
                                    <button onClick={() => setEditOpen(true)} className="px-4 py-2 rounded-lg bg-neutral-800">Edit Profile</button>
                                ) : (
                                    <div className="text-sm text-zinc-400">{user.reputation_score ?? 0} rep · {user.reputation_level ?? "--"}</div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="bg-white/5 p-4 rounded-xl text-center">
                                <div className="text-2xl font-black">{user.stats?.recipes ?? 0}</div>
                                <InlineLabel>Recipes</InlineLabel>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl text-center">
                                <div className="text-2xl font-black">{user.stats?.forks ?? 0}</div>
                                <InlineLabel>Forks</InlineLabel>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl text-center">
                                <div className="text-2xl font-black">{user.stats?.comments ?? 0}</div>
                                <InlineLabel>Comments</InlineLabel>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main grid */}
                <div className="gap-6">
                    <div className="gap-6 space-y-6">
                        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900/60 to-black/80 p-6 rounded-2xl border border-white/5">
                            <h2 className="font-semibold text-lg mb-3">About</h2>
                            <p className="text-sm text-zinc-400">{user.bio ?? "No bio provided."}</p>

                            <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-zinc-400">
                                <div>Location: <span className="text-zinc-300">{user.location ?? "--"}</span></div>
                                <div>Website: <a href={user.website ?? ""} target="_blank" rel="noopener noreferrer" className="text-zinc-300 underline">{user.website ?? "--"}</a></div>
                                <div>
                                    Twitter:
                                    {twitter ? (
                                        <a
                                            href={`https://twitter.com/${encodeURIComponent(twitter)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-zinc-300 underline ml-2"
                                        >
                                            @{twitter}
                                        </a>
                                    ) : (
                                        <span className="text-zinc-300 ml-2">--</span>
                                    )}
                                </div>
                                <div>Joined: <span className="text-zinc-300">{user.created_at ? new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(user.created_at)) : "--"}</span></div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900/60 to-black/80 p-6 rounded-2xl border border-white/5">
                            <h3 className="font-semibold mb-3">Activity</h3>
                            <ActivityFeed username={user.username ?? (username ?? "")} />
                        </div>

                        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900/60 to-black/80 p-6 rounded-2xl border border-white/5">
                            <ReputationBar rep={user.reputation_obj} />
                        </div>

                        <div className="bg-gradient-to-br from-neutral-900 via-neutral-900/60 to-black/80 p-6 rounded-2xl border border-white/5">
                            <h3 className="font-semibold mb-3">Badges</h3>
                            <BadgesList badges={user.badges ?? []} />
                        </div>

                        {canEdit && (
                            <div className="bg-gradient-to-br from-neutral-900 via-neutral-900/60 to-black/80 p-6 rounded-2xl border border-white/5">
                                <SecurityCenterExpanded me={user} />
                            </div>
                        )}

                        {canEdit && (
                            <div className="bg-gradient-to-br from-red-900/30 via-red-900/20 to-black/80 p-6 rounded-2xl border border-red-400/50">
                                <h3 className="font-semibold">Danger Zone</h3>
                                <div className="mt-2 text-sm text-zinc-400">Actions here are destructive. You'll be asked to confirm.</div>
                                <div className="mt-4">
                                    <button className="bg-red-700/90 px-4 py-2 rounded-xl">Delete account</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {canEdit && <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} user={user} />}
            {canEdit && <AvatarEditorModal open={avatarOpen} onClose={() => setAvatarOpen(false)} username={user.username ?? username} />}
        </div>
    );
}
