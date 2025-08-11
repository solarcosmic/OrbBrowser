# Orb Browser
Another proof-of-concept browser written in Electron!

Inspired by [Zen](https://zen-browser.app/), [Arc](https://arc.net/), and [Flow](https://flow-browser.com/), and the original [Cascade](https://github.com/solarcosmic/CascadeBrowser/).

Orb is another browser inspired by the original (Cascade) but with more functionality, features, and a better backend system.

Orb is written in Electron and contains basic Widevine DRM support.

## What can Orb actually do?
It can do almost everything Cascade can do:
- Back/forward and reload navigation
- Various keybinds (Ctrl+R, Ctrl+Shift+R, Ctrl+P, Ctrl+W, Ctrl+T)
- Tab creation and destruction, as well as loading favicons
- Basic support for context menus (e.g. Inspect, Select All)
- Save tabs on exit, so it loads them on next load
- Smart URL bar (direct URL, search, etc.)
- Widevine DRM support (Windows/macOS)
- Pinned tabs *

However, it can also do these new extra features (ones with * are planned):
- Ultimate Omnibox! (popup, search suggestions)
- Tab folders *
- Basic Chrome extension support *
- Better navigation system
- Cached favicons (cold URL loading) *
- Animations!
- Improved design

## How does Orb work?
Orb uses `WebView`(s) (yep, again) but uses an entirely different and more workable backend. `WebContentView`(s) were used initially, but were later replaced as they were hard to work with.

## How to Build (from Cascade instructions)
Clone the repository and open a terminal window, but make sure you run the following commands with administrative privileges (e.g. Administrator on Windows, `sudo` on Linux/macOS).

In the repository main folder (where this README and main.js should be) run the following command to install dependencies, this may take a while:
```
npm i
```
To test out Cascade without building it, you can run:
```
npm run start
```
Depending on what platform you want to build for:
```
npm run build            # Current OS
npm run build-win        # Windows (win32)
npm run build-linux      # Linux
npm run build-mac        # macOS (darwin) untested
```
Running in administrative mode prevents any symbolic link errors. You can find the built binary/executable once done in `/dist`.