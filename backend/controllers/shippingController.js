const axios = require('axios');
const pool = require('../config/db');

let cachedToken = null;
let tokenExpiry = null; // timestamp in ms when token expires

/**
 * Helper function to retrieve Shiprocket JWT token securely, with in-memory caching.
 */
const getShiprocketToken = async (email, password) => {
    const now = Date.now();
    if (cachedToken && tokenExpiry && now < tokenExpiry) {
        return cachedToken;
    }

    try {
        console.log('Requesting new Shiprocket JWT Access Token...');
        const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
            email,
            password
        });
        
        if (response.data && response.data.token) {
            cachedToken = response.data.token;
            // Cache token for 7 days (lifetime is typically 10 days)
            tokenExpiry = now + 7 * 24 * 60 * 60 * 1000;
            console.log('Shiprocket JWT Access Token established and cached successfully');
            return cachedToken;
        } else {
            throw new Error('Failed to retrieve token from Shiprocket response structure');
        }
    } catch (error) {
        console.error('Shiprocket Authentication Failure:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Calculates shipping rate dynamically using Shiprocket Courier Serviceability API.
 * Falls back to flat delivery charge if disabled, unconfigured, or unserviceable pincode.
 */
const calculateShippingRate = async (req, res) => {
    try {
        const { delivery_postcode, weight, cod, declared_value } = req.body;
        
        // Input validation
        if (!delivery_postcode || delivery_postcode.toString().trim().length !== 6) {
            return res.status(400).json({ message: 'Valid 6-digit delivery pincode is required' });
        }
        
        // Fetch Shiprocket and fallback settings from database
        const [settingsRows] = await pool.query('SELECT setting_key, setting_value FROM settings');
        const settings = {};
        settingsRows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        
        const isEnabled = settings.shiprocket_enabled === 'true';
        const email = settings.shiprocket_email;
        const password = settings.shiprocket_password;
        const pickupPostcode = settings.shiprocket_pickup_postcode || '364001';
        const length = settings.shiprocket_length || '10';
        const width = settings.shiprocket_width || '10';
        const height = settings.shiprocket_height || '10';
        const fallbackCharge = parseFloat(settings.delivery_charge) || 50;
        
        // Fallback if Shiprocket is disabled or lacks complete credentials
        if (!isEnabled || !email || !password) {
            return res.json({ 
                rate: fallbackCharge, 
                rate_type: 'fallback', 
                message: 'Shiprocket logistics unconfigured or disabled' 
            });
        }
        
        try {
            const token = await getShiprocketToken(email, password);
            
            // Format parameters for Shiprocket Serviceability API
            const safeWeight = Math.max(parseFloat(weight) || 0.1, 0.1);
            const safeCod = cod ? 1 : 0;
            const safeValue = parseFloat(declared_value) || 100;
            
            console.log(`Querying Shiprocket for: Pincode=${delivery_postcode}, Weight=${safeWeight}kg, COD=${safeCod}, Val=₹${safeValue}`);
            
            const response = await axios.get('https://apiv2.shiprocket.in/v1/external/courier/serviceability/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    pickup_postcode: pickupPostcode,
                    delivery_postcode: delivery_postcode,
                    weight: safeWeight,
                    cod: safeCod,
                    declared_value: safeValue,
                    length: length,
                    width: width,
                    height: height
                }
            });
            
            if (response.data && response.data.status === 200 && response.data.data) {
                const data = response.data.data;
                const couriers = data.available_courier_companies || [];
                
                if (couriers.length > 0) {
                    let selectedCourier = null;
                    const recommendedId = data.recommended_courier_company_id;
                    
                    // Match the recommended courier if active
                    if (recommendedId) {
                        selectedCourier = couriers.find(c => c.courier_company_id === recommendedId && c.blocked === 0);
                    }
                    
                    // Otherwise find the cheapest active courier
                    if (!selectedCourier) {
                        const activeCouriers = couriers.filter(c => c.blocked === 0);
                        if (activeCouriers.length > 0) {
                            selectedCourier = activeCouriers.reduce((prev, curr) => prev.rate < curr.rate ? prev : curr);
                        }
                    }
                    
                    if (selectedCourier) {
                        console.log(`Shiprocket match: ${selectedCourier.courier_name} with rate ₹${selectedCourier.rate}`);
                        return res.json({
                            rate: parseFloat(selectedCourier.rate),
                            rate_type: 'dynamic',
                            courier_name: selectedCourier.courier_name,
                            etd: selectedCourier.etd,
                            etd_hours: selectedCourier.etd_hours,
                            message: 'Dynamic shipping rate calculated successfully'
                        });
                    }
                }
            }
            
            // Pincode unserviceable
            console.log(`Pincode ${delivery_postcode} is unserviceable by Shiprocket couriers. Using fallback charge.`);
            return res.json({
                rate: fallbackCharge,
                rate_type: 'fallback',
                message: 'Pincode unserviceable by available couriers'
            });
            
        } catch (apiError) {
            console.error('Shiprocket calculation endpoint error, falling back:', apiError.response?.data || apiError.message);
            
            // Invalidate credentials token on unauthorized status code
            if (apiError.response?.status === 401) {
                cachedToken = null;
                tokenExpiry = null;
            }
            
            return res.json({
                rate: fallbackCharge,
                rate_type: 'fallback',
                message: 'Courier computation failed'
            });
        }
        
    } catch (error) {
        console.error('Shipping controller critical error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { calculateShippingRate };
