// =================================================================
//                 Server-Side Logic (Vercel-friendly)
//                 Now using Application Auth
// =================================================================
const express = require('express');
const axios = require('axios');
const path = require('path');
// require('dotenv').config(); // Uncomment this line for local development if you have a .env file

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Tiltify OAuth 2.0 Credentials (from GitHub Secrets)
const CLIENT_ID = 'ebd80fb51f67410ec181bd052955d0d53519f310befea10888a8c130c339acdf';
const CLIENT_SECRET = process.env.TILTIFY_CLIENT_SECRET; // This must be a GitHub Secret!
const CAMPAIGN_ID = '60eee269-a349-4d82-be22-6e6c2c56cf73';
const TILTIFY_API_URL = 'https://v5api.tiltify.com';

// Store access token and its expiry time for the application
let accessToken = null;
let tokenExpiry = null;

// =================================================================
//                 Server Functions
// =================================================================

/**
 * Get a valid application access token using Client Credentials flow
 */
async function getAccessToken() {
    // Check if we have a valid token
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
        return accessToken;
    }

    try {
        const response = await axios.post(`${TILTIFY_API_URL}/oauth/token`, {
            grant_type: 'client_credentials',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
        });
        
        accessToken = response.data.access_token;
        // Set expiry to 1 minute before the actual expiry to be safe
        tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
        return accessToken;

    } catch (error) {
        console.error('Error fetching application access token:', error.response ? error.response.data : error.message);
        throw new Error('Failed to get application access token.');
    }
}

/**
 * Helper function to fetch data from the Tiltify API's donations endpoint.
 * This is the single source of truth for donation data.
 */
async function fetchTiltifyData() {
    try {
        const token = await getAccessToken(); // Get the application token
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
//                 Server Endpoints
// =================================================================

/**
 * Endpoint to get the total donations for a campaign by summing all donations.
 */
app.get('/api/donations/total', async (req, res) => {
    try {
        const data = await fetchTiltifyData();
        // Calculate the total amount from the donations data
        const totalAmount = data.data.reduce((sum, donation) => {
            return sum + parseFloat(donation.amount.value);
        }, 0);
        res.json({ total_amount: totalAmount });
    } catch (error) {
        res.status(500).send({ error: `Failed to fetch total donations: ${error.message}` });
    }
});

/**
 * Endpoint to get recent donations for a campaign.
 */
app.get('/api/donations', async (req, res) => {
    try {
        const data = await fetchTiltifyData();
        res.json(data);
    } catch (error) {
        res.status(500).send({ error: `Failed to fetch donations: ${error.message}` });
    }
});

// A catch-all route to serve all static files, including index.html, from the root directory
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', req.originalUrl));
});

// IMPORTANT: For Vercel to work, you must export the Express app.
module.exports = app;
