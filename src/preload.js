const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
	// Add any additional APIs you might need here
	// For this app, we don't need to expose anything special
	// as all navigation is handled by the main process menu
});
