# AGENTS.md - AI Assistant Guidelines

This document provides comprehensive guidelines for AI assistants working with the YouTube Music Desktop Application project.

## Project Overview

### Core Purpose

A modern Electron-based desktop application that wraps YouTube Music in a native Windows application with enhanced features including persistent authentication, audio normalization, and interface scaling.

### Technical Stack

-   **Framework**: Electron v27.0.0 with BrowserView (webview tag deprecated)
-   **Target Platform**: Windows (NSIS installer)
-   **Language**: JavaScript (Node.js + Browser)
-   **Architecture**: Modular component-based structure with IPC communication
-   **Authentication**: OAuth 2.0 token injection
-   **Audio Processing**: Web Audio API with dynamic range compression

## Project Structure

```
├── src/
│   ├── main.js                     # Application entry point (40 lines, modular)
│   ├── preload.js                  # Secure IPC bridge with contextBridge
│   ├── renderer.html               # Main UI (minimal, BrowserView host)
│   ├── auth/
│   │   └── oauth.js               # OAuth 2.0 authentication handling
│   ├── menu/
│   │   └── application-menu.js    # Application menu and shortcuts
│   ├── renderer/
│   │   ├── webview-manager.js     # DEPRECATED - kept for reference
│   │   ├── zoom-control.js        # DEPRECATED - functionality moved to webcontents/
│   │   ├── url-persistence.js     # DEPRECATED - functionality moved to webcontents/
│   │   ├── audio-normalization.js # DEPRECATED - functionality moved to webcontents/
│   │   └── oauth-handler.js       # DEPRECATED - functionality moved to webcontents/
│   ├── webcontents/
│   │   └── youtube-manager.js     # BrowserView management and all features
│   └── window/
│       └── main-window.js         # Window creation with BrowserView setup
├── assets/
│   └── YouTubeMusic_Logo.ico     # Application icon
├── package.json                   # Dependencies and build config
├── BUILD.md                      # Build instructions
└── README.md                     # User documentation
```

## Key Features & Implementation

### 1. Authentication System

-   **OAuth 2.0 Flow**: Opens separate login window
-   **Token Injection**: Extracts cookies/session data and injects into webview
-   **Persistent Sessions**: Maintains login state between app restarts
-   **Security**: Uses Electron's partition for session isolation

### 2. Audio Enhancement

-   **Dynamic Range Compression**: Web Audio API compressor with configurable settings
-   **Volume Normalization**: Prevents jarring volume differences between tracks
-   **Real-time Processing**: Applies effects without buffering delays
-   **Toggle Control**: Can be enabled/disabled via menu (Ctrl+N)

### 3. Interface Scaling

-   **Webview Zoom**: Uses Electron's setZoomFactor API
-   **Persistent Settings**: Saves zoom level in localStorage
-   **Keyboard Shortcuts**: Ctrl+/-, Ctrl+0 for zoom control
-   **Range**: 0.5x to 3.0x scaling with 0.1x increments

### 4. Navigation & Persistence

-   **URL Saving**: Automatically saves current page on navigation
-   **Session Restoration**: Restores last visited page on app startup
-   **Browser Controls**: Back, forward, refresh functionality
-   **User Agent Spoofing**: Uses Firefox UA to bypass Google's Electron detection

## Development Guidelines

### Code Architecture Principles

1. **Modular Design**: Each feature in separate file with single responsibility
2. **Clean Separation**: Main process, renderer process, and preload scripts clearly separated
3. **Error Handling**: Comprehensive try-catch blocks and user-friendly error messages
4. **Performance**: Debounced operations and efficient event handling

### File Organization Rules

-   **Main Process** (`src/main.js`): Keep minimal, import from modules
-   **Renderer Modules** (`src/renderer/`): Feature-specific functionality
-   **Menu System** (`src/menu/`): All menu items and keyboard shortcuts
-   **Authentication** (`src/auth/`): OAuth and security-related code
-   **Window Management** (`src/window/`): Window creation and configuration

### Coding Standards

-   Use `const`/`let` instead of `var`
-   Implement proper error handling with try-catch blocks
-   Add console logging for debugging but filter out harmless warnings
-   Use descriptive function and variable names
-   Comment complex logic and API interactions

## Common Tasks & Solutions

### Webview Deprecation (RESOLVED)

**Issue**: Electron's webview tag was deprecated with warnings about instability.
**Solution**: Migrated from `<webview>` tag to `BrowserView` API:

1. **Architecture Change**: Moved from renderer-process webview to main-process BrowserView
2. **IPC Communication**: Implemented secure IPC handlers for all webview operations
3. **Feature Preservation**: All functionality (zoom, audio, OAuth, persistence) maintained
4. **Security Enhancement**: Added proper contextIsolation and preload scripts

**Key Files Updated**:

