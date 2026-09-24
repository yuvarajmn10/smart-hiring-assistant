require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Job = require('./models/Job');
const Application = require('./models/Application');
const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    // ── Clear existing demo data ─────────────────────────
    await User.deleteMany({ email: { $in: ['recruiter@demo.com', 'candidate1@demo.com', 'candidate2@demo.com'] } });
    console.log('Cleared old demo users');
    // ── Create demo recruiter ────────────────────────────
    const hashedPw = await bcrypt.hash('demo1234', 10);
    const recruiter = await User.create({
        name: 'TechCorp Recruiting',
        email: 'recruiter@demo.com',
        password: hashedPw,
        role: 'recruiter',
    });
    console.log('Created recruiter:', recruiter.email);
    // ── Create demo candidates ───────────────────────────
    const candidate1 = await User.create({
        name: 'Arjun Sharma',
        email: 'candidate1@demo.com',
        password: hashedPw,
        role: 'candidate',
    });
    const candidate2 = await User.create({
        name: 'Priya Patel',
        email: 'candidate2@demo.com',
        password: hashedPw,
        role: 'candidate',
    });
    console.log('Created candidates');
    // ── Delete old demo jobs ─────────────────────────────
    await Job.deleteMany({ recruiter: recruiter._id });
    // ── Create 4 realistic jobs ──────────────────────────
    const jobs = await Job.insertMany([
        {
            title: 'Full Stack Developer',
            description: 'We are looking for a skilled Full Stack Developer to join our product team. You will build React frontends and Node.js backends, work with MongoDB, and ship features end-to-end. Strong problem-solving skills and clean code practices required.',
            requirements: ['React', 'Node.js', 'MongoDB', 'REST APIs', 'JavaScript', 'Git'],
            location: 'Bangalore',
            salary: '₹8–14 LPA',
            status: 'open',
            recruiter: recruiter._id,
        },
        {
            title: 'React Frontend Engineer',
            description: 'Join our frontend team to build beautiful, high-performance web applications. You will work closely with designers and backend engineers. Deep knowledge of React hooks, state management, and CSS is required.',
            requirements: ['React', 'TypeScript', 'Tailwind CSS', 'Redux', 'Figma'],
            location: 'Remote',
            salary: '₹10–16 LPA',
            status: 'open',
            recruiter: recruiter._id,
        },
        {
            title: 'Backend Engineer — Node.js',
            description: 'We need a backend engineer to design and build scalable REST APIs. You will work with Express, MongoDB, and Redis. Experience with authentication, rate limiting, and system design is a big plus.',
            requirements: ['Node.js', 'Express', 'MongoDB', 'Redis', 'Docker', 'AWS'],
            location: 'Hyderabad',
            salary: '₹12–18 LPA',
            status: 'open',
            recruiter: recruiter._id,
        },
        {
            title: 'Junior Web Developer',
            description: 'Great opportunity for freshers and early-career developers. You will work on real features under mentorship from senior engineers. Basic HTML, CSS, JavaScript and eagerness to learn is all you need.',
            requirements: ['HTML', 'CSS', 'JavaScript', 'React basics', 'Git'],
            location: 'Pune',
            salary: '₹3–5 LPA',
            status: 'open',
            recruiter: recruiter._id,
        },
    ]);
    console.log('Created', jobs.length, 'jobs');
    // ── Delete old demo applications ─────────────────────
    await Application.deleteMany({
        candidate: { $in: [candidate1._id, candidate2._id] },
    });
    // ── Create applications with realistic AI scores ─────
    await Application.insertMany([
        {
            job: jobs[0]._id,
            candidate: candidate1._id,
            resumeText: 'Arjun Sharma — Full Stack Developer with 2 years of experience. Built 3 production apps using React, Node.js, MongoDB and Express. Strong in REST API design, JWT authentication, and responsive UI. Familiar with DSA — arrays, trees, graphs. Deployed projects on Vercel and Railway.',
            coverLetter: 'I have been building full-stack apps for 2 years and am very excited about this opportunity.',
            status: 'applied',
            aiScore: 85,
            aiVerdict: 'shortlist',
            aiStrengths: ['Strong React + Node.js experience', 'MongoDB knowledge matches requirements', 'Deployed production projects'],
            aiWeaknesses: ['No TypeScript experience mentioned', 'Limited years of experience'],
        },
        {
            job: jobs[0]._id,
            candidate: candidate2._id,
            resumeText: 'Priya Patel — Computer Science graduate. Completed online courses in HTML, CSS, and basic JavaScript. Built a to-do app as a college project. No professional work experience yet. Eager to learn.',
            coverLetter: 'I am a fresher looking for my first opportunity in web development.',
            status: 'applied',
            aiScore: 32,
            aiVerdict: 'reject',
            aiStrengths: ['Basic HTML and CSS knowledge', 'Eager to learn attitude'],
            aiWeaknesses: ['No Node.js or backend experience', 'No MongoDB or REST API knowledge', 'No professional experience'],
        },
        {
            job: jobs[1]._id,
            candidate: candidate1._id,
            resumeText: 'Arjun Sharma — React specialist. Built 5 React projects with hooks, context API, and custom components. Familiar with Tailwind CSS and responsive design. Some TypeScript experience from personal projects.',
            coverLetter: 'Frontend development is my primary strength and I love building great UIs.',
            status: 'applied',
            aiScore: 72,
            aiVerdict: 'maybe',
            aiStrengths: ['Strong React knowledge', 'CSS and responsive design skills'],
            aiWeaknesses: ['TypeScript experience is limited', 'No Redux experience', 'No Figma/design collaboration experience'],
        },
        {
            job: jobs[2]._id,
            candidate: candidate1._id,
            resumeText: 'Arjun Sharma — Backend enthusiast. Built Node.js REST APIs with Express and MongoDB. JWT authentication experience. No Docker or AWS experience yet. Good understanding of database design.',
            coverLetter: 'Backend engineering is something I want to grow into as my next career step.',
            status: 'applied',
            aiScore: 58,
            aiVerdict: 'maybe',
            aiStrengths: ['Node.js and Express experience', 'MongoDB and database knowledge'],
            aiWeaknesses: ['No Docker or containerisation experience', 'No AWS or cloud experience', 'No Redis knowledge'],
        },
        {
            job: jobs[3]._id,
            candidate: candidate2._id,
            resumeText: 'Priya Patel — Recent graduate with strong fundamentals in HTML, CSS, JavaScript and basic React. Built portfolio website. Quick learner and passionate about web development.',
            coverLetter: 'This junior role is perfect for where I am in my career and I am excited to grow.',
            status: 'applied',
            aiScore: 78,
            aiVerdict: 'shortlist',
            aiStrengths: ['HTML CSS JavaScript fundamentals match requirements', 'Basic React knowledge present', 'Shows eagerness to learn'],
            aiWeaknesses: ['No Git experience mentioned', 'No professional project experience'],
        },
        {
            job: jobs[3]._id,
            candidate: candidate1._id,
            resumeText: 'Arjun Sharma applying for the junior role. While overqualified, I am interested in the team culture and growth opportunities.',
            coverLetter: 'I know this is a junior role but I am genuinely interested in this team.',
            status: 'applied',
            aiScore: 91,
            aiVerdict: 'shortlist',
            aiStrengths: ['Exceeds all technical requirements', 'React and JavaScript mastery', 'Deployed production experience'],
            aiWeaknesses: ['May be overqualified — flight risk', 'Salary expectations may exceed budget'],
        },
    ]);
    console.log('Created 6 applications with AI scores');
    console.log('\n✅ Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Recruiter: recruiter@demo.com / demo1234');
    console.log('Candidate 1: candidate1@demo.com / demo1234');
    console.log('Candidate 2: candidate2@demo.com / demo1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
};
seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});