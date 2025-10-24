const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
	// Navigation controls
	navigateBack: () => ipcRenderer.invoke('navigate-back'),
	navigateForward: () => ipcRenderer.invoke('navigate-forward'),
	refreshPage: () => ipcRenderer.invoke('refresh-page'),

	// Zoom controls
	zoomIn: () => ipcRenderer.invoke('zoom-in'),
	zoomOut: () => ipcRenderer.invoke('zoom-out'),
	resetZoom: () => ipcRenderer.invoke('reset-zoom'),
	getZoomLevel: () => ipcRenderer.invoke('get-zoom-level'),

	// Audio controls
	toggleAudioNormalization: () => ipcRenderer.invoke('toggle-audio-normalization'),
	getAudioNormalization: () => ipcRenderer.invoke('get-audio-normalization'),

	// Navigation state
	canGoBack: () => ipcRenderer.invoke('can-go-back'),
	canGoForward: () => ipcRenderer.invoke('can-go-forward'),

	// OAuth
	injectOAuthTokens: tokens => ipcRenderer.invoke('inject-oauth-tokens', tokens),

	// Event listeners
	onYouTubeLoading: callback => ipcRenderer.on('youtube-loading', callback),
	onNavigationChanged: callback => ipcRenderer.on('navigation-changed', callback),
	onOAuthTokens: callback => ipcRenderer.on('oauth-tokens', callback),
	onOAuthError: callback => ipcRenderer.on('oauth-error', callback),

	// Remove event listeners
	removeAllListeners: channel => ipcRenderer.removeAllListeners(channel),
});
