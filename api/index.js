// =================================================================
//                 Server-Side Logic (Vercel-friendly)
//                 Save this as: api/index.js
// =================================================================
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// Tiltify Application Auth Credentials
const CLIENT_ID = 'ebd80fb51f67410ec181bd052955d0d53519f310befea10888a8c130c339acdf';
const CLIENT_SECRET = process.env.TILTIFY_CLIENT_SECRET;
const CAMPAIGN_ID = '60eee269-a349-4d82-be22-6e6c2c56cf73';
const TILTIFY_API_URL = 'https://v5api.tiltify.com';

// In-memory token storage
let accessToken = null;
let tokenExpiry = null;

/**
 * Gets an application access token from Tiltify or returns a valid cached one.
 */
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

/**
 * Helper function to fetch data from the Tiltify API's donations endpoint.
 * This now handles pagination to fetch all donations.
 */
async function fetchTiltifyData() {
    try {
        const token = await getTiltifyAccessToken();
        const allDonations = [];
        let nextUrl = `${TILTIFY_API_URL}/api/public/campaigns/${CAMPAIGN_ID}/donations?limit=100`; // Use limit=100 to get max per page

        while (nextUrl) {
            const response = await axios.get(nextUrl, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            allDonations.push(...response.data.data);
            nextUrl = response.data.links.next ? `${TILTIFY_API_URL}${response.data.links.next}` : null;
        }

        return { data: allDonations };
    } catch (error) {
        console.error(`Error fetching from Tiltify API: ${error.response ? error.response.data : error.message}`);
        throw new Error(`API fetch error: ${error.response ? error.response.status : 'Network error'}`);
    }
}

// =================================================================
//                 API Endpoints
// =================================================================

/**
 * Endpoint to get the total donations for a campaign
 */
app.get('/api/donations/total', async (req, res) => {
    try {
        const data = await fetchTiltifyData();
        const totalAmount = data.data.reduce((sum, donation) => {
            return sum + parseFloat(donation.amount.value);
        }, 0);

        res.json({ total_amount: totalAmount, currency: 'USD' });
    } catch (error) {
        console.error('Error in /api/donations/total:', error.message);
        res.status(500).json({ error: `Failed to fetch total donations: ${error.message}` });
    }
});

/**
 * Endpoint to get recent donations for a campaign
 */
app.get('/api/donations', async (req, res) => {
    try {
        const data = await fetchTiltifyData();
        res.json(data);
    } catch (error) {
        console.error('Error in /api/donations:', error.message);
        res.status(500).json({ error: `Failed to fetch donations: ${error.message}` });
    }
});

// Serve the main HTML file for root requests
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Export the Express app for Vercel
module.exports = app;