// =================================================================
//                 Client-Side Logic (Application Auth)
// =================================================================
const appContainer = document.getElementById('app-container');
const preloadingBlock = document.getElementById('preloadingBlock');
const loadingBlock = document.getElementById('loadingBlock');
const contentBlock = document.getElementById('contentBlock');
const donationListElement = document.getElementById('donationList');
const totalDonationElement = document.getElementById('donationTextTotal');

// Initialize the progress SVG
let progressSVG = null;

// Real-time update variables
let updateInterval = null;
const UPDATE_FREQUENCY = 10000; // 10 seconds
let lastTotalAmount = 0;

// Determine the base URL for API calls.
const BASE_API_URL = window.location.origin;

/**
 * Fetches and displays the total donation amount and a list of donations.
 * This function now directly calls the server-side API endpoints
 * without needing a client-side access token.
 */
async function renderDashboard(isInitialLoad = false) {
    try {
        // Show loading state only on initial load
        if (isInitialLoad) {
            if (preloadingBlock) {
                preloadingBlock.style.display = 'block';
            }
            if (loadingBlock) {
                loadingBlock.style.display = 'block';
            }
            if (contentBlock) {
                contentBlock.style.display = 'none';
            }

            // Initialize the SVG progress indicator
            if (!progressSVG) {
                progressSVG = new ProgressSVG('progress-svg-container');
                progressSVG.initialize();
            }
        }
        
        // Hardcoded campaign goal to $500.
        // The API call to fetch the goal is no longer needed.
        const goalAmount = 500;

        // Fetch total donations
        const totalResponse = await fetch(`${BASE_API_URL}/api/donations/total`);
        if (!totalResponse.ok) {
            throw new Error(`Failed to fetch total donations: ${totalResponse.status}`);
        }
        const totalData = await totalResponse.json();

        // Hide loading state and show content only on initial load
        if (isInitialLoad) {
            if (preloadingBlock) {
                preloadingBlock.style.display = 'none';
            }
            if (loadingBlock) {
                loadingBlock.style.display = 'none';
            }
            if (contentBlock) {
                contentBlock.style.display = 'flex';
            }
        }

        // Update the SVG progress with actual data
        const currentAmount = totalData.total_amount || 0;
        
        // Only animate if the amount has changed
        if (currentAmount !== lastTotalAmount || isInitialLoad) {
            progressSVG.updateProgress(currentAmount, goalAmount);
            lastTotalAmount = currentAmount;

            // Show celebration effect for new donations (only after initial load)
            if (!isInitialLoad && currentAmount > lastTotalAmount) {
                showNewDonationEffect();
            }
        }

        // Create current donation total
        if(totalDonationElement){
            totalDonationElement.style.display = 'block';
            totalDonationElement.textContent = `$${parseFloat(currentAmount).toFixed(2)}`;
        }
        

        // Fetch recent donations
        const donationsResponse = await fetch(`${BASE_API_URL}/api/donations`);
        if (!donationsResponse.ok) {
            throw new Error(`Failed to fetch donations: ${totalResponse.status}`);
        }
        const donationsData = await donationsResponse.json();
        
        let donationsHtml = `<h3 style="font-size: 1.125rem; font-weight: 600; color: #eef3c9; margin-bottom: 0.5rem;">Recent Donations:</h3>`;
        if (donationsData.data && donationsData.data.length > 0) {
            if (donationListElement) {
                donationListElement.style.display = 'flex';
            }
            donationsHtml += '<ul class="list-group w-100">';
            donationsData.data.slice(0, 5).forEach(donation => {
                const amount = parseFloat(donation.amount.value).toFixed(2);
                const name = donation.donor_name || 'Anonymous';
                const comment = donation.donor_comment || 'No comment';
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
        // Only show error UI on initial load to avoid disrupting the user experience
        if (isInitialLoad) {
            if (preloadingBlock) {
                preloadingBlock.style.display = 'block';
                preloadingBlock.innerHTML = `
                    <p style="color: #ef4444; margin-bottom: 1rem;">❌ Error loading data: ${error.message}</p>
                    <button onclick="location.reload()" style="padding: 0.5rem 1rem; background: #4f46e5; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">Retry</button>
                `;
            }
            if (loadingBlock) {
                loadingBlock.style.display = 'none';
            }
            if (contentBlock) {
                contentBlock.style.display = 'none';
            }
        }
    }
}

/**
 * Shows a brief visual effect when a new donation is received
 */
function showNewDonationEffect() {
    if (totalDonationElement) {
        // Add a brief highlight effect
        const originalColor = totalDonationElement.style.color;
        totalDonationElement.style.color = '#16a34a';
        totalDonationElement.style.transform = 'scale(1.1)';
        totalDonationElement.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            totalDonationElement.style.color = originalColor;
            totalDonationElement.style.transform = 'scale(1)';
        }, 1000);
    }
}

/**
 * Starts the real-time update polling
 */
function startRealTimeUpdates() {
    // Clear any existing interval
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    // Set up periodic updates
    updateInterval = setInterval(() => {
        renderDashboard(false); // false = not initial load
    }, UPDATE_FREQUENCY);
    
    console.log(`Real-time updates started (every ${UPDATE_FREQUENCY/1000} seconds)`);
}

/**
 * Stops the real-time update polling
 */
function stopRealTimeUpdates() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
        console.log('Real-time updates stopped');
    }
}

/**
 * Initialize the app - load the dashboard and start real-time updates
 */
async function initializeApp() {
    await renderDashboard(true); // true = initial load
    startRealTimeUpdates();
}

// Clean up interval when page is about to unload
window.addEventListener('beforeunload', () => {
    stopRealTimeUpdates();
});

// Handle page visibility changes (pause updates when tab is not visible)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopRealTimeUpdates();
    } else {
        startRealTimeUpdates();
    }
});

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);