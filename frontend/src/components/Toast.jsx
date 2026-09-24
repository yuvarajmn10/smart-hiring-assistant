import { useState, createContext, useContext, useCallback } from 'react';
const ToastContext = createContext();
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const showToast = useCallback((message, type = 'success') => {
        const id = `${Date.now()}-${Math.random()}`;
        // Random suffix keeps ids unique when two toasts fire in the same ms
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
        // Auto-dismiss after 3.5 seconds
    }, []);
    const toastStyle = (type) => ({
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 16px', borderRadius: '12px',
        fontSize: '13px', fontWeight: 500,
        backdropFilter: 'blur(20px)',
        animation: 'slideIn .3s ease',
        ...(type === 'success' ? {
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            color: 'var(--green-text)',
        } : type === 'error' ? {
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: 'var(--red-text)',
        } : {
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            color: 'var(--indigo-text)',
        }),
    });
    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div style={{ position: 'fixed', top: '70px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '340px' }}>
                {toasts.map(t => (
                    <div key={t.id} style={toastStyle(t.type)}>
                        <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : '✦'}</span>
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext);