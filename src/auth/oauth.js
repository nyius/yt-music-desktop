const { BrowserWindow } = require('electron');
const http = require('http');
const url = require('url');

let oauthServer;

// OAuth 2.0 configuration
const OAUTH_CONFIG = {
	clientId: '1067808876711-bjdkj5cufr43l7r0f8edjnlekfqkc1pf.apps.googleusercontent.com',
	clientSecret: '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', // Note: In production, store securely
	redirectUri: 'http://localhost:8080/oauth/callback',
	scope: 'openid email profile https://www.googleapis.com/auth/youtube',
	responseType: 'code',
};

// Simple OAuth callback server
function startOAuthServer() {
	// Don't start if server is already running
	if (oauthServer && oauthServer.listening) {
		console.log('OAuth server already running on port 8080');
		return;
	}

	oauthServer = http.createServer((req, res) => {
		const parsedUrl = url.parse(req.url, true);

		if (parsedUrl.pathname === '/oauth/callback') {
			const code = parsedUrl.query.code;
			const error = parsedUrl.query.error;

			// Send response to browser
			res.writeHead(200, { 'Content-Type': 'text/html' });
			if (error) {
				res.end(`
					<html>
						<body style="font-family: Arial; text-align: center; padding: 50px;">
							<h2>❌ OAuth Error</h2>
							<p>Error: ${error}</p>
							<p>You can close this window.</p>
						</body>
					</html>
				`);
			} else if (code) {
				res.end(`
					<html>
						<body style="font-family: Arial; text-align: center; padding: 50px;">
							<h2>✅ Login Successful!</h2>
							<p>You can close this window and return to the app.</p>
							<script>window.close();</script>
						</body>
					</html>
				`);

				// Handle the OAuth code
				handleOAuthCallback(code);
			}
		} else {
			res.writeHead(404);
			res.end('Not found');
		}
	});

	oauthServer.listen(8080, 'localhost', () => {
		console.log('OAuth server running on http://localhost:8080');
	});

	// Handle server errors (like port already in use)
	oauthServer.on('error', err => {
		if (err.code === 'EADDRINUSE') {
			console.log('Port 8080 already in use, OAuth server might already be running');
		} else {
			console.error('OAuth server error:', err);
		}
	});
}

// Handle OAuth callback - shared session approach
async function handleOAuthCallback(code, mainWindow) {
	console.log('OAuth code received:', code);

	try {
		console.log('OAuth authentication detected');

		if (mainWindow) {
			mainWindow.webContents.send('oauth-success', {
				success: true,
				message: 'Authentication completed - you can close the browser window',
			});
		}

		console.log('OAuth authentication completed successfully');
	} catch (error) {
		console.error('OAuth callback error:', error);

		if (mainWindow) {
			mainWindow.webContents.send('oauth-error', {
				error: error.message,
			});
		}
	}
}

// Alternative login method using token injection
function openGoogleLoginWindow(mainWindow) {
	// Create a new browser window for OAuth login
	const loginWindow = new BrowserWindow({
		width: 500,
		height: 600,
		show: true,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			partition: 'persist:oauth-temp', // Separate partition for login
		},
	});

	// Navigate to Google login for YouTube Music
	loginWindow.loadURL(
		'https://accounts.google.com/signin/v2/identifier?service=youtube&uilel=3&passive=true&continue=https%3A%2F%2Fwww.youtube.com%2Fsignin%3Faction_handle_signin%3Dtrue%26app%3Ddesktop%26hl%3Den%26next%3Dhttps%253A%252F%252Fmusic.youtube.com%252F&hl=en&ec=65620&flowName=GlifWebSignIn&flowEntry=ServiceLogin'
	);

	// Handle navigation to detect successful login and extract tokens
	loginWindow.webContents.on('did-navigate', async (event, url) => {
		console.log('Login window navigated to:', url);

		// Check if user successfully logged in and was redirected to YouTube Music
		if (url.includes('music.youtube.com')) {
			console.log('Login successful - extracting authentication tokens');

			try {
				// Extract authentication data from the login session
				const authData = await extractAuthenticationData(loginWindow);

				if (authData) {
					console.log('Authentication tokens extracted successfully');

					// Send tokens to renderer process for injection
					if (mainWindow) {
						mainWindow.webContents.send('oauth-tokens', {
							success: true,
							tokens: authData,
							message: 'Authentication tokens ready for injection',
						});
					}
				} else {
					console.warn('Failed to extract authentication data');
				}
			} catch (error) {
				console.error('Error extracting authentication data:', error);
			}

			// Close the login window
			loginWindow.close();
		}
	});

	// Handle window closed
	loginWindow.on('closed', () => {
		console.log('Login window closed');
	});

	return loginWindow;
}

