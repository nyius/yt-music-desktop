# YouTube Music Desktop App

A simple desktop application for Windows that displays YouTube Music with navigation controls.

## Features

-   Loads YouTube Music (https://music.youtube.com/) in a dedicated window
-   **Persistent Login**: Stays logged in to your YouTube Music account between app sessions
-   **Audio Normalization**: Automatically balances volume levels between songs to prevent loud/quiet inconsistencies
-   Navigation controls:
    -   Back (Alt+Left)
    -   Forward (Alt+Right)
    -   Refresh (F5)
    -   Home (Ctrl+H) - returns to YouTube Music homepage
    -   Clear Login Data - logs you out and clears stored session data
-   Audio controls:
    -   Toggle Audio Normalization (Ctrl+N) - enable/disable volume balancing
    -   Audio Info - check normalization status
-   Additional shortcuts:
    -   Toggle Fullscreen (F11)
    -   Developer Tools (F12)
    -   Minimize (Ctrl+M)
    -   Close (Ctrl+W)

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
-   **Audio normalization** uses dynamic range compression to balance volume levels automatically
-   Audio processing may take a moment to initialize when songs start playing
