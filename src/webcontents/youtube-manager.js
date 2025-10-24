// YouTube Music WebContents management
const { ipcMain, app } = require('electron');
const fs = require('fs');
const path = require('path');

class YouTubeManager {
	constructor(mainWindow) {
		this.mainWindow = mainWindow;
		this.youtubeWebContents = null;
		this.currentZoom = 1.0;
		this.audioNormalizationEnabled = true;

		this.setupEventHandlers();
		this.setupIPCHandlers();
	}

	initialize(youtubeView) {
		this.youtubeWebContents = youtubeView.webContents;
		this.setupWebContentsEvents();
		this.loadPersistedSettings();
	}

	setupEventHandlers() {
		// Handle window navigation
		ipcMain.handle('navigate-back', () => {
			if (this.youtubeWebContents && this.youtubeWebContents.canGoBack()) {
				this.youtubeWebContents.goBack();
				return true;
			}
			return false;
		});

		ipcMain.handle('navigate-forward', () => {
			if (this.youtubeWebContents && this.youtubeWebContents.canGoForward()) {
				this.youtubeWebContents.goForward();
				return true;
			}
			return false;
		});

		ipcMain.handle('refresh-page', () => {
			if (this.youtubeWebContents) {
				this.youtubeWebContents.reload();
				return true;
			}
			return false;
		});

		// Zoom controls
		ipcMain.handle('zoom-in', async () => {
			this.currentZoom = Math.min(3.0, this.currentZoom + 0.1);
			this.applyZoom();
			this.saveZoomLevel();
			return this.currentZoom;
		});

		ipcMain.handle('zoom-out', async () => {
			this.currentZoom = Math.max(0.5, this.currentZoom - 0.1);
			this.applyZoom();
			this.saveZoomLevel();
			return this.currentZoom;
		});

		ipcMain.handle('reset-zoom', async () => {
			this.currentZoom = 1.0;
			this.applyZoom();
			this.saveZoomLevel();
			return this.currentZoom;
		});

		// Audio normalization
		ipcMain.handle('toggle-audio-normalization', async () => {
			this.audioNormalizationEnabled = !this.audioNormalizationEnabled;
			this.injectAudioScript();
			this.saveAudioSettings();
			return this.audioNormalizationEnabled;
		});

		// OAuth token injection
		ipcMain.handle('inject-oauth-tokens', (event, tokens) => {
			return this.injectAuthenticationTokens(tokens);
		});
	}

	setupIPCHandlers() {
		// Get current states
		ipcMain.handle('get-zoom-level', () => this.currentZoom);
		ipcMain.handle('get-audio-normalization', () => this.audioNormalizationEnabled);
		ipcMain.handle('can-go-back', () => this.youtubeWebContents?.canGoBack() || false);
		ipcMain.handle('can-go-forward', () => this.youtubeWebContents?.canGoForward() || false);
	}

	setupWebContentsEvents() {
		if (!this.youtubeWebContents) return;

		// Handle navigation events
		this.youtubeWebContents.on('did-navigate', (event, url) => {
			this.saveCurrentUrl(url);
			// Notify renderer of navigation state changes
			this.mainWindow.webContents.send('navigation-changed', {
				canGoBack: this.youtubeWebContents.canGoBack(),
				canGoForward: this.youtubeWebContents.canGoForward(),
				url: url,
			});
		});

		this.youtubeWebContents.on('did-navigate-in-page', (event, url) => {
			this.saveCurrentUrl(url);
		});

		// Handle loading states
		this.youtubeWebContents.on('did-start-loading', () => {
			this.mainWindow.webContents.send('youtube-loading', true);
		});

		this.youtubeWebContents.on('did-stop-loading', () => {
			this.mainWindow.webContents.send('youtube-loading', false);
			// Apply settings after page loads
			this.applyZoom();
			this.injectAudioScript();
		});

		// Handle page ready
		this.youtubeWebContents.on('dom-ready', () => {
			this.injectAudioScript();
		});

		// Filter console messages
		this.youtubeWebContents.on('console-message', (event, level, message, line, sourceId) => {
			// Filter out harmless Permissions-Policy warnings
			if (message.includes('Permissions-Policy header') && message.includes('Unrecognized feature')) {
				return;
			}
			console.log(`[YOUTUBE] ${level}: ${message}`);
		});
	}

