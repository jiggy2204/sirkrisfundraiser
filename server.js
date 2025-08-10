// =================================================================
//                 Server-Side Logic
// =================================================================
const express = require('express');
const axios = require('axios');
const path = require('path');
// require('dotenv').config(); // Uncomment this line for local development if you have a .env file

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Assuming your index.html and app.js are in a 'public' folder

// Tiltify OAuth 2.0 Credentials (from GitHub Secrets)
const CLIENT_ID = 'ebd80fb51f67410ec181bd052955d0d53519f310befea10888a8c130c339acdf';
const CLIENT_SECRET = process.env.TILTIFY_CLIENT_SECRET; // This must be a GitHub Secret!
const TILTIFY_API_URL = 'https://v5api.tiltify.com';

// Store access token and its expiry time
let accessToken = null;
let tokenExpiry = null;

// =================================================================
//                 Server Functions
// =================================================================

/**
 * Get a valid access token using Client Credentials flow
 */
async function getAccessToken() {
    // Check if we have a valid token
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
        return accessToken;
    }

    try {
        console.log('Fetching new access token...');
        const tokenResponse = await axios.post(`${TILTIFY_API_URL}/oauth/token`, {
            grant_type: 'client_credentials',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            scope: 'public'
        });

        accessToken = tokenResponse.data.access_token;
        // Set expiry time (subtract 5 minutes for safety)
        const expiresIn = tokenResponse.data.expires_in || 3600; // Default 1 hour
        tokenExpiry = Date.now() + (expiresIn - 300) * 1000;
        
        console.log('Access token obtained successfully');
        return accessToken;

    } catch (error) {
        console.error('Failed to get access token:', error.response ? error.response.data : error.message);
        throw new Error('Authentication failed');
    }
}

/**
 * Helper function to fetch data from the Tiltify API using the stored access token.
 * Replace 'your_campaign_id_here' with your actual campaign ID
 */
async function fetchTiltifyData(endpoint) {
    const campaignId = 'your_campaign_id_here'; // Replace with your actual campaign ID
    
    try {
        const token = await getAccessToken();
        const response = await axios.get(`${TILTIFY_API_URL}/api/v5/campaigns/${campaignId}${endpoint}`, {
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
 * Endpoint to get the total donations for a campaign.
 */
app.get('/api/donations/total', async (req, res) => {
    try {
        const data = await fetchTiltifyData('');
        res.json({ total_amount: data.data.total_amount.value });
    } catch (error) {
        console.error('Error fetching total donations:', error);
        res.status(500).send({ error: `Failed to fetch total donations: ${error.message}` });
    }
});

/**
 * Endpoint to get recent donations for a campaign.
 */
app.get('/api/donations', async (req, res) => {
    try {
        const data = await fetchTiltifyData('/donations');
        res.json(data);
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).send({ error: `Failed to fetch donations: ${error.message}` });
    }
});

// A catch-all route to serve your index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});