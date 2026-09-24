require('dotenv').config();
const { model } = require('./config/ai');
const testJSON = async () => {
    const prompt = `
You are a hiring assistant.
Score this candidate out of 100 and return ONLY a JSON object.
No explanation. No markdown. No code blocks. Raw JSON only.
Format: {"score": 85, "verdict": "shortlist", "reason": "..."}
`;
    const result = await model.generateContent(prompt);
    const reply = result.response.text();
    console.log('Raw reply:', reply);
    try {
        // Strip markdown code blocks if Gemini adds them
        const cleaned = reply.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        console.log('Parsed JSON:', parsed);
        console.log('Score:', parsed.score);
        console.log('Verdict:', parsed.verdict);
    } catch (e) {
        console.log('Parse failed:', e.message);
        console.log('Tweak the prompt to remove extra text');
    }
};
testJSON();