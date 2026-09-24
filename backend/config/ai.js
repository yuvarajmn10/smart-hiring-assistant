const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Every prompt in this app expects JSON back — make Gemini guarantee it
const generationConfig = { responseMimeType: 'application/json' };
// Cap each call so an overloaded model fails fast and the next one is tried
const requestOptions = { timeout: 20000 };
// Tried in order. On the free tier each model has its own small daily quota
// (about 20 requests), so spreading across several keeps the AI working much longer.
const MODEL_NAMES = [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
];
const models = MODEL_NAMES.map(name => ({
    name,
    model: genAI.getGenerativeModel({ model: name, generationConfig }, requestOptions),
}));
const model = models[0].model;
// model = first choice, kept for scripts like test-gemini.js
module.exports = { model, models };
