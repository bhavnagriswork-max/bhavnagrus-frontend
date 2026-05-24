const https = require('https');

function checkEndpoint(name, url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    console.log(`[ERROR] ${name} (${url}) returned status ${res.statusCode}`);
                    resolve({ name, status: res.statusCode, error: true });
                } else {
                    console.log(`[OK] ${name} (${url}) is up (Status: ${res.statusCode})`);
                    resolve({ name, status: res.statusCode, error: false });
                }
            });
        }).on('error', (e) => {
            console.log(`[ERROR] Failed to reach ${name} (${url}) - ${e.message}`);
            resolve({ name, error: true, message: e.message });
        });
    });
}

async function runTests() {
    console.log("Starting QA Automation tests on https://www.bhavnagris.store/ ...");
    
    await checkEndpoint('Homepage', 'https://www.bhavnagris.store/');
    await checkEndpoint('API Products', 'https://bhavnagris-backend.onrender.com/api/products'); // Assuming backend is hosted somewhere, maybe I don't know the URL. Wait, let's just check the frontend for now.
    
    console.log("Basic tests complete.");
}

runTests();
