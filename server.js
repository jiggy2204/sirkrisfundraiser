// =================================================================
//                 Server-Side Logic
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
const CAMPAIGN_ID = '60eee269-a349-4d82-be22-6e6c2c56cf73';
// IMPORTANT: This REDIRECT_URI must match the URL you provided in the client-side code and in Tiltify's app settings.
const REDIRECT_URI = 'https://sirkrisfundraiser.vercel.app/';
const TILTIFY_API_URL = 'https://v5api.tiltify.com';

// =================================================================
//                 Server Endpoints
// =================================================================

/**
 * Endpoint to exchange the authorization code for an access token.
 * This is the only place where the CLIENT_SECRET should be used.
 */
app.post('/api/token', async (req, res) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).send({ error: 'Authorization code is missing.' });
    }

    try {
        const tokenResponse = await axios.post(`${TILTIFY_API_URL}/oauth/token`, {
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code: code,
        });

        // Tiltify's response should contain the access token
        res.json(tokenResponse.data);

    } catch (error) {
        console.error('Token exchange failed:', error.response ? error.response.data : error.message);
        res.status(500).send({
            error: `Token exchange failed: ${error.response ? error.response.status : 'Network error'} - ${JSON.stringify(error.response ? error.response.data : 'No response data')}`,
            details: 'Check server logs for more information'
        });
    }
});

/**
 * Helper function to fetch data from the Tiltify API using the provided access token.
 * We'll use a placeholder for the campaign ID for now.
 * In a real-world app, you might get this dynamically or from a config file.
 */
async function fetchTiltifyData(accessToken) {
    try {
        const response = await axios.get(`${TILTIFY_API_URL}/api/public/campaigns/${CAMPAIGN_ID}/donations`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching from Tiltify API: ${error.response ? error.response.data : error.message}`);
        throw new Error(`API fetch error: ${error.response ? error.response.status : 'Network error'}`);
    }
}

/**
 * Endpoint to get the total donations for a campaign by summing all donations.
 */
app.get('/api/donations/total', async (req, res) => {
    const accessToken = req.headers.authorization ? req.headers.authorization.split(' ')[1] : req.query.accessToken;

    if (!accessToken) {
        return res.status(401).send({ error: 'Access token is missing.' });
    }

    try {
        const data = await fetchTiltifyData(accessToken);
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
 * It expects the access token to be passed in a query parameter or header.
 */
app.get('/api/donations', async (req, res) => {
    const accessToken = req.headers.authorization ? req.headers.authorization.split(' ')[1] : req.query.accessToken;

    if (!accessToken) {
        return res.status(401).send({ error: 'Access token is missing.' });
    }

    try {
        const data = await fetchTiltifyData(accessToken);
        res.json(data);
    } catch (error) {
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
