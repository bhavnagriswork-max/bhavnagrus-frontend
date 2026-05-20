const pool = require('../config/db');

// @desc    Track a page visit
// @route   POST /api/analytics/track
// @access  Public
const trackVisit = async (req, res) => {
    try {
        const { page_url, referrer, session_id } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
        const ua = req.headers['user-agent'] || '';
        const device_type = detectDevice(ua);
        const user_id = req.user?.id || null;

        await pool.query(
            'INSERT INTO site_visitors (ip_address, user_agent, page_url, referrer, device_type, session_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [ip.substring(0, 50), ua, page_url || '/', referrer || '', device_type, session_id || '', user_id]
        );

        res.json({ tracked: true });
    } catch (error) {
        // Silently fail - don't break user experience
        res.json({ tracked: false });
    }
};

// @desc    Get analytics data for admin
// @route   GET /api/analytics/stats
// @access  Admin
const getAnalyticsStats = async (req, res) => {
    try {
        // Total visitors (unique IPs)
        const [[{ totalVisitors }]] = await pool.query('SELECT COUNT(DISTINCT ip_address) as totalVisitors FROM site_visitors');
        
        // Total page views
        const [[{ totalPageViews }]] = await pool.query('SELECT COUNT(*) as totalPageViews FROM site_visitors');

        // Today's visitors
        const [[{ todayVisitors }]] = await pool.query('SELECT COUNT(DISTINCT ip_address) as todayVisitors FROM site_visitors WHERE DATE(created_at) = CURDATE()');
        const [[{ todayPageViews }]] = await pool.query('SELECT COUNT(*) as todayPageViews FROM site_visitors WHERE DATE(created_at) = CURDATE()');

        // This month
        const [[{ monthVisitors }]] = await pool.query('SELECT COUNT(DISTINCT ip_address) as monthVisitors FROM site_visitors WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())');

        // Last 30 days daily breakdown
        const [dailyVisitors] = await pool.query(`
            SELECT DATE(created_at) as date, 
                   COUNT(*) as page_views, 
                   COUNT(DISTINCT ip_address) as unique_visitors
            FROM site_visitors 
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
            GROUP BY DATE(created_at) 
            ORDER BY date ASC
        `);

        // Last 7 days hourly pattern
        const [hourlyPattern] = await pool.query(`
            SELECT HOUR(created_at) as hour, COUNT(*) as visits 
            FROM site_visitors 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
            GROUP BY HOUR(created_at) 
            ORDER BY hour ASC
        `);

        // Device breakdown
        const [deviceBreakdown] = await pool.query(`
            SELECT device_type, COUNT(*) as count 
            FROM site_visitors 
            GROUP BY device_type 
            ORDER BY count DESC
        `);

        // Top pages
        const [topPages] = await pool.query(`
            SELECT page_url, COUNT(*) as views 
            FROM site_visitors 
            GROUP BY page_url 
            ORDER BY views DESC 
            LIMIT 10
        `);

        // Top referrers
        const [topReferrers] = await pool.query(`
            SELECT referrer, COUNT(*) as count 
            FROM site_visitors 
            WHERE referrer != '' AND referrer IS NOT NULL
            GROUP BY referrer 
            ORDER BY count DESC 
            LIMIT 5
        `);

        // Live visitors (last 5 minutes)
        const [[{ liveVisitors }]] = await pool.query('SELECT COUNT(DISTINCT ip_address) as liveVisitors FROM site_visitors WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)');

        res.json({
            totalVisitors, totalPageViews,
            todayVisitors, todayPageViews,
            monthVisitors, liveVisitors,
            dailyVisitors, hourlyPattern,
            deviceBreakdown, topPages, topReferrers
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

function detectDevice(ua) {
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'Mobile';
    return 'Desktop';
}

module.exports = { trackVisit, getAnalyticsStats };
