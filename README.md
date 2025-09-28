<img width="1920" height="534" alt="orb_browser_banner" src="https://github.com/user-attachments/assets/a873f127-4652-4abb-9c9f-e23be7baf331" />

# Orb Browser
Another proof-of-concept browser written in Electron!

Inspired by [Zen](https://zen-browser.app/), [Arc](https://arc.net/), and [Flow](https://flow-browser.com/), and the original [Cascade](https://github.com/solarcosmic/CascadeBrowser/).

Orb is another browser inspired by the original (Cascade) but with more functionality, features, and a better backend system.

Orb is written in Electron and contains basic Widevine DRM support.

**NOTE:** If on Linux, please do not run this from a shell in Electron (e.g. Visual Studio Code) but rather something like the Terminal. [This is a known bug](https://github.com/castlabs/electron-releases/issues/165).

## What can Orb actually do?
It can do almost everything Cascade can do:
- Back/forward and reload navigation
- Various keybinds (Ctrl+R, Ctrl+Shift+R, Ctrl+P, Ctrl+W, Ctrl+T)
- Tab creation and destruction, as well as loading favicons
- Basic support for context menus (e.g. Inspect, Select All)
- Save tabs on exit, so it loads them on next load
- Smart URL bar (direct URL, search, etc.)
- Widevine DRM support (Windows/macOS)
- Pinned tabs

However, it can also do these new extra features:
- Ultimate Omnibox! (popup, search suggestions, search trends localised)
- Basic Chrome extension support
- Better navigation system
- Cached favicons (cold URL loading) * (partial)
- Animations!
- Improved design

## How does Orb work?
Orb uses `WebView`(s) (yep, again) but uses an entirely different and more workable backend. `WebContentView`(s) were used initially, but were later replaced as they were hard to work with. Worked out though!

## AI Usage (Copilot)
AI was used - but mostly for debugging purposes and ideas - not huge chunks of code.