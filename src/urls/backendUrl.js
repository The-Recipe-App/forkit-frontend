const rawBase = import.meta.env.VITE_BACKEND_URL;

// If env exists → absolute backend
// If not → same-origin
const backendUrlV1 = rawBase
    ? rawBase.replace(/\/+$/, "") + "/"
    : "";

export default backendUrlV1;
