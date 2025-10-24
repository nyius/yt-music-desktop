// Webview initialization and event handling
const { loadSavedZoom, initializeZoomKeyboard } = require('./zoom-control');
const { loadLastVisitedUrl, initializeUrlPersistence } = require('./url-persistence');
const { initializeAudioNormalization } = require('./audio-normalization');
const { initializeOAuthHandling } = require('./oauth-handler');

function initializeWebview() {
	const webview = document.getElementById('webview');
	const loading = document.getElementById('loading');

	// Initialize all modules
	loadSavedZoom();
	initializeZoomKeyboard();
	initializeUrlPersistence();
	initializeAudioNormalization();
	initializeOAuthHandling();

	// Basic webview event handlers
	webview.addEventListener('did-start-loading', () => {
		loading.style.display = 'block';
	});

	webview.addEventListener('did-stop-loading', () => {
		loading.style.display = 'none';
		// Apply zoom after page loads
		try {
			const zoomLevel = parseFloat(localStorage.getItem('zoomLevel')) || 1;
			webview.setZoomFactor(zoomLevel);
		} catch (error) {
			console.warn('Failed to apply zoom after loading:', error);
		}
	});

	// Forward webview console messages to main console (filter out harmless warnings)
	webview.addEventListener('console-message', e => {
		// Filter out harmless Permissions-Policy warnings
		if (e.message.includes('Permissions-Policy header') && e.message.includes('Unrecognized feature')) {
			return; // Skip these harmless warnings
		}
		console.log(`[WEBVIEW] ${e.level}: ${e.message}`);
	});

	// Set Firefox user agent and load initial URL
	const initialUrl = loadLastVisitedUrl();

	// Use loadURL with Firefox user agent to bypass Google's Electron detection
	webview.addEventListener(
		'dom-ready',
		() => {
			webview.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0');
		},
		{ once: true }
	);

	webview.src = initialUrl;
}

module.exports = {
	initializeWebview,
};
