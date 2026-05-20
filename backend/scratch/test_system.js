const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/',
    method: 'GET',
};

const endpoints = [
    { name: 'Health Check', path: '/' },
    { name: 'Products List', path: '/api/products' },
    { name: 'Categories List', path: '/api/categories' },
    { name: 'Public Settings', path: '/api/settings/public' }
];

async function testEndpoint(endpoint) {
    return new Promise((resolve) => {
        const reqOpts = { ...options, path: endpoint.path };
        const req = http.request(reqOpts, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                console.log(`[${res.statusCode === 200 ? 'OK' : 'FAIL'}] ${endpoint.name} (${endpoint.path}) - Status: ${res.statusCode}`);
                if (res.statusCode !== 200) {
                    console.log(`   Response: ${data.substring(0, 100)}...`);
                }
                resolve(res.statusCode === 200);
            });
        });
        req.on('error', (e) => {
            console.error(`[ERROR] ${endpoint.name} (${endpoint.path}) - ${e.message}`);
            resolve(false);
        });
        req.end();
    });
}

async function runTests() {
    console.log('--- Starting System Sanity Check ---');
    let allPassed = true;
    for (const ep of endpoints) {
        const passed = await testEndpoint(ep);
        if (!passed) allPassed = false;
    }
    console.log('------------------------------------');
    console.log(allPassed ? '✅ All basic endpoints are responding properly.' : '❌ Some endpoints failed.');
}

runTests();
