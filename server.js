// =================================================================
//                 Server-Side Code - server.js
// =================================================================

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

// Load environment variables from .env file
require('dotenv').config();

// OAuth 2.0 Configuration
const CLIENT_ID = 'ebd80fb51f67410ec181bd052955d0d53519f310befea10888a8c130c339acdf';
const CLIENT_SECRET = process.env.TILTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'https://jiggy2204.github.io/sirkrisfundraiser/';
const TOKEN_URL = 'https://v5api.tiltify.com/oauth/token';

// Tiltify API Base URLs
// Note: The Tiltify V5 API uses different base paths for public and authenticated calls.
const PUBLIC_API_BASE_URL = 'https://v5api.tiltify.com/api/public/';
const AUTH_API_BASE_URL = 'https://v5api.tiltify.com/api/v5/';

const CAMPAIGN_ID = '60eee269-a349-4d82-be22-6e6c2c56cf73'; // Your specific campaign ID

// Store the access globally (in production, consider using a database or secure storage)
let accessToken = null;
let tokenExpiration = null;

/**
 * Exchanges an authorization code for an access token from Tiltify.
 * @param {string} authorizationCode The code received from the OAuth callback.
 * @returns {Promise<object>} A promise that resolves with the token data.
 */
async function exchangeCodeForToken(authorizationCode) {
    return new Promise((resolve, reject) => {
        console.log('--- Initiating Token Exchange ---');
        console.log('Authorization Code:', authorizationCode);

        const formData = querystring.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: authorizationCode,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code'
        });

        const tokenUrl = new URL(TOKEN_URL);

        const req = https.request({
            hostname: tokenUrl.hostname,
            port: tokenUrl.port || 443,
            path: tokenUrl.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(formData),
                'User-Agent': 'Node.js OAuth Client'
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('--- Token Exchange Response ---');
                console.log('Status:', res.statusCode);
                console.log('Body:', data);

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const tokenData = JSON.parse(data);
                        accessToken = tokenData.access_token;
                        tokenExpiration = new Date(Date.now() + (tokenData.expires_in * 1000));
                        console.log('Token successfully stored. Expires at:', tokenExpiration);
                        resolve(tokenData);
                    } catch (error) {
                        console.error('Failed to parse token response:', error);
                        reject(new Error('Invalid JSON response from Tiltify'));
                    }
                } else {
                    reject(new Error(`Token exchange failed: ${res.statusCode} ${res.statusMessage} - ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });

        req.write(formData);
        req.end();
    });
}

/**
 * Makes a public API call to the Tiltify API.
 * This is a server-side utility function.
 * @param {string} endpoint The API endpoint to call (e.g., 'campaigns/{id}/donations').
 * @returns {Promise<object>} A promise that resolves with the API response data.
 */
async function makePublicAPICall(endpoint) {
    return new Promise((resolve, reject) => {
        const apiUrl = new URL(endpoint, PUBLIC_API_BASE_URL);
        const headers = {
            'User-Agent': 'Node.js Tiltify Client',
            'Accept': 'application/json'
        };

        // Include the access token in the header if available
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const req = https.request({
            hostname: apiUrl.hostname,
            port: apiUrl.port || 443,
            path: apiUrl.pathname + apiUrl.search,
            method: 'GET',
            headers: headers
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('--- Public API Call Response ---');
                console.log('Endpoint:', endpoint);
                console.log('Status:', res.statusCode);
                console.log('Body:', data);

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const responseData = JSON.parse(data);
                        resolve(responseData);
                    } catch (error) {
                        console.error('Failed to parse API response:', error);
                        reject(new Error('Invalid JSON response from Tiltify API'));
                    }
                } else {
                    reject(new Error(`Public API call failed: ${res.statusCode} ${res.statusMessage} - ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('Public API request error:', error);
            reject(error);
        });

        req.end();
    });
}

