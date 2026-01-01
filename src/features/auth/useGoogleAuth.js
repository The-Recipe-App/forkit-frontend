import { useEffect } from "react";

export function useGoogleAuth({ onSuccess }) {
    useEffect(() => {
        if (!window.google) return;

        window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "788389799110-upqs33i4hbrvj2g34f1qtjk3j6j0pi5t.apps.googleusercontent.com",
            callback: onSuccess,
        });
    }, [onSuccess]);

    const prompt = () => {
        window.google.accounts.id.prompt();
    };

    return { prompt };
}
