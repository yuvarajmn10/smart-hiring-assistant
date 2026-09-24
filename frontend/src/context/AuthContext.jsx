import { createContext, useContext, useState } from 'react';
const AuthContext = createContext();
// On app load — check if user was already logged in.
// Read synchronously so the very first render already knows the user.
const loadSavedSession = () => {
    try {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
            return { token: savedToken, user: JSON.parse(savedUser) };
        }
    } catch {
        // Corrupt data in localStorage — treat as logged out
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
    return { token: null, user: null };
};
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => loadSavedSession().user);
    const [token, setToken] = useState(() => loadSavedSession().token);
    const loading = false;
    const login = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };
    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
// Custom hook — any component calls useAuth() to get user/login/logout
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);