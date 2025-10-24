// URL persistence functionality
function saveCurrentUrl() {
	try {
		const webview = document.getElementById('webview');
		const currentUrl = webview.getURL();
		if (currentUrl && currentUrl.includes('music.youtube.com')) {
			localStorage.setItem('lastVisitedUrl', currentUrl);
		}
	} catch (error) {
		console.warn('Failed to save current URL:', error);
	}
}

function loadLastVisitedUrl() {
	try {
		const savedUrl = localStorage.getItem('lastVisitedUrl');
		if (savedUrl && savedUrl.includes('music.youtube.com')) {
			return savedUrl;
		}
	} catch (error) {
		console.warn('Failed to load saved URL:', error);
	}
	return 'https://music.youtube.com/'; // Default fallback
}

// Debounce function to avoid saving too frequently
let saveUrlTimeout;
function debouncedSaveUrl() {
	clearTimeout(saveUrlTimeout);
	saveUrlTimeout = setTimeout(saveCurrentUrl, 1000); // Save after 1 second of inactivity
}

// Combined function to handle navigation and save URL
function handleNavigation() {
	debouncedSaveUrl();
}

// Initialize URL persistence
function initializeUrlPersistence() {
	const webview = document.getElementById('webview');

	// Webview event listeners
	webview.addEventListener('did-navigate', handleNavigation);
	webview.addEventListener('did-navigate-in-page', handleNavigation);

	// Save URL when window is about to close
	window.addEventListener('beforeunload', () => {
		saveCurrentUrl();
	});
}

module.exports = {
	loadLastVisitedUrl,
	initializeUrlPersistence,
};
