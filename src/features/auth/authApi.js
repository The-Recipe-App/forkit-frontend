import { apiUrl } from "../api/apiUrl";

/* -------------------------
   Helpers
------------------------- */

function jsonHeaders() {
    return { "Content-Type": "application/json" };
}

async function parseJsonSafe(res) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

function extractErrorMessage(data, fallback) {
    if (!data) return fallback;
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) {
        return data.detail.map(d => d.msg).join(", ");
    }
    return fallback;
}

/* -------------------------
   Auth APIs
------------------------- */

export async function loginWithPassword(email, password) {
    const res = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        credentials: "include",
        headers: jsonHeaders(),
        body: JSON.stringify({ email, password }),
    });

    const data = await parseJsonSafe(res);
    if (!res.ok) {
        throw new Error(extractErrorMessage(data, "Invalid credentials"));
    }
    return data;
}

export async function registerWithPassword(email, password, username = null) {
    const res = await fetch(apiUrl("/auth/register"), {
        method: "POST",
        credentials: "include",
        headers: jsonHeaders(),
        body: JSON.stringify({ email, password, username }),
    });

    const data = await parseJsonSafe(res);
    if (!res.ok) {
        throw new Error(extractErrorMessage(data, "Registration failed"));
    }
    return data;
}

export async function getCurrentUser() {
    const res = await fetch(apiUrl("/auth/me"), {
        credentials: "include",
    });

    return res.ok ? res.json() : null;
}

export async function logout() {
    localStorage.removeItem("redirectAfterLogin");

    const res = await fetch(apiUrl("/auth/logout"), {
        method: "POST",
        credentials: "include",
    });

    if (!res.ok) throw new Error("Logout failed");
    window.location.reload();
}
