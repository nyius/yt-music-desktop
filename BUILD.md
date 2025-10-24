# Building Windows Executable

## Quick Build

To create a Windows executable (.exe) installer:

```powershell
npm run dist
```

This will create a `dist` folder with:

-   An NSIS installer (.exe)
-   Unpacked application files

## Build Options

### Create installer only:

```powershell
npm run dist
```

### Create portable version (no installer):

```powershell
npm run pack
```

### Development testing:

```powershell
npm start
```

## Output Location

After building, you'll find your executable in:

```
dist/
├── YouTube Music Desktop Setup 1.0.0.exe  # Installer
└── win-unpacked/                          # Portable version
    └── YouTube Music Desktop.exe
```

## Before Building

1. **Add an icon** (optional but recommended):

    - Place `icon.ico` in the `assets` folder
    - Use 256x256 pixels for best quality

2. **Customize app details** in `package.json`:
    - Change `author` field
    - Update `description`
    - Modify `build.appId` to be unique

## Distribution

-   Share the installer: `YouTube Music Desktop Setup 1.0.0.exe`
-   Or share the portable version: `win-unpacked/YouTube Music Desktop.exe`

## Troubleshooting

If build fails:

1. Ensure all dependencies are installed: `npm install`
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check Windows Defender isn't blocking the build process
