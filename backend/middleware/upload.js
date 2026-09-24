const multer = require('multer');
// memoryStorage = keep file in RAM, don't save to disk
const storage = multer.memoryStorage();
// Only allow PDF files
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
        // cb(null, true) = accept this file
    } else {
        cb(new Error('Only PDF files are allowed'), false);
        // cb(error, false) = reject this file with an error
    }
};
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
    // 5MB max file size — resumes are never bigger than this
});
module.exports = upload;