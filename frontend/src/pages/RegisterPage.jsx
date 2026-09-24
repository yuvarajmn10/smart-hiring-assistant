import { useToast } from '../components/Toast';
import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import useIsMobile from '../hooks/useIsMobile';
const RegisterPage = () => {
    const isMobile = useIsMobile();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'candidate' });
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
            const res = await api.post('/auth/register', formData);
            login(res.data.user, res.data.token);
            navigate('/dashboard');
            showToast('Account created successfully!', 'success');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
            showToast(err.response?.data?.message || 'Registration failed.', 'error');
        } finally {
            setLoading(false);
        }
    };
    const roleBtn = (role) => ({
        padding: '10px 0',
        borderRadius: '10px',
        border: formData.role === role ? '1px solid var(--accent)' : '1px solid var(--border)',
        background: formData.role === role ? 'rgba(99,102,241,0.15)' : 'var(--tint-03)',
        color: formData.role === role ? 'var(--indigo-text)' : 'var(--text-secondary)',
        fontSize: '13px', fontWeight: 500, cursor: 'pointer',
        transition: 'all .2s', flex: 1,
        boxShadow: formData.role === role ? '0 0 12px rgba(99,102,241,0.2)' : 'none',
    });
    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 80% 50%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(139,92,246,0.08) 0%, transparent 50%), var(--bg-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1.5rem' : '2rem',
        }}>
            <div className="fade-up" style={{ width: '100%', maxWidth: '440px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex', background: 'var(--accent)',
                        borderRadius: '10px', padding: '6px 14px', marginBottom: '1.25rem',
                    }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'white', fontFamily: 'Syne, sans-serif' }}>HireAI</span>
                    </div>
                    <h1 className="font-display" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Create account</h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Join as a recruiter or candidate</p>
                </div>
                <div className="glass" style={{ borderRadius: '16px', padding: isMobile ? '1.5rem' : '2rem' }}>
                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                            color: 'var(--red-text-soft)', borderRadius: '8px', padding: '10px 14px',
                            fontSize: '13px', marginBottom: '1.25rem',
                        }}>{error}</div>
                    )}
                    <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Role selector */}
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '8px' }}>I am a...</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" style={roleBtn('candidate')} onClick={() => setFormData({ ...formData, role: 'candidate' })}>
                                    👤 Candidate
                                </button>
                                <button type="button" style={roleBtn('recruiter')} onClick={() => setFormData({ ...formData, role: 'recruiter' })}>
                                    🏢 Recruiter
                                </button>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Full Name</label>
                            <input className="input-dark" type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Ravi Kumar" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Email</label>
                            <input className="input-dark" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@company.com" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Password</label>
                            <input className="input-dark" type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} placeholder="Min 6 characters" />
                        </div>
                        <button className="btn-accent" type="submit" disabled={loading} style={{ marginTop: '4px' }}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                    <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '1.5rem' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
export default RegisterPage;