const pdfParse = require('pdf-parse');
const parseResume = async (req, res) => {
    try {

        // 1. Check a file was actually uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a PDF file' });
        }
        // 2. req.file.buffer is the raw PDF binary data in memory
        const data = await pdfParse(req.file.buffer);
        // 3. data.text is all the extracted plain text from the PDF
        const resumeText = data.text.trim();
        if (!resumeText || resumeText.length < 50) {
            return res.status(400).json({
                message: 'Could not extract text from PDF. Make sure it is not a scanned image.',
            });
        }
        // 4. Return the extracted text + some metadata
        res.json({
            resumeText,
            fileName: req.file.originalname,
            characters: resumeText.length,
            pages: data.numpages,
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to parse PDF: ' + error.message });
    }
};
module.exports = { parseResume };