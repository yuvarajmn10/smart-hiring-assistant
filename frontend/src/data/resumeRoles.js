// What the "Fill details" form suggests for each target role:
// skills to click-add, what recruiters look for, and role-specific placeholders.
// portfolio: true shows the portfolio link as a highlighted field.
const RESUME_ROLES = {
    'Frontend Developer': {
        skills: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'Redux', 'REST APIs', 'Git', 'Responsive Design', 'Jest'],
        lookFor: 'Projects with live links, component-based UI work, performance and accessibility.',
        summary: 'Frontend developer who builds fast, accessible React interfaces…',
        project: 'e.g. Built a job-board UI in React + Tailwind with search and filters, deployed on Vercel',
        experience: 'e.g. Rebuilt the checkout page in React, cutting load time by 40%',
        portfolio: true,
    },
    'Backend Developer': {
        skills: ['Node.js', 'Express', 'Java', 'Spring Boot', 'Python', 'Django', 'REST APIs', 'SQL', 'MongoDB', 'PostgreSQL', 'Redis', 'Docker', 'Git'],
        lookFor: 'APIs you designed, databases, scale and reliability numbers, testing.',
        summary: 'Backend developer focused on reliable APIs and clean data models…',
        project: 'e.g. Designed a REST API in Node.js + MongoDB with JWT auth serving 5k users',
        experience: 'e.g. Built payment webhooks handling 20k events/day with retries and idempotency',
    },
    'Full Stack Developer': {
        skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'MongoDB', 'SQL', 'REST APIs', 'Git', 'Docker', 'AWS', 'Tailwind CSS'],
        lookFor: 'End-to-end projects (UI + API + database) that are deployed and usable.',
        summary: 'Full stack developer who ships features end-to-end, from React UI to Node APIs…',
        project: 'e.g. MERN hiring app with AI resume scoring, deployed on Vercel + Railway',
        experience: 'e.g. Owned the notifications feature across React frontend and Node backend',
        portfolio: true,
    },
    'Data Analyst': {
        skills: ['Excel', 'SQL', 'Python', 'Pandas', 'Power BI', 'Tableau', 'Statistics', 'Data Cleaning', 'Data Visualization', 'Google Sheets'],
        lookFor: 'Dashboards and analyses with a clear business outcome, SQL depth, storytelling.',
        summary: 'Data analyst who turns messy data into dashboards and decisions…',
        project: 'e.g. Power BI sales dashboard that found a 12% drop in repeat customers',
        experience: 'e.g. Automated weekly reporting in SQL + Python, saving 6 hours a week',
        portfolio: true,
    },
    'Data Scientist / ML Engineer': {
        skills: ['Python', 'NumPy', 'Pandas', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'SQL', 'Machine Learning', 'Deep Learning', 'NLP', 'Statistics', 'MLOps'],
        lookFor: 'Models with measured results, datasets used, deployment, Kaggle or research.',
        summary: 'Data scientist building ML models that move real metrics…',
        project: 'e.g. Churn prediction model (XGBoost) with 0.87 AUC, served via FastAPI',
        experience: 'e.g. Improved recommendation CTR by 9% with a re-ranking model',
    },
    'UI/UX Designer': {
        skills: ['Figma', 'Adobe XD', 'Wireframing', 'Prototyping', 'User Research', 'Usability Testing', 'Design Systems', 'Interaction Design', 'Visual Design'],
        lookFor: 'A portfolio link is essential — case studies showing problem, process and outcome.',
        summary: 'Product designer who turns user research into simple, usable interfaces…',
        project: 'e.g. Redesigned a food-ordering flow; usability test success rose from 60% to 90%',
        experience: 'e.g. Built and maintained the company design system in Figma',
        portfolio: true,
    },
    'Mobile App Developer': {
        skills: ['Kotlin', 'Java', 'Android', 'Swift', 'iOS', 'Flutter', 'Dart', 'React Native', 'Firebase', 'REST APIs', 'Git'],
        lookFor: 'Apps on the Play Store / App Store with downloads or ratings.',
        summary: 'Mobile developer shipping smooth Android and iOS apps…',
        project: 'e.g. Flutter expense tracker with offline sync, 1k+ Play Store downloads',
        experience: 'e.g. Cut app crash rate from 2% to 0.3% by fixing memory leaks',
        portfolio: true,
    },
    'DevOps / Cloud Engineer': {
        skills: ['Linux', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Monitoring', 'Bash'],
        lookFor: 'Infrastructure you automated, uptime and deployment-speed improvements, certifications.',
        summary: 'DevOps engineer who automates infrastructure and deployments…',
        project: 'e.g. Terraform + GitHub Actions pipeline deploying to AWS ECS on every merge',
        experience: 'e.g. Reduced deploy time from 45 to 8 minutes with a new CI/CD pipeline',
    },
    'Software Tester / QA': {
        skills: ['Manual Testing', 'Selenium', 'Cypress', 'Playwright', 'Java', 'Python', 'API Testing', 'Postman', 'JIRA', 'Test Cases', 'Automation'],
        lookFor: 'Automation suites you built, bugs caught, test coverage.',
        summary: 'QA engineer who builds automated test suites and catches bugs early…',
        project: 'e.g. Playwright suite covering 120 end-to-end flows, run in CI',
        experience: 'e.g. Automated regression tests, cutting release testing from 3 days to 4 hours',
    },
    'Product Manager': {
        skills: ['Product Strategy', 'Roadmapping', 'User Research', 'Analytics', 'SQL', 'A/B Testing', 'JIRA', 'Stakeholder Management', 'PRD Writing', 'Agile'],
        lookFor: 'Products or features you owned and the metrics they moved.',
        summary: 'Product manager who ships features users love and measures the impact…',
        project: 'e.g. Launched a referral feature that grew sign-ups 18% in a quarter',
        experience: 'e.g. Led a team of 6 engineers to launch the mobile onboarding revamp',
    },
    'Digital Marketing': {
        skills: ['SEO', 'Google Ads', 'Meta Ads', 'Content Marketing', 'Social Media', 'Email Marketing', 'Google Analytics', 'Copywriting', 'Canva'],
        lookFor: 'Campaigns with numbers: reach, CTR, conversions, cost per lead.',
        summary: 'Digital marketer who runs campaigns that bring in measurable leads…',
        project: 'e.g. Instagram campaign for a local brand: 40k reach, 3.2% engagement',
        experience: 'e.g. Grew organic traffic 2.5x in 6 months through SEO content',
        portfolio: true,
    },
    'Business / Sales': {
        skills: ['Communication', 'Negotiation', 'CRM', 'Salesforce', 'Lead Generation', 'Excel', 'Market Research', 'Presentation', 'Client Relationship'],
        lookFor: 'Targets you hit, revenue or deals closed, client relationships.',
        summary: 'Sales professional who builds client relationships and consistently hits targets…',
        project: 'e.g. Market research on 50 local retailers that shaped the pricing strategy',
        experience: 'e.g. Closed ₹12L in new business in 6 months, 120% of target',
    },
};
export const ROLE_NAMES = Object.keys(RESUME_ROLES);
export const OTHER_ROLE = 'Other';
// Fallback suggestions when the role isn't in the list
const GENERIC = {
    skills: ['Communication', 'Teamwork', 'Problem Solving', 'Excel', 'Git'],
    lookFor: 'Concrete results — numbers, links and outcomes — for every project and job.',
    summary: 'Two or three lines about who you are and what you are looking for…',
    project: 'e.g. What you built, the tools you used and the result',
    experience: 'e.g. What you did and the measurable impact it had',
};
export const getRoleTemplate = (role) => RESUME_ROLES[role] || GENERIC;
