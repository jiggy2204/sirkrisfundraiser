// =================================================================
//                 Client-Side Logic (Combined)
// =================================================================

// OAuth 2.0 Credentials
const CLIENT_ID = 'ebd80fb51f67410ec181bd052955d0d53519f310befea10888a8c130c339acdf';
const REDIRECT_URI = 'http://localhost:3000/'; // We will now redirect to the same page
const AUTHORIZE_URL = 'https://v5api.tiltify.com/oauth/authorize';

const appContainer = document.getElementById('app-container');
const tokenKey = 'tiltify_access_token';

/**
 * Renders the login page with a button to initiate the OAuth flow.
 */
function renderLoginPage() {
    appContainer.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Connect to Tiltify</h1>
        <p class="text-gray-600 mb-6">Authorize this application to view your campaign data.</p>
        <button id="connectBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl">
            Connect to Tiltify
        </button>
    `;
    document.getElementById('connectBtn').addEventListener('click', redirectToTiltify);
}

/**
 * Initiates the authorization process by redirecting the user to Tiltify.
 */
function redirectToTiltify() {
    const authUrl = `${AUTHORIZE_URL}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=public`;
    window.location.href = authUrl;
}

/**
 * Handles the OAuth callback. Extracts the authorization code and exchanges it for a token.
 * @param {string} code The authorization code from the URL.
 */
async function handleCallback(code) {
    try {
        // Display loading state
        appContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-indigo-500 border-gray-200 mb-4"></div>
                <p class="text-lg text-gray-700">Exchanging authorization code...</p>
            </div>
        `;

        const response = await fetch('/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        localStorage.setItem(tokenKey, data.access_token);
        // Redirect to clean the URL and load the dashboard
        window.history.pushState({}, '', '/');
        renderDashboard();

    } catch (error) {
        console.error('Token exchange failed:', error);
        appContainer.innerHTML = `
            <p class="text-red-500 mb-4">❌ Connection failed: ${error.message}</p>
            <p><a href="/" class="text-indigo-600 hover:underline">Try again</a></p>
        `;
    }
}

/**
 * Fetches and displays the total donation amount and a list of donations.
 */
async function renderDashboard() {
    appContainer.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Tiltify Campaign Dashboard</h1>
        <p class="text-gray-600 mb-6">Donations and total amount</p>
        <div class="bg-indigo-50 p-6 rounded-lg mb-6">
            <p class="text-sm font-medium text-indigo-600">Total amount raised</p>
            <div id="total-donations" class="text-5xl font-extrabold text-indigo-800 mt-2">
                $0.00 <!-- Static placeholder -->
            </div>
        </div>
        <div id="donations-list" class="text-left">
            <p class="text-lg font-semibold text-gray-800 mb-2">Recent Donations:</p>
            <div class="animate-pulse flex space-x-4">
                <div class="flex-1 space-y-4 py-1">
                    <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div class="space-y-2">
                        <div class="h-4 bg-gray-200 rounded"></div>
                        <div class="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    try {
        // Fetch recent donations
        const donationsResponse = await fetch('/api/donations');
        const donationsData = await donationsResponse.json();
        
        let donationsHtml = '<p class="text-lg font-semibold text-gray-800 mb-2">Recent Donations:</p>';
        if (donationsData.data && donationsData.data.length > 0) {
            donationsHtml += '<ul class="divide-y divide-gray-200">';
            donationsData.data.slice(0, 5).forEach(donation => {
                const amount = parseFloat(donation.amount.value).toFixed(2);
                const name = donation.donor_name || 'Anonymous';
                const comment = donation.comment || 'No comment.';
                donationsHtml += `
                    <li class="py-4 flex flex-col">
                        <div class="flex items-center justify-between">
                            <span class="font-medium text-gray-900">${name}</span>
                            <span class="font-bold text-green-600">$${amount}</span>
                        </div>
                        <p class="text-gray-500 text-sm mt-1">"${comment}"</p>
                            </li>
                        `;
                    });
                    donationsHtml += '</ul>';
                } else {
                    donationsHtml += '<p class="text-gray-500">No recent donations found.</p>';
                }

                document.getElementById('donations-list').innerHTML = donationsHtml;

            } catch (error) {
                console.error('Error fetching data:', error);
                document.getElementById('donations-list').innerHTML = `<p class="text-red-500">Error fetching donations. Please refresh the page.</p>`;
            }
        }

        /**
         * Main function to initialize the application.
         * Checks for an authorization code or an existing token.
         */
        function initializeApp() {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const error = urlParams.get('error');
            const accessToken = localStorage.getItem(tokenKey);

            if (code) {
                // We've returned from the OAuth flow. Exchange the code for a token.
                handleCallback(code);
            } else if (accessToken) {
                // An access token exists. Render the dashboard immediately.
                renderDashboard();
            } else if (error) {
                // An error occurred during the OAuth flow.
                appContainer.innerHTML = `<p class="text-red-500">❌ Authorization failed: ${error}</p>`;
            } else {
                // No token and no code. Display the login page.
                renderLoginPage();
            }
        }

        // Initialize the app when the DOM is ready
        document.addEventListener('DOMContentLoaded', initializeApp);
