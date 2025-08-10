// =================================================================
//                 Client-Side Logic (Simplified)
// =================================================================

const appContainer = document.getElementById('app-container');
const preloadingBlock = document.getElementById('preloadingBlock');
const loadingBlock = document.getElementById('loadingBlock');
const totalDonationsElement = document.getElementById('totalDonations');
const donationListElement = document.getElementById('donationList');

/**
 * Fetches and displays the total donation amount and a list of donations.
 */
async function renderDashboard() {
    try {
        // Show loading state
        if (preloadingBlock) {
            preloadingBlock.style.display = 'block';
        }

        // Fetch total donations
        const totalResponse = await fetch('/api/donations/total');

        if (!totalResponse.ok) {
            throw new Error(`Failed to fetch total donations: ${totalResponse.status}`);
        }
        const totalData = await totalResponse.json();

        // Fetch recent donations
        const donationsResponse = await fetch('/api/donations');

        if (!donationsResponse.ok) {
            throw new Error(`Failed to fetch donations: ${donationsResponse.status}`);
        }
        const donationsData = await donationsResponse.json();

        // Hide loading state and display data
        if (preloadingBlock) {
            preloadingBlock.style.display = 'none';
        }

        // Hide loading state and display data
        if (loadingBlock) {
            loadingBlock.style.display = 'none';
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
