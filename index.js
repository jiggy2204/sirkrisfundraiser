        // OAuth 2.0 Credentials (CLIENT_SECRET should *never* be on the client)
        const CLIENT_ID = 'ebd80fb51f67410ec181bd052955d0d53519f310befea10888a8c130c339acdf';
        const REDIRECT_URI = 'http://localhost:3000/callback'; // CHANGED: Must match exactly
        const AUTHORIZE_URL = 'https://v5api.tiltify.com/oauth/authorize';

        // Function to initiate the authorization process
        function redirectToTiltify() {
                        const authUrl = `${AUTHORIZE_URL}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=public`;
            window.location.href = authUrl;

           }

        // Add event listener to button
        document.getElementById('connectBtn').addEventListener('click', redirectToTiltify);

        // Auto-handle callback if we're on the callback page
        if (window.location.pathname.includes('callback')) {
            handleCallback();
        }
        

        function handleCallback() {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const error = urlParams.get('error');

            if (error) {
                document.getElementById('status').innerHTML = `<p style="color: red;">Error: ${error}</p>`;
                return;
            }

            if (code) {
                exchangeCodeForToken(code);
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
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                document.getElementById('status').innerHTML = `<p style="color: green;">Successfully connected! Access token: ${data.access_token.substring(0, 10)}...</p>`;
                
                // Store token securely (consider using httpOnly cookies in production)
                localStorage.setItem('tiltify_token', data.access_token);
                
            } catch (error) {
                console.error('Token exchange failed:', error);
                document.getElementById('status').innerHTML = `<p style="color: red;">Token exchange failed: ${error.message}</p>`;
            }
        }