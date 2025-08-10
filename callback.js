        function handleCallback() {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const error = urlParams.get('error');

            if (error) {
                document.getElementById('status').innerHTML = `<p style="color: red;">Authorization failed: ${error}</p>`;
                return;
            }

            if (code) {
                exchangeCodeForToken(code);
            } else {
                document.getElementById('status').innerHTML = `<p style="color: red;">No authorization code received</p>`;
            }
        }

        async function exchangeCodeForToken(code) {
            try {
                const response = await fetch('/api/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code: code })
                });

                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`Server error: ${response.status} - ${errorData}`);
                }

                const data = await response.json();
                document.getElementById('status').innerHTML = `
                    <p style="color: green;">✅ Successfully connected to Tiltify!</p>
                    <button onclick="getDonations()" style="margin: 10px;">Get Donations</button>
                    <button onclick="getTotalDonation()" style="margin: 10px;">Get Total Donations</button>
                    <div id="apiResults"></div>
                    <p><a href="/">Return to main page</a></p>
                `;
                // Store token securely (consider using httpOnly cookies in production)
                localStorage.setItem('tiltify_token', data.access_token);
                
            } catch (error) {
                console.error('Token exchange failed:', error);
                document.getElementById('status').innerHTML = `
                    <p style="color: red;">❌ Connection failed: ${error.message}</p>
                    <p><a href="/">Try again</a></p>
                `;
            }
        }

        // Start the callback handling
        handleCallback();

        // Function to get donations data
        async function getDonations() {
            try {
                const response = await fetch('/api/donations');
                const data = await response.json();
                document.getElementById('apiResults').innerHTML = `
                    <h3>Donations Data:</h3>
                    <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px;">${JSON.stringify(data, null, 2)}</pre>
                `;
            } catch (error) {
                document.getElementById('apiResults').innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            }
        };

        // Funcion to get donation total
        async function getTotalDonation() {
            try {
                const response = await fetch('/api/donations/total');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log(data);
                document.getElementById('apiResults').innerHTML = `
                    <h3>Total Donations:</h3>
                    <p style="font-size: 1.2em; font-weight: bold;">$${data.total_amount}</p>
                `;
            } catch (error) {
                document.getElementById('apiResults').innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            }
        }