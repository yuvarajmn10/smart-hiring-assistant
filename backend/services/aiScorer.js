const { models } = require('../config/ai');

const isQuotaError = (err) => /429|quota/i.test(err.message || '');
const isTransient = (err) => /503|overloaded|high demand|timed? ?out|abort|fetch failed/i.test(err.message || '');
// Models that ran out of quota are skipped for a while instead of being retried on every request
const QUOTA_COOLDOWN_MS = 10 * 60 * 1000;
const cooldownUntil = new Map();
// Try each model in turn (see config/ai.js). Quota-exhausted models are parked for 10 minutes;
// overloaded ones just hand over to the next. After a full pass, wait briefly and try once more.
const withRetry = async (prompt) => {
    let lastError;
    for (let pass = 1; pass <= 2; pass++) {
        for (const { name, model } of models) {
            if ((cooldownUntil.get(name) || 0) > Date.now()) continue;
            try {
                return await model.generateContent(prompt);
            } catch (err) {
                lastError = err;
                if (isQuotaError(err)) {
                    cooldownUntil.set(name, Date.now() + QUOTA_COOLDOWN_MS);
                    console.warn(`Gemini ${name}: quota used up — skipping it for 10 minutes`);
                } else if (isTransient(err)) {
                    console.warn(`Gemini ${name}: unavailable (${err.message.slice(0, 60)}…) — trying next model`);
                } else {
                    throw err;
                }
            }
        }
        if (pass === 1) await new Promise(res => setTimeout(res, 3000));
    }
    throw lastError || new Error('All Gemini models are over quota — try again later');
};
const scoreResume = async (resumeText, jobTitle, jobDescription, jobRequirements) => {
    const prompt = `
You are an expert technical recruiter with 10 years of experience.
Evaluate the candidate's resume against the job posting below.
JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription}
JOB REQUIREMENTS: ${jobRequirements.join(', ')}
CANDIDATE RESUME:
${resumeText}
Evaluate the candidate and respond with ONLY a valid JSON object.
No explanation. No markdown. No code blocks. Raw JSON only.
Use exactly this format:
{
"fitScore": 78,
"verdict": "shortlist",
"strengths": ["Strong React experience", "Good project portfolio"],
"weaknesses": ["No backend experience", "Missing system design skills"]
}
Field rules:
- fitScore: integer 0-100. 80+ = strong match, 50-79 = partial, below 50 = weak
- verdict: exactly one of "shortlist", "maybe", "reject"
- strengths: array of 2-4 specific strengths from the resume
- weaknesses: array of 2-4 specific gaps vs the job requirements
`;
    try {
        const result = await withRetry(prompt);
        const reply = result.response.text();
        // Strip markdown code blocks Gemini sometimes adds
        const cleaned = reply.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        // Validate the response has all required fields
        if (
            typeof parsed.fitScore !== 'number' ||
            !['shortlist', 'maybe', 'reject'].includes(parsed.verdict) ||
            !Array.isArray(parsed.strengths) ||
            !Array.isArray(parsed.weaknesses)
        ) {
            throw new Error('Invalid AI response format');
        }
        parsed.fitScore = Math.max(0, Math.min(100, Math.round(parsed.fitScore)));
        // Keep the score in range even if the model drifts
        return parsed;
    } catch (error) {
        console.error('AI scoring failed:', error.message);
        // Return a safe fallback so the application still saves
        return {
            fitScore: null,
            verdict: null,
            strengths: [],
            weaknesses: [],
        };
    }
};

const generateInterviewQuestions = async (
    jobTitle,
    jobRequirements,
    candidateWeaknesses,
    candidateName
) => {
    const prompt = `
You are an expert technical interviewer.
Generate 5 targeted interview questions for a candidate applying for the role below.
Focus on probing their specific weak areas while also testing job requirements.
JOB TITLE: ${jobTitle}
JOB REQUIREMENTS: ${jobRequirements.join(', ')}
CANDIDATE NAME: ${candidateName}
CANDIDATE WEAK AREAS: ${candidateWeaknesses.join(', ')}
Rules:
- Each question must directly relate to a weak area or job requirement
- Questions should be specific, not generic
- Mix technical and situational questions
- Respond with ONLY a valid JSON array. No explanation. No markdown.
Format exactly like this:
[
{
"question": "How would you manage state across 10+ components without prop drilling?",
"targetedAt": "State management weakness",
"type": "technical"
},
{
"question": "Describe a time you had to learn a new backend technology quickly.",
"targetedAt": "Limited backend experience",
"type": "situational"
}
]
`;
    try {
        const result = await withRetry(prompt);
        const reply = result.response.text();
        const cleaned = reply.replace(/```json|```/g, '').trim();
        const questions = JSON.parse(cleaned);
        // Make sure we got an array back
        if (!Array.isArray(questions)) {
            throw new Error('Expected an array of questions');
        }
        return questions;
    } catch (error) {
        console.error('Interview question generation failed:', error.message);
        return [];
        // Return empty array on failure — never crash the route
    }
};
// Short cover letter written from the candidate's resume for one specific job
const generateCoverLetter = async (resumeText, jobTitle, jobDescription, jobRequirements, candidateName) => {
    const prompt = `
You are helping a job candidate write a cover letter for the application form below.
JOB TITLE: ${jobTitle}
JOB DESCRIPTION: ${jobDescription}
JOB REQUIREMENTS: ${jobRequirements.join(', ')}
CANDIDATE NAME: ${candidateName}
CANDIDATE RESUME:
${resumeText}
Rules:
- First person, confident and specific, 3-4 short sentences, under 450 characters in total
- Mention 2-3 concrete skills, projects or results FROM THE RESUME that match the job requirements
- Only use facts that appear in the resume. Never invent experience, numbers or employers
- No greeting line, no sign-off, no placeholders like [Company]
Respond with ONLY a JSON object: {"coverLetter": "..."}
`;
    const result = await withRetry(prompt);
    const parsed = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
    if (typeof parsed.coverLetter !== 'string' || !parsed.coverLetter.trim()) {
        throw new Error('Invalid AI response format');
    }
    return parsed.coverLetter.trim().slice(0, 500);
    // The form allows 500 characters
};
module.exports = { scoreResume, generateInterviewQuestions, generateCoverLetter };