const http = require('http');

const data = JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    mobile: '1234567890',
    password: 'password123'
});

const options = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = http.request(options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => responseBody += chunk);
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('BODY:', responseBody);
    });
});

req.on('error', (err) => console.error('ERROR:', err.message));
req.write(data);
req.end();
