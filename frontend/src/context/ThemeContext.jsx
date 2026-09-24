import { createContext, useContext, useState, useEffect, useCallback } from 'react';
const ThemeContext = createContext();
// Saved choice wins; otherwise follow the operating system setting
const getInitialTheme = () => {
    try {
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') return saved;
    } catch {
        // Storage blocked — fall through to the OS preference
    }
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(getInitialTheme);
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        // index.css switches every color variable off this attribute
        try { localStorage.setItem('theme', theme); } catch { /* not critical */ }
    }, [theme]);
    const toggleTheme = useCallback(() => {
        setTheme(t => (t === 'dark' ? 'light' : 'dark'));
    }, []);
    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
