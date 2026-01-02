import { loginWithPassword, getCurrentUser, logout } from "./authApi";

export function useAuth() {
    return {
        login: loginWithPassword,
        me: getCurrentUser,
        logout,
    };
}
