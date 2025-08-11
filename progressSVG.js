// =================================================================
//                 SVG Progress Animation Logic
// =================================================================

/**
 * ProgressSVG - Handles all SVG creation and animation logic
 */
class ProgressSVG {
    constructor(containerId) {
        this.containerId = containerId;
        this.currentTotal = 0;
        this.goalAmount = 0;
        this.isInitialized = false;
    }

    /**
     * Creates and initializes the animated SVG progress indicator
     */
    initialize() {
        const svgContainer = document.getElementById(this.containerId);
        if (!svgContainer) {
            console.warn(`SVG container with id="${this.containerId}" not found.`);
            return false;
        }

        svgContainer.innerHTML = this.generateSVGHTML();
        this.isInitialized = true;
        return true;
    }

    /**
     * Generates the complete SVG HTML structure
     * @returns {string} The SVG HTML string
     */
    generateSVGHTML() {
        return `
            <div style="position: relative; width: 300px; height: 300px; margin: 0 auto;">
                <svg width="300" height="300" viewBox="0 0 1468.78 1468.78" style="position: absolute; top: 0; left: 0;">
                    <defs>
                        <!-- Clipping path that will animate from bottom to top -->
                        <clipPath id="progressClip">
                            <rect x="0" y="0" width="1468.78" height="1468.78" 
                                  style="transform-origin: bottom; transform: scaleY(0);" 
                                  id="progressRect"/>
                        </clipPath>
                        <!-- Gradient for a nice fill effect -->
                        <linearGradient id="progressGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" style="stop-color:#4ade80;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#22c55e;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#16a34a;stop-opacity:1" />
                        </linearGradient>
                    </defs>

                    <!-- Color layer (clipped for progress) -->
                    <g clip-path="url(#progressClip)">
                        <circle cx="734.39" cy="734.39" r="733.39" fill="url(#progressGradient)"/>
                        ${this.generateColoredPaths()}
                    </g>

                    <!-- Outline layer (always visible) -->
                    ${this.generateOutlinePaths()}
                </svg>
                
                <!-- Progress text overlay -->
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                            text-align: center; color: #333; font-weight: bold; font-size: 14px;">
                    <div id="progress-percentage">0%</div>
                    <div style="font-size: 12px; margin-top: 4px;" id="progress-text">$0 / $0</div>
                </div>
            </div>
        `;
    }

