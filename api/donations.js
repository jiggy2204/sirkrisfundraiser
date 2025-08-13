const axios = require('axios');

// Tiltify Application Auth Credentials
const CLIENT_ID = 'ebd80fb51f67410ec181bd052955d0d53519f310befea10888a8c130c339acdf';
const CLIENT_SECRET = process.env.TILTIFY_CLIENT_SECRET;
const CAMPAIGN_ID = '60eee269-a349-4d82-be22-6e6c2c56cf73';
const TILTIFY_API_URL = 'https://v5api.tiltify.com';

// In-memory token storage
let accessToken = null;
let tokenExpiry = null;

async function getTiltifyAccessToken() {
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
        return accessToken;
    }

    try {
        const tokenResponse = await axios.post(`${TILTIFY_API_URL}/oauth/token`, {
            grant_type: 'client_credentials',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            scope: 'public'
        });

        const data = tokenResponse.data;
        accessToken = data.access_token;
        tokenExpiry = Date.now() + (data.expires_in * 1000) - (60 * 1000);

        return accessToken;
    } catch (error) {
        console.error('Application token exchange failed:', error.response ? error.response.data : error.message);
        throw new Error(`Application token exchange failed: ${error.response ? error.response.status : 'Network error'}`);
    }
}

async function fetchTiltifyData() {
    try {
        const token = await getTiltifyAccessToken();
        const response = await axios.get(`${TILTIFY_API_URL}/api/public/campaigns/${CAMPAIGN_ID}/donations`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching from Tiltify API: ${error.response ? error.response.data : error.message}`);
        throw new Error(`API fetch error: ${error.response ? error.response.status : 'Network error'}`);
    }
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const data = await fetchTiltifyData();
        res.status(200).json(data);
    } catch (error) {
        console.error('Error in /api/donations:', error.message);
        res.status(500).json({ error: `Failed to fetch donations: ${error.message}` });
    }
}