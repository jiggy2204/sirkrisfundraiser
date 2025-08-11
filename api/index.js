// =================================================================
//                 Server-Side Logic (Vercel-friendly)
// =================================================================
const express = require('express');
const axios = require('axios');
const path = require('path');
// require('dotenv').config(); // Uncomment this line for local development if you have a .env file

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
// This line now correctly points to the root directory (one level up from 'api')
app.use(express.static(path.join(__dirname, '..')));

// Tiltify Application Auth Credentials (from GitHub Secrets)
const CLIENT_ID = 'ebd80fb51f67410ec181bd052955d0d53519f310befea10888a8c130c339acdf';
const CLIENT_SECRET = process.env.TILTIFY_CLIENT_SECRET; // This must be a GitHub Secret!
const CAMPAIGN_ID = '60eee269-a349-4d82-be22-6e6c2c56cf73';
// The REDIRECT_URI is no longer needed for application authentication.
const TILTIFY_API_URL = 'https://v5api.tiltify.com';

// In-memory token storage
let accessToken = null;
let tokenExpiry = null;

/**
 * Gets an application access token from Tiltify or returns a valid cached one.
 * The token is stored in memory and refreshed when it expires.
 */
async function getTiltifyAccessToken() {
    // Check if the current token is still valid
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
        return accessToken;
    }

    try {
        const tokenResponse = await axios.post(`${TILTIFY_API_URL}/oauth/token`, {
            grant_type: 'client_credentials',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            scope: 'public' // This scope is sufficient for public data
        });

        const data = tokenResponse.data;
        accessToken = data.access_token;
        // Set expiry time a bit before the actual expiry to be safe
        tokenExpiry = Date.now() + (data.expires_in * 1000) - (60 * 1000); // 1 minute buffer

        return accessToken;
    } catch (error) {
        console.error('Application token exchange failed:', error.response ? error.response.data : error.message);
        throw new Error(`Application token exchange failed: ${error.response ? error.response.status : 'Network error'}`);
    }
}

/**
 * Helper function to fetch data from the Tiltify API's donations endpoint.
 * This function now uses the internally managed access token.
 */
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

// =================================================================
//                 Server Endpoints
// =================================================================

// The /api/token endpoint is no longer needed as the server handles authentication internally.

/**
 * Endpoint to get the total donations for a campaign by summing all donations.
 * This endpoint no longer requires an access token from the client.
 */
app.get('/api/donations/total', async (req, res) => {
    try {
        const data = await fetchTiltifyData();
        // Calculate the total amount from the donations data
        const totalAmount = data.data.reduce((sum, donation) => {
            return sum + parseFloat(donation.amount.value);
        }, 0);
        res.json({ total_amount: totalAmount, currency: 'USD' });
    } catch (error) {
        res.status(500).send({ error: `Failed to fetch total donations: ${error.message}` });
    }
});

/**
 * Endpoint to get recent donations for a campaign.
 * This endpoint no longer requires an access token from the client.
 */
app.get('/api/donations', async (req, res) => {
    try {
        const data = await fetchTiltifyData();
        res.json(data);
    } catch (error) {
        res.status(500).send({ error: `Failed to fetch donations: ${error.message}` });
    }
});

/**
 * Endpoint to get campaign goal.
 * This endpoint no longer requires an access token from the client.
 */
app.get('/api/goal', async (req, res) => {
    try {
        const data = await getTiltifyAccessToken();
        const response = await axios.get(`${TILTIFY_API_URL}/api/public/campaigns/${CAMPAIGN_ID}`,{
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if(response.data && response.data.data) {
            const campaignData = response.data.data;
            res.json({
                goal: campaignData.goal ? parseFloat(campaignData.goal.value) : 0,
                currency: campaignData.goal ? campaignData.goal.currency : 'USD',
                amount_raised: campaignData.amount_raisedj ? parseFloat(campaignData.amount_raised.value) : 0,
                total_amount_raised: campaignData.total_amount_raised ? parseFloat(campaignData.total_amount_raised.value) : 0
            });
        } else {
            res.status(404).json({ error: 'Campaign data not found.' });
        };
        
    } catch (err) {
        res.status(500).send({ error: `Failed to fetch donation goal: ${err.message}`});
    }
})

// A catch-all route to serve your index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// IMPORTANT: For Vercel to work, you must export the Express app.
module.exports = app;