	applyZoom() {
		if (this.youtubeWebContents) {
			this.youtubeWebContents.setZoomFactor(this.currentZoom);
		}
	}

	saveZoomLevel() {
		try {
			const userDataPath = app.getPath('userData');
			const settingsFile = path.join(userDataPath, 'zoom-settings.json');
			const settings = { zoomLevel: this.currentZoom };
			fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
		} catch (error) {
			console.warn('Failed to save zoom level:', error);
		}
	}

	loadPersistedSettings() {
		// Load zoom level
		try {
			const userDataPath = app.getPath('userData');
			const settingsFile = path.join(userDataPath, 'zoom-settings.json');

			if (fs.existsSync(settingsFile)) {
				const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
				this.currentZoom = Math.max(0.5, Math.min(3.0, settings.zoomLevel || 1.0));
			}
		} catch (error) {
			console.warn('Failed to load zoom settings:', error);
		}

		// Load audio settings
		try {
			const userDataPath = app.getPath('userData');
			const audioFile = path.join(userDataPath, 'audio-settings.json');

			if (fs.existsSync(audioFile)) {
				const settings = JSON.parse(fs.readFileSync(audioFile, 'utf8'));
				this.audioNormalizationEnabled = settings.enabled !== false;
			}
		} catch (error) {
			console.warn('Failed to load audio settings:', error);
		}
	}

	saveCurrentUrl(url) {
		if (!url || !url.includes('music.youtube.com')) return;

		try {
			const userDataPath = app.getPath('userData');
			const urlFile = path.join(userDataPath, 'last-url.txt');
			fs.writeFileSync(urlFile, url);
		} catch (error) {
			console.warn('Failed to save current URL:', error);
		}
	}

	saveAudioSettings() {
		try {
			const userDataPath = app.getPath('userData');
			const audioFile = path.join(userDataPath, 'audio-settings.json');
			const settings = { enabled: this.audioNormalizationEnabled };
			fs.writeFileSync(audioFile, JSON.stringify(settings, null, 2));
		} catch (error) {
			console.warn('Failed to save audio settings:', error);
		}
	}

	injectAudioScript() {
		if (!this.youtubeWebContents) return;

		const audioScript = `
			(function() {
				if (window.audioNormalizationInitialized) return;
				window.audioNormalizationInitialized = true;
				
				window.audioContext = null;
				window.compressor = null;
				window.gainNode = null;
				window.mediaElementSource = null;
				window.isNormalizationEnabled = ${this.audioNormalizationEnabled};

				function initializeAudioNormalization() {
					const observer = new MutationObserver(() => {
						const videoElement = document.querySelector('video');
						if (videoElement && !window.mediaElementSource) {
							setupAudioProcessing(videoElement);
						}
					});

					observer.observe(document.body, {
						childList: true,
						subtree: true
					});

					setTimeout(() => {
						const videoElement = document.querySelector('video');
						if (videoElement && !window.mediaElementSource) {
							setupAudioProcessing(videoElement);
						}
					}, 2000);
				}

				function setupAudioProcessing(videoElement) {
					try {
						window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
						window.mediaElementSource = window.audioContext.createMediaElementSource(videoElement);
						
						window.compressor = window.audioContext.createDynamicsCompressor();
						window.compressor.threshold.setValueAtTime(-24, window.audioContext.currentTime);
						window.compressor.knee.setValueAtTime(30, window.audioContext.currentTime);
						window.compressor.ratio.setValueAtTime(12, window.audioContext.currentTime);
						window.compressor.attack.setValueAtTime(0.003, window.audioContext.currentTime);
						window.compressor.release.setValueAtTime(0.25, window.audioContext.currentTime);
						
						window.gainNode = window.audioContext.createGain();
						window.gainNode.gain.setValueAtTime(0.8, window.audioContext.currentTime);
						
						if (window.isNormalizationEnabled) {
							window.mediaElementSource.connect(window.compressor);
							window.compressor.connect(window.gainNode);
							window.gainNode.connect(window.audioContext.destination);
						} else {
							window.mediaElementSource.connect(window.audioContext.destination);
						}
						
						console.log('Audio normalization initialized successfully');
						
						if (audioContext.state === 'suspended') {
							videoElement.addEventListener('play', () => {
								audioContext.resume();
							}, { once: true });
						}
						
					} catch (error) {
						console.warn('Audio normalization setup failed:', error);
					}
				}

				function toggleAudioNormalization() {
					if (!window.audioContext || !window.mediaElementSource) {
						console.warn('Audio normalization not initialized');
						return;
					}
					
					try {
						window.mediaElementSource.disconnect();
						if (window.compressor) window.compressor.disconnect();
						if (window.gainNode) window.gainNode.disconnect();
						
						if (window.isNormalizationEnabled) {
							window.mediaElementSource.connect(window.audioContext.destination);
							console.log('Audio normalization disabled');
						} else {
							window.mediaElementSource.connect(window.compressor);
							window.compressor.connect(window.gainNode);
							window.gainNode.connect(window.audioContext.destination);
							console.log('Audio normalization enabled');
						}
						
						window.isNormalizationEnabled = !window.isNormalizationEnabled;
						
					} catch (error) {
						console.warn('Error toggling audio normalization:', error);
					}
				}

				window.toggleAudioNormalization = toggleAudioNormalization;
				
				if (document.readyState === 'loading') {
					document.addEventListener('DOMContentLoaded', initializeAudioNormalization);
				} else {
					initializeAudioNormalization();
				}
			})();
		`;

		this.youtubeWebContents.executeJavaScript(audioScript).catch(error => console.warn('Failed to inject audio script:', error));
	}

