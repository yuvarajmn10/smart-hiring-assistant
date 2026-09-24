// Live jobs from other platforms (LinkedIn, Naukri, Indeed, Internshala-type
// listings) via the JSearch API on RapidAPI, which aggregates Google Jobs.
const JSEARCH_URL = 'https://jsearch.p.rapidapi.com/search-v2';
// v5 of JSearch retired /search — search-v2 pages with a cursor instead of page numbers
const CACHE_TTL_MS = 15 * 60 * 1000;
// Free plan has a small monthly quota — identical searches within 15 min reuse the last answer
const cache = new Map();

const EMPLOYMENT_TYPES = ['FULLTIME', 'PARTTIME', 'INTERN', 'CONTRACTOR'];
const DATE_POSTED = ['all', 'today', '3days', 'week', 'month'];
// JSearch defaults to US listings — pick the country from the location text, India otherwise
const COUNTRIES = {
    'united states': 'us', usa: 'us', 'united kingdom': 'gb', uk: 'gb', england: 'gb',
    canada: 'ca', australia: 'au', germany: 'de', singapore: 'sg', 'united arab emirates': 'ae',
    uae: 'ae', dubai: 'ae', france: 'fr', netherlands: 'nl', ireland: 'ie',
};
const countryFor = (location) => {
    const text = location.toLowerCase();
    const match = Object.keys(COUNTRIES).find(name => text.includes(name));
    return match ? COUNTRIES[match] : 'in';
};

// Keep only what the frontend needs, with stable field names
const normalizeJob = (j) => ({
    id: j.job_id,
    title: j.job_title,
    company: j.employer_name,
    logo: j.employer_logo || null,
    publisher: j.job_publisher,
    employmentType: j.job_employment_types?.[0] || null,
    // e.g. "INTERN" — job_employment_type is now a display string like "Internship"
    isRemote: Boolean(j.job_is_remote),
    location: j.job_location || [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') || null,
    postedAt: j.job_posted_at_datetime_utc || null,
    applyLink: j.job_apply_link,
    description: (j.job_description || '').slice(0, 400),
    salary: j.job_salary_string || j.job_min_salary || j.job_max_salary
        ? { text: j.job_salary_string, min: j.job_min_salary, max: j.job_max_salary, currency: j.job_salary_currency, period: j.job_salary_period }
        : null,
    skills: j.job_required_skills || [],
});

// GET /api/external-jobs?query=react&location=Bangalore&type=INTERN&datePosted=week&remote=true&cursor=<from previous response>
const getExternalJobs = async (req, res) => {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
        return res.status(503).json({ message: 'Live jobs are not configured yet — add RAPIDAPI_KEY to backend/.env' });
    }
    const query = (req.query.query || 'software developer').toString().trim().slice(0, 100);
    const location = (req.query.location || 'India').toString().trim().slice(0, 100);
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor.slice(0, 4000) : '';
    const type = EMPLOYMENT_TYPES.includes(req.query.type) ? req.query.type : null;
    const datePosted = DATE_POSTED.includes(req.query.datePosted) ? req.query.datePosted : 'all';
    const remote = req.query.remote === 'true';

    const params = new URLSearchParams({
        query: location ? `${query} in ${location}` : query,
        num_pages: '1',
        date_posted: datePosted,
        country: countryFor(location),
    });
    if (type) params.set('employment_types', type);
    if (remote) params.set('work_from_home', 'true');
    if (cursor) params.set('cursor', cursor);

    const cacheKey = params.toString();
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
        return res.json({ ...hit.body, cached: true });
    }

    try {
        const response = await fetch(`${JSEARCH_URL}?${params}`, {
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
            },
            signal: AbortSignal.timeout(20000),
        });
        if (response.status === 429) {
            return res.status(429).json({ message: 'Live job search limit reached for now. Please try again later.' });
        }
        if (response.status === 401 || response.status === 403) {
            return res.status(502).json({ message: 'Live jobs API key was rejected — check RAPIDAPI_KEY and that you subscribed to JSearch' });
        }
        if (!response.ok) {
            return res.status(502).json({ message: `Live jobs provider error (${response.status})` });
        }
        const data = await response.json();
        const raw = Array.isArray(data.data) ? data.data : (data.data?.jobs || []);
        const jobs = raw.filter(j => j.job_apply_link).map(normalizeJob);
        const nextCursor = jobs.length > 0 ? (data.data?.cursor || null) : null;
        const body = { count: jobs.length, hasMore: Boolean(nextCursor), nextCursor, fetchedAt: new Date().toISOString(), jobs };
        cache.set(cacheKey, { at: Date.now(), body });
        if (cache.size > 200) cache.delete(cache.keys().next().value);
        // Oldest entry goes first — Map keeps insertion order
        res.json(body);
    } catch (error) {
        console.error('Live jobs fetch failed:', error.message);
        res.status(502).json({ message: 'Could not reach the live jobs provider. Please try again.' });
    }
};

module.exports = { getExternalJobs };
