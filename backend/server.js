const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const { protect, recruiterOnly, candidateOnly } = require('./middleware/auth');
const jobRoutes = require('./routes/jobRoutes');
// const Application = require('./models/Application');


dotenv.config();

const app = express();
// const User = require('./models/user');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);

// app.get('/api/test/protected', protect, (req, res) => {
//   res.json({
//     message: 'You accessed a protected route!',
//     user: req.user
//   });
// });

// app.get('/api/test/recruiter', protect, recruiterOnly, (req, res) => {
//   res.json({
//     message: 'You are a verified recruiter!',
//     user: req.user
//   });
// });

app.get('/health', (req, res) => {
  res.json({
    status: 'Server is running!',
    message: 'Smart Hiring Assistant API'
  });
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});