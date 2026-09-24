import { useToast } from '../components/Toast';
import Spinner from '../components/Spinner';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import useIsMobile from '../hooks/useIsMobile';
// ─── Page shell ──────────────────────────────────────────
const DashboardPage = () => {
    const { user } = useAuth();
    return (
        <div className="fade-up" style={{
            maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem',
        }}>
            {/* Page header */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 className="font-display" style={{
                    fontSize: '28px', fontWeight: 700,
                    color: 'var(--text-primary)', marginBottom: '6px',
                }}>
                    Welcome back, {user?.name} 👋
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {user?.role === 'recruiter'
                        ? 'Manage your job postings and review AI-scored applicants'
                        : 'Track your applications and explore new opportunities'}
                </p>
            </div>
            {user?.role === 'recruiter' ? <RecruiterDashboard /> : <CandidateDashboard />}
        </div>
    );
};

const RecruiterDashboard = () => {
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [formData, setFormData] = useState({
        title: '', description: '', requirements: '', location: '', salary: '',
    });
    const fetchJobs = useCallback(() => (
        api.get('/jobs/my')
            .then(res => setJobs(res.data.jobs))
            .catch(err => {
                console.error(err);
                showToast('Failed to load your jobs', 'error');
            })
            .finally(() => setLoading(false))
    ), [showToast]);
    useEffect(() => { fetchJobs(); }, [fetchJobs]);
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setFormError('');
    };
    const handlePostJob = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                requirements: formData.requirements.split(',').map(r => r.trim()).filter(r => r),
            };
            await api.post('/jobs', payload);
            setFormData({ title: '', description: '', requirements: '', location: '', salary: '' });
            setShowForm(false);
            fetchJobs();
            showToast('Job posted successfully!', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to post job', 'error');
        } finally { setSubmitting(false); }
    };
    const handleDelete = async (jobId) => {
        if (!window.confirm('Delete this job posting?')) return;
        try {
            await api.delete(`/jobs/${jobId}`);
            setJobs(jobs.filter(j => j._id !== jobId));
            showToast('Job deleted', 'success');
        } catch {
            showToast('Failed to delete job', 'error');
        }
    };
    if (loading) return <Spinner text="Loading jobs..." />;
    return (
        <div>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Job Postings', value: jobs.length, color: '#6366f1' },
                ].map(stat => (
                    <div key={stat.label} className="stat-card">
                        <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color, fontFamily: 'Syne,sans-serif', lineHeight: 1 }}>
                            {stat.value}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Your Job Postings
                </h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        background: showForm ? 'var(--tint-05)' : 'var(--accent)',
                        color: showForm ? 'var(--text-secondary)' : 'white',
                        border: showForm ? '1px solid var(--border)' : 'none',
                        borderRadius: '10px', padding: '9px 18px', fontSize: '13px',
                        fontWeight: 500, cursor: 'pointer', transition: 'all .2s',
                        fontFamily: 'DM Sans,sans-serif',
                    }}
                >
                    {showForm ? '✕ Cancel' : '+ Post New Job'}
                </button>
            </div>
            {/* Post job form */}
            {showForm && (
                <div className="glass fade-up" style={{ borderRadius: '16px', padding: '1.75rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
                        Post a New Job
                    </h3>
                    {formError && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--red-text-soft)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '1rem' }}>
                            {formError}
                        </div>
                    )}
                    <form onSubmit={handlePostJob} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Job Title *</label>
                                <input className="input-dark" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Frontend Developer" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Location</label>
                                <input className="input-dark" name="location" value={formData.location} onChange={handleChange} placeholder="Bangalore / Remote" />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Description *</label>
                            <textarea className="input-dark" name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Describe the role and responsibilities..." style={{ resize: 'none' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Requirements</label>
                                <input className="input-dark" name="requirements" value={formData.requirements} onChange={handleChange} placeholder="React, Node.js, MongoDB" />
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Comma separated</p>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>Salary</label>
                                <input className="input-dark" name="salary" value={formData.salary} onChange={handleChange} placeholder="e.g. 8–12 LPA" />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" disabled={submitting} style={{
                                background: 'var(--accent)', color: 'white', border: 'none',
                                borderRadius: '10px', padding: '10px 24px', fontSize: '13px',
                                fontWeight: 500, cursor: 'pointer', opacity: submitting ? .6 : 1,
                                transition: 'all .2s', fontFamily: 'DM Sans,sans-serif',
                                boxShadow: submitting ? 'none' : '0 0 16px rgba(99,102,241,0.3)',
                            }}>
                                {submitting ? 'Posting...' : 'Post Job →'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {/* Empty state */}
            {jobs.length === 0 && !showForm && (
                <div style={{
                    textAlign: 'center', padding: '4rem 2rem',
                    background: 'var(--bg-card)', border: '1px dashed var(--tint-08)',
                    borderRadius: '16px',
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>No jobs posted yet</p>
                    <button onClick={() => setShowForm(true)} style={{
                        background: 'none', border: 'none', color: 'var(--accent)',
                        fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    }}>Post your first job →</button>
                </div>
            )}
            {/* Job cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {jobs.map((job, i) => (
                    <div key={job._id} className="glass" style={{
                        borderRadius: '16px', padding: '1.5rem',
                        animation: `fadeUp .35s ease ${i * 0.05}s both`,
                        transition: 'border-color .2s',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif', marginBottom: '4px' }}>
                                    {job.title}
                                </h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    {job.location || 'Remote'} · {job.salary || 'Salary not disclosed'}
                                </p>
                            </div>
                        </div>
                        {/* Requirement tags */}
                        {job.requirements?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                                {job.requirements.map((req, i) => (
                                    <span key={i} style={{
                                        fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '6px',
                                        background: 'rgba(99,102,241,0.12)',
                                        color: 'var(--indigo-text)',
                                        border: '1px solid rgba(99,102,241,0.2)',
                                    }}>{req}</span>
                                ))}
                            </div>
                        )}
                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                            <button onClick={() => navigate(`/jobs/${job._id}`)} style={{
                                background: 'none', border: 'none', color: 'var(--accent)',
                                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                                fontFamily: 'DM Sans,sans-serif', padding: 0,
                            }}>View Applicants →</button>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                            <button className="btn-danger" onClick={() => handleDelete(job._id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Status of a live-job application — set by the candidate, since the other site doesn't report back
const EXTERNAL_STATUS = {
    applied: { label: 'Applied', bg: 'rgba(99,102,241,0.12)', color: 'var(--indigo-text)', border: 'rgba(99,102,241,0.25)' },
    interviewing: { label: 'Interviewing', bg: 'rgba(245,158,11,0.12)', color: 'var(--amber-text)', border: 'rgba(245,158,11,0.25)' },
    offer: { label: 'Offer 🎉', bg: 'rgba(16,185,129,0.12)', color: 'var(--green-text)', border: 'rgba(16,185,129,0.25)' },
    rejected: { label: 'Rejected', bg: 'rgba(239,68,68,0.1)', color: 'var(--red-text)', border: 'rgba(239,68,68,0.2)' },
};
// Recruiter's decision on a HireAI application (legacy values fall back to Under Review)
const HIREAI_STATUS = {
    applied: { label: 'Under Review', bg: 'rgba(99,102,241,0.12)', color: 'var(--indigo-text)', border: 'rgba(99,102,241,0.2)' },
    interview: { label: 'Interview 📅', bg: 'rgba(245,158,11,0.12)', color: 'var(--amber-text)', border: 'rgba(245,158,11,0.25)' },
    selected: { label: 'Selected 🎉', bg: 'rgba(16,185,129,0.12)', color: 'var(--green-text)', border: 'rgba(16,185,129,0.25)' },
    rejected: { label: 'Rejected', bg: 'rgba(239,68,68,0.1)', color: 'var(--red-text)', border: 'rgba(239,68,68,0.2)' },
};
const APP_FILTERS = ['All', 'HireAI', 'Other sites'];
const CandidateDashboard = () => {
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [applications, setApplications] = useState([]);
    const [external, setExternal] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    useEffect(() => {
        // Load both lists together; one failing shouldn't hide the other
        Promise.allSettled([api.get('/applications/my'), api.get('/external-applications/my')])
            .then(([own, ext]) => {
                if (own.status === 'fulfilled') setApplications(own.value.data.applications);
                if (ext.status === 'fulfilled') setExternal(ext.value.data.applications);
                if (own.status === 'rejected' || ext.status === 'rejected') showToast('Some applications could not be loaded', 'error');
            })
            .finally(() => setLoading(false));
    }, [showToast]);
    const updateStatus = async (id, status) => {
        const before = external;
        setExternal(list => list.map(a => (a._id === id ? { ...a, status } : a)));
        try {
            await api.patch(`/external-applications/${id}`, { status });
        } catch {
            setExternal(before);
            showToast('Could not update status', 'error');
        }
    };
    const removeExternal = async (id) => {
        if (!window.confirm('Remove this application from your dashboard?')) return;
        try {
            await api.delete(`/external-applications/${id}`);
            setExternal(list => list.filter(a => a._id !== id));
            showToast('Removed from dashboard', 'success');
        } catch {
            showToast('Could not remove application', 'error');
        }
    };
    // Verdict badge styling
    const verdictConfig = {
        shortlist: { bg: 'rgba(16,185,129,0.12)', color: 'var(--green-text)', border: 'rgba(16,185,129,0.25)', label: 'Shortlisted ✓' },
        maybe: { bg: 'rgba(245,158,11,0.12)', color: 'var(--amber-text)', border: 'rgba(245,158,11,0.25)', label: 'Under Review' },
        reject: { bg: 'rgba(239,68,68,0.1)', color: 'var(--red-text)', border: 'rgba(239,68,68,0.2)', label: 'Not Selected' },
    };
    if (loading) return <Spinner text="Loading your applications..." />;
    // One timeline, newest first, across both kinds of application
    const combined = [
        ...(filter !== 'Other sites' ? applications.map(a => ({ kind: 'hireai', date: a.createdAt, data: a })) : []),
        ...(filter !== 'HireAI' ? external.map(a => ({ kind: 'external', date: a.createdAt, data: a })) : []),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    const scored = applications.filter(a => a.aiScore != null);
    const total = applications.length + external.length;
    return (
        <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Applied', value: total, color: '#6366f1' },
                    { label: 'On Other Sites', value: external.length, color: 'var(--purple-text)' },
                    { label: 'HireAI Shortlisted', value: applications.filter(a => a.aiVerdict === 'shortlist').length, color: '#10b981' },
                    { label: 'Avg AI Score', value: scored.length ? Math.round(scored.reduce((s, a) => s + a.aiScore, 0) / scored.length) + '%' : '—', color: '#f59e0b' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, fontFamily: 'Syne,sans-serif', lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>{s.label}</div>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Your Applications</h2>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {APP_FILTERS.map(f => (
                            <button key={f} type="button" onClick={() => setFilter(f)} style={{
                                fontSize: '11px', fontWeight: 500, padding: '4px 10px', borderRadius: '999px', cursor: 'pointer',
                                fontFamily: 'DM Sans,sans-serif',
                                background: filter === f ? 'rgba(99,102,241,0.15)' : 'var(--tint-04)',
                                color: filter === f ? 'var(--indigo-text)' : 'var(--text-secondary)',
                                border: filter === f ? '1px solid var(--accent)' : '1px solid var(--border)',
                            }}>{f}</button>
                        ))}
                    </div>
                </div>
                <button onClick={() => navigate('/jobs')} style={{
                    background: 'var(--accent)', color: 'white', border: 'none',
                    borderRadius: '10px', padding: '9px 18px', fontSize: '13px',
                    fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
                }}>Browse Jobs</button>
            </div>
            {/* Empty */}
            {combined.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--tint-08)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚀</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
                        {filter === 'Other sites' ? 'No live-job applications yet' : filter === 'HireAI' ? 'No HireAI applications yet' : 'No applications yet'}
                    </p>
                    <button onClick={() => navigate(filter === 'Other sites' ? '/jobs?tab=live' : '/jobs')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
                        {filter === 'Other sites' ? 'Browse live jobs →' : 'Browse open jobs →'}
                    </button>
                </div>
            )}
            {/* Application cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {combined.map((item, i) => {
                    const app = item.data;
                    const sourceBadge = (text, isExternal) => (
                        <span style={{
                            fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', letterSpacing: '.03em',
                            background: isExternal ? 'rgba(139,92,246,0.12)' : 'rgba(99,102,241,0.12)',
                            color: isExternal ? 'var(--purple-text)' : 'var(--indigo-text)',
                            border: `1px solid ${isExternal ? 'rgba(139,92,246,0.25)' : 'rgba(99,102,241,0.2)'}`,
                        }}>{text}</span>
                    );
                    if (item.kind === 'external') {
                        const st = EXTERNAL_STATUS[app.status] || EXTERNAL_STATUS.applied;
                        return (
                            <div key={`ext-${app._id}`} className="glass" style={{ borderRadius: '16px', padding: '1.5rem', animation: `fadeUp .35s ease ${Math.min(i, 10) * 0.05}s both` }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ marginBottom: '6px' }}>{sourceBadge(`🌐 ${app.publisher || 'Other site'}`, true)}</div>
                                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif', marginBottom: '4px' }}>{app.title}</h3>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {[app.company, app.location].filter(Boolean).join(' · ')}{(app.company || app.location) ? ' · ' : ''}Applied {new Date(app.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', flexShrink: 0, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                                        {st.label}
                                    </span>
                                </div>
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        Status
                                        <select value={app.status} onChange={e => updateStatus(app._id, e.target.value)} className="input-dark"
                                            style={{ width: 'auto', padding: '5px 10px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer' }}>
                                            {Object.entries(EXTERNAL_STATUS).map(([value, cfg]) => (
                                                <option key={value} value={value}>{cfg.label}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <a href={app.applyLink} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '12px' }}>
                                            View posting ↗
                                        </a>
                                        <button type="button" className="btn-danger" onClick={() => removeExternal(app._id)}>Remove</button>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    const vc = verdictConfig[app.aiVerdict] || { bg: 'var(--tint-05)', color: 'var(--text-muted)', border: 'var(--border)', label: 'Pending' };
                    return (
                        <div key={app._id} className="glass" style={{ borderRadius: '16px', padding: '1.5rem', animation: `fadeUp .35s ease ${Math.min(i, 10) * 0.05}s both` }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                <div>
                                    <div style={{ marginBottom: '6px' }}>{sourceBadge('✦ HireAI', false)}</div>
                                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif', marginBottom: '4px' }}>
                                        {app.job?.title || 'Job no longer available'}
                                    </h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        {app.job?.location ? `${app.job.location} · ` : ''}Applied {new Date(app.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                {/* Score + verdict */}
                                <div style={{ textAlign: 'right' }}>
                                    {app.aiScore != null ? (
                                        <>
                                            <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif', lineHeight: 1, marginBottom: '6px' }}>
                                                {app.aiScore}<span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
                                            </div>
                                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: vc.bg, color: vc.color, border: `1px solid ${vc.border}` }}>
                                                {vc.label}
                                            </span>
                                        </>
                                    ) : (
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Score pending</span>
                                    )}
                                </div>
                            </div>
                            {/* Status bar */}
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                {(() => {
                                    const hs = HIREAI_STATUS[app.status] || HIREAI_STATUS.applied;
                                    return (
                                        <span style={{ fontSize: '12px', fontWeight: 500, padding: '3px 10px', borderRadius: '999px', background: hs.bg, color: hs.color, border: `1px solid ${hs.border}` }}>
                                            {hs.label}
                                        </span>
                                    );
                                })()}
                                {app.aiScore != null && (
                                    <div style={{ flex: 1, margin: '0 12px', height: '3px', background: 'var(--tint-05)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${app.aiScore}%`, background: `linear-gradient(90deg, ${vc.color}, var(--accent))`, borderRadius: '2px' }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
export default DashboardPage;