const { contextBridge, ipcRenderer } = require("electron");

if (location.pathname.endsWith("index.html")) {
    const { injectBrowserAction } = require("electron-chrome-extensions/browser-action");
    injectBrowserAction();
}

/*
reminder:
* renderer to main: ipcRenderer.send()
* main to renderer: ipcRenderer.on()
* renderer to main (two-way): ipcRenderer.invoke()
*/

contextBridge.exposeInMainWorld("electronAPI", {
    onMouseClick: (callback) => ipcRenderer.on("mouse-click", (_evt, x, y) => callback(x, y)),
    onLinkOpen: (callback) => ipcRenderer.on("open-link", (_evt, url) => callback(url)),
    sendConsoleLog: (txt) => ipcRenderer.send("renderer:console-log", txt),
    onAppBlur: (callback) => ipcRenderer.on("app-blur", (_evt) => callback()),
    onAppFocus: (callback) => ipcRenderer.on("app-focus", (_evt) => callback()),
    requestTabOpen: (url) => ipcRenderer.send("renderer:open-new-tab", url),
    clearBrowsingHistory: () => ipcRenderer.send("renderer:clear-browsing-history"),
    sendToRenderer: (callback) => ipcRenderer.on("send-to-renderer", (_evt, data) => callback(data)),
    contextMenuShow: (menu, args) => ipcRenderer.send("menu:context-menu-show", menu, args),
    sendTabActivated: (wvId) => ipcRenderer.send("main:tab-activated", wvId),
    showMainDropdown: (wvId) => ipcRenderer.send("renderer:toggle-main-dropdown"),
    printTab: (wvId) => ipcRenderer.send("renderer:print-tab", wvId),
    quitOrb: () => ipcRenderer.send("main:quit-orb"),
    getTrendingSearches: (country) => ipcRenderer.invoke("misc:get-trending-searches", country),
});