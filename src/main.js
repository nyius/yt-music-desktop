const { app, BrowserWindow, Menu, shell, session } = require('electron');
const path = require('path');

let mainWindow;

// Configure app user data directory for persistent storage
app.setPath('userData', path.join(app.getPath('appData'), 'YouTube Music Desktop'));

function createWindow() {
	// Create the browser window
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			enableRemoteModule: false,
			webSecurity: true,
			preload: path.join(__dirname, 'preload.js'),
			partition: 'persist:youtube-music', // Enable persistent storage
		},
		icon: path.join(__dirname, '..', 'assets', 'icon.png'),
		title: 'YouTube Music Desktop',
		show: false,
	});

	// Create application menu
	const template = [
		{
			label: 'Navigation',
			submenu: [
				{
					label: 'Back',
					accelerator: 'Alt+Left',
					click: () => {
						if (mainWindow.webContents.canGoBack()) {
							mainWindow.webContents.goBack();
						}
					},
				},
				{
					label: 'Forward',
					accelerator: 'Alt+Right',
					click: () => {
						if (mainWindow.webContents.canGoForward()) {
							mainWindow.webContents.goForward();
						}
					},
				},
				{
					label: 'Refresh',
					accelerator: 'F5',
					click: () => {
						mainWindow.webContents.reload();
					},
				},
				{ type: 'separator' },
				{
					label: 'Home',
					accelerator: 'Ctrl+H',
					click: () => {
						mainWindow.loadURL('https://music.youtube.com/');
					},
				},
				{ type: 'separator' },
				{
					label: 'Clear Login Data',
					click: async () => {
						const ses = session.fromPartition('persist:youtube-music');
						await ses.clearStorageData();
						mainWindow.loadURL('https://music.youtube.com/');
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
			],
		},
		{
			label: 'Audio',
			submenu: [
				{
					label: 'Toggle Audio Normalization',
					accelerator: 'Ctrl+N',
					click: () => {
						mainWindow.webContents.executeJavaScript('window.toggleAudioNormalization && window.toggleAudioNormalization()');
					},
				},
				{
					label: 'Audio Info',
					click: () => {
						mainWindow.webContents.executeJavaScript(`
							const info = window.audioContext ? 
								'Audio normalization is initialized. State: ' + window.audioContext.state :
								'Audio normalization not yet initialized';
							alert(info);
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

	// Set user agent to avoid potential issues with YouTube Music
	ses.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

	// Enable persistent storage for cookies and local storage
	ses.setPermissionRequestHandler((webContents, permission, callback) => {
		// Allow certain permissions needed for YouTube Music
		const allowedPermissions = ['notifications', 'media'];
		callback(allowedPermissions.includes(permission));
	});

	// Load YouTube Music
	mainWindow.loadURL('https://music.youtube.com/');

	// Show window when ready
	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
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
