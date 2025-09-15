const { contextBridge, ipcRenderer } = require("electron");

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
<<<<<<< Updated upstream
    loadExtension: (path) => ipcRenderer.send("renderer:load-extension", path),
    getExtensions: () => ipcRenderer.send("renderer:get-extensions"),
=======
    // extension jazz
    getExtensions: () => ipcRenderer.invoke("extensions:get-extensions"),
    activateExtension: (extId) => ipcRenderer.send("extensions:activate-extension", extId),
    activateExtensionContextMenu: (extId) => ipcRenderer.send("extensions:activate-extension-context-menu", extId),
>>>>>>> Stashed changes
});