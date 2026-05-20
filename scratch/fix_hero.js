const pool = require('../backend/config/db');

async function fixHero() {
    try {
        await pool.query('UPDATE settings SET setting_value = ? WHERE setting_key = ?', [
            'Pure <br/> <span class="text-bhavaccent italic">Tradition.</span>',
            'hero_title'
        ]);
        console.log('SUCCESS: Hero title fixed');
        process.exit(0);
    } catch (err) {
        console.error('FAILURE:', err);
        process.exit(1);
    }
}

fixHero();