    /**
     * Generates the colored SVG paths for the hat and monocle
     * @returns {string} Colored paths HTML
     */
    generateColoredPaths() {
        return `
            <g id="hatColor">
                <g id="hatColor-2" data-name="hatColor">
                    <path d="M1082,191.65l-316.11,45.59c.69,5.09.78,10.46.21,16.09-1.75,27.9-39.96,26.48-61.23,38.75-25.3,16.31-54.32,22.78-82.68,33.77-3.22,1.61-7.25,5.65-13.05,5.33,20.49,14.34,42.91,26.09,56.31,47.2,19.37,30.61,27.95,66.24,36.37,100.74,17.64,82.69,33.67,162.16,31.16,248.9.01,16.12-5.13,28.38-7.54,43.7-3.52,31.6-7.2,62.07-22.66,90.78-22.37,44.68-53.46,76.79-86.33,112.61-9.99,10.65-26.27,9.53-35.13,20.02-10.57,11.2-21.84,21.06-33.61,30.01,224.78.73,616.3-17.73,562.3-170.48-76-215-28-663-28-663Z" fill="#22c55e"/>
                    <path d="M218.78,876.78c32.55-21.95,71.23-33.27,110.73-38.95,20.31-2.92,39.81-11.48,54.32-22.78,2.24-1.46,3.93-3.45,5.21-5.87-177.88,48.91-292.84,107.45-286.09,154.44,2.91,20.28,29.97,39.87,75.13,56.42-1.88-2.55-3.7-5.1-5.46-7.64-32.45-49.47,4.1-107.7,46.16-135.63Z" fill="#16a34a"/>
                    <path d="M721.72,741.9c6.43,22.12,6.89,46.63,2.61,70.29.32,2.25,1.94,5.48.97,6.77-10.31,16.45-18.52,31.45-25.27,48.55-19.94,53.54-72.64,79.54-110.99,117.31-23.2,22.91-46.08,40.02-73.8,55.52-7.41,4.52-16.6,4.69-24.18,8.08-12.15,5.75-24.33,11.31-36.54,16.66,96.92,4.13,206.88-.15,320.64-16.5,348.73-50.12,600.96-194.59,590.63-266.45-10.27-71.44-290.81-78.47-644.09-40.22Z" fill="#22c55e"/>
                    <path d="M284.66,306.4c-.59,2.38-1.16,4.77-1.71,7.16-1.92,10.64-.94,25.47,5.83,32.56,7.1,9.34,25.96,4.33,33.39,15.93,24.86,36.74,26.67,81.4,38.64,124.6,12.78,48.84,13.14,99.46,24.79,148.47,9.23,40.14,6.84,79.64,5.91,121.24-.47,20.8,6.01,49.81-7.69,58.7-4.94,3.85-10.47,7.37-16.41,10.47,22.75,116.31,30.66,195.94,30.66,195.94,0,0,61.38-1.09,148.93-.81,11.77-8.95,18.69-18.48,33-28,8.86-10.49,22.11-19.28,33-29,37-33,67.39-56.47,89.76-101.15,15.45-28.71,19.14-59.18,22.66-90.78,2.4-15.33,7.55-27.58,7.54-43.7,2.51-86.74-13.52-166.21-31.16-248.9-8.42-34.5-16.99-70.12-36.37-100.74-13.4-21.11-35.82-32.86-56.31-47.2,5.8.32,9.83-3.72,13.05-5.33,28.37-10.99,57.39-17.46,82.68-33.77,21.27-12.27,59.48-10.85,61.23-38.75.58-5.64.48-11-.21-16.09l-481.23,69.16Z" fill="#4ade80"/>
                    <path d="M391.51,756.36c.93-41.6,3.32-81.1-5.91-121.24-11.65-49-12.02-99.63-24.79-148.47-11.97-43.2-13.78-87.86-38.64-124.6-7.43-11.61-26.29-6.59-33.39-15.93-6.78-7.09-7.76-21.92-5.83-32.56.55-2.38,1.12-4.77,1.71-7.16l-77.6,11.15c83.45,172.26,132.79,367.04,160.35,507.96,5.94-3.1,11.47-6.62,16.41-10.47,13.69-8.88,7.22-37.9,7.69-58.7Z" fill="#4ade80"/>
                    <path d="M721.72,741.9c-2.02.28-4.03.57-6.04.86-120.7,17.35-232.48,40.54-326.64,66.42-1.28,2.42-2.97,4.41-5.21,5.87-14.5,11.3-34,19.86-54.32,22.78-39.5,5.68-78.18,17-110.73,38.95-42.05,27.93-78.61,86.16-46.16,135.63,1.76,2.53,3.58,5.09,5.46,7.64,62.64,22.95,160.14,40.06,276.45,45.03,12.21-5.35,24.39-10.91,36.54-16.66,7.57-3.4,16.76-3.57,24.18-8.08,27.71-15.5,50.6-32.61,73.8-55.52,38.34-37.77,91.04-63.77,110.99-117.31,6.76-17.1,14.97-32.09,25.27-48.55.96-1.29-.65-4.52-.97-6.77,4.28-23.66,3.82-48.17-2.61-70.29Z" fill="#4ade80"/>
                </g>
                <g id="monacleColor">
                    <path d="M981.73,1293.61c.32-.64.67-1.28,1.06-1.91-3.27.29-6.59.44-9.94.44-62.07,0-112.39-50.32-112.39-112.39s50.32-112.39,112.39-112.39c44.94,0,83.71,26.38,101.7,64.49,3.77-.54,7.11-2.56,9.19-6.36,2.03-4.27,2.71-8.68,2.36-13.11-22.84-38.2-64.61-63.78-112.35-63.78-72.25,0-130.81,68.01-130.81,140.26s58.57,121.37,130.81,121.37c2.87,0,5.71-.1,8.53-.28-2.44-5.06-2.9-11.16-.55-16.33Z" fill="#ffd700"/>
                    <path d="M1104.56,1179.42c0-24.5-6.74-47.42-18.47-67.03.35,4.43-.33,8.84-2.36,13.11-2.08,3.8-5.41,5.83-9.19,6.36,6.85,14.53,10.7,30.77,10.7,47.9,0,58.73-45.04,106.92-102.46,111.95-.39.63-.74,1.27-1.06,1.91-2.35,5.17-1.89,11.28.55,16.33,68.27-4.4,122.28-61.15,122.28-130.53Z" fill="#ffcc00"/>
                </g>
            </g>
        `;
    }

