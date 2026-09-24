require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const testModel = async () => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent('Say hello in one word.');
        console.log('Works:', result.response.text());
    } catch (e) {
        console.log('Full error:', e.message);
    }
};

testModel();