const { Menu } = require('electron');

function createApplicationMenu(mainWindow) {
	const template = [
		{
			label: 'Application',
			submenu: [
				{
					label: 'Quit',
					accelerator: 'Ctrl+Q',
					click: () => {
						require('electron').app.quit();
					},
				},
			],
		},
		{
			label: '←',
			accelerator: 'Alt+Left',
			click: async () => {
				if (mainWindow.youtubeWebContents && mainWindow.youtubeWebContents.canGoBack()) {
					mainWindow.youtubeWebContents.goBack();
				}
			},
		},
		{
			label: '→',
			accelerator: 'Alt+Right',
			click: async () => {
				if (mainWindow.youtubeWebContents && mainWindow.youtubeWebContents.canGoForward()) {
					mainWindow.youtubeWebContents.goForward();
				}
			},
		},
		{
			label: '⟳',
			accelerator: 'F5',
			click: () => {
				if (mainWindow.youtubeWebContents) {
					mainWindow.youtubeWebContents.reload();
				}
			},
		},
		{
			label: '🏠 Home',
			accelerator: 'Ctrl+H',
			click: () => {
				if (mainWindow.youtubeWebContents) {
					mainWindow.youtubeWebContents.loadURL('https://music.youtube.com/');
				}
			},
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
				{ type: 'separator' },
				{
					label: 'Zoom In',
					accelerator: 'Ctrl+=',
					click: async () => {
						if (mainWindow.youtubeManager) {
							const newZoom = await mainWindow.youtubeManager.zoomIn();
							console.log('Zoomed in to:', newZoom);
						}
					},
				},
				{
					label: 'Zoom Out',
					accelerator: 'Ctrl+-',
					click: async () => {
						if (mainWindow.youtubeManager) {
							const newZoom = await mainWindow.youtubeManager.zoomOut();
							console.log('Zoomed out to:', newZoom);
						}
					},
				},
				{
					label: 'Reset Zoom',
					accelerator: 'Ctrl+0',
					click: async () => {
						if (mainWindow.youtubeManager) {
							const newZoom = await mainWindow.youtubeManager.resetZoom();
							console.log('Reset zoom to:', newZoom);
						}
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
					click: async () => {
						if (mainWindow.youtubeManager) {
							const isEnabled = await mainWindow.youtubeManager.toggleAudioNormalization();
							console.log('Audio normalization is now:', isEnabled ? 'enabled' : 'disabled');
						}
					},
				},
				{
					label: 'Audio Info',
					click: async () => {
						if (mainWindow.youtubeManager) {
							const isEnabled = await mainWindow.youtubeManager.getAudioNormalization();
							alert(`Audio normalization is ${isEnabled ? 'enabled' : 'disabled'}`);
						}
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
}

module.exports = {
	createApplicationMenu,
};
