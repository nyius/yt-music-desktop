// Audio normalization functionality
let scriptInjected = false; // Prevent multiple injections

// Function to inject audio normalization script
function injectAudioScript() {
	const webview = document.getElementById('webview');
	scriptInjected = true; // Mark as injected to prevent duplicates

	webview
		.executeJavaScript(
			`
		// Audio normalization functionality (using window properties to avoid redeclaration)
		if (!window.audioNormalizationInitialized) {
			window.audioNormalizationInitialized = true;
			
			// Make variables accessible globally for debugging
			window.audioContext = null;
			window.compressor = null;
			window.gainNode = null;
			window.mediaElementSource = null;
			window.isNormalizationEnabled = true;
			console.log('WEBVIEW SCRIPT: Audio normalization script loaded')

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
			
		} // End of if (!window.audioNormalizationInitialized)
	`
		)
		.then(() => {
			// Apply zoom to webview after script injection
			try {
				const { updateZoom } = require('./zoom-control');
				updateZoom();
			} catch (error) {
				console.warn('WEBVIEW: Failed to apply zoom after script injection:', error);
			}
		})
		.catch(error => {
			console.error('WEBVIEW: Failed to inject audio normalization script:', error);
		});
}

// Initialize audio normalization
function initializeAudioNormalization() {
	const webview = document.getElementById('webview');

	webview.addEventListener('did-finish-load', () => {
		if (!scriptInjected) {
			injectAudioScript();
		}
	});

	webview.addEventListener('dom-ready', () => {
		if (!scriptInjected) {
			injectAudioScript();
		}
	});
}

module.exports = {
	initializeAudioNormalization,
};
