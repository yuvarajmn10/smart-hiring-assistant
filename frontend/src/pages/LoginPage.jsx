import { useToast } from '../components/Toast';
import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import useIsMobile from '../hooks/useIsMobile';
const LoginPage = () => {
    const isMobile = useIsMobile();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user, authLoading } = useAuth();
    if (authLoading) return null;
    if (user) return <Navigate to="/dashboard" replace />;
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/login', formData);
            login(res.data.user, res.data.token);
            navigate('/dashboard');
            showToast('Logged in successfully!', 'success');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Try again.');
            showToast(err.response?.data?.message || 'Login failed. Try again.', 'error');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 50%), var(--bg-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1.5rem 1rem' : '1rem',
        }}>
            <div className="fade-up" style={{ width: '100%', maxWidth: '420px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex', background: 'var(--accent)',
                        borderRadius: '10px', padding: '6px 14px', marginBottom: '1.25rem',
                    }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'white', fontFamily: 'Syne, sans-serif' }}>HireAI</span>
                    </div>
                    <h1 className="font-display" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        Welcome back
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Sign in to your account</p>
                </div>
                {/* Card */}
                <div className="glass" style={{ borderRadius: '16px', padding: isMobile ? '1.5rem' : '2rem' }}>
                    {/* Error */}
                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                            color: 'var(--red-text-soft)', borderRadius: '8px', padding: '10px 14px',
                            fontSize: '13px', marginBottom: '1.25rem',
                        }}>{error}</div>
                    )}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Email</label>
                            <input className="input-dark" type="email" name="email"
                                value={formData.email} onChange={handleChange}
                                placeholder="you@company.com" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
                                <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>Forgot password?</Link>
                            </div>
                            <input className="input-dark" type="password" name="password"
                                value={formData.password} onChange={handleChange}
                                required placeholder="••••••••" />
                        </div>
                        <button className="btn-accent" type="submit" disabled={loading} style={{ marginTop: '4px' }}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                    <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '1.5rem' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
export default LoginPage;