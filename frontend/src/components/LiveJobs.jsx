import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import useIsMobile from '../hooks/useIsMobile';
import Spinner from './Spinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { Link } from 'react-router-dom';
// Chip label → JSearch employment_types value (null = any)
const TYPES = { All: null, Internship: 'INTERN', 'Full-time': 'FULLTIME', 'Part-time': 'PARTTIME', Contract: 'CONTRACTOR' };
const DATES = { 'Any time': 'all', Today: 'today', '3 days': '3days', 'This week': 'week', 'This month': 'month' };
const TYPE_LABEL = { INTERN: 'Internship', FULLTIME: 'Full-time', PARTTIME: 'Part-time', CONTRACTOR: 'Contract' };
const timeAgo = (iso, now) => {
    if (!iso) return null;
    const hours = Math.floor((now - new Date(iso)) / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    return `${Math.floor(days / 30)}mo ago`;
};
const formatSalary = (s) => {
    if (!s) return null;
    if (s.text) return s.text;
    const fmt = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${Math.round(n / 1000)}k` : n);
    const range = s.min && s.max ? `${fmt(s.min)}–${fmt(s.max)}` : fmt(s.min || s.max);
    return `${s.currency || ''} ${range}${s.period ? ` / ${s.period.toLowerCase()}` : ''}`.trim();
};
const chip = (active) => ({
    fontSize: '12px', fontWeight: 500, padding: '5px 12px', borderRadius: '999px', cursor: 'pointer',
    fontFamily: 'DM Sans,sans-serif', whiteSpace: 'nowrap', transition: 'all .2s',
    background: active ? 'rgba(99,102,241,0.15)' : 'var(--tint-04)',
    color: active ? 'var(--indigo-text)' : 'var(--text-secondary)',
    border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
});
// Live openings from other sites (via the backend's JSearch proxy) — shown as a tab on Browse Jobs
const LiveJobs = () => {
    const isMobile = useIsMobile();
    const [now] = useState(() => Date.now());
    // Draft inputs vs the submitted search — only a submitted search costs an API call
    const [queryInput, setQueryInput] = useState('');
    const [locationInput, setLocationInput] = useState('India');
    const [search, setSearch] = useState({ query: 'software developer', location: 'India' });
    const [type, setType] = useState('All');
    const [datePosted, setDatePosted] = useState('Any time');
    const [remote, setRemote] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [fetchedAt, setFetchedAt] = useState(null);
    const { user } = useAuth();
    const { showToast } = useToast();
    const isCandidate = user?.role === 'candidate';
    // externalJobId → true for jobs this candidate already applied to
    const [applied, setApplied] = useState({});
    useEffect(() => {
        if (!isCandidate) return;
        api.get('/external-applications/my')
            .then(res => setApplied(Object.fromEntries(res.data.applications.map(a => [a.externalJobId, true]))))
            .catch(() => { /* badge only — the list still works without it */ });
    }, [isCandidate]);
    // The link opens the job site as normal; for candidates we also record it for the dashboard
    const trackApply = (job) => {
        if (!isCandidate || applied[job.id]) return;
        setApplied(prev => ({ ...prev, [job.id]: true }));
        api.post('/external-applications', {
            externalJobId: job.id, title: job.title, company: job.company, logo: job.logo,
            location: job.location, publisher: job.publisher, employmentType: job.employmentType,
            applyLink: job.applyLink,
        })
            .then(() => showToast('Added to your dashboard', 'success'))
            .catch(() => {
                setApplied(prev => ({ ...prev, [job.id]: false }));
                showToast('Could not save this application to your dashboard', 'error');
            });
    };
    // cursor = null → first page; otherwise the token the previous response handed back
    const fetchJobs = useCallback((cursor) => {
        const params = { query: search.query, location: search.location, datePosted: DATES[datePosted] };
        if (cursor) params.cursor = cursor;
        if (TYPES[type]) params.type = TYPES[type];
        if (remote) params.remote = 'true';
        return api.get('/external-jobs', { params })
            .then(res => {
                setJobs(prev => {
                    if (!cursor) return res.data.jobs;
                    const seen = new Set(prev.map(j => j.id));
                    // Pages can overlap — skip jobs already on screen
                    return [...prev, ...res.data.jobs.filter(j => !seen.has(j.id))];
                });
                setHasMore(res.data.hasMore);
                setNextCursor(res.data.nextCursor);
                setFetchedAt(res.data.fetchedAt);
                setError('');
            })
            .catch(err => setError(err.response?.data?.message || 'Could not load live jobs'))
            .finally(() => { setLoading(false); setLoadingMore(false); });
    }, [search, type, datePosted, remote]);
    // Re-run from the first page whenever the search or a filter changes
    useEffect(() => { fetchJobs(null); }, [fetchJobs]);
    const handleSearch = (e) => {
        e.preventDefault();
        setLoading(true);
        setSearch({ query: queryInput.trim() || 'software developer', location: locationInput.trim() });
    };
    const changeFilter = (setter, value) => { setLoading(true); setter(value); };
    const loadMore = () => { setLoadingMore(true); fetchJobs(nextCursor); };
    return (
        <div>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem 3rem' }}>
                {/* ── Search — each submit is one API call, so it doesn't run while typing ── */}
                <form onSubmit={handleSearch} style={{ display: 'flex', marginBottom: '1.25rem', flexDirection: isMobile ? 'column' : 'row', gap: '10px' }}>
                    <input className="input-dark" value={queryInput} onChange={e => setQueryInput(e.target.value)}
                        placeholder="🔍  Role or skill — e.g. React intern" style={{ flex: 2, borderRadius: '12px' }} />
                    <input className="input-dark" value={locationInput} onChange={e => setLocationInput(e.target.value)}
                        placeholder="📍  City or country" style={{ flex: 1, borderRadius: '12px' }} />
                    <button type="submit" className="btn-accent" style={{ width: isMobile ? '100%' : 'auto', padding: '11px 24px', borderRadius: '12px' }}>
                        Search
                    </button>
                </form>
                {!user && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                        <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>Sign in</Link> as a candidate to keep track of the jobs you apply to in your dashboard.
                    </p>
                )}
                {/* ── Filters ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.75rem' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {Object.keys(TYPES).map(t => (
                            <button key={t} type="button" style={chip(type === t)} onClick={() => changeFilter(setType, t)}>{t}</button>
                        ))}
                        <button type="button" style={chip(remote)} onClick={() => changeFilter(setRemote, !remote)}>🏠 Remote only</button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {Object.keys(DATES).map(d => (
                            <button key={d} type="button" style={chip(datePosted === d)} onClick={() => changeFilter(setDatePosted, d)}>{d}</button>
                        ))}
                    </div>
                </div>
                {/* ── Results header ── */}
                {!loading && !error && (
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {jobs.length} {jobs.length === 1 ? 'opening' : 'openings'} for "{search.query}"{search.location ? ` in ${search.location}` : ''}
                        </h2>
                        {fetchedAt && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Updated {new Date(fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                )}
                {loading && <Spinner text="Fetching live openings..." />}
                {!loading && error && (
                    <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '16px' }}>
                        <div style={{ fontSize: '28px', marginBottom: '10px' }}>⚠️</div>
                        <p style={{ color: 'var(--red-text)', fontSize: '14px', marginBottom: '14px' }}>{error}</p>
                        <button type="button" className="btn-ghost" onClick={() => { setLoading(true); fetchJobs(null); }}>Try again</button>
                    </div>
                )}
                {!loading && !error && jobs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--tint-08)', borderRadius: '16px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No openings match these filters. Try a broader search.</p>
                    </div>
                )}
                {/* ── Job cards ── */}
                {!loading && !error && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {jobs.map((job, i) => {
                            const salary = formatSalary(job.salary);
                            const posted = timeAgo(job.postedAt, now);
                            return (
                                <div key={job.id} className="glass" style={{ borderRadius: '16px', padding: '1.5rem', animation: `fadeUp .35s ease ${Math.min(i, 10) * 0.05}s both` }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        {/* Company logo, or its initial when there isn't one */}
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0, overflow: 'hidden',
                                            background: job.logo ? '#fff' : 'rgba(99,102,241,0.15)', border: '1px solid var(--border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '17px', fontWeight: 700, color: 'var(--indigo-text)', fontFamily: 'Syne,sans-serif',
                                        }}>
                                            {job.logo
                                                ? <img src={job.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                                                    onError={e => { e.currentTarget.style.display = 'none'; }} />
                                                : job.company?.[0]?.toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif', lineHeight: 1.3 }}>{job.title}</h3>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{job.company}</p>
                                        </div>
                                        {job.employmentType && (
                                            <span style={{
                                                fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', flexShrink: 0,
                                                ...(job.employmentType === 'INTERN'
                                                    ? { background: 'rgba(245,158,11,0.12)', color: 'var(--amber-text)', border: '1px solid rgba(245,158,11,0.25)' }
                                                    : { background: 'rgba(16,185,129,0.12)', color: 'var(--green-text)', border: '1px solid rgba(16,185,129,0.25)' }),
                                            }}>{TYPE_LABEL[job.employmentType] || job.employmentType}</span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '12px' }}>
                                        {job.location && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📍 {job.location}</span>}
                                        {job.isRemote && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>🏠 Remote</span>}
                                        {salary && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>💰 {salary}</span>}
                                        {posted && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🕐 {posted}</span>}
                                    </div>
                                    {job.description && (
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {job.description}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>via {job.publisher || 'external site'}</span>
                                        <a href={job.applyLink} target="_blank" rel="noopener noreferrer" onClick={() => trackApply(job)} style={{
                                            textDecoration: 'none', borderRadius: '10px', padding: '9px 20px',
                                            fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap',
                                            ...(applied[job.id]
                                                ? { background: 'rgba(16,185,129,0.12)', color: 'var(--green-text)', border: '1px solid rgba(16,185,129,0.3)' }
                                                : { background: 'var(--accent)', color: 'white', boxShadow: '0 0 14px rgba(99,102,241,0.25)' }),
                                        }}>{applied[job.id] ? '✓ Applied · Open ↗' : 'Apply ↗'}</a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {!loading && !error && hasMore && (
                    <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
                        <button type="button" className="btn-ghost" onClick={loadMore} disabled={loadingMore}>
                            {loadingMore ? 'Loading...' : 'Load more jobs'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
export default LiveJobs;
