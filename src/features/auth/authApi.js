import backendUrlV1 from "../../urls/backendUrl";

/* -------------------------
   Helpers
------------------------- */

function jsonHeaders() {
    return {
        "Content-Type": "application/json",
    };
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

    if (typeof data.detail === "string") {
        return data.detail;
    }

    if (Array.isArray(data.detail)) {
        return data.detail.map(d => d.msg).join(", ");
    }

    return fallback;
}

/* -------------------------
   Auth APIs
------------------------- */

/**
 * Login (cookie-based)
 */
export async function loginWithPassword(email, password) {
    const res = await fetch(`${backendUrlV1}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });


    const data = await parseJsonSafe(res);

    if (!res.ok) {
        throw new Error(
            extractErrorMessage(data, "Invalid credentials")
        );
    }

    // backend sets cookie, response body is minimal
    return data;
}

/**
 * Register (cookie-based)
 */
export async function registerWithPassword(email, password, username = null) {
    const res = await fetch(`${backendUrlV1}/auth/register`, {
        method: "POST",
        headers: jsonHeaders(),
        credentials: "include",
        body: JSON.stringify({
            email,
            password,
            username,
        }),
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
        throw new Error(
            extractErrorMessage(data, "Registration failed")
        );
    }

    return data;
}

/**
 * Get current user (from cookie)
 */
export async function getCurrentUser() {
    const res = await fetch(`${backendUrlV1}/auth/me`, {
        credentials: "include",
    });

    if (!res.ok) {
        return null;
    }

    return res.json();
}

/**
 * Logout (server clears cookie)
 */
export async function logout() {
    localStorage.removeItem("redirectAfterLogin");
    //localStorage.removeItem("avatarUrl");
    const res = await fetch(`${backendUrlV1}/auth/logout`, {
        method: "POST",
        credentials: "include",
    });

    if (!res.ok) {
        throw new Error("Logout failed");
    }

    window.location.reload();
}
