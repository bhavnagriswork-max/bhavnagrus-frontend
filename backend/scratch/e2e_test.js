const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

function request(endpoint, method = 'GET', data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + endpoint);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body || '{}');
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runE2ETest() {
    console.log('--- Starting End-to-End System Test ---');
    try {
        // 1. Fetch Products
        console.log('1. Fetching products...');
        const productsRes = await request('/products');
        if (productsRes.status !== 200 || !productsRes.data.length) throw new Error('Failed to fetch products');
        const product = productsRes.data[0];
        console.log(`   Found product: ${product.name} (ID: ${product.id})`);

        // 2. Register/Login Test User
        console.log('2. Authenticating test user...');
        const email = `testuser_${Date.now()}@test.com`;
        const mobile = `987${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
        const registerRes = await request('/auth/register', 'POST', {
            name: 'E2E Test User',
            email: email,
            password: 'password123',
            mobile: mobile
        });
        
        let token = '';
        if (registerRes.status === 201) {
            token = registerRes.data.token;
            console.log('   Test user registered.');
        } else {
            console.log('   Registration failed, maybe user exists. Attempting login...', registerRes.data);
            const loginRes = await request('/auth/login', 'POST', { email: email, password: 'password123' });
            token = loginRes.data.token;
            console.log('   Test user logged in.');
        }

        // 3. Add to Cart
        console.log('3. Adding item to cart...');
        const cartRes = await request('/cart/add', 'POST', { product_id: product.id, quantity: 1 }, token);
        if (cartRes.status !== 200 && cartRes.status !== 201) throw new Error(`Cart add failed: ${JSON.stringify(cartRes.data)}`);
        console.log('   Item added to cart.');

        // 4. Place Order
        console.log('4. Placing order...');
        const orderData = {
            customer_name: 'E2E Test User',
            customer_email: email,
            customer_mobile: mobile,
            address_line1: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456',
            subtotal: product.selling_price,
            delivery_charge: 0,
            discount_amount: 0,
            total_amount: product.selling_price,
            payment_method: 'COD',
            items: [{ product_id: product.id, name: product.name, quantity: 1, selling_price: product.selling_price, weight: product.weight }]
        };
        const orderRes = await request('/orders/place', 'POST', orderData, token);
        if (orderRes.status !== 201) throw new Error(`Order placement failed: ${JSON.stringify(orderRes.data)}`);
        console.log(`   Order placed successfully! Order Number: ${orderRes.data.orderNumber}`);

        console.log('--- E2E Test Completed Successfully ---');
    } catch (err) {
        console.error('--- E2E Test FAILED ---');
        console.error(err.message);
    }
}

runE2ETest();
