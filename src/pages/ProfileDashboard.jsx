import React, { useEffect, useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import backendUrlV1 from "../urls/backendUrl";
import { useMe } from "../hooks/useMe";
import Cropper from "react-easy-crop";
import { Upload, Edit2, ShieldCheck, Trash2, Settings } from "lucide-react";
import { useContextManager } from "../features/ContextProvider";
import { lazy, Suspense } from "react";
import LazyErrorBoundary from "../components/lazyLoadError";
import PanelSkeleton from "../components/PanelSkeleton";
import SoftCrashPanel from "../components/SoftCrashPanel";

const SecurityCenterExpanded = lazy(() =>
    import("../components/profile/SecurityPanel")
);

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

/* ------------------------- Reputation bar (refreshed visuals) ------------------------- */
function ReputationBar({ rep = {} }) {
    const pct = Math.max(0, Math.min(100, rep.progress_pct ?? 0.5));

    return (
        <div className="p-4 rounded-2xl">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-xs text-zinc-400">Reputation</div>
                    <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold tracking-tight">
                            {(rep.score ?? 0).toLocaleString()}
                        </div>
                        <div className="text-xs px-2 py-0.5 rounded-full bg-white/6">
                            {rep.level ?? "--"}
                        </div>
                    </div>
                </div>

                <div className="text-xs text-zinc-400 text-right">
                    Next: <div className="text-zinc-200">{rep.next_level ?? "--"}</div>
                </div>
            </div>

            <div className="mt-4">
                <div className="bg-white/6 h-3 rounded-full overflow-hidden relative">
                    <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-gradient-to-r from-orange-700 via-orange-400 to-orange-200 shadow-[0_6px_20px_rgba(250,204,21,0.12)] transition-all duration-700"
                    />
                </div>
                <div className="mt-2 text-[12px] text-zinc-400">{pct.toFixed(2)}% of the way to the next level</div>
            </div>
        </div>
    );
}

/* ------------------------- Badges list ------------------------- */
function BadgesList({ badges = [] }) {
    if (!badges || !badges.length) return <div className="text-sm text-zinc-500">No badges yet</div>;
    return (
        <div className="flex gap-2 flex-wrap">
            {badges.map((b) => (
                <div key={b.code} className="px-3 py-1 rounded-full bg-white/6 text-sm">
                    <strong className="mr-2">{b.title}</strong>
                    <span className="text-xs text-zinc-400">{b.awarded_at ? new Date(b.awarded_at).toLocaleDateString() : ""}</span>
                </div>
            ))}
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

    if (q.isLoading) {
        return (
            <div className="p-6 rounded-xl bg-white/3 flex flex-col items-center gap-3">
                <div className="h-9 w-9 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <span className="text-sm text-white/70">Loading activity…</span>
            </div>
        );
    };
    if (q.isError) return <div className="text-sm text-zinc-500">Activity not available</div>;

    const items = q.data || [];
    if (!items.length) return <div className="text-sm text-zinc-500">No recent activity</div>;

    return (
        <div className="space-y-3">
            {items.map((it, idx) => (
                <div key={idx} className="p-3 bg-white/4 rounded-lg">
                    <div className="text-sm font-semibold">{it.title}</div>
                    <div className="text-xs text-zinc-400">{it.when ? new Date(it.when).toLocaleString() : ""}</div>
                </div>
            ))}
        </div>
    );
}

/* ------------------------- Edit Profile Modal (unchanged logic, refreshed look) ------------------------- */

function EditProfileModal({ open, onClose, user }) {
    const qc = useQueryClient();
    const navigate = useNavigate();
    const usernameRef = useRef(null);

    const buildInitialForm = () => ({
        username: user.username,
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        twitter: user.twitter || "",
        youtube: user.youtube || ""
    });

    const [form, setForm] = useState(buildInitialForm);
    const [serverError, setServerError] = useState(null);
    const [shake, setShake] = useState(false);

    const originalUsername = user.username;

    useEffect(() => {
        if (!open) return;
        setForm(buildInitialForm());
        setServerError(null);
        setShake(false);
        setTimeout(() => usernameRef.current?.focus(), 80);
    }, [open, user]);

    const usernameStatus = useUsernameAvailabilitySimple(
        form.username,
        open && form.username !== originalUsername
    );

    const isUsernameChanged = form.username !== originalUsername;
    const isDirty = JSON.stringify(form) !== JSON.stringify(buildInitialForm());

    const canSave =
        open &&
        isDirty &&
        (!isUsernameChanged || usernameStatus === "available")

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
                const err = new Error(data.detail || data.message || "Save failed");
                err.status = res.status;
                throw err;
            }
            return data;
        },
        {
            onSuccess: () => {
                qc.invalidateQueries({ queryKey: ["profile", "me"] });
                qc.invalidateQueries({ queryKey: ["profile"] });
                if (form.username !== originalUsername) {
                    navigate(`/profile/${encodeURIComponent(form.username)}`, { replace: true });
                }
                onClose();
            },
            onError: (err) => {

                setServerError(err.message || "Save failed");
                setShake(true);
                setTimeout(() => setShake(false), 450);
            }
        }
    );

    const parseHandle = (value, domain, maxLen = 30) => {
        let raw = value.trim();
        try {
            if (raw.includes(domain)) {
                const url = new URL(raw.startsWith("http") ? raw : "https://" + raw);
                raw = url.pathname.split("/").filter(Boolean)[0] || "";
            }
        } catch { }

        return raw.replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, maxLen);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm grid place-items-center z-50 px-4">
            <div
                className={`
                    relative w-full max-w-2xl mt-7
                    rounded-2xl
                    bg-gradient-to-br from-neutral-900/80 via-neutral-800/70 to-neutral-900/80
                    border border-neutral-700
                    p-6
                    ${shake ? "animate-shake" : ""}
                `}
            >
                <h3 className="text-xl font-semibold tracking-wide mb-4 text-white">Edit Profile</h3>

                <div className="max-h-[calc(100vh-260px)] overflow-y-auto space-y-4 px-2">
                    {serverError && <div className="mb-2 text-sm text-red-400">{serverError}</div>}

                    <label className="text-sm mb-1 block">Username</label>
                    <input
                        ref={usernameRef}
                        className="input-dark w-full"
                        value={form.username}
                        onChange={(e) => setForm(s => ({ ...s, username: e.target.value }))}
                    />
                    <div className="mt-1 h-4 text-xs">
                        {isUsernameChanged && usernameStatus === "checking" && <span className="text-zinc-400">Checking…</span>}
                        {isUsernameChanged && usernameStatus === "available" && <span className="text-green-400">Available ✓</span>}
                        {isUsernameChanged && usernameStatus === "taken" && <span className="text-red-400">Taken ✕</span>}
                        {isUsernameChanged && usernameStatus === "invalid" && <span className="text-yellow-400">3-30 chars, letters, numbers, underscore</span>}
                    </div>

                    <label className="text-sm mt-4 mb-1 block">Bio <span className="text-xs text-zinc-400">({form.bio.length}/160)</span></label>
                    <textarea
                        maxLength={160}
                        className="input-dark w-full h-24 resize-none"
                        value={form.bio}
                        onChange={(e) => setForm(s => ({ ...s, bio: e.target.value }))}
                    />

                    <div className="grid md:grid-cols-2 gap-3 mt-4">
                        <div>
                            <label className="text-sm mb-1 block">Location</label>
                            <input
                                className="input-dark w-full"
                                value={form.location}
                                onChange={(e) => setForm(s => ({ ...s, location: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="text-sm mb-1 block">Website</label>
                            <input
                                className="input-dark w-full"
                                placeholder="https://example.com"
                                value={form.website}
                                onChange={(e) => setForm(s => ({ ...s, website: e.target.value }))}
                            />
                            {form.website && (
                                <a
                                    href={form.website.startsWith("http") ? form.website : `https://${form.website}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-400 mt-1 inline-block"
                                >
                                    Preview website ↗
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="text-sm mb-1 block">Twitter / X</label>
                        <input
                            className="input-dark w-full"
                            placeholder="@username or x.com/username"
                            value={form.twitter}
                            onChange={(e) =>
                                setForm(s => ({ ...s, twitter: parseHandle(e.target.value, "x.com", 15) }))
                            }
                        />
                        {form.twitter && (
                            <a
                                href={form.twitter.startsWith("http") ? form.twitter : `https://twitter.com/${form.twitter}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-400 mt-1 inline-block"
                            >
                                Preview twitter ↗
                            </a>
                        )}

                        <label className="text-sm mt-3 mb-1 block">YouTube</label>
                        <input
                            className="input-dark w-full"
                            placeholder="youtube.com/@channel or channel name"
                            value={form.youtube}
                            onChange={(e) =>
                                setForm(s => ({ ...s, youtube: parseHandle(e.target.value, "youtube.com", 50) }))
                            }
                        />
                        {form.youtube && (
                            <a
                                href={form.youtube.startsWith("http") ? form.youtube : `https://youtube.com/@${form.youtube}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-400 mt-1 inline-block"
                            >
                                Preview YouTube ↗
                            </a>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                    <button
                        className="px-4 py-2 rounded-lg text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition"
                        onClick={() => {
                            setForm(buildInitialForm());
                            setServerError(null);
                            setShake(false);
                            onClose();
                        }}
                        disabled={mutation.isLoading}
                    >
                        Cancel
                    </button>

                    <button
                        className="px-5 py-2 rounded-lg text-sm font-medium text-neutral-900 bg-amber-400 hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        disabled={!canSave || mutation.isLoading}
                        onClick={() => {
                            const payload = Object.fromEntries(
                                Object.entries(form).map(([k, v]) => [k, v.trim() === "" ? null : v])
                            );
                            mutation.mutate(payload);
                        }}
                    >
                        {mutation.isLoading ? "Saving…" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------- Avatar Editor (kept logic, nicer UI) ------------------------- */

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

    const onCropComplete = useCallback((_, pixels) => {
        setCroppedAreaPixels(pixels);
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

            qc.invalidateQueries({ queryKey: ["profile"] });
            onClose();
        },
        onError: () => setError("Upload failed. Please try again.")
    });

    const handleFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setError("Only image files are allowed.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be under 5MB.");
            return;
        }

        const url = URL.createObjectURL(file);
        setImageSrc(url);
    };

    async function handleSave() {
        try {
            const blob = await getCroppedImage(imageSrc, croppedAreaPixels);
            await uploadMutation.mutateAsync(blob);
        } catch {
            setError("Failed to process image.");
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm grid place-items-center z-50 px-4">
            <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-br from-neutral-900/80 via-neutral-800/70 to-neutral-900/80 border border-neutral-700 p-6">
                <h3 className="text-lg font-semibold mb-3">Edit Avatar</h3>

                {error && <div className="text-red-400 text-sm mb-3">{error}</div>}

                {!imageSrc && (
                    <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer bg-neutral-800/50 hover:bg-neutral-800/70 transition">
                        <div className="flex flex-col items-center text-center px-4">
                            <Upload className="w-6 h-6 text-zinc-400 mb-2" />
                            <p className="text-sm text-zinc-300">
                                <span className="font-medium">Click to upload</span> or drag & drop
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">Square image works best • Max 5MB</p>
                        </div>

                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => handleFile(e.target.files?.[0])}
                        />
                    </label>
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

                            {uploadMutation.isLoading && (
                                <div className="absolute inset-0 bg-black/60 grid place-items-center text-white text-sm">
                                    Saving…
                                </div>
                            )}
                        </div>

                        <div className="mt-3">
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.01}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full accent-amber-400"
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button className="btn-ghost" onClick={onClose} disabled={uploadMutation.isLoading}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSave}
                                disabled={uploadMutation.isLoading}
                            >
                                {uploadMutation.isLoading ? "Saving…" : "Save Avatar"}
                            </button>
                        </div>
                    </>
                )}

                {!imageSrc && (
                    <div className="flex justify-end mt-4">
                        <button className="btn-ghost" onClick={onClose}>Cancel</button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ------------------------- Loading & NotFound (refreshed) ------------------------- */
const ProfileLoading = () => (
    <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-full max-w-md rounded-2xl border border-neutral-700 bg-gradient-to-br from-neutral-900/70 to-neutral-800/50 p-8 shadow-xl animate-pulse">
            <div className="h-6 w-1/2 bg-white/10 rounded mb-6" />
            <div className="h-4 w-full bg-white/10 rounded mb-3" />
            <div className="h-4 w-5/6 bg-white/10 rounded mb-3" />
            <div className="h-4 w-2/3 bg-white/10 rounded" />
        </div>
    </div>
);

const ProfileNotFound = () => (
    <div className="flex justify-center items-center min-h-[60vh] px-6">
        <div className="max-w-md w-full rounded-2xl border border-neutral-700 bg-gradient-to-br from-neutral-900/60 to-neutral-800/40 p-10 text-center">
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-semibold text-white mb-2">Profile Not Found</h2>
            <p className="text-sm text-white/60 mb-6">The user you're looking for doesn't exist or may have been removed.</p>
            <button
                onClick={() => window.history.back()}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:brightness-95 text-neutral-900 font-medium transition"
            >
                Go Back
            </button>
        </div>
    </div>
);

/* ------------------------- Main Profile Dashboard (refreshed layout) ------------------------- */
export default function ProfileDashboard() {
    const { username } = useParams();
    const navigate = useNavigate();
    const me = useMe();

    const { windowWidth } = useContextManager();
    const isXS = windowWidth < 380;
    const isSM = windowWidth < 778;
    const isMD = windowWidth < 1024;
    const isLG = windowWidth >= 1024;

    const avatarSize = isXS ? 110 : isSM ? 130 : isMD ? 150 : 160;
    const headerPadding = isXS ? "p-4" : isSM ? "p-5" : "p-6";
    const titleClass = isXS
        ? "text-xl"
        : isSM
            ? "text-2xl"
            : "text-3xl";
    const sectionGap = isXS ? "space-y-6" : "space-y-10";
    const statsWrap = isXS || isSM;

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
    const isAdmin = Boolean(me.data?.is_admin);


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

    useEffect(() => {
        const isModalOpen = editOpen || avatarOpen;
        if (isModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [editOpen, avatarOpen]);

    const isOwnProfile = !username;
    const isLoading = isOwnProfile ? me.isLoading : profileQuery.isLoading;

    const isMissing = isOwnProfile ? !me.data : profileQuery.isError || !profileQuery.data;

    if (isLoading) return <ProfileLoading />;
    if (isMissing) return <ProfileNotFound />;

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
    const youtube = user?.youtube?.replace(/^https?:\/\//, "");

    return (
        <div
            className={`
                min-h-screen max-w-[100vw] text-neutral-200 px-3 py-6
            `}
        >

            <div className={`max-w-6xl mx-auto ${sectionGap}`}>

                {/* Header */}
                <div
                    className={`
                        rounded-3xl ${headerPadding}
                        flex ${windowWidth < 774 ? "flex-col items-start" : "flex-row items-center"}
                        gap-${isXS ? "4" : "6"}
                    `}
                >

                    <div className={`flex items-center gap-6 w-full ${isXS ? "flex-col" : "flex-row"}`}>
                        <div className="relative">
                            <div className="rounded-full bg-gradient-to-tr from-amber-400 to-pink-400 p-1">
                                <div className="rounded-full bg-neutral-700">
                                    <img
                                        src={
                                            user.avatar_url
                                                ? `${user.avatar_url}?v=${user.avatar_changed_at ?? ""}`
                                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username ?? "User")}`
                                        }
                                        alt={user.username}
                                        style={{ width: avatarSize, height: avatarSize }}
                                        className="rounded-full object-cover ring-4 ring-black/60 shadow-xl"
                                    />
                                </div>
                            </div>

                            {canEdit && (
                                <button
                                    onClick={() => setAvatarOpen(true)}
                                    className="absolute -right-2 -bottom-2 bg-amber-400 p-2 rounded-full shadow-md text-neutral-900 hover:scale-105 transition"
                                >
                                    <Upload className="w-4 h-4" />
                                </button>
                            )}
                        </div>


                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-3">
                                <h1 className={`${titleClass} font-semibold tracking-tight`}>
                                    {user.username}</h1>
                                <span className="inline-block w-2 h-2 rounded-full bg-orange-400" />
                            </div>
                            {user.bio && (
                                <p
                                    className={`
                                        mt-2 text-sm text-zinc-400 max-w-xl
                                        ${isXS ? "leading-snug" : "leading-relaxed"}
                                    `}
                                >
                                    {user.bio}
                                </p>
                            )}


                            <div className="mt-4 flex items-center gap-3">
                                {canEdit ? (
                                    <button
                                        onClick={() => setEditOpen(true)}
                                        className="px-4 py-2 rounded-lg bg-orange-600/90 hover:bg-orange-500 text-black font-bold transition flex items-center gap-2 text-sm"
                                    >
                                        <Edit2 className="w-4 h-4" /> Edit Profile
                                    </button>
                                ) : (
                                    <div className="text-sm text-zinc-400">
                                        {user.reputation_score ?? 0} rep · {user.reputation_level ?? "--"}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats (compact) */}
                    <div
                        className={`
                            ${statsWrap ? "w-full grid grid-cols-3 gap-2 mt-4" : "ml-auto flex gap-3"}
                        `}
                    >

                        {[
                            ["Recipes", user.stats?.recipes ?? 0],
                            ["Forks", user.stats?.forks ?? 0],
                            ["Comments", user.stats?.comments ?? 0],
                        ].map(([label, value]) => (
                            <div key={label} className="bg-white/4 px-4 py-3 rounded-2xl text-center min-w-[96px]">
                                <div className="text-xl text-center w-full font-bold">{value}</div>
                                <span className="text-xs text-zinc-400">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left / main */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="p-6 rounded-2xl border border-neutral-700 bg-gradient-to-br from-black/20 to-black/10">
                            <h2 className="font-semibold text-base mb-2">About</h2>
                            <p className="text-zinc-400 leading-relaxed">{user.bio ?? "No bio provided."}</p>
                            <div className="sm:col-span-2 text-sm mt-4">On Forkit since <span className="text-zinc-300">
                                {user.created_at ? new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(user.created_at)) : "--"}
                            </span></div>

                            {user.location || user.website || twitter || youtube ?
                                (
                                <>
                                    <label className="block mt-4 mb-2 font-semibold text-base">Additional info</label>
                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-zinc-400">
                                        {user.location && <div>Location: {" "}<span className="text-zinc-200">{user.location}</span></div>}
                                        {user.website && <div>Website: {" "}
                                            <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-zinc-200 underline break-all hover:text-white transition">
                                                {user.website}
                                            </a>
                                        </div>
                                        }
                                        {twitter && <div>Twitter: {" "}
                                            <a href={`https://twitter.com/${encodeURIComponent(twitter)}`} target="_blank" rel="noopener noreferrer" className="text-zinc-200 underline hover:text-white transition">
                                                @{twitter}
                                            </a>
                                        </div>
                                        }

                                        {youtube && <div>YouTube: {" "}
                                            <a href={`https://youtube.com/@${encodeURIComponent(youtube)}`} target="_blank" rel="noopener noreferrer" className="text-zinc-200 underline hover:text-white transition">
                                                @{youtube}
                                            </a>
                                        </div>
                                        }
                                    </div>
                                </>
                                ) : (
                                    <div className="text-sm text-zinc-500 mt-4">No additional information provided.</div>
                                )
                            }
                        </div>

                        <div className="p-6 rounded-2xl border border-neutral-700 bg-gradient-to-br from-black/20 to-black/10">
                            <h3 className="font-semibold mb-3">Activity</h3>
                            <ActivityFeed username={user.username ?? username ?? ""} />
                        </div>
                    </div>

                    {/* Right sidebar */}
                    <div className="space-y-6">
                        <div className="p-4 rounded-2xl border border-neutral-700 bg-gradient-to-br from-black/20 to-black/10">
                            <ReputationBar rep={user.reputation_obj} />
                        </div>

                        <div className="p-4 rounded-2xl border border-neutral-700 bg-gradient-to-br from-black/20 to-black/10">
                            <h3 className="font-semibold mb-3">Badges</h3>
                            <BadgesList badges={user.badges ?? []} />
                        </div>
                    </div>
                </div>

                {/* Owner-only sections */}
                {canEdit && (
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl border border-neutral-700 bg-gradient-to-br from-black/20 to-black/10">
                            <div className="flex items-center gap-3 mb-3">
                                <ShieldCheck className="w-5 h-5 text-amber-400" />
                                <div>
                                    <div className="font-semibold text-base">Security</div>
                                </div>
                            </div>
                            <LazyErrorBoundary
                                fallback={
                                    <SoftCrashPanel />
                                }
                            >
                                <Suspense fallback={<PanelSkeleton />}>
                                    <SecurityCenterExpanded me={user} />
                                </Suspense>
                            </LazyErrorBoundary>
                        </div>

                        <div className="p-6 rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-900/20 to-black/30">
                            <div className="flex md:flex-row flex-col md:items-center md:justify-between">
                                <div>
                                    <h3 className="font-semibold">Danger Zone</h3>
                                    <p className="mt-2 text-sm text-zinc-400">
                                        Actions here are destructive. You'll be asked to confirm.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 mt-5 md:mt-0">
                                    <button className="flex items-center gap-2 bg-red-700/90 hover:bg-red-600 px-4 py-2 rounded-xl text-sm transition">
                                        <Trash2 className="w-4 h-4" /> Delete account
                                    </button>
                                </div>
                            </div>
                        </div>
                        {isAdmin && <div className="p-6">
                            <div className="flex md:flex-row flex-col md:items-center md:justify-between">
                                <div>
                                    <h3 className="font-semibold">Go to Admin Panel</h3>
                                    <p className="mt-2 text-sm text-zinc-400">
                                        Access administrative tools and settings for your account.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 mt-5 md:mt-0">
                                    <button className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-900 px-4 py-2 rounded-xl text-sm transition"
                                        onClick={() => window.location.href = "/admin"}
                                    >
                                        <Settings className="w-4 h-4" /> Admin
                                    </button>
                                </div>
                            </div>
                        </div>
                        }
                    </div>
                )}

                {canEdit && <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} user={user} />}
                {canEdit && <AvatarEditorModal open={avatarOpen} onClose={() => setAvatarOpen(false)} username={user.username ?? username} />}
            </div>
        </div>
    );
}