	async injectAuthenticationTokens(authData) {
		if (!this.youtubeWebContents || !authData) return false;

		const injectionScript = `
			(function() {
				console.log('Starting token injection...');
				
				// Inject cookies
				const cookies = ${JSON.stringify(authData.cookies || [])};
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
				const sessionInfo = ${JSON.stringify(authData.sessionInfo || {})};
				try {
					localStorage.setItem('yt_auth_session', JSON.stringify(sessionInfo));
					localStorage.setItem('yt_login_time', sessionInfo.loginTime?.toString() || Date.now().toString());
					console.log('Injected session info');
				} catch (error) {
					console.warn('Failed to inject session info:', error);
				}
				
				console.log('Token injection completed');
				return 'injection-complete';
			})();
		`;

		try {
			const result = await this.youtubeWebContents.executeJavaScript(injectionScript);
			console.log('Token injection result:', result);

			// Navigate to YouTube Music after injection
			setTimeout(() => {
				this.youtubeWebContents.loadURL('https://music.youtube.com/');
			}, 1000);

			return true;
		} catch (error) {
			console.error('Token injection failed:', error);
			return false;
		}
	}

	cleanup() {
		// Save current state before cleanup
		if (this.youtubeWebContents) {
			const url = this.youtubeWebContents.getURL();
			this.saveCurrentUrl(url);
		}
		this.saveZoomLevel();
		this.saveAudioSettings();
	}

	// Direct methods for menu access
	async zoomIn() {
		this.currentZoom = Math.min(3.0, this.currentZoom + 0.1);
		this.applyZoom();
		this.saveZoomLevel();
		return this.currentZoom;
	}

	async zoomOut() {
		this.currentZoom = Math.max(0.5, this.currentZoom - 0.1);
		this.applyZoom();
		this.saveZoomLevel();
		return this.currentZoom;
	}

	async resetZoom() {
		this.currentZoom = 1.0;
		this.applyZoom();
		this.saveZoomLevel();
		return this.currentZoom;
	}

	async toggleAudioNormalization() {
		this.audioNormalizationEnabled = !this.audioNormalizationEnabled;
		this.injectAudioScript();
		this.saveAudioSettings();
		return this.audioNormalizationEnabled;
	}

	async getAudioNormalization() {
		return this.audioNormalizationEnabled;
	}
}

module.exports = { YouTubeManager };