-   `src/window/main-window.js` - BrowserView creation and management
-   `src/webcontents/youtube-manager.js` - Centralized webcontents operations
-   `src/preload.js` - Secure IPC bridge with contextBridge
-   `src/renderer.html` - Simplified to basic UI without embedded webview

### Adding New Features

1. Create new module in appropriate subdirectory
2. Export functions that need to be accessed elsewhere
3. Import and initialize in `youtube-manager.js` or `main.js`
4. Add menu items if user-facing functionality needed
5. Update this documentation

### OAuth Issues

-   **"Client not found"**: Use token injection approach instead of direct OAuth
-   **Session persistence**: Ensure cookies are properly extracted and injected
-   **Login failures**: Check Firefox user agent and partition settings

### Audio Problems

-   **No audio processing**: Ensure Web Audio API context is created after user interaction
-   **Performance issues**: Check compressor settings and gain values
-   **Cross-origin errors**: Verify YouTube Music allows audio context creation

### Build Issues

-   **Missing dependencies**: Run `npm install` before building
-   **Icon not found**: Ensure `assets/YouTubeMusic_Logo.ico` exists
-   **Build fails**: Check electron-builder configuration in package.json

## Testing Checklist

### Basic Functionality

-   [ ] App launches without errors
-   [ ] YouTube Music loads correctly
-   [ ] Navigation controls work (back/forward/refresh)
-   [ ] Zoom controls function properly
-   [ ] Audio normalization can be toggled

### Authentication Testing

-   [ ] OAuth login window opens
-   [ ] Login completes successfully
-   [ ] Session persists after app restart
-   [ ] Logout and re-login works

### Persistence Testing

-   [ ] Last visited URL restored on startup
-   [ ] Zoom level maintained between sessions
-   [ ] Audio normalization setting preserved

### Build Testing

-   [ ] `npm start` launches development version
-   [ ] `npm run dist` creates installer
-   [ ] Installer runs and installs correctly
-   [ ] Installed app functions identically to development version

## Troubleshooting Common Issues

### App Won't Start

1. Check Node.js and npm versions
2. Run `npm install` to ensure dependencies
3. Verify main.js path in package.json
4. Check for syntax errors in recently modified files

### YouTube Music Won't Load

1. Verify internet connection
2. Check if user agent spoofing is working
3. Look for console errors in webview
4. Try clearing application data

### Authentication Failures

1. Check OAuth redirect URL configuration
2. Verify token extraction logic
3. Test with fresh login credentials
4. Check for changes in Google's OAuth flow

### Audio Not Working

1. Ensure user has interacted with page (autoplay policy)
2. Check if audio context is created successfully
3. Verify compressor settings are reasonable
4. Test with audio normalization disabled

## Security Considerations

### Safe Practices

-   Never store credentials in plain text
-   Use Electron's security best practices
-   Validate all user inputs
-   Implement proper session management

### OAuth Security

-   Use secure redirect URLs
-   Implement state parameter validation
-   Handle token refresh properly
-   Clear sensitive data on logout

## Performance Optimization

### Memory Management

-   Dispose audio contexts when not needed
-   Remove event listeners when components unmount
-   Avoid memory leaks in webview operations

### Startup Optimization

-   Lazy load non-critical modules
-   Minimize main process operations
-   Cache frequently accessed data

## Extension Points

### Adding New Audio Effects

1. Extend audio-normalization.js
2. Add new Web Audio API nodes
3. Create menu toggles for new effects
4. Implement settings persistence

### Adding New Navigation Features

1. Extend webview-manager.js
2. Add new event listeners
3. Implement in application-menu.js
4. Add keyboard shortcuts

### Platform Support

1. Update package.json build configuration
2. Add platform-specific icons
3. Test platform-specific features
4. Update build scripts

## AI Assistant Best Practices

### When Modifying Code

1. **Read First**: Always examine existing code structure before making changes
2. **Preserve Functionality**: Ensure all existing features continue working
3. **Follow Patterns**: Maintain consistency with established code patterns
4. **Test Changes**: Verify modifications work as expected
5. **Update Documentation**: Keep this file current with any architectural changes

### When Debugging

1. **Check Console**: Look for both main process and renderer process errors
2. **Verify Paths**: Ensure all file paths are correct after refactoring
3. **Test OAuth Flow**: Authentication issues are common after changes
4. **Validate Audio**: Ensure Web Audio API changes don't break functionality

### When Adding Features

1. **Plan Architecture**: Consider where new code fits in modular structure
2. **Security First**: Implement proper input validation and error handling
3. **User Experience**: Ensure features are intuitive and well-integrated
4. **Performance**: Consider impact on app startup and runtime performance

---

This project emphasizes clean, modular architecture with separation of concerns. Always maintain this principle when making modifications or additions.
