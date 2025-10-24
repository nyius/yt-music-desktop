const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
	// Add any additional APIs you might need here
	// For this app, we don't need to expose anything special
	// as all navigation is handled by the main process menu
});

// Audio normalization functionality
let audioContext;
let compressor;
let gainNode;
let mediaElementSource;
let isNormalizationEnabled = true;

function initializeAudioNormalization() {
	// Wait for page to load and find audio/video elements
	const observer = new MutationObserver(() => {
		const videoElement = document.querySelector('video');
		if (videoElement && !mediaElementSource) {
			setupAudioProcessing(videoElement);
		}
	});

	// Start observing
	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	// Also check immediately in case elements already exist
	setTimeout(() => {
		const videoElement = document.querySelector('video');
		if (videoElement && !mediaElementSource) {
			setupAudioProcessing(videoElement);
		}
	}, 2000);
}

function setupAudioProcessing(videoElement) {
	try {
		// Create audio context
		audioContext = new (window.AudioContext || window.webkitAudioContext)();

		// Create media element source
		mediaElementSource = audioContext.createMediaElementSource(videoElement);

		// Create compressor (dynamic range compression for normalization)
		compressor = audioContext.createDynamicsCompressor();
		compressor.threshold.setValueAtTime(-24, audioContext.currentTime);
		compressor.knee.setValueAtTime(30, audioContext.currentTime);
		compressor.ratio.setValueAtTime(12, audioContext.currentTime);
		compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
		compressor.release.setValueAtTime(0.25, audioContext.currentTime);

		// Create gain node for volume control
		gainNode = audioContext.createGain();
		gainNode.gain.setValueAtTime(0.8, audioContext.currentTime); // Slightly reduce volume to prevent clipping

		// Connect the audio processing chain
		if (isNormalizationEnabled) {
			mediaElementSource.connect(compressor);
			compressor.connect(gainNode);
			gainNode.connect(audioContext.destination);
		} else {
			mediaElementSource.connect(audioContext.destination);
		}

		console.log('Audio normalization initialized successfully');

		// Resume audio context if it's suspended
		if (audioContext.state === 'suspended') {
			videoElement.addEventListener(
				'play',
				() => {
					audioContext.resume();
				},
				{ once: true }
			);
		}
	} catch (error) {
		console.warn('Audio normalization setup failed:', error);
	}
}

function toggleAudioNormalization() {
	if (!audioContext || !mediaElementSource) {
		console.warn('Audio normalization not initialized');
		return;
	}

	try {
		// Disconnect all nodes
		mediaElementSource.disconnect();
		if (compressor) compressor.disconnect();
		if (gainNode) gainNode.disconnect();

		// Reconnect based on normalization state
		if (isNormalizationEnabled) {
			// Disable normalization - direct connection
			mediaElementSource.connect(audioContext.destination);
			console.log('Audio normalization disabled');
		} else {
			// Enable normalization - full processing chain
			mediaElementSource.connect(compressor);
			compressor.connect(gainNode);
			gainNode.connect(audioContext.destination);
			console.log('Audio normalization enabled');
		}

		isNormalizationEnabled = !isNormalizationEnabled;
	} catch (error) {
		console.warn('Error toggling audio normalization:', error);
	}
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initializeAudioNormalization);
} else {
	initializeAudioNormalization();
}

// Expose toggle function globally for menu access
window.toggleAudioNormalization = toggleAudioNormalization;
