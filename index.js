// =================================================================
//                 Client-Side Logic (Simplified)
// =================================================================

const appContainer = document.getElementById('app-container');
const preloadingBlock = document.getElementById('preloadingBlock');
const totalDonationsElement = document.getElementById('totalDonations');
const donationListElement = document.getElementById('donationList');

// Determine the base URL for API calls.
const BASE_API_URL = window.location.origin;

// IMPORTANT: Update this REDIRECT_URI to your Vercel URL.
const REDIRECT_URI = 'https://sirkrisfundraiser.vercel.app/';
const AUTHORIZE_URL = 'https://v5api.tiltify.com/oauth/authorize';
const CLIENT_ID = 'ebd80fb51f67410ec181bd052955d0d53519f310befea10888a8c130c339acdf';
const tokenKey = 'tiltify_access_token';

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
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem;">
                <div style="width: 3rem; height: 3rem; border: 4px solid #e2e8f0; border-top-color: #6366f1; border-radius: 9999px; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
                <p style="font-size: 1.125rem; color: #4b5563;">Exchanging authorization code...</p>
            </div>
        `;

        const response = await fetch(`${BASE_API_URL}/api/token`, {
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
        window.history.pushState({}, '', REDIRECT_URI);
        renderDashboard();

    } catch (error) {
        console.error('Token exchange failed:', error);
        appContainer.innerHTML = `
            <p style="color: #ef4444; margin-bottom: 1rem;">❌ Connection failed: ${error.message}</p>
            <p><a href="${REDIRECT_URI}" style="color: #4f46e5; text-decoration: underline;">Try again</a></p>
        `;
    }
}

/**
 * Fetches and displays the total donation amount and a list of donations.
 */
async function renderDashboard() {
    try {
        // Show loading state
        document.getElementById('loadingBlock').style.display = 'block';
        
        // Fetch total donations
        const totalResponse = await fetch(`${BASE_API_URL}/api/donations/total`);
        if (!totalResponse.ok) {
            throw new Error(`Failed to fetch total donations: ${totalResponse.status}`);
        }
        const totalData = await totalResponse.json();
        
        document.getElementById('loadingBlock').style.display = 'none';
        document.getElementById('totalDonations').innerHTML = `$${parseFloat(totalData.total_amount).toFixed(2)}`;

        // Fetch recent donations
        const donationsResponse = await fetch(`${BASE_API_URL}/api/donations`);
        if (!donationsResponse.ok) {
            throw new Error(`Failed to fetch donations: ${donationsResponse.status}`);
        }
        const donationsData = await donationsResponse.json();
        
        let donationsHtml = '<h3 style="font-size: 1.125rem; font-weight: 600; color: #eef3c9; margin-bottom: 0.5rem;">Recent Donations:</h3>';
        if (donationsData.data && donationsData.data.length > 0) {
            preloadingBlock.style.display = 'none';
            contentBlock.style.display = 'flex';
            contentBlock.classList.add('contentBlock');
            document.getElementById('donationList').style.display = 'flex';
            donationsHtml += '<ul class="list-group w-100">';
            donationsData.data.slice(0, 5).forEach(donation => {
                const amount = parseFloat(donation.amount.value).toFixed(2);
                const name = donation.donor_name || 'Anonymous';
                const comment = donation.comment || 'No comment.';
                donationsHtml += `
                    <li class="list-group-item">
                        <div class="d-flex align-items-center justify-content-between">
                            <span class="donorName">${name}</span>
                            <span class="donorAmt">$${amount}</span>
                        </div>
                        <p class="donorComment">"${comment}"</p>
                    </li>
                `;
            });
            donationsHtml += '</ul>';
        } else {
            donationsHtml += '<p style="color: #6b7280;">No recent donations found.</p>';
        }

        document.getElementById('donationList').innerHTML = donationsHtml;

    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('loadingBlock').style.display = 'none';
        preloadingBlock.innerHTML = `
            <p style="color: #ef4444; margin-bottom: 1rem;">❌ Error loading data: ${error.message}</p>
            <button onclick="location.reload()" style="padding: 0.5rem 1rem; background: #4f46e5; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">Retry</button>
        `;
    }
}

/**
 * Initialize the app - just load the dashboard directly
 */
function initializeApp() {
    renderDashboard();
}

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
