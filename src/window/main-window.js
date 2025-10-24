const { BrowserWindow, shell, session, BrowserView } = require('electron');
const path = require('path');
const { Deeplink } = require('electron-deeplink');
const { handleOAuthCallback } = require('../auth/oauth');
const { createApplicationMenu } = require('../menu/application-menu');
const { YouTubeManager } = require('../webcontents/youtube-manager');

function createWindow() {
	// Create the browser window
	const mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			enableRemoteModule: false,
			webSecurity: true,
			preload: path.join(__dirname, '..', 'preload.js'), // Add preload script
		},
		icon: path.join(__dirname, '..', 'assets', 'YouTubeMusic_Logo.png'),
		title: 'YouTube Music Desktop',
		show: false,
	});

	// Create BrowserView for YouTube Music
	const youtubeView = new BrowserView({
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			partition: 'persist:youtube-music', // For persistent login
			webSecurity: true,
		},
	});

	// Configure session for the BrowserView
	configureYouTubeSession(youtubeView.webContents);

	// Set up BrowserView
	mainWindow.setBrowserView(youtubeView);

	// Store reference to YouTube view for later access
	mainWindow.youtubeView = youtubeView;

	// Create YouTube manager
	const youtubeManager = new YouTubeManager(mainWindow);
	mainWindow.youtubeManager = youtubeManager;

	// Create application menu
	createApplicationMenu(mainWindow);

	// Configure session for persistent login
	configureSession();

	// Load our custom renderer
	mainWindow.loadFile(path.join(__dirname, '..', 'renderer.html'));

	// Show window when ready
	mainWindow.once('ready-to-show', () => {
		mainWindow.show();

		// Position the YouTube view to fill the window
		const bounds = mainWindow.getBounds();
		youtubeView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });

		// Load YouTube Music
		loadYouTubeMusic(youtubeView.webContents);

		// Initialize YouTube manager
		youtubeManager.initialize(youtubeView);

		// Store reference to YouTube WebContents for menu access
		mainWindow.youtubeWebContents = youtubeView.webContents;

		// Initialize deeplink for OAuth callbacks
		initializeDeeplink(mainWindow);
	});

	// Handle window resize
	mainWindow.on('resize', () => {
		const bounds = mainWindow.getContentBounds();
		youtubeView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
	});

	// Handle external links
	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	// Handle window closed
	mainWindow.on('closed', () => {
		// Cleanup YouTube manager
		if (mainWindow.youtubeManager) {
			mainWindow.youtubeManager.cleanup();
		}
		return null;
	});

	return mainWindow;
}

// Configure session for YouTube Music WebContentsView
function configureYouTubeSession(webContents) {
	// Set Firefox user agent to bypass Google's Electron detection
	webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0');

	// Handle external links in YouTube view
	webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});
}

// Load YouTube Music with URL persistence
function loadYouTubeMusic(webContents) {
	// Try to load saved URL, fallback to default
	const { app } = require('electron');
	const fs = require('fs');

	let savedUrl = 'https://music.youtube.com/';

	try {
		const userDataPath = app.getPath('userData');
		const urlFile = path.join(userDataPath, 'last-url.txt');

		if (fs.existsSync(urlFile)) {
			const url = fs.readFileSync(urlFile, 'utf8').trim();
			if (url && url.includes('music.youtube.com')) {
				savedUrl = url;
			}
		}
	} catch (error) {
		console.warn('Failed to load saved URL:', error);
	}

	webContents.loadURL(savedUrl);
}

function configureSession() {
	const ses = session.fromPartition('persist:youtube-music');

	// Set user agent to Firefox to bypass Google's Electron detection
	ses.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0');

	// Add Firefox-compatible headers to match the user agent
	ses.webRequest.onBeforeSendHeaders((details, callback) => {
		// Remove Chrome-specific headers and add Firefox-like headers
		delete details.requestHeaders['sec-ch-ua'];
		delete details.requestHeaders['sec-ch-ua-mobile'];
		delete details.requestHeaders['sec-ch-ua-platform'];
		callback({ requestHeaders: details.requestHeaders });
	});

	// Enable persistent storage for cookies and local storage
	ses.setPermissionRequestHandler((webContents, permission, callback) => {
		// Allow certain permissions needed for YouTube Music
		const allowedPermissions = ['notifications', 'media'];
		callback(allowedPermissions.includes(permission));
	});
}

function initializeDeeplink(mainWindow) {
	const isDev = process.env.NODE_ENV === 'development';
	const protocol = 'ytmusic-desktop';

	const deeplink = new Deeplink({
		app: require('electron').app,
		mainWindow,
		protocol,
		isDev,
	});

	deeplink.on('received', link => {
		console.log('Deeplink received:', link);
		handleOAuthCallback(link, mainWindow);
	});

	return deeplink;
}

module.exports = {
	createWindow,
	configureSession,
	initializeDeeplink,
};
