import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useIsMobile from '../hooks/useIsMobile';
import { useTheme } from '../context/ThemeContext';
const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useIsMobile();
    const [menuOpen, setMenuOpen] = useState(false);
    const { theme, setTheme, toggleTheme } = useTheme();
    const themeLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    const themeToggle = (
        <button type="button" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel} style={{
            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
            background: 'var(--tint-04)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '15px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .2s',
        }}>
            {theme === 'dark' ? '☀' : '☾'}
        </button>
    );
    // Light / Dark picker used inside the account menus (desktop dropdown and mobile menu)
    const themePicker = (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '8px 12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>🎨 Appearance</span>
            <div role="group" aria-label="Theme" style={{ display: 'flex', gap: '2px', padding: '2px', borderRadius: '8px', background: 'var(--tint-04)', border: '1px solid var(--border)' }}>
                {[['light', '☀ Light'], ['dark', '☾ Dark']].map(([value, label]) => (
                    <button key={value} type="button" aria-pressed={theme === value} onClick={() => setTheme(value)} style={{
                        padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                        fontSize: '12px', fontWeight: 500, fontFamily: 'DM Sans,sans-serif', transition: 'all .15s',
                        background: theme === value ? 'var(--accent)' : 'transparent',
                        color: theme === value ? 'white' : 'var(--text-secondary)',
                    }}>{label}</button>
                ))}
            </div>
        </div>
    );
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    // Close the account menu on an outside click or Escape
    useEffect(() => {
        if (!userMenuOpen) return;
        const onClick = (e) => { if (!userMenuRef.current?.contains(e.target)) setUserMenuOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setUserMenuOpen(false); };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [userMenuOpen]);
    const menuItem = (danger = false) => ({
        display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
        padding: '9px 12px', borderRadius: '8px', border: 'none',
        fontSize: '13px', fontWeight: 500, textAlign: 'left', textDecoration: 'none', cursor: 'pointer',
        fontFamily: 'DM Sans,sans-serif', color: danger ? 'var(--red-text)' : 'var(--text-secondary)',
    });
    const handleLogout = () => { logout(); navigate('/login'); setMenuOpen(false); setUserMenuOpen(false); };
    const isActive = (path) => location.pathname === path;
    const navLink = (path) => ({
        fontSize: '13px', fontWeight: 500, textDecoration: 'none', transition: 'color .2s',
        color: isActive(path) ? 'var(--text-primary)' : 'var(--text-secondary)',
        paddingBottom: '2px',
        borderBottom: isActive(path) ? '1px solid var(--accent)' : '1px solid transparent',
    });
    return (
        <>
            <nav style={{ background: 'var(--nav-bg)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '0 1.25rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
                {/* Logo */}
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'var(--accent)', borderRadius: '7px', padding: '4px 10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'white', fontFamily: 'Syne,sans-serif' }}>HireAI</span>
                    </div>
                </Link>
                {/* Desktop nav */}
                {!isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        {!user && themeToggle}
                        {user?.role !== 'recruiter' && <Link to="/jobs" style={navLink('/jobs')}>Browse Jobs</Link>}
                        {user ? (
                            <>
                                <Link to="/dashboard" style={navLink('/dashboard')}>Dashboard</Link>
                                <div ref={userMenuRef} style={{ position: 'relative' }}>
                                    <button type="button" onClick={() => setUserMenuOpen(o => !o)} aria-haspopup="menu" aria-expanded={userMenuOpen} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: userMenuOpen ? 'var(--bg-card-hover)' : 'var(--bg-card)', border: `1px solid ${userMenuOpen ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '999px', padding: '4px 10px 4px 8px', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', transition: 'all .2s' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: user.role === 'recruiter' ? 'rgba(139,92,246,0.3)' : 'rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: user.role === 'recruiter' ? 'var(--purple-text)' : 'var(--green-text)' }}>
                                            {user.name?.[0]?.toUpperCase()}
                                        </div>
                                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{user.name}</span>
                                        <span style={{ fontSize: '11px', fontWeight: 500, padding: '1px 7px', borderRadius: '999px', background: user.role === 'recruiter' ? 'rgba(139,92,246,0.2)' : 'rgba(16,185,129,0.2)', color: user.role === 'recruiter' ? 'var(--purple-text)' : 'var(--green-text)' }}>{user.role}</span>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', transition: 'transform .2s', transform: userMenuOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                                    </button>
                                    {userMenuOpen && (
                                        <div role="menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', minWidth: '220px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.25)', padding: '6px', zIndex: 200, animation: 'fadeUp .15s ease' }}>
                                            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: '6px' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                                                {user.email && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>}
                                            </div>
                                            <Link to="/dashboard" role="menuitem" className="menu-item" onClick={() => setUserMenuOpen(false)} style={menuItem()}>📊 Dashboard</Link>
                                            {user.role === 'candidate' && (
                                                <Link to="/resume" role="menuitem" className="menu-item" onClick={() => setUserMenuOpen(false)} style={menuItem()}>📄 Your Resume</Link>
                                            )}
                                            {themePicker}
                                            <div style={{ height: '1px', background: 'var(--border)', margin: '6px 0' }} />
                                            <button type="button" role="menuitem" className="menu-item" onClick={handleLogout} style={menuItem(true)}>↪ Logout</button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>Login</Link>
                                <Link to="/register" style={{ fontSize: '13px', fontWeight: 500, color: 'white', textDecoration: 'none', background: 'var(--accent)', padding: '6px 14px', borderRadius: '8px' }}>Get Started</Link>
                            </>
                        )}
                    </div>
                )}
                {/* Mobile hamburger */}
                {isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {!user && themeToggle}
                    <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{
                                width: '22px', height: '2px', background: 'var(--text-secondary)', borderRadius: '2px', transition: 'all .2s',
                                transform: menuOpen ? (i === 0 ? 'rotate(45deg) translate(5px,5px)' : i === 2 ? 'rotate(-45deg) translate(5px,-5px)' : 'scale(0)') : 'none',
                                opacity: menuOpen && i === 1 ? 0 : 1,
                            }} />
                        ))}
                    </button>
                    </div>
                )}
            </nav>
            {/* Mobile dropdown menu */}
            {isMobile && menuOpen && (
                <div style={{ position: 'fixed', top: '56px', left: 0, right: 0, background: 'var(--nav-bg-solid)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', zIndex: 99, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeUp .2s ease' }}>
                    {user?.role !== 'recruiter' && (
                        <Link to="/jobs" onClick={() => setMenuOpen(false)} style={{ fontSize: '15px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>Browse Jobs</Link>
                    )}
                    {user ? (
                        <>
                            <Link to="/dashboard" onClick={() => setMenuOpen(false)} style={{ fontSize: '15px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>Dashboard</Link>
                            {user.role === 'candidate' && (
                                <Link to="/resume" onClick={() => setMenuOpen(false)} style={{ fontSize: '15px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>Your Resume</Link>
                            )}
                            <div style={{ margin: '0 -12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>{themePicker}</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                                <div>
                                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{user.name}</span>
                                    <span style={{ fontSize: '11px', marginLeft: '8px', padding: '2px 8px', borderRadius: '999px', background: user.role === 'recruiter' ? 'rgba(139,92,246,0.2)' : 'rgba(16,185,129,0.2)', color: user.role === 'recruiter' ? 'var(--purple-text)' : 'var(--green-text)', fontWeight: 500 }}>{user.role}</span>
                                </div>
                                <button onClick={handleLogout} style={{ fontSize: '13px', color: 'var(--red-text)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 500 }}>Logout</button>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link to="/login" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--tint-03)' }}>Login</Link>
                            <Link to="/register" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', fontSize: '14px', color: 'white', textDecoration: 'none', fontWeight: 500, padding: '10px', borderRadius: '10px', background: 'var(--accent)' }}>Register</Link>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};
export default Navbar;