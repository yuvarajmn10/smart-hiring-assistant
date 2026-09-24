import { useToast } from '../components/Toast';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useIsMobile from '../hooks/useIsMobile';
const VERDICT_CONFIG = {
    shortlist: { bg: 'rgba(16,185,129,0.12)', color: 'var(--green-text)', border: 'rgba(16,185,129,0.25)', label: 'Shortlisted ✓', msg: 'Strong match — recruiter will likely review you.' },
    maybe: { bg: 'rgba(245,158,11,0.12)', color: 'var(--amber-text)', border: 'rgba(245,158,11,0.25)', label: 'Under Review', msg: 'Partial match — consider tailoring your resume.' },
    reject: { bg: 'rgba(239,68,68,0.1)', color: 'var(--red-text)', border: 'rgba(239,68,68,0.2)', label: 'Low Match', msg: 'Weak match for this role. Try other positions.' },
};
// Score ring, verdict and strengths/gaps — shared by "Review my resume" and the success screen
const FitAnalysis = ({ result, isMobile }) => {
    const vc = VERDICT_CONFIG[result.aiVerdict] || VERDICT_CONFIG.maybe;
    return (
        <>
            {/* Score card */}
            <div className="glass" style={{ borderRadius: '16px', padding: '2rem', marginBottom: '1rem', textAlign: 'center' }}>
                {/* Score ring */}
                <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.25rem' }}>
                    <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8" style={{ stroke: 'var(--tint-06)' }} />
                        <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8"
                            strokeDasharray={`${(result.aiScore / 100) * 314} 314`}
                            strokeLinecap="round"
                            style={{ stroke: vc.color, filter: `drop-shadow(0 0 6px ${vc.color})`, transition: 'stroke-dasharray 1s ease' }}
                        />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '28px', fontWeight: 800, color: vc.color, fontFamily: 'Syne,sans-serif', lineHeight: 1 }}>
                            {result.aiScore ?? '—'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 100</span>
                    </div>
                </div>
                {/* Verdict badge */}
                <span style={{ fontSize: '13px', fontWeight: 600, padding: '5px 16px', borderRadius: '999px', background: vc.bg, color: vc.color, border: `1px solid ${vc.border}`, display: 'inline-block', marginBottom: '10px' }}>
                    {vc.label}
                </span>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{vc.msg}</p>
            </div>
            {/* Strengths + Weaknesses */}
            {(result.aiStrengths?.length > 0 || result.aiWeaknesses?.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', padding: '1rem' }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--green-text)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '8px' }}>✓ Strengths</p>
                        {result.aiStrengths?.map((s, i) => (
                            <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--green-text)', flexShrink: 0 }}>·</span> {s}
                            </div>
                        ))}
                    </div>
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '1rem' }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--red-text)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '8px' }}>✗ Gaps</p>
                        {result.aiWeaknesses?.map((w, i) => (
                            <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--red-text)', flexShrink: 0 }}>·</span> {w}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};
const ApplyPage = () => {
    const isMobile = useIsMobile();
    const { id: jobId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const fileInputRef = useRef();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stage, setStage] = useState('form');
    // 'form' | 'processing' | 'success'
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [error, setError] = useState('');
    const [processingStep, setProcessingStep] = useState(0);
    const [result, setResult] = useState(null);
    // Saved resume from the Resume page — used by default so there's nothing to upload
    const [savedResume, setSavedResume] = useState(null);
    const [useSaved, setUseSaved] = useState(false);
    // "Review my resume" result (not saved anywhere until Submit)
    const [review, setReview] = useState(null);
    const [reviewing, setReviewing] = useState(false);
    const [writingLetter, setWritingLetter] = useState(false);
    // Text already extracted from the uploaded PDF, so Review then Submit parses it once
    const parsedRef = useRef({ file: null, text: '' });
    useEffect(() => {
        api.get('/profile/resume')
            .then(res => {
                if (res.data.resume) { setSavedResume(res.data.resume); setUseSaved(true); }
            })
            .catch(() => { /* no saved resume — the upload box still works */ });
    }, []);
    useEffect(() => {
        api.get(`/jobs/${jobId}`)
            .then(res => setJob(res.data.job))
            .catch(() => navigate('/jobs'))
            .finally(() => setLoading(false));
    }, [jobId, navigate]);

    // Drag and drop handlers
    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped?.type === 'application/pdf') {
            setFile(dropped); setError(''); setReview(null);
        } else {
            setError('Please upload a PDF file only.');
            showToast('Please select a PDF file.', 'error');
        }
    };
    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected?.type === 'application/pdf') {
            setFile(selected); setError(''); setReview(null);
        } else {
            setError('Please select a PDF file.');
            showToast('Please select a PDF file.', 'error');
        }
    };
    // Resume text for scoring: the saved resume, or the uploaded PDF (parsed once, then reused)
    const getResumeText = async () => {
        if (useSaved) return savedResume.resumeText;
        if (parsedRef.current.file === file) return parsedRef.current.text;
        const formData = new FormData();
        formData.append('resume', file);
        const parseRes = await api.post('/resume/parse', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        parsedRef.current = { file, text: parseRes.data.resumeText };
        return parseRes.data.resumeText;
    };
    // AI drafts a cover letter from the resume + this job; the candidate can edit it after
    const handleWriteLetter = async () => {
        if (!useSaved && !file) { setError('Choose or upload your resume first — the cover letter is written from it.'); return; }
        if (coverLetter.trim() && !window.confirm('Replace your current cover letter with an AI-written one?')) return;
        setError('');
        setWritingLetter(true);
        try {
            const resumeText = await getResumeText();
            const res = await api.post('/applications/cover-letter', { jobId, resumeText });
            setCoverLetter(res.data.coverLetter);
            showToast('Cover letter written — edit it as you like', 'success');
        } catch (err) {
            setError(err.response?.data?.message || 'Could not write a cover letter. Try again.');
        } finally { setWritingLetter(false); }
    };
    // Fit score only — nothing is submitted
    const handleReview = async () => {
        if (!useSaved && !file) { setError('Please upload your resume PDF.'); return; }
        setError('');
        setReviewing(true);
        try {
            const resumeText = await getResumeText();
            const res = await api.post('/applications/preview', { jobId, resumeText });
            setReview(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not review your resume. Try again.');
        } finally { setReviewing(false); }
    };
    // Main submit handler
    const handleSubmit = async () => {
        if (!useSaved && !file) { setError('Please upload your resume PDF.'); return; }
        setError('');
        setStage('processing');
        setProcessingStep(0);
        try {
            // Step 1 — Parse PDF (skipped when using the saved resume — its text is already stored)
            setProcessingStep(1);
            const resumeText = await getResumeText();
            // Step 2 — AI analysis (visual delay so user sees the step)
            setProcessingStep(2);
            await new Promise(r => setTimeout(r, 600));
            // Step 3 — Submit application
            setProcessingStep(3);
            const appRes = await api.post('/applications', {
                jobId,
                resumeText,
                coverLetter,
            });
            setResult(appRes.data.application);
            setStage('success');
            showToast('Application submitted successfully!', 'success');
        } catch (err) {
            setStage('form');
            setError(err.response?.data?.message || 'Submission failed. Try again.');
            showToast(err.response?.data?.message || 'Submission failed. Try again.', 'error');
        }
    };
    const pageWrap = {
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.1) 0%, transparent 55%), var(--bg-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem',
    };
    if (!job && loading) return null;
    // ── Stage: processing ────────────────────────────────
    if (stage === 'processing') {
        const steps = ['Uploading resume', 'Parsing PDF content', 'Running AI analysis', 'Submitting application'];
        return (
            <div style={pageWrap}>
                <div className="fade-up" style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}>
                    {/* Spinner */}
                    <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 2rem' }}>
                        <div style={{ width: '72px', height: '72px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>✦</div>
                    </div>
                    <h2 className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        Processing your application
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Our AI is reading your resume and computing your fit score
                    </p>
                    {/* Processing steps */}
                    <div className="glass" style={{ borderRadius: '14px', padding: '1.25rem', textAlign: 'left' }}>
                        {steps.map((step, i) => {
                            const done = processingStep > i + 1;
                            const active = processingStep === i + 1;
                            return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <div style={{
                                        width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '11px', fontWeight: 700,
                                        background: done ? 'rgba(16,185,129,0.15)' : active ? 'rgba(99,102,241,0.2)' : 'var(--tint-04)',
                                        border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : active ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                                        color: done ? 'var(--green-text)' : active ? 'var(--indigo-text)' : 'var(--text-muted)',
                                    }}>
                                        {done ? '✓' : i + 1}
                                    </div>
                                    <span style={{ fontSize: '13px', color: done ? 'var(--text-secondary)' : active ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: active ? 500 : 400 }}>
                                        {step}
                                        {active && <span style={{ color: 'var(--accent)', marginLeft: '6px' }}>...</span>}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
    // ── Stage: success ───────────────────────────────────
    if (stage === 'success' && result) {
        return (
            <div style={pageWrap}>
                <div className="fade-up" style={{ width: '100%', maxWidth: '500px' }}>
                    {/* Success icon */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 1rem',
                            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                        }}>✓</div>
                        <h1 className="font-display" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                            Application submitted!
                        </h1>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Here is your AI fit analysis</p>
                    </div>
                    <FitAnalysis result={result} isMobile={isMobile} />
                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
                        <button onClick={() => navigate('/dashboard')} style={{
                            flex: 1, background: 'var(--accent)', color: 'white', border: 'none',
                            borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 500,
                            cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
                            boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                        }}>View Dashboard</button>
                        <button onClick={() => navigate('/jobs')} style={{
                            flex: 1, background: 'var(--tint-04)', color: 'var(--text-secondary)',
                            border: '1px solid var(--border)', borderRadius: '10px', padding: '12px',
                            fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
                        }}>Browse More Jobs</button>
                    </div>
                </div>
            </div>
        );
    }
    // ── Stage: form ──────────────────────────────────────
    return (
        <div style={pageWrap}>
            <div className="fade-up" style={{ width: '100%', maxWidth: '560px' }}>
                {/* Back */}
                <button onClick={() => navigate('/jobs')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', marginBottom: '1.5rem', padding: 0, fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ← Back to Jobs
                </button>
                {/* Job context */}
                {job && (
                    <div className="glass" style={{ borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: 'var(--indigo-text)', fontFamily: 'Syne,sans-serif', flexShrink: 0 }}>
                            {job.title?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 500 }}>APPLYING FOR</p>
                            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif' }}>{job.title}</h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{job.location} · {job.salary}</p>
                        </div>
                    </div>
                )}
                {/* Main form card */}
                <div className="glass" style={{ borderRadius: '16px', padding: '2rem' }}>
                    <h1 className="font-display" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Submit Application</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>{savedResume ? 'Your saved resume is ready' : 'Upload your resume'} — our AI will score your fit in seconds</p>
                    {/* Error */}
                    {error && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--red-text-soft)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '1.25rem' }}>
                            {error}
                        </div>
                    )}
                    {/* Saved resume vs a new upload */}
                    {savedResume ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
                            {[
                                { value: true, title: 'Use my saved resume', sub: `${savedResume.source === 'upload' ? savedResume.fileName || 'PDF' : 'Filled-in details'}${savedResume.targetRole ? ` · ${savedResume.targetRole}` : ''} · updated ${new Date(savedResume.updatedAt).toLocaleDateString()}` },
                                { value: false, title: 'Upload a different PDF', sub: 'Only for this application — your saved resume stays as it is' },
                            ].map(opt => (
                                <label key={String(opt.value)} style={{
                                    display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer',
                                    padding: '12px 14px', borderRadius: '12px',
                                    border: `1px solid ${useSaved === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                                    background: useSaved === opt.value ? 'rgba(99,102,241,0.08)' : 'var(--tint-02)',
                                }}>
                                    <input type="radio" name="resume-choice" checked={useSaved === opt.value} onChange={() => { setUseSaved(opt.value); setError(''); setReview(null); }} style={{ marginTop: '3px', accentColor: 'var(--accent)' }} />
                                    <span>
                                        <span style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{opt.title}</span>
                                        <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.sub}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                            Tip: <span onClick={() => navigate('/resume')} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}>save your resume</span> once and skip this upload next time.
                        </p>
                    )}
                    {/* PDF Drop zone */}
                    {!useSaved && <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${dragOver ? 'var(--accent)' : file ? 'rgba(16,185,129,0.5)' : 'var(--tint-10)'}`,
                            borderRadius: '14px',
                            padding: '2rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: dragOver ? 'rgba(99,102,241,0.06)' : file ? 'rgba(16,185,129,0.04)' : 'var(--tint-02)',
                            transition: 'all .2s',
                            marginBottom: '1.25rem',
                        }}
                    >
                        <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                        {file ? (
                            <>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--green-text)', marginBottom: '4px' }}>{file.name}</p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB · Click to replace</p>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: '32px', marginBottom: '10px' }}>{dragOver ? '⬇️' : '📎'}</div>
                                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    {dragOver ? 'Drop your PDF here' : 'Drag & drop your resume'}
                                </p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>or click to browse · PDF only · max 5MB</p>
                            </>
                        )}
                    </div>}
                    {/* Cover letter */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                            <label htmlFor="cover-letter" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                Cover Letter <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                            </label>
                            <button type="button" onClick={handleWriteLetter} disabled={writingLetter} style={{
                                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                                color: 'var(--indigo-text)', borderRadius: '8px', padding: '5px 12px',
                                fontSize: '12px', fontWeight: 600, fontFamily: 'DM Sans,sans-serif', whiteSpace: 'nowrap',
                                cursor: writingLetter ? 'default' : 'pointer', opacity: writingLetter ? 0.7 : 1,
                            }}>
                                {writingLetter ? '⏳ Writing…' : '✦ Write with AI'}
                            </button>
                        </div>
                        <textarea
                            className="input-dark"
                            id="cover-letter"
                            rows={6}
                            maxLength={500}
                            value={coverLetter}
                            onChange={e => setCoverLetter(e.target.value)}
                            placeholder="Briefly explain why you're a great fit for this role — or click ✦ Write with AI"
                            style={{ resize: 'none' }}
                        />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                            {coverLetter.length} / 500 characters
                        </p>
                    </div>
                    {/* AI info banner */}
                    <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', padding: '10px 14px', marginBottom: '1.5rem', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>✦</span>
                        <p style={{ fontSize: '12px', color: 'var(--indigo-text)', lineHeight: 1.5 }}>
                            Click <strong>Review my resume</strong> to see your AI fit score (0–100) before applying — nothing is sent to the recruiter until you press Submit.
                        </p>
                    </div>
                    {/* Review result — shown before submitting */}
                    {review && (
                        <div className="fade-up" style={{ marginBottom: '1.25rem' }}>
                            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
                                Your fit for this role — not submitted yet
                            </p>
                            <FitAnalysis result={review} isMobile={isMobile} />
                            {review.aiScore < 50 && (
                                <p style={{ fontSize: '12px', color: 'var(--amber-text)', lineHeight: 1.5 }}>
                                    Low match — consider <span onClick={() => navigate('/resume')} style={{ textDecoration: 'underline', cursor: 'pointer' }}>updating your resume</span> to cover the gaps before you submit.
                                </p>
                            )}
                        </div>
                    )}
                    {/* Review + Submit */}
                    <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
                        <button type="button" onClick={handleReview} disabled={reviewing || !!review} style={{
                            flex: 1, background: 'rgba(99,102,241,0.1)', color: 'var(--indigo-text)',
                            border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', padding: '14px',
                            fontSize: '15px', fontWeight: 600, fontFamily: 'DM Sans,sans-serif',
                            cursor: reviewing || review ? 'default' : 'pointer', opacity: reviewing ? 0.7 : 1,
                            transition: 'all .2s',
                        }}>
                            {reviewing ? '⏳ Reviewing… (up to a minute)' : review ? '✓ Reviewed' : '✦ Review my resume'}
                        </button>
                        <button type="button" onClick={handleSubmit} disabled={reviewing} style={{
                            flex: 1, background: 'var(--accent)', color: 'white', border: 'none',
                            borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600,
                            cursor: reviewing ? 'default' : 'pointer', fontFamily: 'DM Sans,sans-serif',
                            boxShadow: '0 0 24px rgba(99,102,241,0.35)', opacity: reviewing ? 0.7 : 1,
                            transition: 'all .2s',
                        }}>
                            Submit Application →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ApplyPage;