    /**
     * Generates the outline SVG paths
     * @returns {string} Outline paths HTML
     */
    generateOutlinePaths() {
        return `
            <g id="IconOutline" fill="none" stroke="#000" stroke-width="2">
                <circle cx="734.39" cy="734.39" r="733.39"/>
                <g id="HatColor">
                    <g id="hat">
                        <path d="M1365.81,782.12c-6.44-44.77-114.35-65.07-284.81-64.47-26.06-204.41-3.51-473.22,2.09-519.18.89-2.36,1.19-4.67.87-6.91,0,0,0-.02,0-.02,0,0,0,0,0,0h0c-5.31-36.28-171.15-43.11-382.61-18.1-21.65,2.56-43.77,5.45-66.25,8.68-151.49,21.77-283.2,53.66-359.19,84.28-45.46,18.32-70.97,36.18-68.84,51.16h0s0,0,0,0c0,0,0,.01,0,.02.37,2.58,1.56,5.02,3.51,7.3,79.44,166.5,127.41,352.89,154.92,490.94-164.4,47.5-269,102.92-262.55,147.8,2.91,20.28,29.97,39.87,75.13,56.42,62.64,22.95,160.14,40.06,276.45,45.03,96.92,4.13,206.88-.15,320.64-16.5,348.73-50.12,600.96-194.59,590.63-266.45Z" stroke-width="3"/>
                        <path d="M1072,624.65s-399.18,168.53-667.13,119.59c-.05-.04-.1-.08-.15-.12-21.05-3.87-39.49-8.73-58.72-15.47l19,87s17.92,20.19,44.34,26.82c-.05.02-.11.05-.16.07,104.94,26.3,393.17,71.75,671.37-124.19l-8.55-93.7Z" stroke-width="3"/>
                    </g>
                    <g id="monacleLens">
                        <path d="M981.73,1293.61c.32-.64.67-1.28,1.06-1.91-3.27.29-6.59.44-9.94.44-62.07,0-112.39-50.32-112.39-112.39s50.32-112.39,112.39-112.39c44.94,0,83.71,26.38,101.7,64.49,3.77-.54,7.11-2.56,9.19-6.36,2.03-4.27,2.71-8.68,2.36-13.11-22.84-38.2-64.61-63.78-112.35-63.78-72.25,0-130.81,68.01-130.81,140.26s58.57,121.37,130.81,121.37c2.87,0,5.71-.1,8.53-.28-2.44-5.06-2.9-11.16-.55-16.33Z" stroke-width="3.29"/>
                        <path d="M1104.56,1179.42c0-24.5-6.74-47.42-18.47-67.03.35,4.43-.33,8.84-2.36,13.11-2.08,3.8-5.41,5.83-9.19,6.36,6.85,14.53,10.7,30.77,10.7,47.9,0,58.73-45.04,106.92-102.46,111.95-.39.63-.74,1.27-1.06,1.91-2.35,5.17-1.89,11.28.55,16.33,68.27-4.4,122.28-61.15,122.28-130.53Z" stroke-width="3.29"/>
                    </g>
                </g>
            </g>
        `;
    }

    /**
     * Animates the SVG progress fill
     * @param {number} currentAmount - Current donation amount
     * @param {number} goalAmount - Target goal amount
     */
    updateProgress(currentAmount, goalAmount) {
        if (!this.isInitialized) {
            console.warn('SVG not initialized. Call initialize() first.');
            return;
        }

        this.currentTotal = currentAmount || 0;
        this.goalAmount = goalAmount || 0;

        const progressRect = document.getElementById('progressRect');
        const progressPercentage = document.getElementById('progress-percentage');
        const progressText = document.getElementById('progress-text');
        
        if (!progressRect) {
            console.warn('Progress rect element not found.');
            return;
        }

        // Calculate percentage and clamp between 0 and 100
        const percentage = this.goalAmount > 0 ? (this.currentTotal / this.goalAmount) * 100 : 0;
        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        const scaleY = clampedPercentage / 100;

        // Animate the fill
        progressRect.style.transition = 'transform 2s ease-out';
        progressRect.style.transform = `scaleY(${scaleY})`;

        // Update text elements
        if (progressPercentage) {
            progressPercentage.textContent = `${Math.round(clampedPercentage)}%`;
        }
        
        if (progressText) {
            progressText.textContent = `$${this.currentTotal.toFixed(2)} / $${this.goalAmount.toFixed(2)}`;
        }

        // Special handling for goal completion
        if (clampedPercentage >= 100) {
            this.celebrateGoalReached();
        }
    }

    /**
     * Handles visual celebration when goal is reached
     */
    celebrateGoalReached() {
        setTimeout(() => {
            const progressPercentage = document.getElementById('progress-percentage');
            if (progressPercentage) {
                progressPercentage.style.color = '#16a34a';
                progressPercentage.textContent = 'GOAL REACHED! 🎉';
            }
        }, 2000);
    }

    /**
     * Updates just the percentage without full re-calculation (for efficiency)
     * @param {number} percentage - Progress percentage (0-100)
     */
    animateToPercentage(percentage) {
        if (!this.isInitialized) return;

        const progressRect = document.getElementById('progressRect');
        const progressPercentage = document.getElementById('progress-percentage');
        
        if (!progressRect) return;

        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        const scaleY = clampedPercentage / 100;

        progressRect.style.transition = 'transform 2s ease-out';
        progressRect.style.transform = `scaleY(${scaleY})`;

        if (progressPercentage) {
            progressPercentage.textContent = `${Math.round(clampedPercentage)}%`;
        }

        if (clampedPercentage >= 100) {
            this.celebrateGoalReached();
        }
    }

    /**
     * Resets the progress animation
     */
    reset() {
        if (!this.isInitialized) return;

        const progressRect = document.getElementById('progressRect');
        const progressPercentage = document.getElementById('progress-percentage');
        const progressText = document.getElementById('progress-text');

        if (progressRect) {
            progressRect.style.transform = 'scaleY(0)';
        }
        if (progressPercentage) {
            progressPercentage.textContent = '0%';
            progressPercentage.style.color = '#333';
        }
        if (progressText) {
            progressText.textContent = '$0 / $0';
        }

        this.currentTotal = 0;
        this.goalAmount = 0;
    }
}

// Export for use in other files (if using modules) or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressSVG;
} else {
    window.ProgressSVG = ProgressSVG;
}