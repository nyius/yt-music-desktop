# YouTube Music Desktop App

A simple desktop application for Windows that displays YouTube Music with navigation controls.

## Features

-   Loads YouTube Music (https://music.youtube.com/) in a dedicated window
-   **Custom Navigation Bar**: Built-in navigation controls with visual buttons
-   **Persistent Login**: Stays logged in to your YouTube Music account between app sessions
-   **Page Persistence**: Remembers and restores the last page you were on when reopening the app
-   **Audio Normalization**: Automatically balances volume levels between songs to prevent loud/quiet inconsistencies
-   **Interface Scaling**: Zoom in/out functionality that scales both YouTube Music content and navigation bar
-   **Navigation Controls** (available in navigation bar and keyboard shortcuts):
    -   Back (Alt+Left) - ← button
    -   Forward (Alt+Right) - → button
    -   Refresh (F5) - ⟳ button
-   **Zoom Controls** (available in 'View' dropdown and keyboard shortcuts):
    -   Zoom In (Ctrl++) - + button
    -   Zoom Out (Ctrl+-) - − button
    -   Reset Zoom (Ctrl+0) - ⚬ button
-   **Visual Indicators**:
    -   Navigation buttons show enabled/disabled states
    -   Audio normalization status indicator (green = on, red = off)
    -   Loading indicator when pages are loading
    -   Zoom level persists between app sessions
        **Audio Enhancements**:
    -   Audio Normalization Toggle (Ctrl+N) - Normalizes all audio to be a similar volume
-   Additional shortcuts:
    -   Toggle Fullscreen (F11)
    -   Developer Tools (F12)
    -   Clear Login Data (Application menu)

## Getting Started

### Prerequisites

-   Node.js (version 14 or higher)
-   npm (comes with Node.js)

### Installation

1. Open terminal in the project directory
2. Install dependencies:
    ```
    npm install
    ```

### Running the Application

To start the application in development mode:

```
npm start
```

### Building for Windows

To create a Windows executable:

```
npm run dist
```

This will create a `dist` folder with the Windows installer.

## Project Structure

```
├── src/
│   ├── main.js      # Main Electron process
│   └── preload.js   # Preload script for security
├── assets/          # Application icons (add your own)
├── package.json     # Project configuration
└── README.md        # This file
```

## Customization

-   Replace `assets/icon.png` and `assets/icon.ico` with your preferred icons
-   Modify `package.json` to change app name, author, etc.
-   Update window size and other settings in `src/main.js`

## Notes

-   The application runs YouTube Music in a secure webview
-   External links open in your default browser
-   All navigation is handled through the application menu or keyboard shortcuts
-   **Login data is stored locally** in `%APPDATA%\YouTube Music Desktop` for persistence
-   Use "Clear Login Data" from the Navigation menu if you want to log out completely
-   **Page persistence** automatically saves your current page and restores it on next launch
-   **Audio normalization** uses dynamic range compression to balance volume levels automatically
-   Audio processing may take a moment to initialize when songs start playing
