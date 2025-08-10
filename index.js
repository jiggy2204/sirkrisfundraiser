// =================================================================
//                 Client-Side Logic (Simplified)
// =================================================================

const appContainer = document.getElementById('app-container');
const preloadingBlock = document.getElementById('preloadingBlock');
const totalDonationsElement = document.getElementById('totalDonations');
const donationListElement = document.getElementById('donationList');

/**
 * Fetches and displays the total donation amount and a list of donations.
 */
async function renderDashboard() {
    try {
        // Show loading state
        document.getElementById('loadingBlock').style.display = 'block';
        
        // Fetch total donations
        const totalResponse = await fetch('/api/donations/total');
        if (!totalResponse.ok) {
            throw new Error(`Failed to fetch total donations: ${totalResponse.status}`);
        }
        const totalData = await totalResponse.json();
        
        document.getElementById('loadingBlock').style.display = 'none';
        document.getElementById('totalDonations').innerHTML = `$${parseFloat(totalData.total_amount).toFixed(2)}`;

        // Fetch recent donations
        const donationsResponse = await fetch('/api/donations');
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