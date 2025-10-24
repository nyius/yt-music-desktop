const { app, BrowserWindow, Menu, shell, session, ipcMain } = require('electron');
const path = require('path');
const { Deeplink } = require('electron-deeplink');

let mainWindow;
let deeplink;

// Configure app user data directory for persistent storage
app.setPath('userData', path.join(app.getPath('appData'), 'YouTube Music Desktop'));

// Set up custom protocol for OAuth callback
const isDev = process.env.NODE_ENV === 'development';
const protocol = 'ytmusic-desktop';

if (!isDev) {
	// Register protocol for production
	app.setAsDefaultProtocolClient(protocol);
}

// Handle OAuth callback
function handleOAuthCallback(url) {
	console.log('OAuth callback received:', url);

	// Parse the URL to extract tokens/code
	const urlObj = new URL(url);
	const code = urlObj.searchParams.get('code');
	const error = urlObj.searchParams.get('error');

	if (error) {
		console.error('OAuth error:', error);
		return;
	}

	if (code) {
		console.log('OAuth code received:', code);
		// Send the code to the renderer process
		if (mainWindow) {
			mainWindow.webContents.send('oauth-success', { code });
		}
	}
}

function createWindow() {
	// Create the browser window
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: false,
			webSecurity: true,
			webviewTag: true, // Enable webview tag
		},
		icon: path.join(__dirname, '..', 'assets', 'YouTubeMusic_Logo.png'),
		title: 'YouTube Music Desktop',
		show: false,
	});

	// Create application menu
	const template = [
		{
			label: 'Application',
			submenu: [
				{
					label: 'OAuth Login',
					click: () => {
						// Start OAuth flow - this will open browser and redirect back to our app
						const clientId = 'your-google-client-id'; // You'll need to register this
						const redirectUri = `${protocol}://oauth/callback`;
						const scope = 'https://www.googleapis.com/auth/youtube';
						const oauthUrl = `https://accounts.google.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;

						shell.openExternal(oauthUrl);
					},
				},
				{
					label: 'Login in Browser (Simple)',
					click: () => {
						// Simple browser login as backup
						shell.openExternal('https://accounts.google.com/signin/v2/identifier?service=youtube&continue=https%3A%2F%2Fmusic.youtube.com%2F');
					},
				},
				{ type: 'separator' },
				{
					label: 'Clear Login Data',
					click: async () => {
						const ses = session.fromPartition('persist:youtube-music');
						await ses.clearStorageData();
						mainWindow.loadFile(path.join(__dirname, 'renderer.html'));
					},
				},
				{ type: 'separator' },
				{
					label: 'Quit',
					accelerator: 'Ctrl+Q',
					click: () => {
						app.quit();
					},
				},
			],
		},
		{
			label: '←',
			accelerator: 'Alt+Left',
			click: () => {
				mainWindow.webContents.executeJavaScript(`
					if (document.getElementById('webview') && document.getElementById('webview').canGoBack()) {
						document.getElementById('webview').goBack();
					}
				`);
			},
		},
		{
			label: '→',
			accelerator: 'Alt+Right',
			click: () => {
				mainWindow.webContents.executeJavaScript(`
					if (document.getElementById('webview') && document.getElementById('webview').canGoForward()) {
						document.getElementById('webview').goForward();
					}
				`);
			},
		},
		{
			label: '⟳',
			accelerator: 'F5',
			click: () => {
				mainWindow.webContents.executeJavaScript(`
					if (document.getElementById('webview')) {
						document.getElementById('webview').reload();
					}
				`);
			},
		},
		{
			label: 'File',
			submenu: [
				{
					label: 'Clear Login Data',
					click: async () => {
						const ses = session.fromPartition('persist:youtube-music');
						await ses.clearStorageData();
						mainWindow.loadFile(path.join(__dirname, 'renderer.html'));
					},
				},
				{ type: 'separator' },
				{
					label: 'Quit',
					accelerator: 'Ctrl+Q',
					click: () => {
						app.quit();
					},
				},
			],
		},

		{
			label: 'View',
			submenu: [
				{
					label: 'Toggle Fullscreen',
					accelerator: 'F11',
					click: () => {
						mainWindow.setFullScreen(!mainWindow.isFullScreen());
					},
				},
				{
					label: 'Toggle Developer Tools',
					accelerator: 'F12',
					click: () => {
						mainWindow.webContents.toggleDevTools();
					},
				},
				{ type: 'separator' },
				{
					label: 'Zoom In',
					accelerator: 'Ctrl+=',
					click: () => {
						mainWindow.webContents.executeJavaScript('window.zoomIn && window.zoomIn()');
					},
				},
				{
					label: 'Zoom Out',
					accelerator: 'Ctrl+-',
					click: () => {
						mainWindow.webContents.executeJavaScript('window.zoomOut && window.zoomOut()');
					},
				},
				{
					label: 'Reset Zoom',
					accelerator: 'Ctrl+0',
					click: () => {
						mainWindow.webContents.executeJavaScript('window.resetZoom && window.resetZoom()');
					},
				},
			],
		},
		{
			label: 'Audio',
			submenu: [
				{
					label: 'Toggle Audio Normalization',
					accelerator: 'Ctrl+N',
					click: () => {
						// Execute in the renderer process which will then call the webview
						mainWindow.webContents
							.executeJavaScript(
								`
							
							if (document.getElementById('webview')) {
								
								document.getElementById('webview').executeJavaScript('console.log("Webview: Simple test successful"); "test-result"')
									.then(result => {
										// Now try the actual toggle
										const script = \`
											if (window.toggleAudioNormalization) {
												window.toggleAudioNormalization();
												console.log("Webview: Audio normalization toggled");
												"toggle-success";
											} else {
												console.warn("Webview: toggleAudioNormalization function not found");
												console.log("Webview: Available window properties:", Object.keys(window).filter(key => key.includes('audio') || key.includes('toggle')));
												"toggle-function-not-found";
											}
										\`;
										
										return document.getElementById('webview').executeJavaScript(script);
									})
									.then(result => console.log('Menu: Toggle completed, result:', result))
									.catch(error => console.error('Menu: executeJavaScript failed:', error));
							} else {
								console.error('Menu: Webview element not found');
							}
						`
							)
							.catch(error => console.error('Main executeJavaScript error:', error));
					},
				},
				{
					label: 'Audio Info',
					click: () => {
						mainWindow.webContents.executeJavaScript(`
							if (document.getElementById('webview')) {
								document.getElementById('webview').executeJavaScript(\`
									alert(window.audioContext ? 
										'Audio normalization is initialized. State: ' + window.audioContext.state :
										'Audio normalization not yet initialized');
								\`);
							}
						`);
					},
				},
			],
		},
		{
			label: 'Window',
			submenu: [
				{
					label: 'Minimize',
					accelerator: 'Ctrl+M',
					click: () => {
						mainWindow.minimize();
					},
				},
				{
					label: 'Close',
					accelerator: 'Ctrl+W',
					click: () => {
						mainWindow.close();
					},
				},
			],
		},
	];

	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);

	// Configure session for persistent login
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

	// Load our custom renderer with navigation bar
	mainWindow.loadFile(path.join(__dirname, 'renderer.html'));

	// Show window when ready
	mainWindow.once('ready-to-show', () => {
		mainWindow.show();

		// Initialize deeplink for OAuth callbacks
		deeplink = new Deeplink({ app, mainWindow, protocol, isDev });
		deeplink.on('received', link => {
			console.log('Deeplink received:', link);
			handleOAuthCallback(link);
		});
	});

	// Handle external links
	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});

	// Handle window closed
	mainWindow.on('closed', () => {
		mainWindow = null;
	});
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
	contents.on('new-window', (event, navigationUrl) => {
		event.preventDefault();
		shell.openExternal(navigationUrl);
	});
});
