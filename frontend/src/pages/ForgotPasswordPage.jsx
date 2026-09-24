import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../components/Toast';
import useIsMobile from '../hooks/useIsMobile';
const RESEND_SECONDS = 60;
const label = { display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' };
// Two steps: 1) email → code is emailed, 2) code + new password
const ForgotPasswordPage = () => {
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [step, setStep] = useState('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendIn, setResendIn] = useState(0);
    // Countdown for "Resend code" (the backend also refuses resends within a minute)
    useEffect(() => {
        if (resendIn <= 0) return;
        const t = setTimeout(() => setResendIn(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [resendIn]);

    const requestCode = async (e) => {
        e?.preventDefault();
        if (!email.trim()) { setError('Enter your email'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setInfo(res.data.message);
            setStep('reset');
            setResendIn(RESEND_SECONDS);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not send the code. Try again.');
        } finally { setLoading(false); }
    };
    const resetPassword = async (e) => {
        e.preventDefault();
        if (!/^\d{6}$/.test(code)) { setError('Enter the 6-digit code from the email'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        if (password !== confirm) { setError('Passwords do not match'); return; }
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/reset-password', { email, code, newPassword: password });
            showToast('Password reset — sign in with your new password', 'success');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Could not reset password. Try again.');
        } finally { setLoading(false); }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 50%), var(--bg-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1.5rem 1rem' : '1rem',
        }}>
            <div className="fade-up" style={{ width: '100%', maxWidth: '420px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', background: 'var(--accent)', borderRadius: '10px', padding: '6px 14px', marginBottom: '1.25rem' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'white', fontFamily: 'Syne, sans-serif' }}>HireAI</span>
                    </div>
                    <h1 className="font-display" style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        {step === 'email' ? 'Forgot password?' : 'Reset your password'}
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {step === 'email' ? "Enter your email and we'll send you a 6-digit code" : <>Enter the code sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong></>}
                    </p>
                </div>
                <div className="glass" style={{ borderRadius: '16px', padding: isMobile ? '1.5rem' : '2rem' }}>
                    {error && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--red-text-soft)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '1.25rem' }}>{error}</div>
                    )}
                    {step === 'reset' && info && !error && (
                        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: 'var(--green-text)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '1.25rem' }}>{info} Check your spam folder too.</div>
                    )}
                    {step === 'email' ? (
                        <form onSubmit={requestCode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={label}>Email</label>
                                <input className="input-dark" type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="you@company.com" autoFocus required />
                            </div>
                            <button className="btn-accent" type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send code'}</button>
                        </form>
                    ) : (
                        <form onSubmit={resetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={label}>6-digit code</label>
                                <input className="input-dark" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
                                    onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }} placeholder="123456" autoFocus
                                    style={{ fontSize: '20px', letterSpacing: '8px', textAlign: 'center', fontWeight: 600 }} />
                            </div>
                            <div>
                                <label style={label}>New password</label>
                                <input className="input-dark" type="password" autoComplete="new-password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="Min 6 characters" />
                            </div>
                            <div>
                                <label style={label}>Confirm new password</label>
                                <input className="input-dark" type="password" autoComplete="new-password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }} placeholder="Type it again" />
                            </div>
                            <button className="btn-accent" type="submit" disabled={loading}>{loading ? 'Resetting…' : 'Reset password'}</button>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <button type="button" onClick={() => { setStep('email'); setCode(''); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', padding: 0 }}>
                                    ← Change email
                                </button>
                                <button type="button" onClick={requestCode} disabled={resendIn > 0 || loading} style={{ background: 'none', border: 'none', color: resendIn > 0 ? 'var(--text-muted)' : 'var(--accent)', cursor: resendIn > 0 ? 'default' : 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 500, padding: 0 }}>
                                    {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                                </button>
                            </div>
                        </form>
                    )}
                    <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '1.5rem' }}>
                        Remembered it? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>Back to sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
export default ForgotPasswordPage;
