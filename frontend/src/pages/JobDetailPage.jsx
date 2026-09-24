import { useToast } from '../components/Toast';
import Spinner from '../components/Spinner';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useIsMobile from '../hooks/useIsMobile';
// Verdict config — reused across cards
const VERDICT = {
    shortlist: { bg: 'rgba(16,185,129,0.12)', color: 'var(--green-text)', border: 'rgba(16,185,129,0.25)', label: 'Shortlisted', score: [80, 100] },
    maybe: { bg: 'rgba(245,158,11,0.12)', color: 'var(--amber-text)', border: 'rgba(245,158,11,0.25)', label: 'Under Review', score: [50, 79] },
    reject: { bg: 'rgba(239,68,68,0.1)', color: 'var(--red-text)', border: 'rgba(239,68,68,0.2)', label: 'Not Selected', score: [0, 49] },
};
// Filter chips → which aiVerdict each one shows (null = all)
// Saved while the AI was unavailable — no score yet
const NOT_SCORED = { bg: 'var(--tint-05)', color: 'var(--text-muted)', border: 'var(--border)', label: 'Not scored' };
// Recruiter's decision on an application — separate from the AI verdict
// (legacy 'reviewed' / 'shortlisted' values fall back to Under Review)
const APP_STATUS = {
    applied: { label: 'Under Review', bg: 'rgba(99,102,241,0.12)', color: 'var(--indigo-text)', border: 'rgba(99,102,241,0.25)' },
    interview: { label: 'Interview', bg: 'rgba(245,158,11,0.12)', color: 'var(--amber-text)', border: 'rgba(245,158,11,0.25)' },
    selected: { label: 'Selected', bg: 'rgba(16,185,129,0.12)', color: 'var(--green-text)', border: 'rgba(16,185,129,0.25)' },
    rejected: { label: 'Rejected', bg: 'rgba(239,68,68,0.1)', color: 'var(--red-text)', border: 'rgba(239,68,68,0.2)' },
};
const FILTERS = { All: null, Shortlisted: 'shortlist', Maybe: 'maybe', Rejected: 'reject' };
const JobDetailPage = () => {
    const isMobile = useIsMobile();
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [job, setJob] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [questions, setQuestions] = useState({});
    const [loadingQ, setLoadingQ] = useState({});
    const [filter, setFilter] = useState('All');
    const [rescoring, setRescoring] = useState({});
    const [topN, setTopN] = useState(3);
    const [topStatus, setTopStatus] = useState('selected');
    const [bulkBusy, setBulkBusy] = useState(false);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [jobRes, candRes] = await Promise.all([
                    api.get(`/jobs/${id}`),
                    api.get(`/applications/ranked?jobId=${id}&k=100`),
                ]);
                setJob(jobRes.data.job);
                setCandidates(candRes.data.topCandidates || []);
            } catch (err) {
                console.error(err);
                showToast('Failed to load job details', 'error');
            } finally { setLoading(false); }
        };
        fetchData();
    }, [id, showToast]);
    // Toggle expand/collapse a candidate card
    const toggleExpand = (appId) => {
        setExpanded(expanded === appId ? null : appId);
    };
    // Generate interview questions for a candidate
    const generateQuestions = async (appId) => {
        if (questions[appId]) return;
        setLoadingQ(prev => ({ ...prev, [appId]: true }));
        try {
            const res = await api.get(`/interview/${appId}`);
            setQuestions(prev => ({ ...prev, [appId]: res.data }));
        } catch (err) {
            console.error(err);
            showToast('Failed to generate interview questions', 'error');
        } finally {
            setLoadingQ(prev => ({ ...prev, [appId]: false }));
        }
    };
    // Re-run AI scoring for an application that was saved without a score
    const rescore = async (appId) => {
        setRescoring(prev => ({ ...prev, [appId]: true }));
        try {
            const res = await api.post(`/applications/${appId}/rescore`);
            const updated = res.data.application;
            // Put it back in score order, like the ranked list from the server
            setCandidates(prev => prev.map(c => (c._id === appId ? { ...c, ...updated, candidate: c.candidate } : c))
                .sort((a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1)));
            showToast(`Scored ${updated.aiScore}/100`, 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not score this application', 'error');
        } finally {
            setRescoring(prev => ({ ...prev, [appId]: false }));
        }
    };
    // Recruiter moves an application between under review / interview / selected / rejected
    const updateStatus = async (appId, status) => {
        const before = candidates;
        setCandidates(prev => prev.map(c => (c._id === appId ? { ...c, status } : c)));
        try {
            await api.patch(`/applications/${appId}/status`, { status });
            showToast(`Marked as ${APP_STATUS[status].label}`, 'success');
        } catch (err) {
            setCandidates(before);
            showToast(err.response?.data?.message || 'Could not update status', 'error');
        }
    };
    // Only scored applicants have a rank; candidates is already in heap (score) order
    const rankedCandidates = candidates.filter(c => c.aiScore != null);
    // Apply one status to the top N ranked candidates in a single request
    const updateTopN = async () => {
        const n = Math.min(Math.max(1, parseInt(topN) || 0), rankedCandidates.length);
        const label = APP_STATUS[topStatus].label;
        if (!window.confirm(`Mark the top ${n} ranked candidate${n === 1 ? '' : 's'} as ${label}?`)) return;
        const ids = rankedCandidates.slice(0, n).map(c => c._id);
        const before = candidates;
        setBulkBusy(true);
        setCandidates(prev => prev.map(c => (ids.includes(c._id) ? { ...c, status: topStatus } : c)));
        try {
            await api.patch('/applications/status', { jobId: id, applicationIds: ids, status: topStatus });
            showToast(`Top ${n} marked as ${label}`, 'success');
        } catch (err) {
            setCandidates(before);
            showToast(err.response?.data?.message || 'Could not update candidates', 'error');
        } finally {
            setBulkBusy(false);
        }
    };
    const visibleCandidates = FILTERS[filter]
        ? candidates.filter(c => c.aiVerdict === FILTERS[filter])
        : candidates;
    if (loading) return <Spinner text="Loading applicants..." />;
    return (
        <div className="fade-up" style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
            {/* Back button */}
            <button onClick={() => navigate('/dashboard')} style={{
                background: 'none', border: 'none', color: 'var(--text-secondary)',
                fontSize: '13px', cursor: 'pointer', marginBottom: '1.5rem',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontFamily: 'DM Sans,sans-serif', padding: 0,
            }}>
                ← Back to Dashboard
            </button>
            {/* Job header card */}
            <div className="glass" style={{ borderRadius: '16px', padding: '1.75rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Job Posting</p>
                        <h1 className="font-display" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                            {job?.title}
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {job?.location} · {job?.salary || 'Salary not disclosed'}
                        </p>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'Syne,sans-serif', lineHeight: 1 }}>
                            {candidates.length}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Total Applicants</div>
                    </div>
                </div>
                {/* Requirements */}
                {job?.requirements?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        {job.requirements.map((r, i) => (
                            <span key={i} style={{ fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '6px', background: 'rgba(99,102,241,0.12)', color: 'var(--indigo-text)', border: '1px solid rgba(99,102,241,0.2)' }}>{r}</span>
                        ))}
                    </div>
                )}
            </div>
            {/* Candidates header */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: '1.25rem', gap: isMobile ? '1rem' : '0' }}>

                <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>Ranked Applicants</h2>

                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {Object.keys(FILTERS).map(f => (
                        <button key={f} type="button" onClick={() => setFilter(f)} style={{
                            fontSize: '11px', fontWeight: 500, padding: '4px 10px',
                            borderRadius: '999px', cursor: 'pointer',
                            fontFamily: 'DM Sans,sans-serif',
                            background: filter === f ? 'rgba(99,102,241,0.15)' : 'var(--tint-04)',
                            color: filter === f ? 'var(--indigo-text)' : 'var(--text-secondary)',
                            border: filter === f ? '1px solid var(--accent)' : '1px solid var(--border)',
                        }}>{f}</button>
                    ))}
                </div>
            </div>
            {/* Bulk action: top N by rank */}
            {rankedCandidates.length > 0 && (
                <div className="glass" style={{
                    borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.25rem',
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 10px',
                    fontSize: '13px', color: 'var(--text-secondary)',
                }}>
                    <span>Mark top</span>
                    <input type="number" min={1} max={rankedCandidates.length} value={topN}
                        onChange={e => setTopN(e.target.value)} aria-label="Number of top candidates"
                        className="input-dark" style={{ width: '64px', padding: '5px 8px', fontSize: '13px', borderRadius: '8px' }} />
                    <span>of {rankedCandidates.length} ranked as</span>
                    <select value={topStatus} onChange={e => setTopStatus(e.target.value)} aria-label="Status for top candidates"
                        className="input-dark" style={{ width: 'auto', padding: '5px 10px', fontSize: '13px', borderRadius: '8px', cursor: 'pointer' }}>
                        {Object.entries(APP_STATUS).map(([value, cfg]) => (
                            <option key={value} value={value}>{cfg.label}</option>
                        ))}
                    </select>
                    <button type="button" onClick={updateTopN} disabled={bulkBusy || !(parseInt(topN) >= 1)} style={{
                        background: 'rgba(99,102,241,0.15)', border: '1px solid var(--accent)',
                        color: 'var(--indigo-text)', borderRadius: '8px', padding: '6px 14px',
                        fontSize: '13px', fontWeight: 600, fontFamily: 'DM Sans,sans-serif',
                        cursor: bulkBusy ? 'default' : 'pointer', opacity: bulkBusy ? 0.7 : 1,
                    }}>
                        {bulkBusy ? 'Updating…' : 'Apply'}
                    </button>
                </div>
            )}
            {/* Empty */}
            {candidates.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--tint-08)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No applications yet for this job</p>
                </div>
            )}
            {candidates.length > 0 && visibleCandidates.length === 0 && (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    No {filter.toLowerCase()} applicants
                </p>
            )}
            {/* Candidate cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {visibleCandidates.map((app) => {
                    const i = candidates.indexOf(app);
                    const vc = app.aiScore == null ? NOT_SCORED : (VERDICT[app.aiVerdict] || VERDICT.maybe);
                    const statusKey = APP_STATUS[app.status] ? app.status : 'applied';
                    const st = APP_STATUS[statusKey];
                    const isOpen = expanded === app._id;
                    const qData = questions[app._id];
                    const isLoadingQ = loadingQ[app._id];
                    return (
                        <div key={app._id} className="glass" style={{
                            borderRadius: '16px', overflow: 'hidden',
                            animation: `fadeUp .35s ease ${i * 0.06}s both`,
                            borderColor: isOpen ? 'rgba(99,102,241,0.3)' : 'var(--tint-08)',
                        }}>
                            {/* Card header */}
                            <div style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: isMobile ? '10px 12px' : '1.25rem' }}>
                                {/* Rank badge */}
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                                    background: i === 0 ? 'rgba(251,191,36,0.15)' : i === 1 ? 'rgba(156,163,175,0.1)' : i === 2 ? 'rgba(180,120,60,0.1)' : 'var(--tint-04)',
                                    border: `1px solid ${i === 0 ? 'rgba(251,191,36,0.3)' : i === 1 ? 'rgba(156,163,175,0.2)' : i === 2 ? 'rgba(180,120,60,0.2)' : 'var(--border)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '14px', fontWeight: 700, fontFamily: 'Syne,sans-serif',
                                    color: i === 0 ? 'var(--amber-text)' : i === 1 ? 'var(--silver-text)' : i === 2 ? 'var(--bronze-text)' : 'var(--text-muted)',
                                }}>
                                    #{i + 1}
                                </div>
                                {/* Avatar */}
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                                    background: `linear-gradient(135deg, ${vc.bg}, rgba(99,102,241,0.2))`,
                                    border: `1px solid ${vc.border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '15px', fontWeight: 700, fontFamily: 'Syne,sans-serif', color: vc.color,
                                }}>
                                    {app.candidate?.name?.[0]?.toUpperCase()}
                                </div>
                                {/* Name + email */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif', marginBottom: '2px' }}>
                                        {app.candidate?.name}
                                    </div>
                                    {!isMobile && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{app.candidate?.email}</div>}
                                </div>
                                {/* Score */}
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: vc.color, fontFamily: 'Syne,sans-serif', lineHeight: 1, marginBottom: '6px' }}>
                                        {app.aiScore ?? '—'}
                                        {app.aiScore != null && <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>}
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: vc.bg, color: vc.color, border: `1px solid ${vc.border}` }}>
                                        {vc.label}
                                    </span>
                                    {app.aiScore == null && (
                                        <button type="button" onClick={() => rescore(app._id)} disabled={rescoring[app._id]} style={{
                                            display: 'block', marginTop: '8px', marginLeft: 'auto',
                                            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                                            color: 'var(--indigo-text)', borderRadius: '8px', padding: '5px 10px',
                                            fontSize: '12px', fontWeight: 500, fontFamily: 'DM Sans,sans-serif',
                                            cursor: rescoring[app._id] ? 'default' : 'pointer', opacity: rescoring[app._id] ? 0.7 : 1,
                                        }}>
                                            {rescoring[app._id] ? '⏳ Scoring…' : '✦ Score now'}
                                        </button>
                                    )}
                                </div>
                                {/* Recruiter decision */}
                                <select value={statusKey} onChange={e => updateStatus(app._id, e.target.value)}
                                    aria-label="Application status" className="input-dark"
                                    style={{
                                        width: 'auto', flexShrink: 0, padding: '6px 10px', fontSize: '12px', fontWeight: 600,
                                        borderRadius: '8px', cursor: 'pointer',
                                        background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                                    }}>
                                    {Object.entries(APP_STATUS).map(([value, cfg]) => (
                                        <option key={value} value={value}>{cfg.label}</option>
                                    ))}
                                </select>
                                {/* Expand toggle */}
                                <button onClick={() => toggleExpand(app._id)} style={{
                                    background: 'var(--tint-04)', border: '1px solid var(--border)',
                                    borderRadius: '8px', width: '32px', height: '32px', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '14px',
                                    transition: 'all .2s', transform: isOpen ? 'rotate(180deg)' : 'none',
                                }}>▾</button>
                            </div>
                            {/* Score bar */}
                            {app.aiScore != null && (
                                <div style={{ height: '2px', background: 'var(--tint-04)', margin: '0 1.5rem' }}>
                                    <div style={{ height: '100%', width: `${app.aiScore}%`, background: `linear-gradient(90deg, ${vc.color}, var(--accent))`, borderRadius: '2px', transition: 'width 1s ease' }} />
                                </div>
                            )}
                            {/* Expanded section */}
                            {isOpen && (
                                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', animation: 'fadeUp .25s ease' }}>
                                    {/* Strengths + Weaknesses */}
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', padding: '1rem' }}>
                                            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--green-text)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '10px' }}>✓ Strengths</p>
                                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {app.aiStrengths?.map((s, i) => (
                                                    <li key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                                        <span style={{ color: 'var(--green-text)', flexShrink: 0, marginTop: '1px' }}>·</span> {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '1rem' }}>
                                            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--red-text)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '10px' }}>✗ Gaps</p>
                                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {app.aiWeaknesses?.map((w, i) => (
                                                    <li key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                                        <span style={{ color: 'var(--red-text)', flexShrink: 0, marginTop: '1px' }}>·</span> {w}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    {/* Interview questions button */}
                                    {!qData && (
                                        <button
                                            onClick={() => generateQuestions(app._id)}
                                            disabled={isLoadingQ}
                                            style={{
                                                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                                                color: 'var(--indigo-text)', borderRadius: '10px', padding: '10px 18px',
                                                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                                                transition: 'all .2s', fontFamily: 'DM Sans,sans-serif',
                                                opacity: isLoadingQ ? .6 : 1,
                                            }}
                                        >
                                            {isLoadingQ ? '⏳ Generating questions...' : '✦ Generate Interview Questions'}
                                        </button>
                                    )}
                                    {/* Interview questions output */}
                                    {qData && (
                                        <div style={{ marginTop: '1rem', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--indigo-text)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                                                    ✦ Interview Questions for {qData.candidate}
                                                </p>
                                                <button onClick={() => {
                                                    const text = qData.questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n');
                                                    navigator.clipboard.writeText(text);
                                                    showToast('Questions copied to clipboard!', 'success');
                                                }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                                                    Copy all
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {qData.questions?.map((q, qi) => (
                                                    <div key={qi} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0, marginTop: '1px', fontFamily: 'Syne,sans-serif' }}>Q{qi + 1}</span>
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '3px', lineHeight: 1.5 }}>{q.question}</p>
                                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: 'rgba(99,102,241,0.12)', color: 'var(--indigo-text)', border: '1px solid rgba(99,102,241,0.2)' }}>
                                                                    {q.type}
                                                                </span>
                                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>→ {q.targetedAt}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
export default JobDetailPage;