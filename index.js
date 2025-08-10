// =================================================================
//                 Client-Side Logic (Simplified)
// =================================================================

const appContainer = document.getElementById('app-container');
const preloadingBlock = document.getElementById('preloadingBlock');
const totalDonationsElement = document.getElementById('totalDonations');
const donationListElement = document.getElementById('donationList');

const CLIENT_ID = 'ebd80fb51f67410ec181bd052955d0d53519f310befea10888a8c130c339acdf';
const REDIRECT_URI = 'https://sirkrisfundraiser.vercel.app/';

// Tiltify OAuth 2.0 flow
async function getAccessTokenFromCode(code) {
    try {
        const response = await fetch('/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: code })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to exchange code for token: ${error.error}`);
        }

        const data = await response.json();
        // Store the access token for later use
        localStorage.setItem('tiltify_access_token', data.access_token);
        return data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error);
        return null;
    }
}

async function handleOAuthRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        const accessToken = await getAccessTokenFromCode(code);
        if (accessToken) {
            // Remove the code from the URL for a cleaner look
            window.history.replaceState({}, document.title, REDIRECT_URI);
            return accessToken;
        }
    }
    // If no code, check for a stored token
    return localStorage.getItem('tiltify_access_token');
}


/**
 * Fetches and displays the total donation amount and a list of donations.
 */
async function renderDashboard() {
    try {
        const accessToken = await handleOAuthRedirect();

        if (!accessToken) {
            // If no token, redirect to Tiltify authorization page
            const authUrl = `https://v5api.tiltify.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
            window.location.href = authUrl;
            return;
        }

        // Show loading state
        if (preloadingBlock) {
            preloadingBlock.style.display = 'none';
        }

        // Fetch total donations
        const totalResponse = await fetch('/api/donations/total', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!totalResponse.ok) {
            throw new Error(`Failed to fetch total donations: ${totalResponse.status}`);
        }
        const totalData = await totalResponse.json();

        // Fetch recent donations
        const donationsResponse = await fetch('/api/donations', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!donationsResponse.ok) {
            throw new Error(`Failed to fetch donations: ${donationsResponse.status}`);
        }
        const donationsData = await donationsResponse.json();

        if (preloadingBlock) {
            preloadingBlock.style.display = 'none';
        }

        if (totalDonationsElement) {
            totalDonationsElement.innerHTML = `$${parseFloat(totalData.total_amount).toFixed(2)}`;
        }

        // Render the donations list
        let donationsHtml = '';
        if (donationsData && donationsData.data && donationsData.data.length > 0) {
            donationsHtml += '<ul class="list-group">';
            donationsData.data.forEach(donation => {
                const name = donation.donor_name || 'Anonymous';
                const amount = parseFloat(donation.amount.value).toFixed(2);
                const comment = donation.donor_comment || 'No comment.';
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

        if (donationListElement) {
            donationListElement.innerHTML = donationsHtml;
        }

    } catch (error) {
        console.error('Error fetching data:', error);
        if (preloadingBlock) {
            preloadingBlock.innerHTML = `
                <p style="color: #ef4444; margin-bottom: 1rem;">❌ Error loading data: ${error.message}</p>
                <button onclick="location.reload()" style="padding: 0.5rem 1rem; background: #4f46e5; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">Retry</button>
            `;
        }
    }
}

/**
 * Initialize the app
 */
function initializeApp() {
    renderDashboard();
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', initializeApp);