// Extract authentication tokens and session data
async function extractAuthenticationData(loginWindow) {
	try {
		const session = loginWindow.webContents.session;

		// Get authentication cookies
		const cookies = await session.cookies.get({});

		// Filter for Google authentication cookies
		const authCookies = cookies.filter(
			cookie =>
				(cookie.domain.includes('google.com') || cookie.domain.includes('youtube.com')) &&
				(cookie.name.includes('SID') ||
					cookie.name.includes('HSID') ||
					cookie.name.includes('SSID') ||
					cookie.name.includes('APISID') ||
					cookie.name.includes('SAPISID') ||
					cookie.name.includes('LOGIN_INFO') ||
					cookie.name.includes('YSC') ||
					cookie.name.includes('VISITOR_INFO'))
		);

		console.log(`Found ${authCookies.length} authentication cookies`);

		// Create token object with cookies formatted for injection
		const authData = {
			cookies: authCookies.map(cookie => ({
				name: cookie.name,
				value: cookie.value,
				domain: cookie.domain,
				path: cookie.path,
			})),
			sessionInfo: {
				loginTime: Date.now(),
				domain: 'youtube.com',
			},
		};

		// Try to extract any access tokens from the page context
		try {
			const pageTokens = await loginWindow.webContents.executeJavaScript(`
				(() => {
					// Try to find tokens in various places
					let tokens = {};
					
					// Check localStorage
					if (window.localStorage) {
						for (let i = 0; i < window.localStorage.length; i++) {
							const key = window.localStorage.key(i);
							if (key && (key.includes('token') || key.includes('auth') || key.includes('session'))) {
								tokens[key] = window.localStorage.getItem(key);
							}
						}
					}
					
					// Check sessionStorage
					if (window.sessionStorage) {
						for (let i = 0; i < window.sessionStorage.length; i++) {
							const key = window.sessionStorage.key(i);
							if (key && (key.includes('token') || key.includes('auth') || key.includes('session'))) {
								tokens[key] = window.sessionStorage.getItem(key);
							}
						}
					}
					
					// Check for global variables that might contain tokens
					const globalKeys = Object.keys(window).filter(key => 
						key.includes('token') || key.includes('auth') || key.includes('ytcfg') || key.includes('yt')
					);
					
					globalKeys.forEach(key => {
						try {
							const value = window[key];
							if (value && typeof value === 'object') {
								tokens[key] = JSON.stringify(value);
							} else if (value && typeof value === 'string') {
								tokens[key] = value;
							}
						} catch (e) {
							// Ignore errors accessing properties
						}
					});
					
					return tokens;
				})();
			`);

			if (pageTokens && Object.keys(pageTokens).length > 0) {
				authData.pageTokens = pageTokens;
				console.log('Extracted page tokens:', Object.keys(pageTokens));
			}
		} catch (error) {
			console.warn('Failed to extract page tokens:', error);
		}

		return authData;
	} catch (error) {
		console.error('Error in extractAuthenticationData:', error);
		return null;
	}
}

// Clean up OAuth server
function cleanupOAuthServer() {
	if (oauthServer) {
		oauthServer.close();
		oauthServer = null;
	}
}

module.exports = {
	OAUTH_CONFIG,
	startOAuthServer,
	handleOAuthCallback,
	openGoogleLoginWindow,
	extractAuthenticationData,
	cleanupOAuthServer,
};
