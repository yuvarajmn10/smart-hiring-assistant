import { useToast } from '../components/Toast';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import useIsMobile from '../hooks/useIsMobile';
import LiveJobs from '../components/LiveJobs';
const JobsPage = () => {
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    // ?tab=live keeps the chosen tab in the URL, so refresh and shared links land on it
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab') === 'live' ? 'live' : 'hireai';
    const switchTab = (next) => setSearchParams(next === 'live' ? { tab: 'live' } : {}, { replace: true });
    const tabStyle = (active) => ({
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '9px 18px', borderRadius: '10px', cursor: 'pointer',
        fontSize: '14px', fontWeight: 500, fontFamily: 'DM Sans,sans-serif', border: 'none',
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? 'white' : 'var(--text-secondary)',
        boxShadow: active ? '0 0 14px rgba(99,102,241,0.3)' : 'none',
        transition: 'all .2s',
    });
    useEffect(() => {
        api.get('/jobs')
            .then(res => setJobs(res.data.jobs || []))
            .catch(() => showToast('Failed to load jobs', 'error'))
            .finally(() => setLoading(false));
    }, [showToast]);
    // Job ids this candidate already applied to — so the button can say so
    const [appliedJobIds, setAppliedJobIds] = useState(() => new Set());
    useEffect(() => {
        if (user?.role !== 'candidate') return;
        api.get('/applications/my')
            .then(res => setAppliedJobIds(new Set(res.data.applications.map(a => a.job?._id).filter(Boolean))))
            .catch(() => { /* badge only */ });
    }, [user]);
    // Filter jobs by search query — title or requirements
    const filtered = jobs.filter(job => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            job.title.toLowerCase().includes(q) ||
            job.location?.toLowerCase().includes(q) ||
            job.requirements?.some(r => r.toLowerCase().includes(q))
        );
    });
    // Apply button logic based on user role
    const handleApply = (jobId) => {
        if (!user) { navigate('/login'); return; }
        if (user.role === 'recruiter') return;
        if (appliedJobIds.has(jobId)) { navigate('/dashboard'); return; }
        navigate(`/apply/${jobId}`);
    };
    // Apply button label + style per user state
    const applyBtnConfig = (jobId) => {
        if (!user) return { label: 'Sign in to Apply', style: { background: 'var(--accent)', color: 'white' } };
        if (appliedJobIds.has(jobId)) return { label: '✓ Applied · View', style: { background: 'rgba(16,185,129,0.12)', color: 'var(--green-text)', border: '1px solid rgba(16,185,129,0.3)' } };
        if (user.role === 'recruiter') return { label: 'Recruiter Account', style: { background: 'var(--tint-04)', color: 'var(--text-muted)', cursor: 'not-allowed', border: '1px solid var(--border)' } };
        return { label: 'Apply Now →', style: { background: 'var(--accent)', color: 'white' } };
    };
    // How long ago the job was posted
    const [now] = useState(() => Date.now());
    const timeAgo = (date) => {
        const days = Math.floor((now - new Date(date)) / 86400000);
        if (days === 0) return 'Today';
        if (days === 1) return '1 day ago';
        if (days < 30) return `${days} days ago`;
        return `${Math.floor(days / 30)}mo ago`;
    };
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            {/* ── Hero section ── */}
            <div style={{
                background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 65%)',
                borderBottom: '1px solid var(--border)',
                padding: isMobile ? '2.5rem 1rem 2rem' : '4rem 1.5rem 3rem',
                textAlign: 'center',
            }}>
                <div className="fade-up">
                    {/* Live badge */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '999px', padding: '4px 12px', marginBottom: '1.5rem' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                        <span style={{ fontSize: '12px', color: 'var(--green-text)', fontWeight: 500 }}>{jobs.length} open positions</span>
                    </div>
                    <h1 className="font-display" style={{ fontSize: 'clamp(28px,5vw,48px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.15 }}>
                        Find your next<br />
                        <span style={{ background: 'linear-gradient(135deg,#6366f1,var(--purple-text))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>dream role</span>
                    </h1>
                    <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
                        AI-powered hiring — get scored instantly when you apply
                    </p>
                    {/* Tabs — HireAI's own postings vs live openings from other sites */}
                    <div style={{ display: 'inline-flex', gap: '4px', padding: '4px', borderRadius: '12px', background: 'var(--tint-04)', border: '1px solid var(--border)', marginBottom: tab === 'hireai' ? '1.5rem' : 0 }}>
                        <button type="button" style={tabStyle(tab === 'hireai')} onClick={() => switchTab('hireai')}>
                            ✦ HireAI Jobs
                            <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '999px', background: tab === 'hireai' ? 'rgba(255,255,255,0.2)' : 'var(--tint-08)' }}>{jobs.length}</span>
                        </button>
                        <button type="button" style={tabStyle(tab === 'live')} onClick={() => switchTab('live')}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                            Live Jobs
                        </button>
                    </div>
                    {/* Search bar */}
                    {tab === 'hireai' && <div style={{ maxWidth: '500px', margin: '0 auto', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '16px', pointerEvents: 'none' }}>🔍</div>
                        <input
                            className="input-dark"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by title, skill or location..."
                            style={{ paddingLeft: '40px', fontSize: '14px', borderRadius: '12px' }}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} style={{
                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px',
                            }}>✕</button>
                        )}
                    </div>}
                </div>
            </div>
            {tab === 'live' && <LiveJobs />}
            {/* ── Main content ── */}
            {tab === 'hireai' && <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
                    {[
                        { label: 'Total Jobs', value: jobs.length, icon: '💼', color: '#6366f1' },
                        { label: 'Open Positions', value: jobs.filter(j => j.status === 'open').length, icon: '✅', color: '#10b981' },
                        { label: 'AI-Powered', value: '100%', icon: '✦', color: 'var(--purple-text)' },
                    ].map(s => (
                        <div key={s.label} className="stat-card" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{s.icon}</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: s.color, fontFamily: 'Syne,sans-serif', lineHeight: 1 }}>{s.value}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
                {/* Results header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                            {search ? `${filtered.length} results for "${search}"` : 'All Open Positions'}
                        </h2>
                        {search && filtered.length === 0 && (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Try a different keyword</p>
                        )}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Sorted by newest first
                    </span>
                </div>
                {/* Loading spinner */}
                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
                        <div style={{ width: '36px', height: '36px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                    </div>
                )}
                {/* No results */}
                {!loading && filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--tint-08)', borderRadius: '16px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>{search ? '🔍' : '📭'}</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            {search ? `No jobs found for "${search}"` : 'No open positions right now'}
                        </p>
                        {search && <button onClick={() => setSearch('')} style={{ marginTop: '12px', background: 'none', border: 'none', color: 'var(--accent)', fontSize: '13px', cursor: 'pointer' }}>Clear search</button>}
                    </div>
                )}
                {/* Job cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filtered.map((job, i) => {
                        const btn = applyBtnConfig(job._id);
                        return (
                            <div key={job._id} className="glass" style={{
                                borderRadius: '16px', padding: '1.5rem',
                                animation: `fadeUp .35s ease ${i * 0.06}s both`,
                                transition: 'border-color .2s, transform .2s',
                            }}>
                                {/* Card header */}
                                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '12px' }}>
                                    <div style={{ flex: 1 }}>
                                        {/* Company avatar + title */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                                                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '16px', fontWeight: 700, color: 'var(--indigo-text)', fontFamily: 'Syne,sans-serif',
                                            }}>
                                                {job.title?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif' }}>
                                                    {job.title}
                                                </h3>
                                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                    {job.recruiter?.name || 'Company'}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Meta info */}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                                            {job.location && (
                                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    📍 {job.location}
                                                </span>
                                            )}
                                            {job.salary && (
                                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    💰 {job.salary}
                                                </span>
                                            )}
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                🕐 {timeAgo(job.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Status badge */}
                                    <span style={{
                                        fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', flexShrink: 0,
                                        background: 'rgba(16,185,129,0.12)', color: 'var(--green-text)', border: '1px solid rgba(16,185,129,0.25)',
                                    }}>{job.status}</span>
                                </div>
                                {/* Description preview */}
                                {job.description && (
                                    <p style={{
                                        fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px',
                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                    }}>
                                        {job.description}
                                    </p>
                                )}
                                {/* Requirement tags */}
                                {job.requirements?.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                                        {job.requirements.slice(0, 6).map((req, i) => (
                                            <span key={i} style={{
                                                fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '6px',
                                                background: 'rgba(99,102,241,0.1)', color: 'var(--indigo-text)', border: '1px solid rgba(99,102,241,0.2)',
                                            }}>{req}</span>
                                        ))}
                                        {job.requirements.length > 6 && (
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '3px 6px' }}>
                                                +{job.requirements.length - 6} more
                                            </span>
                                        )}
                                    </div>
                                )}
                                {/* Footer — apply button */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            Posted by {job.recruiter?.name || 'Recruiter'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleApply(job._id)}
                                        disabled={user?.role === 'recruiter'}
                                        style={{
                                            ...btn.style,
                                            border: btn.style.border || 'none',
                                            borderRadius: '10px', padding: '9px 20px',
                                            fontSize: '13px', fontWeight: 500, cursor: user?.role === 'recruiter' ? 'not-allowed' : 'pointer',
                                            transition: 'all .2s', fontFamily: 'DM Sans,sans-serif',
                                            boxShadow: user?.role !== 'recruiter' && !appliedJobIds.has(job._id) ? '0 0 14px rgba(99,102,241,0.25)' : 'none',
                                        }}
                                    >
                                        {btn.label}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* Bottom CTA for non-logged-in users */}
                {!user && jobs.length > 0 && (
                    <div style={{
                        marginTop: '2.5rem', textAlign: 'center', padding: '2.5rem',
                        background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 70%)',
                        border: '1px solid rgba(99,102,241,0.15)', borderRadius: '20px',
                    }}>
                        <h3 className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                            Ready to apply?
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Create an account to apply and get your AI fit score instantly
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button onClick={() => navigate('/register')} style={{
                                background: 'var(--accent)', color: 'white', border: 'none',
                                borderRadius: '10px', padding: '10px 24px', fontSize: '14px',
                                fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
                                boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                            }}>Create Account</button>
                            <button onClick={() => navigate('/login')} style={{
                                background: 'var(--tint-04)', color: 'var(--text-secondary)',
                                border: '1px solid var(--border)', borderRadius: '10px',
                                padding: '10px 24px', fontSize: '14px', fontWeight: 500,
                                cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
                            }}>Sign In</button>
                        </div>
                    </div>
                )}
            </div>}
        </div>
    );
};
export default JobsPage;