/**
 * Makes an authenticated API call to the Tiltify API.
 * This is a server-side utility function.
 * @param {string} endpoint The API endpoint to call (e.g., 'current-user').
 * @returns {Promise<object>} A promise that resolves with the API response data.
 */
async function makeAuthenticatedAPICall(endpoint) {
    return new Promise((resolve, reject) => {
        if (!accessToken) {
            reject(new Error('No access token available. Please authenticate first.'));
            return;
        }

        if (tokenExpiration && new Date() > tokenExpiration) {
            reject(new Error('Access token has expired. Please re-authenticate.'));
            return;
        }

        const apiUrl = new URL(endpoint, AUTH_API_BASE_URL);

        const req = https.request({
            hostname: apiUrl.hostname,
            port: apiUrl.port || 443,
            path: apiUrl.pathname + apiUrl.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'Node.js Tiltify Client',
                'Accept': 'application/json'
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('--- Authenticated API Call Response ---');
                console.log('Endpoint:', endpoint);
                console.log('Status:', res.statusCode);
                console.log('Body:', data);

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const responseData = JSON.parse(data);
                        resolve(responseData);
                    } catch (error) {
                        console.error('Failed to parse API response:', error);
                        reject(new Error('Invalid JSON response from Tiltify API'));
                    }
                } else {
                    reject(new Error(`Authenticated API call failed: ${res.statusCode} ${res.statusMessage} - ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('Authenticated API request error:', error);
            reject(error);
        });

        req.end();
    });
}

// Simple HTTP server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API endpoint for token exchange (from client)
    if (pathname === '/api/token' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { code } = JSON.parse(body);
                console.log('Received authorization code, exchanging for token...');
                const tokenData = await exchangeCodeForToken(code);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(tokenData));
            } catch (error) {
                console.error('Token exchange error:', error.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    error: error.message,
                    details: 'Check server logs for more information'
                }));
            }
        });
        return;
    }

    // New API endpoint for getting donations (from client)
    if (pathname === '/api/donations' && req.method === 'GET') {
        try {
            console.log(`Fetching donations for campaign ID: ${CAMPAIGN_ID}`);
            // Use makePublicAPICall with the CAMPAIGN_ID, which will now also include the access token if it exists
            const donationsData = await makePublicAPICall(`campaigns/${CAMPAIGN_ID}/donations`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(donationsData));
        } catch (error) {
            console.error('Donations API error:', error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
        return;
    };

        // New API endpoint for getting the total amount of donations
    if (pathname === '/api/donations/total' && req.method === 'GET') {
        try {
            console.log(`Calculating total donations for campaign ID: ${CAMPAIGN_ID}`);
            const donationsData = await makePublicAPICall(`campaigns/${CAMPAIGN_ID}/donations`);
            
            // Calculate the total sum of donations
            const totalAmount = donationsData.data.reduce((sum, donation) => {
                // Parse the amount value from string to a number (float) and add to the sum
                const donationValue = parseFloat(donation.amount.value);
                return sum + (isNaN(donationValue) ? 0 : donationValue);
            }, 0);

            // Format the response
            const response = {
                total_amount: totalAmount.toFixed(2), // Format to 2 decimal places
                currency: 'USD',
                campaign_id: CAMPAIGN_ID
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
        } catch (error) {
            console.error('Total donations API error:', error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
        return;
    };

    // Serve static files and handle callback route
    let filePath = pathname;
    
    if (pathname === '/callback') {
        filePath = '/callback.html';
    } else if (pathname === '/') {
        filePath = '/index.html';
    }
    
    filePath = path.join(__dirname, filePath);

    try {
        const data = fs.readFileSync(filePath);
        const ext = path.extname(filePath);
        let contentType = 'text/html';

        if (ext === '.js') contentType = 'text/javascript';
        else if (ext === '.css') contentType = 'text/css';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    } catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Make sure to set TILTIFY_CLIENT_SECRET environment variable');
    console.log(`CLIENT_ID: ${CLIENT_ID}`);
    console.log(`REDIRECT_URI: ${REDIRECT_URI}`);
});
