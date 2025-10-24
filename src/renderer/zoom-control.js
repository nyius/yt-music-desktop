// Zoom functionality
let zoomLevel = 1;
const minZoom = 0.5;
const maxZoom = 3;
const zoomStep = 0.1;

function updateZoom() {
	// Update CSS custom property for zoom scaling
	document.documentElement.style.setProperty('--zoom-level', zoomLevel);

	// Apply zoom to webview content only if webview is ready
	try {
		const webview = document.getElementById('webview');
		if (webview && typeof webview.setZoomFactor === 'function') {
			webview.setZoomFactor(zoomLevel);
		}
	} catch (error) {
		console.warn('Failed to set webview zoom factor:', error);
	}

	// Store zoom level in localStorage for persistence
	localStorage.setItem('zoomLevel', zoomLevel);
}

function zoomIn() {
	if (zoomLevel < maxZoom) {
		zoomLevel = Math.round((zoomLevel + zoomStep) * 10) / 10;
		updateZoom();
	}
}

function zoomOut() {
	console.log('Zoom out clicked, current level:', zoomLevel);
	if (zoomLevel > minZoom) {
		zoomLevel = Math.round((zoomLevel - zoomStep) * 10) / 10;
		updateZoom();
	}
}

function resetZoom() {
	console.log('Reset zoom clicked, current level:', zoomLevel);
	zoomLevel = 1;
	updateZoom();
	console.log('Reset zoom to:', zoomLevel);
}

// Load saved zoom level on startup
function loadSavedZoom() {
	const savedZoom = localStorage.getItem('zoomLevel');
	if (savedZoom) {
		zoomLevel = parseFloat(savedZoom);
		if (zoomLevel < minZoom) zoomLevel = minZoom;
		if (zoomLevel > maxZoom) zoomLevel = maxZoom;
	}
	updateZoom();
}

// Expose zoom functions globally for menu access
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.resetZoom = resetZoom;

// Keyboard shortcuts for zoom
function initializeZoomKeyboard() {
	document.addEventListener('keydown', e => {
		if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
			e.preventDefault();
			zoomIn();
		} else if (e.ctrlKey && (e.key === '-' || e.key === '_')) {
			e.preventDefault();
			zoomOut();
		} else if (e.ctrlKey && e.key === '0') {
			e.preventDefault();
			resetZoom();
		}
	});
}

module.exports = {
	loadSavedZoom,
	initializeZoomKeyboard,
	updateZoom,
};
