import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Spinner from '../components/Spinner';
import useIsMobile from '../hooks/useIsMobile';
import { ROLE_NAMES, OTHER_ROLE, getRoleTemplate } from '../data/resumeRoles';

const EMPTY_EXPERIENCE = { title: '', company: '', start: '', end: '', description: '' };
const EMPTY_EDUCATION = { degree: '', institution: '', year: '', score: '' };
const EMPTY_PROJECT = { name: '', tech: '', link: '', description: '' };
const emptyDetails = (user) => ({
    fullName: user?.name || '', email: user?.email || '', phone: '', location: '',
    links: { linkedin: '', github: '', portfolio: '' },
    summary: '', skills: [], experience: [], education: [], projects: [], certifications: [],
});
// Merge saved details over the empty shape so every field is defined (controlled inputs)
const withDefaults = (details, user) => {
    const base = emptyDetails(user);
    if (!details) return base;
    return { ...base, ...details, links: { ...base.links, ...details.links } };
};

const label = { display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' };
const sectionTitle = { fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif' };
const card = { borderRadius: '16px', padding: '1.5rem', marginBottom: '1.25rem' };
const chipBtn = (active) => ({
    fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '999px', cursor: 'pointer',
    fontFamily: 'DM Sans,sans-serif', transition: 'all .15s',
    background: active ? 'rgba(16,185,129,0.12)' : 'var(--tint-04)',
    color: active ? 'var(--green-text)' : 'var(--text-secondary)',
    border: active ? '1px solid rgba(16,185,129,0.3)' : '1px dashed var(--tint-15)',
});
const linkBtn = { background: 'none', border: 'none', color: 'var(--accent)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', padding: 0 };
const removeBtn = { background: 'none', border: 'none', color: 'var(--red-text)', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', padding: 0 };

const ResumePage = () => {
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const { showToast } = useToast();
    const fileInputRef = useRef();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(null);
    const [tab, setTab] = useState('upload');
    const [showPreview, setShowPreview] = useState(false);
    // Target role — a preset from the list, or free text when "Other" is picked
    const [rolePick, setRolePick] = useState('');
    const [customRole, setCustomRole] = useState('');
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [details, setDetails] = useState(() => emptyDetails(user));
    const [skillInput, setSkillInput] = useState('');
    const [certInput, setCertInput] = useState('');

    const targetRole = rolePick === OTHER_ROLE ? customRole.trim() : rolePick;
    const template = getRoleTemplate(rolePick);

    const loadSaved = (resume) => {
        setSaved(resume);
        if (!resume) return;
        setTab(resume.source === 'form' ? 'form' : 'upload');
        if (resume.targetRole) {
            if (ROLE_NAMES.includes(resume.targetRole)) setRolePick(resume.targetRole);
            else { setRolePick(OTHER_ROLE); setCustomRole(resume.targetRole); }
        }
        if (resume.source === 'form') setDetails(withDefaults(resume.details, user));
    };
    useEffect(() => {
        api.get('/profile/resume')
            .then(res => loadSaved(res.data.resume))
            .catch(() => showToast('Could not load your saved resume', 'error'))
            .finally(() => setLoading(false));
        // loadSaved only reads setters and user — run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Form helpers ─────────────────────────────────
    const setField = (key, value) => setDetails(d => ({ ...d, [key]: value }));
    const setLink = (key, value) => setDetails(d => ({ ...d, links: { ...d.links, [key]: value } }));
    const addSkill = (skill) => {
        const s = skill.trim();
        if (!s) return;
        setDetails(d => (d.skills.some(x => x.toLowerCase() === s.toLowerCase()) ? d : { ...d, skills: [...d.skills, s] }));
    };
    const removeSkill = (skill) => setDetails(d => ({ ...d, skills: d.skills.filter(x => x !== skill) }));
    const onSkillKey = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addSkill(skillInput);
            setSkillInput('');
        }
    };
    const addCert = () => {
        const c = certInput.trim();
        if (c) setDetails(d => ({ ...d, certifications: [...d.certifications, c] }));
        setCertInput('');
    };
    // Repeatable sections (experience / education / projects)
    const addItem = (key, empty) => setDetails(d => ({ ...d, [key]: [...d[key], { ...empty }] }));
    const updateItem = (key, i, field, value) => setDetails(d => ({
        ...d, [key]: d[key].map((item, idx) => (idx === i ? { ...item, [field]: value } : item)),
    }));
    const removeItem = (key, i) => setDetails(d => ({ ...d, [key]: d[key].filter((_, idx) => idx !== i) }));

    // ── File helpers ─────────────────────────────────
    const pickFile = (f) => {
        if (f?.type === 'application/pdf') setFile(f);
        else showToast('Please choose a PDF file', 'error');
    };

    // ── Save ─────────────────────────────────────────
    const saveUpload = async () => {
        if (!file) { showToast('Choose a PDF first', 'error'); return; }
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('resume', file);
            if (targetRole) formData.append('targetRole', targetRole);
            const res = await api.post('/profile/resume/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSaved(res.data.resume);
            setFile(null);
            showToast('Resume saved from your PDF', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not save resume', 'error');
        } finally { setSaving(false); }
    };
    const saveForm = async () => {
        if (!details.fullName.trim()) { showToast('Full name is required', 'error'); return; }
        setSaving(true);
        try {
            const res = await api.put('/profile/resume', { targetRole, details });
            setSaved(res.data.resume);
            showToast('Resume saved', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not save resume', 'error');
        } finally { setSaving(false); }
    };
    const deleteResume = async () => {
        if (!window.confirm('Delete your saved resume?')) return;
        try {
            await api.delete('/profile/resume');
            setSaved(null);
            setShowPreview(false);
            showToast('Resume deleted', 'success');
        } catch {
            showToast('Could not delete resume', 'error');
        }
    };

    if (loading) return <Spinner text="Loading your resume..." />;
    const tabBtn = (id, text) => (
        <button type="button" onClick={() => setTab(id)} style={{
            flex: 1, padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 500, fontFamily: 'DM Sans,sans-serif', transition: 'all .2s',
            background: tab === id ? 'var(--accent)' : 'transparent',
            color: tab === id ? 'white' : 'var(--text-secondary)',
        }}>{text}</button>
    );
    const grid2 = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' };

    return (
        <div className="fade-up" style={{ maxWidth: '820px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
            <h1 className="font-display" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Your Resume</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Save it once and use it every time you apply on HireAI.
            </p>

            {/* ── Saved resume status ── */}
            {saved ? (
                <div className="glass" style={{ ...card, borderColor: 'rgba(16,185,129,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>✓</div>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    Resume saved {saved.source === 'upload' ? `from ${saved.fileName || 'PDF'}` : 'from your details'}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {saved.targetRole ? `Target: ${saved.targetRole} · ` : ''}Updated {new Date(saved.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" className="btn-ghost" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => setShowPreview(p => !p)}>
                                {showPreview ? 'Hide text' : 'Preview text'}
                            </button>
                            <button type="button" className="btn-danger" onClick={deleteResume}>Delete</button>
                        </div>
                    </div>
                    {showPreview && (
                        <pre style={{ marginTop: '1rem', padding: '1rem', borderRadius: '10px', background: 'var(--tint-03)', border: '1px solid var(--border)', fontSize: '12px', lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: '320px', overflowY: 'auto', fontFamily: 'DM Sans,sans-serif' }}>
                            {saved.resumeText}
                        </pre>
                    )}
                </div>
            ) : (
                <div style={{ ...card, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px' }}>📄</span>
                    <p style={{ fontSize: '13px', color: 'var(--indigo-text)' }}>No resume saved yet — upload a PDF or fill in your details below.</p>
                </div>
            )}

            {/* ── Target role ── */}
            <div className="glass" style={card}>
                <label style={label} htmlFor="target-role">Target role</label>
                <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
                    <select id="target-role" className="input-dark" value={rolePick} onChange={e => setRolePick(e.target.value)} style={{ flex: 1, cursor: 'pointer' }}>
                        <option value="">Choose the role you're aiming for…</option>
                        {ROLE_NAMES.map(r => <option key={r} value={r}>{r}</option>)}
                        <option value={OTHER_ROLE}>Other…</option>
                    </select>
                    {rolePick === OTHER_ROLE && (
                        <input className="input-dark" value={customRole} onChange={e => setCustomRole(e.target.value)} placeholder="Type your role" style={{ flex: 1 }} />
                    )}
                </div>
                {rolePick && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.5 }}>
                        <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Recruiters look for: </strong>{template.lookFor}
                    </p>
                )}
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '12px', background: 'var(--tint-04)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                {tabBtn('upload', '📄 Upload PDF')}
                {tabBtn('form', '✍ Fill details')}
            </div>

            {tab === 'upload' && (
                <div className="glass" style={card}>
                    <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0]); }}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${dragOver ? 'var(--accent)' : file ? 'rgba(16,185,129,0.5)' : 'var(--tint-10)'}`,
                            borderRadius: '14px', padding: '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer',
                            background: dragOver ? 'rgba(99,102,241,0.06)' : file ? 'rgba(16,185,129,0.04)' : 'var(--tint-02)',
                            transition: 'all .2s', marginBottom: '1.25rem',
                        }}
                    >
                        <input ref={fileInputRef} type="file" accept=".pdf" onChange={e => pickFile(e.target.files[0])} style={{ display: 'none' }} />
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>{file ? '📄' : dragOver ? '⬇️' : '📎'}</div>
                        {file ? (
                            <>
                                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--green-text)', marginBottom: '4px' }}>{file.name}</p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB · Click to replace</p>
                            </>
                        ) : (
                            <>
                                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    {dragOver ? 'Drop your PDF here' : 'Drag & drop your resume'}
                                </p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>or click to browse · PDF only · max 5MB</p>
                            </>
                        )}
                    </div>
                    {saved?.source === 'form' && (
                        <p style={{ fontSize: '12px', color: 'var(--amber-text)', marginBottom: '1rem' }}>
                            Saving a PDF replaces the resume you filled in.
                        </p>
                    )}
                    <button type="button" className="btn-accent" onClick={saveUpload} disabled={saving || !file}>
                        {saving ? 'Reading PDF…' : 'Save resume'}
                    </button>
                </div>
            )}

            {tab === 'form' && (
                <>
                    {/* Personal */}
                    <div className="glass" style={card}>
                        <h2 style={{ ...sectionTitle, marginBottom: '1rem' }}>Personal details</h2>
                        <div style={grid2}>
                            <div><label style={label}>Full name *</label><input className="input-dark" value={details.fullName} onChange={e => setField('fullName', e.target.value)} /></div>
                            <div><label style={label}>Email</label><input className="input-dark" type="email" value={details.email} onChange={e => setField('email', e.target.value)} /></div>
                            <div><label style={label}>Phone</label><input className="input-dark" value={details.phone} onChange={e => setField('phone', e.target.value)} placeholder="+91 98765 43210" /></div>
                            <div><label style={label}>Location</label><input className="input-dark" value={details.location} onChange={e => setField('location', e.target.value)} placeholder="Bengaluru, India" /></div>
                            <div><label style={label}>LinkedIn</label><input className="input-dark" value={details.links.linkedin} onChange={e => setLink('linkedin', e.target.value)} placeholder="linkedin.com/in/…" /></div>
                            <div><label style={label}>GitHub</label><input className="input-dark" value={details.links.github} onChange={e => setLink('github', e.target.value)} placeholder="github.com/…" /></div>
                        </div>
                        <div style={{ marginTop: '12px' }}>
                            <label style={label}>
                                Portfolio {template.portfolio && <span style={{ color: 'var(--amber-text)', fontWeight: 600 }}>· recommended for {rolePick}</span>}
                            </label>
                            <input className="input-dark" value={details.links.portfolio} onChange={e => setLink('portfolio', e.target.value)} placeholder="yourname.dev, Behance, Dribbble…"
                                style={template.portfolio ? { borderColor: 'rgba(245,158,11,0.4)' } : undefined} />
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="glass" style={card}>
                        <h2 style={{ ...sectionTitle, marginBottom: '1rem' }}>Summary</h2>
                        <textarea className="input-dark" rows={3} value={details.summary} onChange={e => setField('summary', e.target.value)} placeholder={template.summary} style={{ resize: 'vertical' }} />
                    </div>

                    {/* Skills */}
                    <div className="glass" style={card}>
                        <h2 style={{ ...sectionTitle, marginBottom: '1rem' }}>Skills</h2>
                        {details.skills.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                {details.skills.map(s => (
                                    <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, padding: '4px 6px 4px 10px', borderRadius: '999px', background: 'rgba(99,102,241,0.12)', color: 'var(--indigo-text)', border: '1px solid rgba(99,102,241,0.25)' }}>
                                        {s}
                                        <button type="button" aria-label={`Remove ${s}`} onClick={() => removeSkill(s)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '12px', padding: '0 2px' }}>✕</button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <input className="input-dark" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={onSkillKey}
                            onBlur={() => { addSkill(skillInput); setSkillInput(''); }} placeholder="Type a skill and press Enter" />
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '12px 0 8px' }}>
                            {rolePick ? `Suggested for ${targetRole || rolePick} — click to add:` : 'Pick a target role above for suggestions, or click to add:'}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {template.skills.map(s => {
                                const has = details.skills.some(x => x.toLowerCase() === s.toLowerCase());
                                return (
                                    <button key={s} type="button" style={chipBtn(has)} onClick={() => (has ? removeSkill(details.skills.find(x => x.toLowerCase() === s.toLowerCase())) : addSkill(s))}>
                                        {has ? '✓ ' : '+ '}{s}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Experience */}
                    <div className="glass" style={card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={sectionTitle}>Experience & internships</h2>
                            <button type="button" style={linkBtn} onClick={() => addItem('experience', EMPTY_EXPERIENCE)}>+ Add</button>
                        </div>
                        {details.experience.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No experience yet? That's fine — add projects below instead.</p>}
                        {details.experience.map((exp, i) => (
                            <div key={i} style={{ paddingTop: i ? '1rem' : 0, marginTop: i ? '1rem' : 0, borderTop: i ? '1px solid var(--border)' : 'none' }}>
                                <div style={grid2}>
                                    <div><label style={label}>Job title</label><input className="input-dark" value={exp.title} onChange={e => updateItem('experience', i, 'title', e.target.value)} placeholder={rolePick && rolePick !== OTHER_ROLE ? `${rolePick} Intern` : 'Software Engineer Intern'} /></div>
                                    <div><label style={label}>Company</label><input className="input-dark" value={exp.company} onChange={e => updateItem('experience', i, 'company', e.target.value)} /></div>
                                    <div><label style={label}>Start</label><input className="input-dark" value={exp.start} onChange={e => updateItem('experience', i, 'start', e.target.value)} placeholder="Jun 2025" /></div>
                                    <div><label style={label}>End</label><input className="input-dark" value={exp.end} onChange={e => updateItem('experience', i, 'end', e.target.value)} placeholder="Present" /></div>
                                </div>
                                <div style={{ marginTop: '12px' }}>
                                    <label style={label}>What you did</label>
                                    <textarea className="input-dark" rows={3} value={exp.description} onChange={e => updateItem('experience', i, 'description', e.target.value)} placeholder={template.experience} style={{ resize: 'vertical' }} />
                                </div>
                                <button type="button" style={{ ...removeBtn, marginTop: '8px' }} onClick={() => removeItem('experience', i)}>Remove</button>
                            </div>
                        ))}
                    </div>

                    {/* Projects */}
                    <div className="glass" style={card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={sectionTitle}>Projects</h2>
                            <button type="button" style={linkBtn} onClick={() => addItem('projects', EMPTY_PROJECT)}>+ Add</button>
                        </div>
                        {details.projects.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{template.project}</p>}
                        {details.projects.map((p, i) => (
                            <div key={i} style={{ paddingTop: i ? '1rem' : 0, marginTop: i ? '1rem' : 0, borderTop: i ? '1px solid var(--border)' : 'none' }}>
                                <div style={grid2}>
                                    <div><label style={label}>Project name</label><input className="input-dark" value={p.name} onChange={e => updateItem('projects', i, 'name', e.target.value)} /></div>
                                    <div><label style={label}>Tech used</label><input className="input-dark" value={p.tech} onChange={e => updateItem('projects', i, 'tech', e.target.value)} placeholder={template.skills.slice(0, 3).join(', ')} /></div>
                                </div>
                                <div style={{ marginTop: '12px' }}>
                                    <label style={label}>Link</label>
                                    <input className="input-dark" value={p.link} onChange={e => updateItem('projects', i, 'link', e.target.value)} placeholder="github.com/… or live demo URL" />
                                </div>
                                <div style={{ marginTop: '12px' }}>
                                    <label style={label}>Description</label>
                                    <textarea className="input-dark" rows={2} value={p.description} onChange={e => updateItem('projects', i, 'description', e.target.value)} placeholder={template.project} style={{ resize: 'vertical' }} />
                                </div>
                                <button type="button" style={{ ...removeBtn, marginTop: '8px' }} onClick={() => removeItem('projects', i)}>Remove</button>
                            </div>
                        ))}
                    </div>

                    {/* Education */}
                    <div className="glass" style={card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={sectionTitle}>Education</h2>
                            <button type="button" style={linkBtn} onClick={() => addItem('education', EMPTY_EDUCATION)}>+ Add</button>
                        </div>
                        {details.education.map((ed, i) => (
                            <div key={i} style={{ paddingTop: i ? '1rem' : 0, marginTop: i ? '1rem' : 0, borderTop: i ? '1px solid var(--border)' : 'none' }}>
                                <div style={grid2}>
                                    <div><label style={label}>Degree</label><input className="input-dark" value={ed.degree} onChange={e => updateItem('education', i, 'degree', e.target.value)} placeholder="B.E. Computer Science" /></div>
                                    <div><label style={label}>College / school</label><input className="input-dark" value={ed.institution} onChange={e => updateItem('education', i, 'institution', e.target.value)} /></div>
                                    <div><label style={label}>Year</label><input className="input-dark" value={ed.year} onChange={e => updateItem('education', i, 'year', e.target.value)} placeholder="2022 – 2026" /></div>
                                    <div><label style={label}>CGPA / %</label><input className="input-dark" value={ed.score} onChange={e => updateItem('education', i, 'score', e.target.value)} placeholder="8.4 CGPA" /></div>
                                </div>
                                <button type="button" style={{ ...removeBtn, marginTop: '8px' }} onClick={() => removeItem('education', i)}>Remove</button>
                            </div>
                        ))}
                    </div>

                    {/* Certifications */}
                    <div className="glass" style={card}>
                        <h2 style={{ ...sectionTitle, marginBottom: '1rem' }}>Certifications</h2>
                        {details.certifications.length > 0 && (
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                                {details.certifications.map((c, i) => (
                                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        · {c}
                                        <button type="button" style={removeBtn} onClick={() => setField('certifications', details.certifications.filter((_, idx) => idx !== i))}>Remove</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input className="input-dark" value={certInput} onChange={e => setCertInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }} placeholder="e.g. AWS Cloud Practitioner" />
                            <button type="button" className="btn-ghost" onClick={addCert}>Add</button>
                        </div>
                    </div>

                    {saved?.source === 'upload' && (
                        <p style={{ fontSize: '12px', color: 'var(--amber-text)', marginBottom: '1rem' }}>
                            Saving these details replaces your uploaded PDF.
                        </p>
                    )}
                    {/* Save bar stays in view while scrolling a long form */}
                    <div style={{ position: 'sticky', bottom: '1rem', zIndex: 5 }}>
                        <button type="button" className="btn-accent" onClick={saveForm} disabled={saving} style={{ boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
                            {saving ? 'Saving…' : 'Save resume'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
export default ResumePage;
