# PageHold Browser Extension

## Installation Instructions

### Microsoft Edge (or Chrome/Brave)

1. Open Edge and go to: edge://extensions/
2. Enable "Developer mode" (toggle in bottom-left corner)
3. Click "Load unpacked"
4. Select the PageHold-extension folder
5. The extension is now installed!

### Testing

Visit any website and you'll see the PageHold loading screen appear briefly before the page content is revealed.

## Files

- **manifest.json** - Extension configuration (required)
- **content.js** - Core functionality that injects the loading overlay
- **popup.html** - Extension popup interface (click the extension icon)

## How It Works

1. Injects immediately at document_start (before any content renders)
2. Shows a clean loading overlay with animated icon and progress bar
3. Waits for page to be fully ready (max 3 seconds)
4. Fades out smoothly to reveal the complete page

## Customization

Edit content.js to adjust:
- MAX_WAIT_TIME (default: 3000ms)
- FADE_DURATION (default: 400ms)
- Overlay colors and styling
