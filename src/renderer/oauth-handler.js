// OAuth token injection functionality
const { ipcRenderer } = require('electron');

// Function to inject authentication tokens into webview
function injectAuthenticationTokens(authData) {
	const webview = document.getElementById('webview');

	// Wait for webview to be ready
	webview.addEventListener('dom-ready', function onDomReady() {
		console.log('Webview DOM ready, injecting tokens...');

		// Create injection script
		const injectionScript = `
			(() => {
				console.log('Starting token injection...');
				
				// Inject cookies into webview's document.cookie
				const cookies = ${JSON.stringify(authData.cookies)};
				cookies.forEach(cookie => {
					try {
						let cookieString = cookie.name + '=' + cookie.value;
						if (cookie.path) cookieString += '; path=' + cookie.path;
						if (cookie.domain) cookieString += '; domain=' + cookie.domain;
						document.cookie = cookieString;
						console.log('Injected cookie:', cookie.name);
					} catch (error) {
						console.warn('Failed to inject cookie:', cookie.name, error);
					}
				});
				
				// Inject session info into localStorage
				const sessionInfo = ${JSON.stringify(authData.sessionInfo)};
				try {
					localStorage.setItem('yt_auth_session', JSON.stringify(sessionInfo));
					localStorage.setItem('yt_login_time', sessionInfo.loginTime.toString());
					console.log('Injected session info into localStorage');
				} catch (error) {
					console.warn('Failed to inject session info:', error);
				}
				
				// Inject page tokens if available
				const pageTokens = ${JSON.stringify(authData.pageTokens || {})};
				Object.keys(pageTokens).forEach(key => {
					try {
						if (key.includes('localStorage') || key.includes('storage')) {
							localStorage.setItem(key, pageTokens[key]);
						} else if (key.includes('sessionStorage')) {
							sessionStorage.setItem(key, pageTokens[key]);
						}
						console.log('Injected page token:', key);
					} catch (error) {
						console.warn('Failed to inject page token:', key, error);
					}
				});
				
				console.log('Token injection completed');
				return 'injection-complete';
			})();
		`;

		// Execute injection script in webview
		webview
			.executeJavaScript(injectionScript)
			.then(result => {
				console.log('Token injection result:', result);

				// Navigate to YouTube Music after injection
				setTimeout(() => {
					console.log('Navigating to YouTube Music with injected tokens...');
					webview.loadURL('https://music.youtube.com/');
				}, 1000);
			})
			.catch(error => {
				console.error('Token injection failed:', error);
			});

		// Remove the event listener after first injection
		webview.removeEventListener('dom-ready', onDomReady);
	});

	// If webview is already ready, inject immediately
	if (webview.getURL() && webview.getURL() !== 'about:blank') {
		console.log('Webview already loaded, injecting tokens immediately...');

		const injectionScript = `
			(() => {
				console.log('Starting immediate token injection...');
				
				// Inject cookies
				const cookies = ${JSON.stringify(authData.cookies)};
				cookies.forEach(cookie => {
					try {
						let cookieString = cookie.name + '=' + cookie.value;
						if (cookie.path) cookieString += '; path=' + cookie.path;
						if (cookie.domain) cookieString += '; domain=' + cookie.domain;
						document.cookie = cookieString;
						console.log('Injected cookie:', cookie.name);
					} catch (error) {
						console.warn('Failed to inject cookie:', cookie.name, error);
					}
				});
				
				// Inject session info
				const sessionInfo = ${JSON.stringify(authData.sessionInfo)};
				try {
					localStorage.setItem('yt_auth_session', JSON.stringify(sessionInfo));
					localStorage.setItem('yt_login_time', sessionInfo.loginTime.toString());
					console.log('Injected session info');
				} catch (error) {
					console.warn('Failed to inject session info:', error);
				}
				
				console.log('Immediate token injection completed');
				return 'immediate-injection-complete';
			})();
		`;

		webview
			.executeJavaScript(injectionScript)
			.then(result => {
				console.log('Immediate injection result:', result);

				// Reload to apply tokens
				setTimeout(() => {
					webview.reload();
				}, 1000);
			})
			.catch(error => {
				console.error('Immediate injection failed:', error);
			});
	} else {
		// Load YouTube Music first, then inject
		console.log('Loading YouTube Music for token injection...');
		webview.loadURL('https://music.youtube.com/');
	}
}

// Initialize OAuth handling
function initializeOAuthHandling() {
	// Handle OAuth tokens for injection
	ipcRenderer.on('oauth-tokens', (event, data) => {
		console.log('OAuth tokens received:', data);
		if (data.success && data.tokens) {
			console.log('Injecting authentication tokens into webview...');
			injectAuthenticationTokens(data.tokens);
		}
	});

	// Handle OAuth errors
	ipcRenderer.on('oauth-error', (event, data) => {
		console.error('OAuth error received:', data);
		alert(`Login failed: ${data.error}`);
	});
}

module.exports = {
	initializeOAuthHandling,
};
