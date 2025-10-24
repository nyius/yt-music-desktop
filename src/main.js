const { app, BrowserWindow } = require('electron');
const path = require('path');
const { createWindow } = require('./window/main-window');
const { cleanupOAuthServer } = require('./auth/oauth');

let mainWindow;

// Configure app user data directory for persistent storage
app.setPath('userData', path.join(app.getPath('appData'), 'YouTube Music Desktop'));

// Set up custom protocol for OAuth callback
const isDev = process.env.NODE_ENV === 'development';
const protocol = 'ytmusic-desktop';

if (!isDev) {
	// Register protocol for production
	app.setAsDefaultProtocolClient(protocol);
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
	mainWindow = createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
	// Clean up OAuth server
	cleanupOAuthServer();

	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		mainWindow = createWindow();
	}
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
	contents.on('new-window', (event, navigationUrl) => {
		event.preventDefault();
		require('electron').shell.openExternal(navigationUrl);
	});
});
